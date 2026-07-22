#!/usr/bin/env tsx

/**
 * SEO Ranking Checker
 *
 * Checks Google rankings for rentail.space across key search terms.
 * Stores results in the database for historical tracking.
 *
 * @see https://serpapi.com/search-api
 */

import { groupBy, mapAsync, maxBy } from "es-toolkit";
import { default as env } from "~/lib/env";
import { trackApiCall } from "~/lib/apiUsageTracker";
import { fork, sleep } from "radashi";
import { getJson } from "serpapi";
import { ms } from "convert";
import terms from "./searchTerms";

type RankingResults = {
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
 * @param newerThan - The date to cache the results.
 * @param engine - The engine to check rankings for.
 * @param limit - The number of results to return.
 * @returns The newest date and the top N results.
 */
export default async function checkRankings({
  engine,
  limit,
  newerThan,
}: {
  engine: string;
  limit: number;
  newerThan: Date;
}): Promise<{
  newest: Date;
  results: { hostname: string; count: number }[];
}> {
  const all = await mapAsync(terms, (term) =>
    checkRankingWithSerpAPI({ engine, newerThan, term }),
  );
  const newest =
    maxBy(all, (result) => result.createdAt.getTime())?.createdAt ?? new Date();

  const hostnames = Object.entries(
    groupBy(
      all.flatMap(({ data }) =>
        data.results.map((result) => new URL(result.link).hostname),
      ),
      (hostname) => hostname,
    ),
  ).map(([hostname, queries]) => ({
    hostname,
    count: queries.length,
  }));
  const [rentail, allOther] = fork(
    hostnames,
    ({ hostname }) => hostname === "rentail.space",
  );
  return {
    newest,
    results: [...rentail, ...allOther.slice(0, limit)].sort(
      (a, b) => b.count - a.count,
    ),
  };
}

/**
 * Check ranking using SerpAPI (recommended for production)
 */
async function checkRankingWithSerpAPI({
  engine,
  newerThan,
  term,
}: {
  engine: string;
  newerThan: Date;
  term: string;
}): Promise<{
  data: RankingResults;
  createdAt: Date;
}> {
  return await trackApiCall(
    {
      newerThan,
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
      await sleep(ms("1s"));

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
