import prisma from "~/lib/prisma";
import { stopChat } from "~/lib/redis-stop-monitor";
import type { Route } from "./+types/api.chat.$id.stop";

/**
 * Stop a chat. Typically a chat will run until the LLM is done,
 * and reload the page will only resume the chat. This endpoint is used
 * to stop the chat manually.
 *
 * @param params.id - The ID of the chat to stop.
 */
export async function action({ params }: Route.ActionArgs) {
  const chat = await prisma.chat.findUnique({
    where: { id: params.id },
  });
  if (!chat) throw new Response(null, { status: 404 });

  await stopChat(chat.id);
  return new Response(null, { status: 204 });
}
