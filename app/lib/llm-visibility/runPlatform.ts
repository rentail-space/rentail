// app/lib/llm-visibility/runPlatform.ts

import { captureException } from "@sentry/react-router";
import { sleep } from "radashi";
import { ms } from "convert";
import queries from "./queries";
import prisma from "~/lib/prisma.server";

/**
 * Maximum number of times to repeat a query if it fails.
 */
const MAX_REPEATS = 3;

export default async function runPlatform({
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

      for (let repeat = 1; repeat <= MAX_REPEATS; repeat++) {
        console.info(
          "[%s] Rep %d/%d: %s",
          platform,
          repeat,
          MAX_REPEATS,
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
              repetition: repeat,
              query: query.query,
              category: query.category,
              response: "",
              mentioned: index >= 0,
              position: index >= 0 ? index : null,
              citations,
            },
          });
          break;
        } catch (error) {
          console.error("[%s] Error: %s", platform, error);
        }
        await sleep(ms("2s"));
      }
    }
  } catch (error) {
    console.error("[%s] Error: %s", platform, error);
    captureException(error, { extra: { platform } });
  }
}
