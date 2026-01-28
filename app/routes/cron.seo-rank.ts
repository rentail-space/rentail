/**
 * Cron job to run SEO ranking checks and send alerts.
 */

import { mapAsync } from "es-toolkit";
import checkRankings from "~/lib/seo-rank/checkRanking.server";
import sendSEORankAlert from "~/lib/seo-rank/SEORankAlert.server";

export async function loader() {
  return (async () => {
    const engines = ["google", "google_ai_mode", "bing", "duckduckgo"];
    const engineQueries = await mapAsync(engines, async (engine) => ({
      engine,
      queries: await checkRankings(engine, 10),
    }));
    await sendSEORankAlert(engineQueries);
    return new Response("OK");
  })();
}
