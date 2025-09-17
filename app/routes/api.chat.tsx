import {
  type AnthropicProviderOptions,
  createAnthropic,
} from "@ai-sdk/anthropic";
import { captureException } from "@sentry/react-router";
import { convertToModelMessages, stepCountIs, streamText } from "ai";
import humanFormat from "human-format";
import Redis from "ioredis";
import type { Conversation } from "prisma/generated/client";
import { createResumableStreamContext } from "resumable-stream/ioredis";
import invariant from "tiny-invariant";
import { ulid } from "ulid";
import zod from "zod";
import env from "~/lib/env";
import prisma from "~/lib/prisma";
import { monitorStopSignal, stopChat } from "~/lib/redis-stop-monitor";
import { getConversationFromSession } from "~/sessions.server";
import general from "../lib/general.md?raw";
import spaces from "../lib/spaces.md?raw";
import type { Route } from "./+types/api.chat";
import {
  type ClientMessage,
  fromClientMessage,
  toClientMessage,
} from "./chat/ClientMessage";

// @see https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-message-persistence
// @see https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-resume-streams

invariant(general, "General prompt is required");
invariant(spaces, "Centers list is required");

export async function action({ request }: Route.ActionArgs) {
  const { conversation, user } = await getConversationFromSession(request);
  const { userMessage } = (await request.json()) as {
    userMessage: ClientMessage;
  };

  // Store the user's messages in the database,
  await updateChat({
    activeStreamId: null,
    conversation,
    messages: [userMessage],
  });
  const originalMessages = await loadMessages(conversation);

  // Set up Redis stop monitoring
  const { abortSignal, cleanup } = monitorStopSignal(conversation.id);

  // Send the conversation to Anthropic LLM
  const model = createAnthropic({ apiKey: env.ANTHROPIC_API_KEY })(
    "claude-sonnet-4-20250514",
  );
  const result = streamText({
    messages: convertToModelMessages(originalMessages),
    model,
    abortSignal,

    onFinish: async ({ steps, totalUsage }) => {
      console.info(
        "[LLM] steps %d => total tokens %s",
        steps.length,
        humanFormat(totalUsage.totalTokens ?? 0),
      );
      await cleanup();
    },

    providerOptions: {
      anthropic: {
        sendReasoning: true,
        thinking: { type: "enabled", budgetTokens: 12000 },
      } satisfies AnthropicProviderOptions,
    },

    stopWhen: stepCountIs(3),
    system: [general, spaces].join("\n\n=====\n\n"),

    tools: {
      getLocation: {
        description: "Get the location of the current user",
        inputSchema: zod.object({}).describe("No input is required"),
        outputSchema: zod
          .object({
            latitude: zod.string(),
            longitude: zod.string(),
          })
          .describe("The location of the current user"),
        execute: () => ({ latitude: user.latitude, longitude: user.longitude }),
      },
    },
    toolChoice: "auto",
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
      await updateChat({ conversation, activeStreamId });
    },

    generateMessageId: ulid,
    onError: (error) => {
      captureException(error);
      return JSON.stringify(error);
    },

    onFinish: async ({ messages, isAborted }) => {
      await updateChat({
        activeStreamId: null,
        conversation,
        messages,
      });
      if (isAborted) {
        await prisma.message.create({
          data: {
            conversationId: conversation.id,
            id: ulid(),
            isAborted,
            role: "USER",
          },
        });
        await stopChat(conversation.id);
      }
    },

    originalMessages,
    sendReasoning: true,
  });
}

async function loadMessages(
  conversation: Conversation,
): Promise<ClientMessage[]> {
  const messages = await prisma.message.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: "asc" },
  });
  return messages.map(toClientMessage);
}

async function updateChat({
  activeStreamId,
  conversation,
  messages,
}: {
  activeStreamId: string | null;
  conversation: Conversation;
  messages?: ClientMessage[];
}): Promise<void> {
  await prisma.conversation.update({
    where: { id: conversation.id },
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
}

/**
 * {
 *   "id":"Nv2i6Na7LGdM4QLx",
 *   "messages":[
 *     {
 *       "parts":[{"text":"Welcome to **rentail.space**!\n\nI'm your virtual assistant here to help you find the perfect retail space for\nyour business needs.  How can I assist you today?"}],
 *       "role":"assistant"
 *     },
 *     {
 *       "parts":[{"text":"What are the available retail spaces?"}],
 *       "role":
 *       "user","id":"RNf0kp5K0xhgmH3O"
 *     }
 *   ],
 *   "trigger":"submit-message"
 * }
 */
