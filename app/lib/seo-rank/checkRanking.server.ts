#!/usr/bin/env tsx

/**
 * SEO Ranking Checker
 *
 * Checks Google rankings for rentail.space across key search terms.
 * Stores results in the database for historical tracking.
 *
 * @see https://serpapi.com/search-api
 */

import { ms } from "convert";
import { delay, groupBy, mapAsync, partition } from "es-toolkit";
import { getJson } from "serpapi";
import { trackApiCall } from "~/lib/apiUsageTracker";
import { default as env } from "~/lib/env";
import terms from "./searchTerms";

export type RankingResults = {
  term: string;
  engine: string;
  results: {
    link: string;
    snippet: string;
    title: string;
  }[];
};

/**
 * Check rankings for a given engine and return the top N results. Always
 * includes rentail.space.
 *
 * @param days - The number of days to cache the results.
 * @param engine - The engine to check rankings for.
 * @param limit - The number of results to return.
 * @returns An array of objects with hostname and count.
 */
export default async function checkRankings({
  days,
  engine,
  limit,
}: {
  days: number;
  engine: string;
  limit: number;
}): Promise<{ hostname: string; count: number }[]> {
  const all = await mapAsync(terms, (term) =>
    checkRankingWithSerpAPI({ days, engine, term }),
  );

  const hostnames = Object.entries(
    groupBy(
      all.flatMap((query) =>
        query.results.map((result) => new URL(result.link).hostname),
      ),
      (hostname) => hostname,
    ),
  ).map(([hostname, queries]) => ({
    hostname,
    count: queries.length,
  }));
  const [rentail, allOther] = partition(
    hostnames,
    ({ hostname }) => hostname === "rentail.space",
  );
  return [...rentail, ...allOther.slice(0, limit)].sort(
    (a, b) => b.count - a.count,
  );
}

/**
 * Check ranking using SerpAPI (recommended for production)
 */
async function checkRankingWithSerpAPI({
  days,
  engine,
  term,
}: {
  days: number;
  engine: string;
  term: string;
}): Promise<RankingResults> {
  return await trackApiCall(
    {
      days,
      defaultValue: { engine, term, results: [] },
      endpoint: "search",
      key: `seo:${engine}:${term}`,
      service: "serpapi",
    },
    async () => {
      const response = (await getJson({
        engine,
        api_key: env.SERPAPI_KEY,
        q: term,
        location: "Los Angeles, California",
      })) as {
        organic_results?: {
          position: number;
          title: string;
          link: string;
          redirect_link: string;
          displayed_link: string;
          favicon: string;
          snippet: string;
          snippet_highlighted_words: string[];
          rich_snippet: {
            top: { detected_extensions: string[]; extensions: string[] };
          };
          source: string;
        }[];
        references?: {
          link: string;
          title: string;
          snippet: string;
        }[];
      };

      // Rate limit: 1 request per second
      await delay(ms("2s"));

      const results =
        (response.organic_results ?? response.references ?? []).map(
          (result) => ({
            link: result.link,
            title: result.title,
            snippet: result.snippet,
          }),
        ) ?? [];
      return { engine, term, results };
    },
  );
}
