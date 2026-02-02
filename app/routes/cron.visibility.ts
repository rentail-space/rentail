/**
 * Cron job to run visibility checks for LLMs and send visibility alerts.
 */

import sendVisibilityAlert from "~/lib/chatgpt-visibility/EmailVisibilityAlert.server";

export async function loader() {
  return sendVisibilityAlert();
}
