import { captureException } from "@sentry/react-router";
import { UI_MESSAGE_STREAM_HEADERS } from "ai";
import { Redis } from "ioredis";
import { createResumableStreamContext } from "resumable-stream/ioredis";
import env from "~/lib/env";
import { findUserAndChatById } from "~/lib/sessions.server";
import type { Route } from "./+types/api.chat.$chatId.message.$messageId.stream";

/**
 * Resume a message stream.
 *
 * @param params.id - The ID of the chat.
 * @param params.mid - The ID of the message to resume.
 * @see https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-resume-streams
 */
export async function loader({ request, params }: Route.LoaderArgs) {
  const { chatId } = params;
  const found = await findUserAndChatById({
    chatId,
    requestHeaders: request.headers,
  });

  if (!found || found.chat.activeStreamId == null)
    return new Response(null, { status: 204 });

  try {
    const streamContext = createResumableStreamContext({
      publisher: new Redis(env.REDIS_URL),
      subscriber: new Redis(env.REDIS_URL),
      waitUntil: async (promise) => await promise,
    });

    const stream = await streamContext.resumeExistingStream(
      found.chat.activeStreamId,
    );

    if (!stream)
      // Stream not found in Redis, return 204 to signal completion
      return new Response(null, {
        headers: found.responseHeaders,
        status: 204,
      });

    // Return the stream directly - Response accepts ReadableStream<Uint8Array>
    return new Response(stream, {
      headers: { ...UI_MESSAGE_STREAM_HEADERS, ...found.responseHeaders },
    });
  } catch (error) {
    captureException(error, {
      extra: {
        activeStreamId: found.chat.activeStreamId,
        chatId: found.chat.id,
      },
    });
    // Return 204 instead of 500 so client treats it as stream complete
    return new Response(null, { headers: found.responseHeaders, status: 204 });
  }
}
