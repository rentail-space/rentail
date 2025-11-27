import { data } from "react-router";
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
  const found = await findUserAndChatById({
    chatId,
    requestHeaders: request.headers,
  });
  const { centers, location } = await findNearbyCenters({
    headers: request.headers,
    user: found?.user,
  });
  return data({ centers, location }, { headers: found?.responseHeaders });
}
