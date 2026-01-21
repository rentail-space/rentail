import { delay } from "node_modules/msw/lib/core/delay.mjs";
import ora from "ora";
import prisma from "~/lib/prisma";
import parseCitations from "./citation-parser";
import queryChatGPTWithSearch from "./openai-client";
import queries from "./queries";
import { type QueryScore, calculateQueryScore } from "./scorer";

/**
 * Runs all queries and returns the scores for all queries.  The queries are run
 * sequentially to avoid rate limits.  The scores are saved to the database.
 *
 * @returns The scores for all queries.
 */
export default async function runAllQueries(
  verbose: boolean,
): Promise<QueryScore[]> {
  const scores: QueryScore[] = [];

  // Run queries sequentially to avoid rate limits
  for (let i = 0; i < queries.length; i++) {
    const query = queries[i];
    if (verbose) console.info(`Running query ${i + 1} of ${queries.length}`);

    const score = await runSingleQuery({ ...query, verbose });
    scores.push(score);

    // Rate limiting: wait 2 seconds between queries
    if (i < queries.length - 1) {
      if (verbose) console.info("\nWaiting 2 seconds before next query...");
      await delay(2_000);
    }
  }
  return scores;
}

async function runSingleQuery({
  id,
  query,
  verbose,
}: {
  id: string;
  query: string;
  verbose: boolean;
}): Promise<QueryScore> {
  const spinner = ora(`Querying ChatGPT for ${query}`).start();

  try {
    const response = await queryChatGPTWithSearch(query);
    const parsed = parseCitations(response.response);
    const score = calculateQueryScore(id, query, parsed);
    if (score.totalScore > 0) spinner.succeed(`${score.totalScore} points`);
    else spinner.info("0 points");

    if (verbose)
      console.info(`Total citations found: ${parsed.totalCitations}`);
    for (const citation of parsed.rentailSpaceCitations)
      if (verbose)
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
        queryId: id,
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
