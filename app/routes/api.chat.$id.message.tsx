import { createAnthropic } from "@ai-sdk/anthropic";
import { captureException } from "@sentry/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import debug from "debug";
import { invariant, last } from "es-toolkit";
import humanFormat from "human-format";
import { Redis } from "ioredis";
import type { InputJsonValue } from "prisma/generated/internal/prismaNamespace";
import { createResumableStreamContext } from "resumable-stream";
import { ulid } from "ulid";
import env from "~/lib/env";
import findNearbyProperties from "~/lib/findNearbyProperties";
import prisma from "~/lib/prisma";
import { monitorStopSignal } from "~/lib/redis-stop-monitor";
import updateUserProfile, { maskWorkingMemoryTags } from "~/lib/userProfile";
import general from "~/prompts/general.md?raw";
import { findOrCreateUser, recentMessages } from "~/sessions.server";
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
  const { chat, headers, user } = await findOrCreateUser({
    chatId: params.id,
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
  const { properties, markdown } = await findNearbyProperties({
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

    // Transform the stream to mask working memory tags before sending to client
    experimental_transform: () => {
      return new TransformStream({
        transform(chunk, controller) {
          if (chunk.type === "text-delta") {
            controller.enqueue({
              ...chunk,
              text: maskWorkingMemoryTags(chunk.text),
            });
          } else controller.enqueue(chunk);
        },
      });
    },
  });

  return stream.toUIMessageStreamResponse({
    headers,

    consumeSseStream: async ({ stream }) => {
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

    onError: (error) => {
      captureException(error, { extra: { chat } });
      return "Error in agent stream";
    },

    onFinish: async ({ messages }) => {
      await prisma.chat.update({
        where: { id: chat.id },
        data: {
          activeStreamId: ulid(),
          messages: {
            create: messages.map((message) => ({
              content: message.parts as InputJsonValue,
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
