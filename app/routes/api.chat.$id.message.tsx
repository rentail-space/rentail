import { toAISdkFormat } from "@mastra/ai-sdk";
import { captureException } from "@sentry/react-router";
import { createUIMessageStreamResponse } from "ai";
import debug from "debug";
import { invariant, last } from "es-toolkit";
import humanFormat from "human-format";
import { Redis } from "ioredis";
import { createResumableStreamContext } from "resumable-stream";
import { ulid } from "ulid";
import mastra from "~/lib/agent";
import env from "~/lib/env";
import findNearbyProperties from "~/lib/findNearbyProperties";
import prisma from "~/lib/prisma";
import { monitorStopSignal } from "~/lib/redis-stop-monitor";
import general from "~/prompts/general.md?raw";
import { findOrCreateUser } from "~/sessions.server";
import type { Route } from "./+types/api.chat.$id.message";

const logger = debug("chat");

/**
 * Send a message to the chat.
 *
 * @param params.id - The ID of the chat to send the message to.
 * @param request - The request object.
 * @see https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-message-persistence
 */
export async function action({ params, request }: Route.ActionArgs) {
  const chatId = params.id;
  invariant(chatId, "Chat ID is required");
  const { chat, headers, user } = await findOrCreateUser({
    chatId,
    headers: request.headers,
  });

  const { messages: bodyMessages } = (await request.clone().json()) as {
    messages: {
      id: string;
      parts: [{ text: string; type: "text" }];
      role: "user" | "assistant";
      threadId: string;
    }[];
  };
  const lastMessageObj = last(bodyMessages);
  if (!lastMessageObj)
    return new Response("Message is required", { status: 400 });

  const lastMessageText = lastMessageObj.parts
    .map((part) => part.text)
    .join("\n");
  logger("Message from user:\n%o", lastMessageText);

  // Set up Redis stop monitoring
  const { abortSignal } = await monitorStopSignal(chat.id);
  const { properties, markdown } = await findNearbyProperties({
    chat,
    maxDistance: 20,
    user,
  });
  logger("Found %d properties", properties.length);

  const agent = mastra.getAgentById("main");
  const memory = await agent.getMemory();
  invariant(memory, "Memory is required");

  // Don't pass messages array - let agent load from memory automatically
  const stream = await agent.stream(lastMessageText, {
    abortSignal,
    maxSteps: 1,
    memory: {
      resource: user.id,
      thread: chat.id,
      options: {
        lastMessages: 10,
        threads: {
          generateTitle: true,
        },
      },
    },
    requireToolApproval: false,
    savePerStep: false, // Saves after each step; skipDuplicates prevents user message duplication
    system: `${general}\n\n=====\n\n${markdown}`,

    onAbort: async () => {
      logger("Aborted by user");
    },

    onError: (error) => {
      console.error("Error in agent stream", {
        error,
        chat: chat.id,
      });
      captureException(error, {
        extra: { chat },
      });
    },

    onFinish: async ({ steps, usage }) => {
      logger(
        "Finished: %d steps => total tokens %s",
        steps.length,
        humanFormat(usage.totalTokens ?? 0),
      );
      await prisma.chat.update({
        where: { id: chat.id },
        data: { activeStreamId: null },
      });
    },

    onChunk: (data) => {
      logger("Chunk: %o", data);
    },

    providerOptions: {
      anthropic: {
        sendReasoning: false,
        thinking: { type: "disabled" },
      },
    },

    modelSettings: {
      temperature: 0,
    },
  });

  return createUIMessageStreamResponse({
    headers,
    async consumeSseStream({ stream }) {
      const streamId = ulid();

      // Create a resumable stream from the SSE stream
      const streamContext = createResumableStreamContext({
        waitUntil: async (promise) => await promise,
        subscriber: new Redis(env.REDIS_URL),
        publisher: new Redis(env.REDIS_URL),
      });
      await streamContext.createNewResumableStream(streamId, () => stream);

      await prisma.chat.update({
        where: { id: chat.id },
        data: { activeStreamId: streamId },
      });
    },
    stream: toAISdkFormat(stream, {
      from: "agent",
    }),
  });
}
