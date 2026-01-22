/**
 * Cron job to run visibility checks for LLMs and send visibility alerts.
 */

import { captureException } from "@sentry/react-router";
import sendQueryAlert from "~/lib/chatgpt-visibility/QueryAlert";
import runAllQueries from "~/lib/chatgpt-visibility/runAllQueries";

export async function loader() {
  try {
    const sources = await runAllQueries(false);
    await sendQueryAlert({ sources });
    return null;
  } catch (error) {
    captureException(error);
    throw error;
  }
}
