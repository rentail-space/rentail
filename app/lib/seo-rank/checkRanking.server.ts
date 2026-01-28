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
import { delay, groupBy, partition } from "es-toolkit";
import { DateTime } from "luxon";
import ora from "ora";
import { getJson } from "serpapi";
import { trackApiCall } from "~/lib/apiUsageTracker";
import env from "~/lib/env";
import prisma from "~/lib/prisma.server";
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
 * @param engine - The engine to check rankings for.
 * @param limit - The number of results to return.
 * @returns An array of objects with hostname and count.
 */
export default async function checkRankings(
  engine: string,
  limit: number,
): Promise<{ hostname: string; count: number }[]> {
  const results: RankingResults[] = [];
  const spinner = ora().start(`Checking ${terms.length} terms...`);

  for (const term of terms) {
    spinner.text = `Checking "${term}"...`;
    const ranking = await withCache(engine, term, () =>
      checkRankingWithSerpAPI(engine, term),
    );
    results.push(ranking);
  }
  spinner.succeed(`Checked ${terms.length} terms`);

  const countedHostnames = Object.entries(
    groupBy(
      results.flatMap((query) =>
        query.results.map((result) => new URL(result.link).hostname),
      ),
      (hostname) => hostname,
    ),
  ).map(([hostname, results]) => ({
    hostname,
    count: results.length,
  }));
  const [rentail, allOther] = partition(
    countedHostnames,
    ({ hostname }) => hostname === "rentail.space",
  );
  return [...rentail, ...allOther.slice(0, limit)].sort(
    (a, b) => b.count - a.count,
  );
}

/**
 * Check ranking using SerpAPI (recommended for production)
 */
async function checkRankingWithSerpAPI(
  engine: string,
  term: string,
): Promise<RankingResults> {
  return await trackApiCall("serpapi", "search", async () => {
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
      (response.organic_results ?? response.references ?? []).map((result) => ({
        link: result.link,
        title: result.title,
        snippet: result.snippet,
      })) ?? [];
    return { engine, term, results };
  });
}

async function withCache(
  engine: string,
  term: string,
  fn: () => Promise<RankingResults>,
) {
  const key = `seo:${engine}:${term}`;
  const tenDaysAgo = DateTime.now().minus({ days: 10 }).toJSDate();
  const cached = await prisma.cache.findUnique({
    where: { key, createdAt: { gte: tenDaysAgo } },
  });
  if (cached) return cached.value as unknown as RankingResults;
  const value = await fn();
  await prisma.cache.upsert({
    create: { key, value },
    update: { value },
    where: { key },
  });
  return value;
}
