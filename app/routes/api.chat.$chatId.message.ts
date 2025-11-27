import { captureException } from "@sentry/react-router";
import { type UIMessage, convertToModelMessages, streamText } from "ai";
import debug from "debug";
import { invariant, last } from "es-toolkit";
import humanFormat from "human-format";
import { Redis } from "ioredis";
import type { InputJsonValue } from "prisma/generated/internal/prismaNamespace";
import { createResumableStreamContext } from "resumable-stream/ioredis";
import { ulid } from "ulid";
import env from "~/lib/env";
import { conversationalModel } from "~/lib/model";
import preparePrompt from "~/lib/preparePrompt";
import prisma from "~/lib/prisma";
import { monitorStopSignal } from "~/lib/redis-stop-monitor";
import updateWorkingMemory, {
  maskWorkingMemoryTags,
} from "~/lib/workingMemory";
import chatPrompt from "~/prompts/chatPrompt.md?raw";
import { findOrCreateUser, recentMessages } from "~/sessions.server";
import type { Route } from "./+types/api.chat.$chatId.message";

const logger = debug("chat");

/**
 * Send a message to the chat.
 *
 * @param params.id - The ID of the chat to send the message to.
 * @param request - The request object.
 * @see https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-message-persistence
 */
export async function action({ request, params }: Route.ActionArgs) {
  const { chatId } = params;

  const { chat, responseHeaders, user } = await findOrCreateUser({
    chatId,
    requestHeaders: request.headers,
  });

  // We're only looking for last message sent by the user
  const { messages: bodyMessages } = (await request.json()) as {
    messages: UIMessage[];
  };
  const lastMessage = last(bodyMessages) as UIMessage;
  invariant(lastMessage, "Last message is required");

  // For robustness, we're clearing any previous active stream.
  // We're also saving the user's message to the database.
  await prisma.chat.update({
    data: {
      activeStreamId: null,
      messages: {
        create: {
          content: lastMessage.parts as InputJsonValue,
          id: lastMessage.id,
          role: "user",
          type: "text",
        },
      },
    },
    where: { id: chat.id },
  });

  // We're getting the recent messages to pass to the stream, since we need AI
  // to operate on the full conversation history.
  const messages = await recentMessages(chat.id);

  // Set up Redis stop monitoring
  const { abortSignal } = await monitorStopSignal(chat.id);

  // NOTE: onFinish may be called before consumeSseStream, so we need to store
  // the active stream ID in the database right now. The docs show a different
  // approach, but it fails certain test cases (quick responses).
  const activeStreamId = ulid();
  await prisma.chat.update({
    data: { activeStreamId },
    where: { id: chat.id },
  });

  const stream = streamText({
    abortSignal,
    model: conversationalModel,
    messages: convertToModelMessages(messages),
    system: await preparePrompt({
      headers: request.headers,
      user,
      prompt: chatPrompt,
    }),

    onAbort: async () => {
      logger("Aborted %s by user", chat.id);
    },

    onError: (error) => {
      captureException(error, { extra: { chat } });
      console.error("Error in agent stream: %s", error);
    },

    onFinish: async ({ steps, usage }) => {
      logger(
        "Finished %s: %d steps => total tokens %s",
        chat.id,
        steps.length,
        humanFormat(usage.totalTokens ?? 0),
      );
    },
  });

  return stream.toUIMessageStreamResponse({
    headers: responseHeaders,

    generateMessageId: () => ulid(),

    // Include all messages (including the user message just added) in the response.
    // This tells the AI SDK to include these messages in the stream so the client
    // hook can update its state with both the user message and assistant response.
    originalMessages: messages.map((msg) => ({
      id: msg.id,
      role: msg.role as "user" | "assistant",
      parts: msg.parts,
    })),

    consumeSseStream: async ({ stream }) => {
      // Create a resumable stream from the SSE stream
      const streamContext = createResumableStreamContext({
        publisher: new Redis(env.REDIS_URL),
        subscriber: new Redis(env.REDIS_URL),
        waitUntil: async (promise) => await promise,
      });
      await streamContext.createNewResumableStream(
        activeStreamId,
        () => stream,
      );
    },

    onError: (error) => {
      captureException(error, { extra: { chat } });
      console.error("Error in agent stream: %s", error);
      return "Error in agent stream";
    },

    onFinish: async ({ messages }) => {
      // 1. Try to save assistant messages and clear active stream ID
      // Only create assistant messages - the user message was already created at line 49-54
      const assistantMessages = messages.filter(
        (message) => message.role === "assistant",
      );

      await prisma.chat.update({
        where: { id: chat.id },
        data: {
          activeStreamId: null,

          messages: {
            createMany: {
              data: assistantMessages.map((message) => ({
                content: message.parts
                  .filter((part) => part.type === "text")
                  .map((part) => ({
                    type: "text",
                    text: maskWorkingMemoryTags(part.text).trim(),
                  })),
                id: message.id,
                role: message.role as "assistant" | "user",
                type: "text",
              })),
              skipDuplicates: true,
            },
          },
        },
      });

      // 2. Update the user's working memory asynchronously (slower operation)
      await prisma.user.update({
        where: { id: user.id },
        data: {
          workingMemory: await updateWorkingMemory({
            messages,
            workingMemory: user.workingMemory,
          }),
        },
      });
    },
  });
}
