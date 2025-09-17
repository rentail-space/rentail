import prisma from "~/lib/prisma";
import { stopChat } from "~/lib/redis-stop-monitor";
import type { Route } from "./+types/api.chat.$id.stop";

/**
 * Stop a conversation. Typically a conversation will run until the LLM is done,
 * and reload the page will only resume the conversation. This endpoint is used
 * to stop the conversation manually.
 *
 * @param params.id - The ID of the conversation to stop.
 */
export async function action({ params }: Route.ActionArgs) {
  const conversation = await prisma.conversation.findUnique({
    where: { id: params.id },
  });
  if (!conversation) throw new Response(null, { status: 404 });

  await stopChat(conversation.id);
  return new Response(null, { status: 204 });
}
