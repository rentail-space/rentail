import { stopChat } from "~/lib/redis-stop-monitor";
import { findUserAndChatById } from "~/lib/sessions.server";
import type { Route } from "./+types/api.chat.$chatId.stop";

/**
 * Stop a chat. Typically a chat will run until the LLM is done,
 * and reload the page will only resume the chat. This endpoint is used
 * to stop the chat manually.
 *
 * @param params.id - The ID of the chat to stop.
 * @see https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-stop-streams
 */
export async function action({ params, request }: Route.ActionArgs) {
  const { chatId } = params;
  const found = await findUserAndChatById({
    chatId,
    requestHeaders: request.headers,
  });
  if (!found) throw new Response("Not Found", { status: 404 });

  await stopChat(found.chat.id);
  return new Response(null, { headers: found.responseHeaders, status: 204 });
}
