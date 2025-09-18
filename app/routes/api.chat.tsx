import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import {
  type AnthropicProviderOptions,
  createAnthropic,
} from "@ai-sdk/anthropic";
import { captureException, type User } from "@sentry/react-router";
import { convertToModelMessages, stepCountIs, streamText } from "ai";
import { invariant } from "es-toolkit";
import humanFormat from "human-format";
import Redis from "ioredis";
import type { Chat } from "prisma/generated/client";
import { createResumableStreamContext } from "resumable-stream/ioredis";
import { ulid } from "ulid";
import env from "~/lib/env";
import prisma from "~/lib/prisma";
import { monitorStopSignal } from "~/lib/redis-stop-monitor";
import { getChatFromSession } from "~/sessions.server";
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
  const { chat } = await getChatFromSession(request);
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
    system: [general, await loadSpaces(chat.user)].join("\n\n=====\n\n"),
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

async function loadSpaces(user: User): Promise<string> {
  const filenames = await readdir(
    path.join(process.cwd(), "app/data/centers"),
    "utf8",
  );
  const centers = await Promise.all(
    filenames.map(
      async (filename) =>
        await readFile(
          path.join(process.cwd(), "app/data/centers", filename),
          "utf8",
        ),
    ),
  );

  const nearBy = centers.filter((center) => {
    const distance = calculateDistance({
      center: {
        latitude: center.match(/Latitude:\s+(-?\d+\.\d+)/)?.[1],
        longitude: center.match(/Longitude:\s+(-?\d+\.\d+)/)?.[1],
      },
      user: {
        latitude: user.location?.latitude,
        longitude: user.location?.longitude,
      },
    });
    return distance < 20;
  });

  return [
    `Here are the shopping centers in the area which are within 20 miles of the user.
    These are all the shopping centers you know about.
    You do not know about any other shopping centers.
    If the user asks about a shopping center you do not know about, you should say so.
    Do not make up information about shopping centers you do not know about.
    Do not even mention shopping centers you do not know about.
    `,
    ...nearBy,
  ].join("\n\n");
}

function calculateDistance({
  center,
  user,
}: {
  center: { latitude?: string; longitude?: string };
  user: { latitude?: string; longitude?: string };
}): number {
  // Convert string coordinates to numbers
  const centerAt = {
    latitude: Number.parseFloat(center.latitude ?? "NA"),
    longitude: Number.parseFloat(center.longitude ?? "NA"),
  };
  const userAt = {
    latitude: Number.parseFloat(user.latitude ?? "NA"),
    longitude: Number.parseFloat(user.longitude ?? "NA"),
  };

  // If any coordinates are invalid, return a large distance
  if (
    Number.isNaN(centerAt.latitude) ||
    Number.isNaN(centerAt.longitude) ||
    Number.isNaN(userAt.latitude) ||
    Number.isNaN(userAt.longitude)
  )
    return Number.MAX_SAFE_INTEGER;

  // Convert latitude and longitude to radians
  const centerAtRad = {
    latitude: (centerAt.latitude * Math.PI) / 180,
    longitude: (centerAt.longitude * Math.PI) / 180,
  };
  const userAtRad = {
    latitude: (userAt.latitude * Math.PI) / 180,
    longitude: (userAt.longitude * Math.PI) / 180,
  };

  // Haversine formula
  const dLat = userAtRad.latitude - centerAtRad.latitude;
  const dLon = userAtRad.longitude - centerAtRad.longitude;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(centerAtRad.latitude) *
      Math.cos(userAtRad.latitude) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  // Earth's radius in miles
  const R = 3959;

  // Calculate distance
  return R * c;
}

/**
 * {
 *   "id":"Nv2i6Na7LGdM4QLx",
 *   "messages":[
 *     {
 *       "parts":[{"text":"What are the available retail spaces?"}],
 *       "role":
 *       "user","id":"RNf0kp5K0xhgmH3O"
 *     },
 *     {
 *       id: '01K5CBJ0GYKYQKMQ37BW00A7YF',
 *       metadata: undefined,
 *       role: 'assistant',
 *       parts: [
 *         { type: 'step-start' },
 *         {
 *           type: 'reasoning',
 *           text: "I can help you find the perfect retail space for your business needs.",
 *           state: 'done',
 *         },
 *         {
 *           type: 'tool-getLocation',
 *           toolCallId: 'toolu_01Sh2rNyVvzicuwEaPRUTpTN',
 *           state: 'output-available',
 *           input: {},
 *           output: { latitude: null, longitude: null },
 *           rawInput: undefined,
 *           errorText: undefined,
 *           providerExecuted: undefined,
 *           preliminary: undefined
 *         },
 *         { type: 'step-start' },
 *         {
 *           type: 'text',
 *           text: 'The location of the current user is 37.774929, -122.419416.',
 *           providerMetadata: undefined,
 *           state: 'done',
 *         },
 *       ],
 *   ],
 *   "trigger":"submit-message"
 * }
 */
