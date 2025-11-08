import findNearbyCenters from "~/lib/findNearbyCenters";
import prisma from "~/lib/prisma";
import type { Route } from "./+types/api.chat.$chatId.centers";

/**
 * Get the shopping centers near the user for a chat.
 *
 * @param params.id - The ID of the chat to get the properties for.
 */
export async function loader({ params, request }: Route.LoaderArgs) {
  const { chatId } = params;
  const chat = await prisma.chat.findUnique({
    where: { id: chatId },
    include: { user: true },
  });
  const centers = await findNearbyCenters({
    headers: request.headers,
    user: chat?.user,
  });
  return { centers };
}
