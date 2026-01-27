#!/usr/bin/env tsx

/**
 * SEO Ranking Checker
 *
 * Checks Google rankings for rentail.space across key search terms.
 * Stores results in the database for historical tracking.
 *
 * Usage:
 *   pnpm check-seo
 *   pnpm check-seo --method=playwright  # Use browser automation instead of API
 */

import { ms } from "convert";
import { delay } from "es-toolkit";
import ora from "ora";
import { chromium } from "playwright";
import { getJson } from "serpapi";
import env from "~/lib/env";
import prisma from "~/lib/prisma.server";
import terms from "./searchTerms";

export type RankingResults = {
  term: string;
  results: {
    link: string;
    snippet: string;
    title: string;
  }[];
};

export default async function checkRankings(
  method: "playwright" | "serpapi",
): Promise<RankingResults[]> {
  const results: RankingResults[] = [];
  const spinner = ora().start(`Checking ${terms.length} terms...`);

  for (const term of terms) {
    spinner.text = `Checking "${term}"...`;
    const ranking = await withCache(method, term, async () =>
      method === "playwright"
        ? await checkRankingWithPlaywright(term)
        : await checkRankingWithSerpAPI(term),
    );
    results.push(ranking);
    // Rate limit: 1 request per second
    await delay(ms("2s"));
  }
  spinner.succeed(`Checked ${terms.length} terms`);
  return results;
}

/**
 * Check ranking using SerpAPI (recommended for production)
 */
async function checkRankingWithSerpAPI(term: string): Promise<RankingResults> {
  try {
    const response = (await getJson({
      engine: "google",
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
      related_searches?: {
        block_position: number;
        query: string;
        link: string;
        serpapi_link: string;
      }[];
    };

    const results =
      response.organic_results?.map((result) => ({
        link: result.link,
        title: result.title,
        snippet: result.snippet,
      })) ?? [];
    return { term, results };
  } catch (error) {
    console.error(`Error checking "%s":`, term, error);
    return { term, results: [] };
  }
}

/**
 * Check ranking using Playwright browser automation (fallback/free option)
 */
async function checkRankingWithPlaywright(
  term: string,
): Promise<RankingResults> {
  const browser = await chromium.launch({ headless: true });

  try {
    const page = await browser.newPage();

    // Search Google
    await page.goto(
      `https://www.google.com/search?q=${encodeURIComponent(term)}&num=10`,
      { waitUntil: "domcontentloaded" },
    );

    // Wait for results
    await page.waitForSelector("#search", { timeout: 5000 });

    // Extract all organic result links
    const results = await page.$$eval("#search div.g a[href]", (links) => {
      return links
        .map((link, index) => ({
          link: (link as HTMLAnchorElement).href,
          title: (link as HTMLAnchorElement).textContent,
          snippet: (link as HTMLAnchorElement).textContent,
          position: index + 1,
          includesDomain:
            (link as HTMLAnchorElement).hostname === "rentail.space",
        }))
        .filter((r) => r.includesDomain && r.position <= 10);
    });

    if (results.length > 0) {
      return { term, results };
    }

    return { term, results: [] };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Playwright error for "${term}":`, errorMessage);
    return { term, results: [] };
  } finally {
    await browser.close();
  }
}

async function withCache(
  method: "playwright" | "serpapi",
  term: string,
  fn: () => Promise<RankingResults>,
) {
  const key = `seo:${method}:${term}`;
  const cached = await prisma.cache.findUnique({ where: { key } });
  if (cached) return JSON.parse(cached.value as string) as RankingResults;
  const result = await fn();
  await prisma.cache.upsert({
    where: { key },
    create: { key, value: JSON.stringify(result) },
    update: { value: JSON.stringify(result) },
  });
  return result;
}
