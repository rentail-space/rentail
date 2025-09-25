import {
  type AnthropicProviderOptions,
  createAnthropic,
} from "@ai-sdk/anthropic";
import { captureException, type User } from "@sentry/react-router";
import { convertToModelMessages, stepCountIs, streamText } from "ai";
import { invariant } from "es-toolkit";
import humanFormat from "human-format";
import Redis from "ioredis";
import type {
  Chat,
  ShoppingCenter,
  ShoppingCenterSpace,
} from "prisma/generated/client";
import type { ShoppingCenterGetPayload } from "prisma/generated/models";
import { createResumableStreamContext } from "resumable-stream/ioredis";
import { ulid } from "ulid";
import env from "~/lib/env";
import prisma from "~/lib/prisma";
import { monitorStopSignal } from "~/lib/redis-stop-monitor";
import { commit, getChatFromSession } from "~/sessions.server";
import general from "../lib/general.md?raw";
import type { Route } from "./+types/api.chat";
import {
  type ClientMessage,
  fromClientMessage,
  toClientMessages,
} from "./chat/ClientMessage";

// @see https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-message-persistence
// @see https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-resume-streams

invariant(general, "General prompt is required");

export async function action({ request }: Route.ActionArgs) {
  const { chat, session } = await getChatFromSession(request);
  const { userMessage } = (await request.json()) as {
    userMessage: ClientMessage;
  };

  // Store the user's messages in the database,
  await updateChat({
    activeStreamId: null,
    chat,
    messages: [userMessage],
  });
  const originalMessages = await loadContentMessages(chat);

  // Set up Redis stop monitoring
  const { abortSignal, cleanup } = await monitorStopSignal(chat.id);
  const maxDistance = 20;
  const spaces = await findSpaces(chat.user, maxDistance);

  // Send the chat to Anthropic LLM
  const model = createAnthropic({ apiKey: env.ANTHROPIC_API_KEY })(
    "claude-sonnet-4-20250514",
  );
  const result = streamText({
    messages: convertToModelMessages(originalMessages),
    model,
    abortSignal,

    onFinish: async ({ steps, totalUsage }) => {
      console.info(
        "[CHAT] steps %d => total tokens %s",
        steps.length,
        humanFormat(totalUsage.totalTokens ?? 0),
      );
      await cleanup();
    },

    onAbort: async () => {
      console.info("[CHAT] Aborted by user");
      await cleanup();
    },

    providerOptions: {
      anthropic: {
        sendReasoning: true,
        thinking: { type: "enabled", budgetTokens: 12000 },
      } satisfies AnthropicProviderOptions,
    },

    stopWhen: stepCountIs(3),
    system: `${general}\n\n=====\n\n${shoppingCentersToMarkdown(spaces, maxDistance)}`,
  });

  // Consume the stream to ensure it runs to completion & triggers onFinish even
  // when the client response is aborted:
  result.consumeStream(); // no await

  // Stream the response to the client,  saving the last message(s) from the
  // assistant.
  return result.toUIMessageStreamResponse<ClientMessage>({
    async consumeSseStream({ stream }) {
      const activeStreamId = ulid();
      // Create a resumable stream from the SSE stream
      const streamContext = createResumableStreamContext({
        // NOTE: use separate instances for publisher and subscriber
        publisher: new Redis(env.REDIS_URL),
        subscriber: new Redis(env.REDIS_URL),
        waitUntil: null,
      });
      await streamContext.createNewResumableStream(
        activeStreamId,
        () => stream,
      );
      await updateChat({ chat, activeStreamId });
    },

    generateMessageId: ulid,

    onError: (error) => {
      captureException(error);
      return JSON.stringify(error);
    },

    onFinish: async ({ messages, isAborted }) => {
      await updateChat({
        activeStreamId: null,
        chat,
        isAborted,
        messages,
      });
    },

    originalMessages,
    sendReasoning: true,
    headers: { "Set-Cookie": await commit(session) },
  });
}

