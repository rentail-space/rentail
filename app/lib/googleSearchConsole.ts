import { JWT } from "google-auth-library";
import { google } from "googleapis";
import envVars from "./env.js";

export interface SearchQuery {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

/**
 * Fetch search analytics data from Google Search Console
 * Returns top 100 queries sorted by impressions (reach)
 */
export async function getSearchAnalytics(
  startDate: string,
  endDate: string,
): Promise<SearchQuery[]> {
  try {
    const auth = new JWT({
      scopes: "https://www.googleapis.com/auth/webmasters.readonly",
      email: "analytics@rentail-480516.iam.gserviceaccount.com",
      key: envVars.GOOGLE_ANALYTICS_PRIVATE_KEY,
    });
    const searchconsole = google.searchconsole({ version: "v1", auth: auth });
    const response = await searchconsole.searchanalytics.query({
      siteUrl: "https://rentail.space",
      requestBody: {
        startDate,
        endDate,
        dimensions: ["query"],
        rowLimit: 100,
        dimensionFilterGroups: [],
      },
    });

    if (!response.data.rows) return [];
    return response.data.rows.map((row) => ({
      query: row.keys?.[0] ?? "",
      clicks: row.clicks ?? 0,
      impressions: row.impressions ?? 0,
      ctr: row.ctr ?? 0,
      position: row.position ?? 0,
    }));
  } catch (error) {
    console.error("Error fetching search analytics:", error);
    return [];
  }
}
