import prisma from "~/lib/prisma";
import { triggerStop } from "~/lib/redis-stop-monitor";
import type { Route } from "./+types/api.chat.$id.stop";

export async function action({ params }: Route.ActionArgs) {
  const conversation = await prisma.conversation.findUnique({
    where: { id: params.id },
  });
  if (!conversation) throw new Response(null, { status: 404 });

  await triggerStop(conversation.id);
  return new Response(null, { status: 204 });
}
