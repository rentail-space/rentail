/**
 * Ranking formula for a center:
 * - Centers with 4.0 rating or above
 * - Higher rating is better (5.0 is the best)
 * - Higher review count is better (1000 > 100 > 10 )
 * - Higher tier centers are better (3 > 2 > 1)
 *
 * @param rating - The rating of the center.
 * @param reviewCount - The number of reviews for the center.
 * @param tier - The tier of the center.
 * @returns The ranking score for the center.
 */
export default function calculateRanking({
  rating,
  reviewCount,
  tier,
}: {
  rating?: number | null;
  reviewCount?: number | null;
  tier?: number;
}): number {
  return rating && rating >= 4 && tier && reviewCount
    ? rating * Math.log10(reviewCount ?? 1) * (tier ?? 1)
    : 0;
}
