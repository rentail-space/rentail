#!/usr/bin/env tsx

import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { delay } from "es-toolkit";
import discoverCenters from "~/lib/scrape/discoverCenters";
import enrichCenter from "~/lib/scrape/enrichCenter";
import RateLimiter from "~/lib/scrape/rateLimiter";
import saveCenterFile from "~/lib/scrape/saveCenterFile";
import scrapeCenter from "~/lib/scrape/scrapeCenter";
import scrapeLoopNet from "~/lib/scrape/scrapeLoopNet";
import scrapeSpaces from "~/lib/scrape/scrapeSpaces";
import validateImages from "~/lib/scrape/validateImages";

interface DiscoveryCache {
  query: string;
  centers: Array<{
    name: string;
    address: string;
    city: string;
    state: string;
    website?: string;
    latitude: number;
    longitude: number;
  }>;
  discoveredAt: string;
}

function getCacheFilePath(query: string): string {
  // Create slug from query for filename
  const slug = query
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return resolve(".cache", `discovery-${slug}.json`);
}

export default async function collectCenters(countyName: string) {
  console.info('Starting collection for: "%s"', countyName);

  // Rate limiter: 1.2s between API calls (~50/min)
  const rateLimiter = new RateLimiter(1200);

  // Stage 1: Discovery (with caching)
  const cacheDir = resolve(".cache");
  if (!existsSync(cacheDir)) {
    await mkdir(cacheDir, { recursive: true });
  }

  const cacheFile = getCacheFilePath(countyName);
  let centers: Array<{
    name: string;
    address: string;
    city: string;
    state: string;
    website?: string;
    latitude: number;
    longitude: number;
  }>;

  // Try to load from cache
  if (existsSync(cacheFile)) {
    try {
      const cacheData = await readFile(cacheFile, "utf-8");
      const cache: DiscoveryCache = JSON.parse(cacheData);

      if (cache.query === countyName) {
        console.info(
          "\x1b[32m  ✓ Loaded %d centers from cache (discovered: %s)\x1b[0m",
          cache.centers.length,
          cache.discoveredAt,
        );
        centers = cache.centers;
      } else {
        throw new Error("Query mismatch");
      }
    } catch {
      // Cache invalid, run discovery
      console.info("\x1b[33m  ⚠ Cache invalid, discovering...\x1b[0m");
      console.info("\x1b[32m  Stage 1: Discovering centers...\x1b[0m");
      await rateLimiter.throttle();
      centers = await discoverCenters(countyName);

      // Save to cache
      const cache: DiscoveryCache = {
        query: countyName,
        centers,
        discoveredAt: new Date().toISOString(),
      };
      await writeFile(cacheFile, JSON.stringify(cache, null, 2));
      console.info("\x1b[32m  ✓ Saved discovery cache\x1b[0m");
    }
  } else {
    // No cache, run discovery
    console.info("\x1b[32m  Stage 1: Discovering centers...\x1b[0m");
    await rateLimiter.throttle();
    centers = await discoverCenters(countyName);

    // Save to cache
    const cache: DiscoveryCache = {
      query: countyName,
      centers,
      discoveredAt: new Date().toISOString(),
    };
    await writeFile(cacheFile, JSON.stringify(cache, null, 2));
    console.info("\x1b[32m  ✓ Saved discovery cache\x1b[0m");
  }

  let successCount = 0;
  let failCount = 0;

  // Process each center
  for (let i = 0; i < centers.length; i++) {
    const center = centers[i];
    try {
      // Stage 2: Scraping website
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let scrapedData: {
        bodyText?: string;
        images?: string[];
        title?: string;
        description?: string | null;
        error?: string;
      } = {};
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
        typeof scrapedData === "object" &&
        scrapedData !== null &&
        "images" in scrapedData &&
        Array.isArray(scrapedData.images)
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
