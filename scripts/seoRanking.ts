#!/usr/bin/env tsx

/**
 * SEO Ranking Checker and Alert Sender
 *
 * Checks Google rankings for rentail.space across key search terms.
 * Sends alerts via email.
 *
 * Usage:
 *   tsx scripts/seoRanking.ts
 *   tsx scripts/seoRanking.ts --method=playwright  # Use browser automation instead of API
 */

import prisma from "~/lib/prisma.server";
import checkRankings from "~/lib/seo-rank/checkRanking.server";
import sendSEORankAlert from "~/lib/seo-rank/SEORankAlert.server";

export type RankingResults = {
  term: string;
  results: {
    link: string;
    snippet: string;
    title: string;
  }[];
};

try {
  const method = process.argv.includes("--method=playwright")
    ? "playwright"
    : "serpapi";
  const queries = await checkRankings(method);
  await sendSEORankAlert({ queries });
  process.exit(0);
} catch (error) {
  console.error("\n❌ SEO check failed:", error);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
