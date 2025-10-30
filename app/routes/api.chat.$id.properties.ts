import findNearbyProperties from "~/lib/findNearbyProperties";
import prisma from "~/lib/prisma";
import type { Route } from "./+types/api.chat.$id.export.csv";

export async function loader({ params }: Route.LoaderArgs) {
  const { id } = params;
  const chat = await prisma.chat.findUnique({
    include: { user: true },
    where: { id },
  });
  if (!chat) throw new Response("Chat not found", { status: 404 });
  const { properties } = await findNearbyProperties({
    chat,
    maxDistance: 20,
    user: chat.user,
  });
  return properties;
}
