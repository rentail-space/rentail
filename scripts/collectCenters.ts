#!/usr/bin/env tsx
import debug from "debug";
import { discoverCenters } from "~/lib/discoverCenters";
import { enrichCenter } from "~/lib/enrichCenter";
import { RateLimiter } from "~/lib/rateLimiter";
import { scrapeCenter } from "~/lib/scrapeCenter";
import { writeCenterFile } from "~/lib/writeCenterFile";

const logger = debug("collect:centers");

async function main() {
  const countyName = process.argv[2];

  if (!countyName) {
    console.error('Usage: tsx scripts/collectCenters.ts "County Name, ST"');
    process.exit(1);
  }

  logger(`Starting collection for: ${countyName}`);

  // Rate limiter: 1.2s between API calls (~50/min)
  const rateLimiter = new RateLimiter(1200);

  // Stage 1: Discovery
  logger("Stage 1: Discovering centers...");
  await rateLimiter.throttle();
  const centers = await discoverCenters(countyName);
  logger(`Found ${centers.length} centers`);

  let successCount = 0;
  let failCount = 0;

  // Process each center
  for (let i = 0; i < centers.length; i++) {
    const center = centers[i];
    logger(`[${i + 1}/${centers.length}] Processing: ${center.name}`);

    try {
      // Stage 2: Scraping
      logger(`  Scraping website: ${center.website}`);
      await new Promise((resolve) =>
        setTimeout(resolve, 2000 + Math.random() * 1000),
      );
      const scrapedData = await scrapeCenter(center.website);

      if (scrapedData.error) {
        logger(`  ⚠ Scraping failed, using LLM-only mode`);
      }

      // Stage 3: Enrichment
      logger(`  Enriching data...`);
      await rateLimiter.throttle();
      const enrichedData = await enrichCenter(center, scrapedData);

      // Stage 4: Write to file
      logger(`  Writing to file...`);
      const path = await writeCenterFile(enrichedData, countyName);
      logger(`  ✓ Saved: ${path}`);

      successCount++;
    } catch (error) {
      logger(
        `  ✗ Failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      failCount++;
    }
  }

  // Summary
  console.log(`
✓ Processed: ${countyName}
✓ Centers saved: ${successCount}/${centers.length}
${failCount > 0 ? `⚠ Failed: ${failCount}` : ""}
📁 Output: prisma/seed/${centers[0]?.state.toLowerCase()}/${countyName
    .toLowerCase()
    .replace(/\s+county\s*/i, "")
    .replace(/\s+/g, "-")}/*.json
  `);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