/**
 * Load text messages from the database. Ignores reasoning messages,
 * aborted messages, and other messages that don't have text content.
 *
 * @param chat The chat to load the messages from.
 * @returns The text messages.
 */
async function loadContentMessages(chat: Chat): Promise<ClientMessage[]> {
  const messages = await prisma.message.findMany({
    where: { chatId: chat.id, content: { not: null } },
    orderBy: { id: "asc" },
  });
  return toClientMessages(messages);
}

/**
 * Update the chat in the database.
 *
 * @param activeStreamId The active stream ID. If null, no stream is active.
 * @param chat The chat to update.
 * @param isAborted Whether the chat was aborted. If true, an aborted message is added.
 * @param messages Messages to add or update. If null, messages are not updated.
 */
async function updateChat({
  activeStreamId,
  chat,
  isAborted,
  messages,
}: {
  activeStreamId: string | null;
  chat: Chat;
  isAborted?: boolean;
  messages?: ClientMessage[];
}): Promise<void> {
  await prisma.chat.update({
    where: { id: chat.id },
    data: {
      activeStreamId,
      messages: messages
        ? {
            createMany: {
              data: messages.flatMap(fromClientMessage),
              skipDuplicates: true,
            },
          }
        : undefined,
    },
  });
  if (isAborted)
    await prisma.message.create({
      data: { chatId: chat.id, isAborted: true, role: "USER" },
    });
}

/**
 * Find the shopping centers within a given distance from the user.
 *
 * @param user The user to find the shopping centers for.
 * @param distance The distance in miles to find the shopping centers within.
 * @returns The shopping centers within the given distance.
 */
async function findSpaces(
  user: User,
  distance: number,
): Promise<ShoppingCenterGetPayload<{ include: { spaces: true } }>[]> {
  const maxDistance = distance * 1609.344; // 20 miles in meters
  const nearBy = await prisma.$queryRaw<
    { id: string; longitude: number; latitude: number }[]
  >`
    SELECT id, ST_X(location::geometry), ST_Y(location::geometry)
    FROM "shopping_centers" 
    WHERE ST_DistanceSphere(location::geometry, ST_MakePoint(${user.location.longitude}, ${user.location.latitude})) < ${maxDistance}
  `;
  const centers = await prisma.shoppingCenter.findMany({
    include: { spaces: true },
    where: { id: { in: nearBy.map((center) => center.id) } },
  });
  return centers;
}

function shoppingCentersToMarkdown(
  centers: ShoppingCenterGetPayload<{ include: { spaces: true } }>[],
  maxDistance: number,
): string {
  const prefix = `Here are the shopping centers in the area which are within ${maxDistance} miles of the user.
    These are all the shopping centers you know about.
    You do not know about any other shopping centers.
    If the user asks about a shopping center you do not know about, you should say so.
    Do not make up information about shopping centers you do not know about.
    Do not even mention shopping centers you do not know about.`;

  return `${prefix}\n\n${centers.map(shoppingCenterToMarkdown).join("\n\n")}`;
}

function shoppingCenterToMarkdown(
  center: ShoppingCenterGetPayload<{ include: { spaces: true } }>,
): string {
  return `<shopping-center>
  Shopping center name: ${center.name}
  Address: ${center.address}, ${center.city}, ${center.state}, ${center.country}
  Description: ${center.description}
  ${center.imageURLs.map((image) => `Image: ${image}`).join("\n")}
  Spaces: ${center.spaces.map(shoppingCenterSpacesToMarkdown).join("\n")}
</shopping-center>`;
}

function shoppingCenterSpacesToMarkdown(space: ShoppingCenterSpace): string {
  return `<space>
  Space name: ${space.name}
  Description: ${space.details}
  Cost: ${space.cost}
  Foot traffic: ${space.footTraffic}
  Size: ${space.size} sqft
  Available: ${space.available}
  ${space.imageURLs.map((image) => `Image: ${image}`).join("\n")}
</space>`;
}
