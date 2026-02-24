// app/lib/llm-visibility/runAllQueries.server.ts
import { groupBy, orderBy } from "es-toolkit";
import prisma from "~/lib/prisma.server";
import queryClaude from "./claudeClient";
import queryGemini from "./geminiClient";
import queryChatGPTWithSearch from "./openaiClient";
import queryPerplexity from "./perplexityClient";
import { runPlatform } from "./runPlatform";

async function tryRunPlatform(args: Parameters<typeof runPlatform>[0]) {
  try {
    await runPlatform(args);
  } catch (error) {
    console.error(`[${args.platform}] Failed:`, error);
  }
}

export default async function runAllQueries({
  newerThan,
}: {
  newerThan: Date;
}) {
  await tryRunPlatform({
    platform: "chatgpt",
    modelId: "gpt-5-chat-latest",
    newerThan,
    queryFn: queryChatGPTWithSearch,
  });

  await tryRunPlatform({
    platform: "perplexity",
    modelId: "sonar",
    newerThan,
    queryFn: queryPerplexity,
  });

  await tryRunPlatform({
    platform: "claude",
    modelId: "claude-haiku-4-5-20251001",
    newerThan,
    queryFn: queryClaude,
  });

  await tryRunPlatform({
    platform: "gemini",
    modelId: "gemini-2.5-flash",
    newerThan,
    queryFn: queryGemini,
  });

  const all = await prisma.visibilityRun.findMany({
    include: { checks: true },
    orderBy: { createdAt: "asc" },
  });
  const byDate = Object.entries(
    groupBy(all, ({ createdAt }) => createdAt.toISOString().slice(0, 10)),
  );
  return orderBy(byDate, [([date]) => date], ["asc"]);
}
