import invariant from "tiny-invariant";
import { z } from "zod";
import { createGoogleAnalyticsAuth } from "./googleAnalytics.server.js";

const searchQuerySchema = z.object({
  query: z.string(),
  clicks: z.number(),
  impressions: z.number(),
  ctr: z.number(),
  position: z.number(),
});

export const searchQueryArraySchema = z.array(searchQuerySchema);

export type SearchQuery = z.infer<typeof searchQuerySchema>;

const searchConsoleErrorSchema = z.object({
  error: z.object({ message: z.string() }),
});

const searchConsoleResponseSchema = z.object({
  rows: z.array(
    z.object({
      keys: z.array(z.string()),
      clicks: z.number(),
      impressions: z.number(),
      ctr: z.number(),
      position: z.number(),
    }),
  ),
});

/**
 * Fetch search analytics data from Google Search Console
 * Returns top 100 queries sorted by impressions (reach)
 */
export async function getSearchAnalytics({
  startDate,
  endDate,
}: {
  startDate: Date;
  endDate: Date;
}): Promise<SearchQuery[]> {
  try {
    const auth = createGoogleAnalyticsAuth(
      "https://www.googleapis.com/auth/webmasters.readonly",
    );
    const domain = "rentail.space";
    const url = `https://searchconsole.googleapis.com/webmasters/v3/sites/sc-domain:${domain}/searchAnalytics/query`;
    const accessToken = (await auth.authorize()).access_token;
    invariant(accessToken, "Failed to get access token");
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        startDate: startDate.toISOString().split("T")[0],
        endDate: endDate.toISOString().split("T")[0],
        dimensions: ["query"],
        rowLimit: 100,
        dimensionFilterGroups: [],
      }),
    });
    if (!response.ok) {
      const error = searchConsoleErrorSchema.safeParse(await response.json());
      if (error.success)
        console.error(
          "Error fetching search analytics:",
          error.data.error.message,
        );
      return [];
    }

    const data = searchConsoleResponseSchema.safeParse(await response.json());
    if (!data.success) {
      console.error("Invalid Search Console API response:", data.error);
      return [];
    }
    return data.data.rows.map((row) => ({
      query: row.keys[0] ?? "",
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: row.ctr,
      position: row.position,
    }));
  } catch (error) {
    console.error("Error fetching search analytics:", error);
    return [];
  }
}
