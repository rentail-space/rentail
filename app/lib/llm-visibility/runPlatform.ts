// app/lib/llm-visibility/runPlatform.ts

import { captureException } from "@sentry/react-router";
import prisma from "~/lib/prisma.server";
import queries from "./queries";

const REPETITIONS = 3;

export type MentionResult = {
  mentioned: boolean;
  position: number | null;
};

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
  queryFn: (query: string) => Promise<{
    citations: string[];
    queries: string[];
  }>;
}): Promise<void> {
  try {
    const existing = await prisma.visibilityRun.findFirst({
      where: { platform, createdAt: { gte: newerThan } },
      orderBy: { createdAt: "desc" },
    });
    if (existing) {
      console.info(
        "[%s] Skipping — run already exists: %s",
        platform,
        existing.id,
      );
      return;
    }

    const run = await prisma.visibilityRun.create({
      data: { platform, model: modelId },
    });
    console.info("[%s] Created run %s", platform, run.id);

    for (let qi = 0; qi < queries.length; qi++) {
      const query = queries[qi];
      console.info(
        "[%s] Query %d/%d: %s",
        platform,
        qi + 1,
        queries.length,
        query.query,
      );

      for (let rep = 1; rep <= REPETITIONS; rep++) {
        console.info(
          "[%s] Rep %d/%d: %s",
          platform,
          rep,
          REPETITIONS,
          query.query,
        );
        try {
          const { citations } = await queryFn(query.query);
          const index = citations.findIndex((url) =>
            url.startsWith("https://rentail.space"),
          );
          await prisma.visibilityCheck.create({
            data: {
              runId: run.id,
              repetition: rep,
              query: query.query,
              category: query.category,
              response: "",
              mentioned: index >= 0,
              position: index >= 0 ? index : null,
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
  } catch (error) {
    console.error("[%s] Error: %s", platform, error);
    captureException(error, { extra: { platform } });
  }
}
