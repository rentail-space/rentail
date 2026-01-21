#!/usr/bin/env tsx

/**
 * Runs weekly to monitor rentail.space's visibility in ChatGPT search results.
 *
 * Usage:
 *   tsx scripts/visibility.ts
 */

import { delay } from "node_modules/msw/lib/core/delay.mjs";
import ora from "ora";
import prisma from "~/lib/prisma";
import parseCitations from "../app/lib/chatgpt-visibility/citation-parser";
import queryChatGPTWithSearch from "../app/lib/chatgpt-visibility/openai-client";
import queries from "../app/lib/chatgpt-visibility/queries";
import sendQueryAlert from "../app/lib/chatgpt-visibility/QueryAlert";
import {
  type QueryScore,
  calculateAggregateScore,
  calculateQueryScore,
} from "../app/lib/chatgpt-visibility/scorer";

try {
  const scores = await runAllQueries();
  const aggregate = calculateAggregateScore(scores);
  console.info(aggregate);
  await sendQueryAlert(aggregate);

  process.exit(0);
} catch (error) {
  console.error("\n❌ Fatal error:", error);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}

async function runAllQueries(): Promise<QueryScore[]> {
  const scores: QueryScore[] = [];

  // Run queries sequentially to avoid rate limits
  for (let i = 0; i < queries.length; i++) {
    const query = queries[i];
    console.info(`\n[${i + 1}/${queries.length}]`);

    const score = await runSingleQuery(query.id, query.query);
    scores.push(score);

    // Rate limiting: wait 2 seconds between queries
    if (i < queries.length - 1) {
      console.info("\nWaiting 2 seconds before next query...");
      await delay(2_000);
    }
  }
  return scores;
}

async function runSingleQuery(
  queryId: string,
  query: string,
): Promise<QueryScore> {
  const spinner = ora(`Querying ChatGPT for ${query}`).start();

  try {
    const response = await queryChatGPTWithSearch(query);
    const parsed = parseCitations(response.response);
    const score = calculateQueryScore(queryId, query, parsed);
    if (score.totalScore > 0) spinner.succeed(`${score.totalScore} points`);
    else spinner.info("0 points");

    console.info(`Total citations found: ${parsed.totalCitations}`);
    for (const citation of parsed.rentailSpaceCitations)
      console.info(
        `  ${citation.position}. ${citation.url}\n     Context: ${citation.context.slice(0, 80)}...`,
      );

    for (const citation of parsed.citations) {
      const marker = citation.isRentailSpace ? "★" : " ";
      console.info(`  ${marker} ${citation.position}. ${citation.url}`);
    }

    // Save to database
    await prisma.visibilityCheck.create({
      data: {
        citationPercentage: score.rentailSpacePercentage,
        citations: JSON.stringify(parsed.citations),
        firstPlace: score.firstPlaceBonus > 0,
        mentions: score.rentailSpaceCount,
        model: response.model,
        query,
        queryId,
        response: response.response,
        score: score.totalScore,
        totalCitations: parsed.totalCitations,
      },
    });

    return score;
  } catch (error) {
    spinner.fail(`Error querying "${query}": ${error}`);
    throw error;
  }
}
