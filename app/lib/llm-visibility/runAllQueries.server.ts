import { groupBy, orderBy, partition } from "es-toolkit";
import ora from "ora";
import prisma from "~/lib/prisma.server";
import queryChatGPTWithSearch from "./openaiClient";
import queries from "./queries";

const REPETITIONS = 3;

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export type MentionResult = {
  mentioned: boolean;
  position: number | null;
};

export function analyzeMention(response: string): MentionResult {
  const text = response.toLowerCase();
  const keywords = ["rentail.space", "rentail"];
  const mentioned = keywords.some((k) => text.includes(k));
  if (!mentioned) return { mentioned: false, position: null };
  const positions = keywords.map((k) => text.indexOf(k)).filter((i) => i >= 0);
  return { mentioned: true, position: Math.min(...positions) };
}

export type RunSummary = {
  runId: string;
  createdAt: Date;
  checkCount: number;
};

/**
 * Creates a VisibilityRun and runs all queries × REPETITIONS times.
 * Skips if a run already exists newer than newerThan.
 */
export default async function runAllQueries({
  newerThan,
}: {
  newerThan: Date;
}) {
  // Deduplication at run level
  const existing = await prisma.visibilityRun.findFirst({
    where: { createdAt: { gte: newerThan } },
    orderBy: { createdAt: "desc" },
  });
  if (existing) {
    console.info("Skipping — run already exists:", existing.id);
  } else {
    const run = await prisma.visibilityRun.create({
      data: { platform: "chatgpt", model: "gpt-5-chat-latest" },
    });
    console.info(`Created run ${run.id}`);

    for (let qi = 0; qi < queries.length; qi++) {
      const query = queries[qi];
      console.info(`Query ${qi + 1}/${queries.length}: ${query.query}`);

      for (let rep = 1; rep <= REPETITIONS; rep++) {
        await runSingleCheck({ run, query, repetition: rep });
        await sleep(2_000);
      }
    }
  }

  // Return all runs grouped by date for email/charts
  const all = await prisma.visibilityRun.findMany({
    include: { checks: true },
    orderBy: { createdAt: "asc" },
  });
  const byDate = Object.entries(
    groupBy(all, ({ createdAt }) => createdAt.toISOString().slice(0, 10)),
  );
  return orderBy(byDate, [([date]) => date], ["asc"]);
}

async function runSingleCheck({
  run,
  query,
  repetition,
}: {
  run: { id: string };
  query: { query: string; category: string };
  repetition: number;
}) {
  const spinner = ora(
    `Rep ${repetition}/${REPETITIONS}: ${query.query}`,
  ).start();

  try {
    const { text, citations } = await queryChatGPTWithSearch(query.query);
    const { mentioned, position } = analyzeMention(text);
    const [rentailCitations] = partition(
      citations,
      (url) => new URL(url).hostname === "rentail.space",
    );
    const isFirstPlace =
      citations.length > 0 &&
      new URL(citations[0]).hostname === "rentail.space";
    const score = (isFirstPlace ? 50 : 0) + rentailCitations.length * 10;
    spinner.succeed(
      `score=${score} mentioned=${mentioned} citations=${citations.length}`,
    );

    await prisma.visibilityCheck.create({
      data: {
        runId: run.id,
        repetition,
        query: query.query,
        category: query.category,
        response: text,
        mentioned,
        position,
        citations,
      },
    });
  } catch (error) {
    spinner.fail(`Error: ${error}`);
    throw error;
  }
}
