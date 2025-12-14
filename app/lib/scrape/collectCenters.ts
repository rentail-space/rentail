#!/usr/bin/env tsx

import { delay } from "es-toolkit";
import discoverCenters from "~/lib/scrape/discoverCenters";
import enrichCenter from "~/lib/scrape/enrichCenter";
import RateLimiter from "~/lib/scrape/rateLimiter";
import saveCenterFile from "~/lib/scrape/saveCenterFile";
import scrapeCenter from "~/lib/scrape/scrapeCenter";
import validateImages from "~/lib/scrape/validateImages";

export default async function collectCenters(countyName: string) {
  console.info('Starting collection for: "%s"', countyName);

  // Rate limiter: 1.2s between API calls (~50/min)
  const rateLimiter = new RateLimiter(1200);

  // Stage 1: Discovery
  console.info("\x1b[32m  Stage 1: Discovering centers...\x1b[0m");
  await rateLimiter.throttle();
  const centers = await discoverCenters(countyName);

  let successCount = 0;
  let failCount = 0;

  // Process each center
  for (let i = 0; i < centers.length; i++) {
    const center = centers[i];
    try {
      // Stage 2: Scraping
      await delay(2000 + Math.random() * 1000);
      const scrapedData = await scrapeCenter(center.website);

      // Stage 2.5: Validate images
      let validImages: string[] = [];
      const scrapedImages = scrapedData.images || [];
      validImages = await validateImages(scrapedImages);

      // Stage 3: Enrichment
      await rateLimiter.throttle();
      const enrichedData = await enrichCenter(center, {
        ...scrapedData,
        images: validImages,
      });

      // Stage 4: Write to file
      await saveCenterFile(enrichedData);
      successCount++;
    } catch (error) {
      console.error(
        "\x1b[31m  ✗ Failed: %s\x1b[0m",
        error instanceof Error ? error.message : String(error),
      );
      failCount++;
    }
  }

  // Summary
  console.info(
    "\x1b[32m  ✓ Centers saved: %d/%d\x1b[0m",
    successCount,
    centers.length,
  );
  if (failCount > 0) console.info("\x1b[31m  ⚠ Failed: %d\x1b[0m", failCount);
}
