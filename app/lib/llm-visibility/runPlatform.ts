// app/lib/llm-visibility/runPlatform.ts
import prisma from "~/lib/prisma.server";
import queries from "./queries";
import type { LLMResult } from "./types";

const REPETITIONS = 3;

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

export function sleep(ms: number): Promise<void> {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export async function runPlatform({
  platform,
  modelId,
  newerThan,
  queryFn,
}: {
  platform: string;
  modelId: string;
  newerThan: Date;
  queryFn: (query: string) => Promise<LLMResult>;
}): Promise<void> {
  const existing = await prisma.visibilityRun.findFirst({
    where: { platform, createdAt: { gte: newerThan } },
    orderBy: { createdAt: "desc" },
  });
  if (existing) {
    console.info(`[${platform}] Skipping — run already exists:`, existing.id);
    return;
  }

  const run = await prisma.visibilityRun.create({
    data: { platform, model: modelId },
  });
  console.info(`[${platform}] Created run ${run.id}`);

  for (let qi = 0; qi < queries.length; qi++) {
    const query = queries[qi];
    console.info(
      `[${platform}] Query ${qi + 1}/${queries.length}: ${query.query}`,
    );

    for (let rep = 1; rep <= REPETITIONS; rep++) {
      console.info(`[${platform}] Rep ${rep}/${REPETITIONS}: ${query.query}`);
      try {
        const { text, citations } = await queryFn(query.query);
        const { mentioned, position } = analyzeMention(text);
        console.info(
          `[${platform}] mentioned=${mentioned} citations=${citations.length}`,
        );
        await prisma.visibilityCheck.create({
          data: {
            runId: run.id,
            repetition: rep,
            query: query.query,
            category: query.category,
            response: text,
            mentioned,
            position,
            citations,
          },
        });
      } catch (error) {
        console.error(`[${platform}] Error: ${error}`);
        throw error;
      }
      await sleep(2_000);
    }
  }
}
