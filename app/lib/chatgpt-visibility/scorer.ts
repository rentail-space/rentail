import type { ParsedResponse } from "./citation-parser";

/**
 * Scoring algorithm for ChatGPT visibility monitoring.
 *
 * Scoring formula:
 * - First place citation: +50 points
 * - Each mention (citation or text reference): +10 points
 *
 * Target: 50%+ of all citations should be rentail.space
 */

export type QueryScore = {
  queryId: string;
  query: string;
  firstPlaceBonus: number; // 50 or 0
  mentionPoints: number; // mentions × 10
  totalScore: number;
  rentailSpaceCount: number;
  totalCitations: number;
  rentailSpacePercentage: number; // % of total citations
  meetsTarget: boolean; // true if >= 50% of citations
};

type AlertLevel = "excellent" | "good" | "warning" | "critical";

export type AggregateScore = {
  date: Date;
  totalQueries: number;
  averageScore: number;
  firstPlaceCount: number;
  firstPlacePercentage: number;
  totalMentions: number;
  averageMentionsPerQuery: number;
  queriesMeetingTarget: number; // queries with 50%+ citations
  targetPercentage: number;
  scores: QueryScore[];
  recommendation: string;
  alertLevel: AlertLevel;
};

const FIRST_PLACE_POINTS = 50;
const MENTION_POINTS = 10;
const TARGET_CITATION_PERCENTAGE = 50; // 50% of citations should be rentail.space

/**
 * Calculate score for a single query
 */
export function calculateQueryScore(
  queryId: string,
  query: string,
  parsed: ParsedResponse,
): QueryScore {
  const firstPlaceBonus = parsed.hasRentailSpaceInFirstPlace
    ? FIRST_PLACE_POINTS
    : 0;
  const mentionPoints = parsed.rentailSpaceCount * MENTION_POINTS;
  const totalScore = firstPlaceBonus + mentionPoints;

  const rentailSpacePercentage =
    parsed.totalCitations > 0
      ? (parsed.rentailSpaceCitations.length / parsed.totalCitations) * 100
      : 0;

  const meetsTarget = rentailSpacePercentage >= TARGET_CITATION_PERCENTAGE;

  return {
    queryId,
    query,
    firstPlaceBonus,
    mentionPoints,
    totalScore,
    rentailSpaceCount: parsed.rentailSpaceCount,
    totalCitations: parsed.totalCitations,
    rentailSpacePercentage,
    meetsTarget,
  };
}

/**
 * Calculate aggregate score across all queries
 */
export function calculateAggregateScore(scores: QueryScore[]): AggregateScore {
  const totalQueries = scores.length;
  const totalScore = scores.reduce((sum, s) => sum + s.totalScore, 0);
  const averageScore = totalScore / totalQueries;

  const firstPlaceCount = scores.filter((s) => s.firstPlaceBonus > 0).length;
  const firstPlacePercentage = (firstPlaceCount / totalQueries) * 100;

  const totalMentions = scores.reduce((sum, s) => sum + s.rentailSpaceCount, 0);
  const averageMentionsPerQuery = totalMentions / totalQueries;

  const queriesMeetingTarget = scores.filter((s) => s.meetsTarget).length;
  const targetPercentage = (queriesMeetingTarget / totalQueries) * 100;

  // Determine alert level and recommendation
  let alertLevel: AlertLevel;
  let recommendation: string;

  if (averageScore >= 300) {
    alertLevel = "excellent";
    recommendation =
      "Excellent visibility! Rentail.space is dominating ChatGPT search results.";
  } else if (averageScore >= 200) {
    alertLevel = "good";
    recommendation =
      "Good visibility. Rentail.space appears consistently in top results.";
  } else if (averageScore >= 100) {
    alertLevel = "warning";
    recommendation =
      "Visibility declining. Consider content marketing or SEO improvements.";
  } else {
    alertLevel = "critical";
    recommendation =
      "Critical: Low visibility in ChatGPT results. Immediate action needed.";
  }

  return {
    date: new Date(),
    totalQueries,
    averageScore,
    firstPlaceCount,
    firstPlacePercentage,
    totalMentions,
    averageMentionsPerQuery,
    queriesMeetingTarget,
    targetPercentage,
    scores,
    recommendation,
    alertLevel,
  };
}
