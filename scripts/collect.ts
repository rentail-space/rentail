#!/usr/bin/env tsx

/**
 * Collect shopping centers:
 *
 *   doppler run -- tsx scripts/collect.ts "LA"
 *
 * Collects all shopping centers in a metro area using comprehensive
 * grid-based search with Google Places API
 */
import collectCenters from "~/lib/scrape/collectCenters";

const cityInput = process.argv[2];

if (!cityInput) {
  console.error('Usage: tsx scripts/collect.ts "City Name"');
  console.error("Examples:");
  console.error('  tsx scripts/collect.ts "LA"');
  console.error('  tsx scripts/collect.ts "New York"');
  console.error('  tsx scripts/collect.ts "Las Vegas"');
  process.exit(1);
}

try {
  await collectCenters(cityInput);
} catch (error) {
  console.error("Fatal error:", error);
  process.exit(1);
}
