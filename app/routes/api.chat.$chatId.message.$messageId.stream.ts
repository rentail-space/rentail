import { UI_MESSAGE_STREAM_HEADERS } from "ai";
import { resumeChatStream } from "~/lib/chatStream.server";
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
    const stream = await resumeChatStream(found.chat.activeStreamId);

    if (!stream)
      // No buffered stream — return 204 to signal completion
      return new Response(null, {
        headers: found.responseHeaders,
        status: 204,
      });

    const headers = new Headers(UI_MESSAGE_STREAM_HEADERS);
    for (const [key, value] of found.responseHeaders)
      headers.append(key, value);

    // Return the stream directly - Response accepts ReadableStream<Uint8Array>
    return new Response(stream, {
      headers,
    });
  } catch (error) {
    console.error(
      "Error resuming stream for chat %s: %s",
      found.chat.id,
      error,
    );
    // Return 204 instead of 500 so client treats it as stream complete
    return new Response(null, { headers: found.responseHeaders, status: 204 });
  }
}
