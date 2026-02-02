import { openai } from "@ai-sdk/openai";
import type { LanguageModelV3 } from "@ai-sdk/provider";
import { groupBy, orderBy, partition } from "es-toolkit";
import { DateTime } from "luxon";
import { delay } from "node_modules/msw/lib/core/delay.mjs";
import ora from "ora";
import prisma from "~/lib/prisma.server";
import queryChatGPTWithSearch from "./openaiClient";
import queries from "./queries";

export type Source = {
  category: string;
  citations: string[];
  createdAt: Date;
  id: string;
  query: string;
};

/**
 * Runs all queries and returns the sources from all queries.  The queries are
 * run sequentially to avoid rate limits.
 *
 * @param cacheDays - The number of days to cache the results.
 * @returns The sources from all queries grouped by date.
 */
export default async function runAllQueries({
  cacheDays,
}: {
  cacheDays: number;
}): Promise<[string, Source[]][]> {
  const sources: Source[] = [];
  const model = openai("gpt-5-chat-latest");
  const createdAt = new Date();

  // Run queries sequentially to avoid rate limits
  for (let i = 0; i < queries.length; i++) {
    const query = queries[i];
    console.info(`Running query ${i + 1} of ${queries.length}`);

    const source = await runSingleQuery({
      cacheDays,
      createdAt,
      model,
      ...query,
    });
    sources.push(source);
  }

  const all = await prisma.visibilityCheck.findMany();
  const byDate = Object.entries(
    groupBy(all, ({ createdAt }) =>
      DateTime.fromJSDate(createdAt).toFormat("yyyy-MM-dd"),
    ),
  );
  return orderBy(byDate, [([date]) => date], ["asc"]);
}

async function runSingleQuery({
  cacheDays,
  createdAt,
  category,
  query,
  model,
}: {
  cacheDays: number;
  createdAt: Date;
  category: string;
  model: LanguageModelV3;
  query: string;
}): Promise<Source> {
  return await withCache({ category, cacheDays, query }, async () => {
    const spinner = ora(`Querying ChatGPT for ${query}`).start();

    try {
      const sources = await queryChatGPTWithSearch({ model, query });
      const citations = sources
        .filter((s) => s.sourceType === "url")
        .map((s) => s.url);
      const [isRentail] = partition(
        citations,
        (url) => new URL(url).hostname === "rentail.space",
      );
      const isFirstPlace = new URL(citations[0]).hostname === "rentail.space";
      const score = (isFirstPlace ? 50 : 0) + isRentail.length * 10;
      spinner.succeed(`${score} points`);

      for (const url of citations) {
        const marker = new URL(url).hostname === "rentail.space" ? "★" : " ";
        console.info("%s %s", marker, url);
      }

      // Save to database
      const { id } = await prisma.visibilityCheck.create({
        data: {
          category,
          citations,
          createdAt,
          model: model.modelId,
          query,
        },
      });

      // Rate limiting: wait 2 seconds between queries
      console.info("\nWaiting 2 seconds before next query...");
      await delay(2_000);

      return { citations, query, category, id, createdAt };
    } catch (error) {
      spinner.fail(`Error querying "${query}": $error`);
      throw error;
    }
  });
}

async function withCache(
  {
    category,
    cacheDays,
    query,
  }: {
    category: string;
    cacheDays: number;
    query: string;
  },
  fn: () => Promise<Source>,
) {
  const key = `seo:${category}:${query}`;
  const ago = DateTime.now().minus({ days: cacheDays }).toJSDate();
  const cached = await prisma.cache.findUnique({
    where: { key, createdAt: { gt: ago } },
  });
  if (cached) return cached.value as unknown as Source;
  const value = await fn();
  await prisma.cache.upsert({
    create: { key, value },
    update: { value },
    where: { key },
  });
  return value;
}
