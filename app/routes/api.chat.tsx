import type { AnthropicProviderOptions } from "@ai-sdk/anthropic";
import type { MastraMessageV2 } from "@mastra/core";
import { captureException, type User } from "@sentry/react-router";
import { stepCountIs, type UIMessage } from "ai";
import { invariant } from "es-toolkit";
import humanFormat from "human-format";
import type { ShoppingCenterSpace } from "prisma/generated/client";
import type { ShoppingCenterGetPayload } from "prisma/generated/models";
import { ulid } from "ulid";
import mastra from "~/lib/mastra";
import prisma from "~/lib/prisma";
import { monitorStopSignal } from "~/lib/redis-stop-monitor";
import { commit, getChatFromSession } from "~/sessions.server";
import general from "../lib/general.md?raw";
import type { Route } from "./+types/api.chat";

// @see https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-message-persistence
// @see https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-resume-streams

invariant(general, "General prompt is required");

export async function action({ request }: Route.ActionArgs) {
  const { chat, session, user } = await getChatFromSession(request);

  const userMessage = (await request.json()) as { userMessage: UIMessage };

  // Set up Redis stop monitoring
  const { abortSignal, cleanup } = await monitorStopSignal(chat.id);
  const maxDistance = 20;
  const spaces = await findSpaces(user, maxDistance);

  const agent = mastra.getAgentById("main");
  const memory = await agent.getMemory();
  invariant(memory, "Memory is required");
  const messages = await memory.saveMessages({
    messages: [
      {
        id: ulid(),
        role: "user",
        createdAt: new Date(),
        threadId: chat.id,
        resourceId: user.id,
        type: "text",
        content: {
          parts: userMessage.userMessage.parts.map((part) => ({
            text: part.type === "text" ? part.text : "",
            type: "text",
          })),
          format: 2,
        },
      },
    ],
    format: "v2",
  });

  const initialMessages: MastraMessageV2[] = messages.map((message) => ({
    content: message.content,
    createdAt: message.createdAt,
    id: message.id,
    role: message.role,
  }));

  const result = await agent.streamVNext(initialMessages, {
    abortSignal,
    format: "aisdk",
    memory: {
      resource: user.id,
      thread: chat.id,
    },
    savePerStep: true,
    maxSteps: 3,
    stopWhen: stepCountIs(3),
    requireToolApproval: false,
    system: `${general}\n\n=====\n\n${shoppingCentersToMarkdown(spaces, maxDistance)}`,

    onFinish: async ({ steps, usage }) => {
      console.info(
        "[CHAT] steps %d => total tokens %s",
        steps.length,
        humanFormat(usage.totalTokens ?? 0),
      );
      await cleanup();
    },

    onAbort: async () => {
      console.info("[CHAT] Aborted by user");
      await cleanup();
    },

    providerOptions: {
      anthropic: {
        sendReasoning: false,
        thinking: { type: "disabled", budgetTokens: 12000 },
      } satisfies AnthropicProviderOptions,
    },
  });

  // Consume the stream to ensure it runs to completion & triggers onFinish even
  // when the client response is aborted:
  result.consumeStream(); // no await

  // Stream the response to the client,  saving the last message(s) from the
  // assistant.
  return result.toUIMessageStreamResponse({
    /*
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
    */

    generateMessageId: ulid,

    onError: (error) => {
      captureException(error);
      return JSON.stringify(error);
    },

    onFinish: async ({ messages, isAborted }) => {
      console.info(
        "[CHAT] Finished: messages=%d isAborted=%s",
        messages.length,
        isAborted,
      );
    },

    sendReasoning: false,
    headers: { "Set-Cookie": await commit(session) },
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
