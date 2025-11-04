import { createAnthropic } from "@ai-sdk/anthropic";
import { captureException } from "@sentry/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import debug from "debug";
import { invariant, last } from "es-toolkit";
import humanFormat from "human-format";
import { Redis } from "ioredis";
import type { InputJsonValue } from "prisma/generated/internal/prismaNamespace";
import { createResumableStreamContext } from "resumable-stream/ioredis";
import { ulid } from "ulid";
import env from "~/lib/env";
import findNearbyProperties from "~/lib/findNearbyProperties";
import prisma from "~/lib/prisma";
import { monitorStopSignal } from "~/lib/redis-stop-monitor";
import systemPrompt from "~/lib/systemPrompt";
import updateUserProfile, {
  maskWorkingMemoryTags,
  userProfile,
} from "~/lib/userProfile";
import { findOrCreateUser, recentMessages } from "~/sessions.server";
import type { Route } from "./+types/api.chat.message";

const logger = debug("chat");

/**
 * Send a message to the chat.
 *
 * @param params.id - The ID of the chat to send the message to.
 * @param request - The request object.
 * @see https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-message-persistence
 */
export async function action({ request }: Route.ActionArgs) {
  const { chat, headers, user } = await findOrCreateUser({
    headers: request.headers,
  });

  // We're only looking for last message sent by the user
  const { messages: bodyMessages } = (await request.clone().json()) as {
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

  // Find properties near the user to include in the system prompt, so AI can
  // recommend properties based on the user's location.
  const properties = await findNearbyProperties(user);
  logger("Found %d properties", properties.length);

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
    model: createAnthropic({ apiKey: env.ANTHROPIC_API_KEY })(
      "claude-haiku-4-5",
    ),
    messages: convertToModelMessages(messages),
    system: systemPrompt({ userProfile, properties }),

    onAbort: async () => {
      logger("Aborted %s by user", chat.id);
    },

    onError: (error) => {
      captureException(error, { extra: { chat } });
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
    headers,

    generateMessageId: () => ulid(),

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
      return "Error in agent stream";
    },

    onFinish: async ({ messages }) => {
      // 1. Clear the active stream ID since the stream is complete
      // 2. Save the assistant's messages to the database
      // 3. Update the user's working memory based on the assistant's messages
      await prisma.chat.update({
        where: { id: chat.id },
        data: {
          activeStreamId: null,

          messages: {
            create: messages.map((message) => ({
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
          },

          user: {
            update: {
              workingMemory: updateUserProfile({
                messages,
                workingMemory: user.workingMemory,
              }),
            },
          },
        },
      });
    },
  });
}
