/**
 * Cron job to run visibility checks for LLMs and send visibility alerts.
 */

import { captureException } from "@sentry/react-router";
import runAllQueries from "~/lib/chatgpt-visibility/runAllQueries";
import sendVisibilityAlert from "~/lib/chatgpt-visibility/VisibilityAlert";

export async function loader() {
  try {
    const sources = await runAllQueries(false);
    await sendVisibilityAlert({ sources });
    return null;
  } catch (error) {
    captureException(error);
    throw error;
  }
}
