/**
 * Cron job to run visibility checks for LLMs and send visibility alerts.
 */

import { captureException } from "@sentry/react-router";
import sendQueryAlert from "~/lib/chatgpt-visibility/QueryAlert";
import runAllQueries from "~/lib/chatgpt-visibility/runAllQueries";
import { calculateAggregateScore } from "~/lib/chatgpt-visibility/scorer";

export async function loader() {
  try {
    const scores = await runAllQueries(false);
    const aggregate = calculateAggregateScore(scores);
    console.info(aggregate);
    await sendQueryAlert(aggregate);
    return null;
  } catch (error) {
    captureException(error);
    throw error;
  }
}
