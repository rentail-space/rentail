import prisma from "~/lib/prisma";
import { stopChat } from "~/lib/redis-stop-monitor";
import type { Route } from "./+types/api.chat.$chatId.stop";

/**
 * Stop a chat. Typically a chat will run until the LLM is done,
 * and reload the page will only resume the chat. This endpoint is used
 * to stop the chat manually.
 *
 * @param params.id - The ID of the chat to stop.
 * @see https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-stop-streams
 */
export async function action({ params }: Route.ActionArgs) {
  const { chatId } = params;
  const chat = await prisma.chat.findUnique({
    where: { id: chatId },
  });
  if (chat) await stopChat(chat.id);
  return new Response(null, { status: 204 });
}
