/**
 * Cron job to run visibility checks for LLMs and send visibility alerts.
 */

import { captureException } from "@sentry/react-router";
import sendVisibilityAlert from "~/lib/chatgpt-visibility/EmailVisibilityAlert.server";
import runAllQueries from "~/lib/chatgpt-visibility/runAllQueries.server";

export async function loader() {
  try {
    const sources = await runAllQueries(false);
    await sendVisibilityAlert({ sources });
    return new Response("OK");
  } catch (error) {
    captureException(error);
    throw error;
  }
}
