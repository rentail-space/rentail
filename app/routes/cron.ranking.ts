/**
 * Cron job to run SEO ranking checks and send alerts.
 */

import { captureException } from "@sentry/react-router";
import checkRankings from "~/lib/seo-rank/checkRanking";
import sendSEORankAlert from "~/lib/seo-rank/SEORankAlert";

export async function loader() {
  try {
    const queries = await checkRankings("serpapi");
    await sendSEORankAlert({ queries });
    return new Response("OK");
  } catch (error) {
    captureException(error);
    throw error;
  }
}
