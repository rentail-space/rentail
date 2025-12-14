#!/usr/bin/env tsx
import { delay } from "es-toolkit";
import discoverCenters from "~/lib/scrape/discoverCenters";
import enrichCenter from "~/lib/scrape/enrichCenter";
import RateLimiter from "~/lib/scrape/rateLimiter";
import scrapeCenter from "~/lib/scrape/scrapeCenter";
import writeCenterFile from "~/lib/scrape/writeCenterFile";

export default async function collectCenters(countyName: string) {
  console.info(`Starting collection for: ${countyName}`);

  // Rate limiter: 1.2s between API calls (~50/min)
  const rateLimiter = new RateLimiter(1200);

  // Stage 1: Discovery
  console.info("Stage 1: Discovering centers...");
  await rateLimiter.throttle();
  const centers = await discoverCenters(countyName);
  console.info(
    "Found %d centers:\n%s",
    centers.length,
    centers.map((center) => `${center.name} - ${center.website}`).join("\n"),
  );

  let successCount = 0;
  let failCount = 0;

  // Process each center
  for (let i = 0; i < centers.length; i++) {
    const center = centers[i];
    console.info(`[${i + 1}/${centers.length}] Processing: ${center.name}`);

    try {
      // Stage 2: Scraping
      console.info(`  Scraping website: ${center.website}`);
      await delay(2000 + Math.random() * 1000);
      const scrapedData = await scrapeCenter(center.website);
      if (scrapedData.error)
        console.error("  ⚠ Scraping failed, using LLM-only mode");

      // Stage 3: Enrichment
      console.info("  Enriching data...");
      await rateLimiter.throttle();
      const enrichedData = await enrichCenter(center, scrapedData);

      // Stage 4: Write to file
      console.info("  Writing to file...");
      const path = await writeCenterFile(enrichedData, countyName);
      console.info(`  ✓ Saved: ${path}`);

      successCount++;
    } catch (error) {
      console.error(
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
