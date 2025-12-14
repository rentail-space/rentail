#!/usr/bin/env tsx

import { delay } from "es-toolkit";
import discoverCenters from "~/lib/scrape/discoverCenters";
import enrichCenter from "~/lib/scrape/enrichCenter";
import RateLimiter from "~/lib/scrape/rateLimiter";
import saveCenterFile from "~/lib/scrape/saveCenterFile";
import scrapeCenter from "~/lib/scrape/scrapeCenter";
import scrapeLoopNet from "~/lib/scrape/scrapeLoopNet";
import scrapeSpaces from "~/lib/scrape/scrapeSpaces";
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
      // Stage 2: Scraping website
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let scrapedData: any = {};
      if (center.website) {
        await delay(2000 + Math.random() * 1000);
        scrapedData = await scrapeCenter(center.website);
      } else {
        console.info("\x1b[33m  ⚠ No website found, skipping scrape\x1b[0m");
      }

      // Stage 2b: Scraping LoopNet
      await delay(2000 + Math.random() * 1000);
      const loopNetData = await scrapeLoopNet({
        centerName: center.name,
        city: center.city,
        state: center.state,
      });

      // Stage 2c: Scraping spaces (if website exists)
      let spaces: Array<{
        number: string;
        type: "Cart" | "Inline" | "Storage" | "Other";
        size: number;
        floor: number;
        available: boolean;
        imageURLs?: string[];
      }> = [];

      if (center.website) {
        await delay(2000 + Math.random() * 1000);
        spaces = await scrapeSpaces(center.website, center.name);
      }

      // Stage 2.5: Validate images
      let validImages: string[] = [];
      const scrapedImages: string[] =
        "images" in scrapedData && Array.isArray(scrapedData.images)
          ? scrapedData.images
          : [];
      const loopNetImages: string[] =
        "images" in loopNetData && Array.isArray(loopNetData.images)
          ? loopNetData.images
          : [];
      const allImages = [...scrapedImages, ...loopNetImages];
      validImages = await validateImages(allImages);

      // Stage 3: Enrichment
      await rateLimiter.throttle();
      const enrichedData = await enrichCenter(center, {
        ...scrapedData,
        ...loopNetData,
        images: validImages,
        spaces,
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
