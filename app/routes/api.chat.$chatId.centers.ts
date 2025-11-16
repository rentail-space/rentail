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
  console.log("Getting centers for chat %s", chatId);
  const found = await findUserAndChatById({ chatId, headers });
  console.log("Found user and chat: %O", found);

  const centers = found
    ? await findNearbyCenters({ headers, user: found.user })
    : [];
  return { centers };
}
