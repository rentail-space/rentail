#!/usr/bin/env tsx

/**
 * Grid-based shopping center collection
 *
 * Usage: doppler run -- tsx scripts/collectGrid.ts "LA"
 *
 * Collects all shopping centers in a metro area using comprehensive
 * grid-based search with Google Places API
 */
import collectCentersFromGrid from "~/lib/scrape/collectCentersFromGrid";

const cityInput = process.argv[2];

if (!cityInput) {
  console.error('Usage: tsx scripts/collectGrid.ts "City Name"');
  console.error("Examples:");
  console.error('  tsx scripts/collectGrid.ts "LA"');
  console.error('  tsx scripts/collectGrid.ts "New York"');
  console.error('  tsx scripts/collectGrid.ts "Las Vegas"');
  process.exit(1);
}

try {
  await collectCentersFromGrid(cityInput);
} catch (error) {
  console.error("Fatal error:", error);
  process.exit(1);
}
