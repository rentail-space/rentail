import { invariant } from "es-toolkit";
import { JWT } from "google-auth-library";
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
    const url =
      "https://searchconsole.googleapis.com/webmasters/v3/sites/https%3A%2F%2Frentail.space/searchAnalytics/query";
    const accessToken = (await auth.authorize()).access_token;
    invariant(accessToken, "Failed to get access token");
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        startDate,
        endDate,
        dimensions: ["query"],
        rowLimit: 100,
        dimensionFilterGroups: [],
      }),
    });
    invariant(response.ok, "Failed to fetch search analytics");
    const data = (await response.json()) as {
      rows: {
        keys: string[];
        clicks: number;
        impressions: number;
        ctr: number;
        position: number;
      }[];
    };

    return data.rows.map((row) => ({
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
