import { openai } from "@ai-sdk/openai";
import type { LanguageModelV3 } from "@ai-sdk/provider";
import { partition } from "es-toolkit";
import { delay } from "node_modules/msw/lib/core/delay.mjs";
import ora from "ora";
import prisma from "~/lib/prisma";
import queryChatGPTWithSearch from "./openai-client";
import queries from "./queries";

export type Source = {
  id: string;
  category: string;
  citations: string[];
  query: string;
};

/**
 * Runs all queries and returns the sources from all queries.  The queries are
 * run sequentially to avoid rate limits.
 *
 * @returns The sources from all queries
 */
export default async function runAllQueries(
  verbose: boolean,
): Promise<Source[]> {
  const sources: Source[] = [];
  const model = openai("gpt-5-chat-latest");
  const createdAt = new Date();

  // Run queries sequentially to avoid rate limits
  for (let i = 0; i < queries.length; i++) {
    const query = queries[i];
    if (verbose) console.info(`Running query ${i + 1} of ${queries.length}`);

    const source = await runSingleQuery({
      createdAt,
      model,
      verbose,
      ...query,
    });
    sources.push(source);

    // Rate limiting: wait 2 seconds between queries
    if (i < queries.length - 1) {
      if (verbose) console.info("\nWaiting 2 seconds before next query...");
      await delay(2_000);
    }
  }
  return sources;
}

async function runSingleQuery({
  createdAt,
  category,
  query,
  model,
  verbose,
}: {
  createdAt: Date;
  category: string;
  model: LanguageModelV3;
  query: string;
  verbose: boolean;
}): Promise<Source> {
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

    if (verbose)
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

    return { citations, query, category, id };
  } catch (error) {
    spinner.fail(`Error querying "${query}": $error`);
    throw error;
  }
}
