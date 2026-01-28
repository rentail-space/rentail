/**
 * Cron job to run visibility checks for LLMs and send visibility alerts.
 */

import sendVisibilityAlert from "~/lib/chatgpt-visibility/EmailVisibilityAlert.server";
import runAllQueries from "~/lib/chatgpt-visibility/runAllQueries.server";

export async function loader() {
  return (async () => {
    const sources = await runAllQueries(false);
    await sendVisibilityAlert({ sources });
    return new Response("OK");
  })();
}
