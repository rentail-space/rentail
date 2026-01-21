#!/usr/bin/env tsx

/**
 * Runs weekly to monitor rentail.space's visibility in ChatGPT search results.
 *
 * Usage:
 *   tsx scripts/visibility.ts
 */

import runAllQueries from "~/lib/chatgpt-visibility/runAllQueries";
import prisma from "~/lib/prisma";
import { calculateAggregateScore } from "../app/lib/chatgpt-visibility/scorer";

try {
  const scores = await runAllQueries(true);
  const aggregate = calculateAggregateScore(scores);
  console.info(aggregate);
  process.exit(0);
} catch (error) {
  console.error("\n❌ Fatal error:", error);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
