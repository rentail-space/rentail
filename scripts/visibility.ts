#!/usr/bin/env tsx

/**
 * Runs weekly to monitor rentail.space's visibility in ChatGPT search results.
 *
 * Usage:
 *   tsx scripts/visibility.ts
 */

import runAllQueries from "~/lib/chatgpt-visibility/runAllQueries.server";
import prisma from "~/lib/prisma.server";

try {
  await runAllQueries(true);
  process.exit(0);
} catch (error) {
  console.error("\n❌ Fatal error:", error);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
