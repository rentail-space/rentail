import findNearbyProperties from "~/lib/findNearbyProperties";
import prisma from "~/lib/prisma";
import type { Route } from "./+types/api.chat.$id.export.csv";

/**
 * Get the properties near the user for a chat.
 *
 * @param params.id - The ID of the chat to get the properties for.
 */
export async function loader({ params }: Route.LoaderArgs) {
  const { id } = params;
  const user = await prisma.user.findUnique({
    where: { id },
  });
  if (!user) return Response.json({ properties: [] });
  const properties = await findNearbyProperties({ maxDistance: 20, user });
  return Response.json({ properties });
}
