/**
 * Cron job to run SEO ranking checks and send alerts.
 */

import sendSEORankAlert from "~/lib/seo-rank/SEORankAlert.server";

export async function loader() {
  return sendSEORankAlert();
}
