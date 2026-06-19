#!/usr/bin/env nub

/**
 * Collect shopping centers:
 *
 *   infisical --env prod run -- nub scripts/collect.ts "LA"
 *
 * Collects all shopping centers in a metro area using comprehensive
 * grid-based search with Google Places API
 */
import collectCenters from "../app/lib/scrape/collectCenters.server";

process.env.NODE_ENV = "production";

const cityInput = process.argv[2];

if (!cityInput) {
  console.error(
    'Usage: NODE_ENV=production infisical --env prod run -- nub scripts/collect.ts "City Name"\n',
  );
  console.error("Examples:");
  console.error('  nub scripts/collect.ts "LA"');
  console.error('  nub scripts/collect.ts "New York"');
  console.error('  nub scripts/collect.ts "Las Vegas"');
  process.exit(1);
}

try {
  await collectCenters(cityInput);
} catch (error) {
  console.error("Fatal error:", error);
  process.exit(1);
}
