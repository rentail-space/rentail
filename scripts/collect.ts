#!/usr/bin/env tsx

/**
 * Collect shopping centers:
 *
 *   doppler run -- tsx scripts/collect.ts "LA"
 *
 * Collects all shopping centers in a metro area using comprehensive
 * grid-based search with Google Places API
 */
import collectCenters from "../app/lib/scrape/collectCenters.server";

process.env.NODE_ENV = "production";

const cityInput = process.argv[2];

if (!cityInput) {
  console.error('Usage: doppler run -- tsx scripts/collect.ts "City Name"');
  console.error("Examples:");
  console.error('  doppler run --  tsx scripts/collect.ts "LA"');
  console.error('  doppler run --  tsx scripts/collect.ts "New York"');
  console.error('  doppler run --  tsx scripts/collect.ts "Las Vegas"');
  process.exit(1);
}

try {
  await collectCenters(cityInput);
} catch (error) {
  console.error("Fatal error:", error);
  process.exit(1);
}
