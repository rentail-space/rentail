#!/usr/bin/env tsx

import collectCenters from "~/lib/scrape/collectCenters";

const countyName = process.argv[2];

if (!countyName) {
  console.error('Usage: tsx scripts/collectCenters.ts "County Name, ST"');
  process.exit(1);
}

try {
  await collectCenters(countyName);
} catch (error) {
  console.error("Fatal error:", error);
  process.exit(1);
}
