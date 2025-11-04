import findNearbyProperties from "~/lib/findNearbyProperties";
import prisma from "~/lib/prisma";
import type { Route } from "./+types/api.chat.$chatId.properties";

/**
 * Get the properties near the user for a chat.
 *
 * @param params.id - The ID of the chat to get the properties for.
 */
export async function loader({ params }: Route.LoaderArgs) {
  const { chatId } = params;
  const chat = await prisma.chat.findUnique({
    where: { id: chatId },
    include: { user: true },
  });
  console.log(chatId, chat);
  if (!chat) return { properties: [] };
  const user = chat.user;
  const properties = await findNearbyProperties(user);
  return { properties };
}
