/**
 * Cron job to run visibility checks for LLMs and send visibility alerts.
 */

import sendVisibilityAlert from "~/lib/llm-visibility/EmailVisibilityAlert.server";

export async function loader() {
  return sendVisibilityAlert();
}
