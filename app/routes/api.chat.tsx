import { createAnthropic } from "@ai-sdk/anthropic";
import { captureException } from "@sentry/react-router";
import { convertToModelMessages, streamText } from "ai";
import Redis from "ioredis";
import type { Conversation, Role } from "prisma/generated/client";
import { createResumableStreamContext } from "resumable-stream/ioredis";
import invariant from "tiny-invariant";
import { ulid } from "ulid";
import zod from "zod";
import env from "~/lib/env";
import prisma from "~/lib/prisma";
import { createStopMonitor } from "~/lib/redis-stop-monitor";
import { getConversationFromSession } from "~/sessions.server";
import general from "../lib/general.md?raw";
import spaces from "../lib/spaces.md?raw";
import type { Route } from "./+types/api.chat";
import type { ClientMessage } from "./chat/ClientMessage";

// @see https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-message-persistence
// @see https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-resume-streams

invariant(general, "General prompt is required");
invariant(spaces, "Centers list is required");

export async function action({ request }: Route.ActionArgs) {
  const { conversation, user } = await getConversationFromSession(request);
  const { message } = (await request.json()) as { message: ClientMessage };

  // Store the new messages from the user.
  await saveChat({
    conversation,
    messages: [message],
    activeStreamId: null,
  });
  // We need to load all messages to send to the LLM
  const messages = [
    ...conversation.messages,
    {
      id: message.id,
      content: combineMessageParts(message.parts),
      role: message.role === "user" ? "USER" : "ASSISTANT",
      createdAt: new Date(),
      conversationId: conversation.id,
    },
  ].map((message) => ({
    id: message.id,
    role: message.role === "USER" ? "user" : "assistant",
    parts: [{ text: message.content, type: "text" }],
  })) as ClientMessage[];

  // Send last message to Anthropic LLM
  const model = createAnthropic({ apiKey: env.ANTHROPIC_API_KEY })(
    "claude-sonnet-4-20250514",
  );
  const abort = new AbortController();

  // Set up Redis stop monitoring
  const cleanupStopMonitor = createStopMonitor(conversation.id, () => {
    console.info(
      "[CHAT] Stop signal received, aborting stream for conversation",
      conversation.id,
    );
    abort.abort();
  });

  const result = streamText({
    messages: convertToModelMessages(messages),
    model,
    abortSignal: abort.signal,
    onFinish: async ({ steps, totalUsage }) => {
      await cleanupStopMonitor();
      console.info(
        "[LLM] steps %d => totalUsage %d",
        steps.length,
        totalUsage.totalTokens,
      );
    },
    providerOptions: {
      anthropic: { thinking: { budgetTokens: 12000, type: "disabled" } },
    },
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

  // consume the stream to ensure it runs to completion & triggers onFinish
  // even when the client response is aborted:
  result.consumeStream(); // no await

  // Stream the response to the client, always save the last message(s) from the
  // assistant.
  return result.toUIMessageStreamResponse({
    async consumeSseStream({ stream }) {
      const activeStreamId = ulid();
      // Create a resumable stream from the SSE stream
      const streamContext = createResumableStreamContext({
        // NOTE must use separate instances for publisher and subscriber
        publisher: new Redis(env.REDIS_URL),
        subscriber: new Redis(env.REDIS_URL),
        waitUntil: null,
      });
      await streamContext.createNewResumableStream(
        activeStreamId,
        () => stream,
      );
      await saveChat({ conversation, messages: [], activeStreamId });
    },
    generateMessageId: ulid,
    onError: (error) => {
      captureException(error);
      return error instanceof Error ? error.message : "Unknown error";
    },
    onFinish: async ({ messages, isAborted }) => {
      await saveChat({
        activeStreamId: isAborted ? null : null,
        conversation,
        messages,
      });
      if (isAborted)
        await prisma.message.create({
          data: {
            content: "",
            conversationId: conversation.id,
            id: ulid(),
            isAborted,
            role: "USER",
          },
        });
      // Clean up stop monitor if not already done
      await cleanupStopMonitor();
    },
    originalMessages: messages,
    sendReasoning: true,
  });
}

async function saveChat({
  activeStreamId,
  conversation,
  messages,
}: {
  activeStreamId: string | null;
  conversation: Conversation;
  messages: ClientMessage[];
}): Promise<void> {
  await prisma.conversation.update({
    where: { id: conversation.id },
    data: {
      activeStreamId,
      messages: {
        createMany: {
          data: messages
            .map((message) => ({
              content: combineMessageParts(message.parts),
              id: message.id,
              role: message.role === "user" ? "USER" : ("ASSISTANT" as Role),
              isAborted: message.metadata?.isAborted,
            }))
            .filter((message) => message.content !== "" || message.isAborted),
          skipDuplicates: true,
        },
      },
    },
  });
}

function combineMessageParts(content: Array<{ type: string; text?: string }>) {
  return content
    .map((part) => (part.type === "text" ? part.text : ""))
    .join("\n")
    .replace(/^\s+|\s+$/g, "")
    .trim();
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
