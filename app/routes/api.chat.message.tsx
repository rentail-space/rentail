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

  const { messages: bodyMessages } = (await request.clone().json()) as {
    messages: UIMessage[];
  };
  const lastMessage = last(bodyMessages) as UIMessage;
  invariant(lastMessage, "Last message is required");
  await prisma.messages.create({
    data: {
      chatId: chat.id,
      content: lastMessage.parts as InputJsonValue,
      id: lastMessage.id,
      role: "user",
      type: "text",
    },
  });

  const messages = await recentMessages(chat.id);

  // Set up Redis stop monitoring
  const { abortSignal } = await monitorStopSignal(chat.id);
  const properties = await findNearbyProperties({
    maxDistance: 20,
    user,
  });
  logger("Found %d properties", properties.length);

  const stream = streamText({
    abortSignal,
    model: createAnthropic({ apiKey: env.ANTHROPIC_API_KEY })(
      "claude-haiku-4-5",
    ),
    messages: convertToModelMessages(messages),
    system: systemPrompt({ userProfile, properties }),

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
  });

  return stream.toUIMessageStreamResponse({
    headers,

    consumeSseStream: async ({ stream }) => {
      const streamId = ulid();

      // Create a resumable stream from the SSE stream
      const streamContext = createResumableStreamContext({
        publisher: new Redis(env.REDIS_URL),
        subscriber: new Redis(env.REDIS_URL),
        waitUntil: async (promise) => await promise,
      });
      await streamContext.createNewResumableStream(streamId, () => stream);

      await prisma.chat.update({
        where: { id: chat.id },
        data: { activeStreamId: streamId },
      });
    },

    onError: (error) => {
      captureException(error, { extra: { chat } });
      return "Error in agent stream";
    },

    onFinish: async ({ messages }) => {
      await prisma.chat.update({
        where: { id: chat.id },
        data: {
          activeStreamId: null,
          messages: {
            create: messages.map((message) => ({
              content: message.parts.map((part) =>
                part.type === "text"
                  ? {
                      type: "text",
                      text: maskWorkingMemoryTags(part.text).trim(),
                    }
                  : part,
              ) as InputJsonValue,
              id: ulid(),
              role: message.role as "assistant" | "user",
              type: "text",
            })),
          },
          user: {
            update: {
              workingMemory: await updateUserProfile({
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
