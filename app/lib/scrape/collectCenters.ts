#!/usr/bin/env tsx

import { delay, partition } from "es-toolkit";
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import discoverCenters from "~/lib/scrape/discoverCenters";
import enrichCenter from "~/lib/scrape/enrichCenter";
import RateLimiter from "~/lib/scrape/rateLimiter";
import retryWithBackoff from "~/lib/scrape/retryWithBackoff";
import scrapeCenter from "~/lib/scrape/scrapeCenter";
import scrapeSpaces from "~/lib/scrape/scrapeSpaces";
import validateImages from "~/lib/scrape/validateImages";

export default async function collectCenters(countyName: string) {
  console.info('Starting collection for: "%s"', countyName);

  // Rate limiter: 1.2s between API calls (~50/min)
  const rateLimiter = new RateLimiter(1200);

  // Stage 1: Discovery
  console.info("\x1b[32m  Stage 1: Discovering centers...\x1b[0m");
  await rateLimiter.throttle();
  const centers = await retryWithBackoff(() => discoverCenters(countyName));

  // Stage 2: Create new centers first, then update existing ones
  const [creating, updating] = partition(centers, (center) =>
    existsSync(getSaveFilename(center)),
  );

  let successCount = 0;
  let failCount = 0;

  for (const center of [...creating, ...updating]) {
    try {
      let enrichedData: typeof center;

      if (center.website) {
        // Stage 3: Scrape website
        await delay(2000 + Math.random() * 1000);
        const scrapedData = await scrapeCenter(center.website);

        // Stage 4: Scrape spaces
        await delay(3000 + Math.random() * 2000);
        const website = center.website;
        const spaces = await retryWithBackoff(() =>
          scrapeSpaces(website, center.name),
        );

        // Stage 5: Validate images
        if (scrapedData.images)
          scrapedData.images = await validateImages(scrapedData.images);

        // Stage 6: Enrichment
        await rateLimiter.throttle();
        enrichedData = await retryWithBackoff(() =>
          enrichCenter(center, { ...scrapedData, spaces }),
        );
      } else {
        enrichedData = center;
      }

      // Stage 7: Save to file
      const filename = getSaveFilename(enrichedData);
      console.info(
        "\x1b[32m  Saving %s to %s...\x1b[0m",
        enrichedData.name,
        filename,
      );
      await mkdir(dirname(filename), { recursive: true });
      await writeFile(filename, JSON.stringify(enrichedData, null, 2));

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

function getSaveFilename(center: { name: string; state: string }) {
  const normalized = center.name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // Remove special chars
    .replace(/\s+/g, "-") // Spaces to hyphens
    .replace(/-+/g, "-") // Collapse multiple hyphens
    .replace(/^-|-$/g, ""); // Trim hyphens

  const slug = `${center.state.toLowerCase()}-${normalized}`;
  return resolve(`prisma/seed/${center.state.toLowerCase()}/${slug}.json`);
}
