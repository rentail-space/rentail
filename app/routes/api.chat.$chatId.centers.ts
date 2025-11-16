import findNearbyCenters from "~/lib/findNearbyCenters";
import { findUserAndChatById } from "~/sessions.server";
import type { Route } from "./+types/api.chat.$chatId.centers";

/**
 * Get the shopping centers near the user for a chat.
 *
 * @param params.id - The ID of the chat to get the centers for.
 */
export async function loader({ params, request }: Route.LoaderArgs) {
  const { chatId } = params;
  const { headers } = request;
  const found = await findUserAndChatById({ chatId, headers });

  const centers = found
    ? await findNearbyCenters({ headers, user: found.user })
    : [];
  return { centers };
}
