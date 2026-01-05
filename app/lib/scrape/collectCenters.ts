/**
 * Grid-based shopping center collection
 * Comprehensive coverage using Google Places Nearby Search
 */

import { mapAsync, partition } from "es-toolkit";
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import ora from "ora";
import { chromium } from "playwright";
import enrichCenter from "./enrichCenter";
import { nearbySearch } from "./fromGooglePlaces";
import { geocodeCounty, mergeBounds } from "./geocodeCounty";
import { generateHexGrid } from "./gridSearch";
import resolveMetroArea from "./metroAreas";
import scrapeCenter from "./scrapeCenter";
import scrapeSpaces from "./scrapeSpaces";

/**
 * Collect shopping centers using grid-based search
 *
 * @param search City name or alias (e.g., "LA", "Los Angeles")
 */
export default async function collectCenters(search: string) {
  console.info('Starting collection for: "%s"', search);

  // Step 1: Resolve metro area from city/county name (e.g., "LA", "Los Angeles")
  const counties = resolveMetroArea(search);
  console.info("Counties: %s", counties.join(", "));

  // Step 2: Geocode all counties to get bounding boxes
  const geocoded = await mapAsync(counties, geocodeCounty);

  // Step 3: Merge bounding boxes to get a single bounding box
  const mergedBounds = mergeBounds(geocoded.map((g) => g.bounds));

  // Step 4: Generate grid of search points
  const radiusKm = 50; // Google Places max radius (31 miles)
  const grid = generateHexGrid(mergedBounds, radiusKm);

  // Step 5: Search each grid point for shopping centers
  const spinner = ora(
    `Searching for shopping centers in ${counties.join(", ")}...`,
  ).start();
  const centers: Awaited<ReturnType<typeof nearbySearch>> = [];

  for (const point of grid) {
    spinner.text = `Searching for shopping centers at ${point.lat.toFixed(3)},${point.lng.toFixed(3)}`;
    try {
      const results = await nearbySearch({
        point,
        radiusMeters: radiusKm * 1000,
        spinner,
      }); // Convert km to meters
      centers.push(...results);
    } catch (error) {
      spinner.fail(
        `Searching for shopping centers at ${point.lat.toFixed(3)},${point.lng.toFixed(3)} failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }
  spinner.succeed(`Found ${centers.length} shopping centers in ${search}`);

  // Step 7: Enrich each center (same as collectCenters.ts)
  // Partition into new vs existing
  const [_, creating] = partition(centers, (center) =>
    existsSync(getCenterSaveFilename(center)),
  );
  console.info(
    "\x1b[33m  → Processing %d new centers (skipping %d existing)\x1b[0m",
    creating.length,
    centers.length - creating.length,
  );

  const browser = await chromium.launch({ headless: true });
  let successCount = 0;
  let failCount = 0;

  for (const center of creating) {
    try {
      // Scrape website
      const { bodyText } = await scrapeCenter({ browser, url: center.website });

      // Extract spaces
      const spaces = await scrapeSpaces({
        browser,
        centerName: center.name,
        url: center.website,
      });

      // Enrich with Claude
      const enriched = await enrichCenter({ center, bodyText });

      // Save to file
      const filename = getCenterSaveFilename(center);
      await mkdir(dirname(filename), { recursive: true });
      await writeFile(
        filename,
        JSON.stringify(
          {
            ...center,
            ...enriched,
            summary: enriched.summary ?? center.summary,
            spaces,
          },
          null,
          2,
        ),
      );

      console.info("\x1b[32m  ✓ Saved %s\x1b[0m", filename);
      successCount++;
    } catch (error) {
      console.error(
        "\x1b[31m  ✗ Failed: %s - %s\x1b[0m",
        center.name,
        error instanceof Error ? error.message : String(error),
      );
      failCount++;
    }
  }

  await browser.close();

  // Summary
  console.info(
    "\x1b[32m\n✓ Collection complete: %d/%d centers saved\x1b[0m",
    successCount,
    creating.length,
  );
  if (failCount > 0) console.info("\x1b[31m  ⚠ Failed: %d\x1b[0m", failCount);
}

/**
 * Get save filename for a center
 */
function getCenterSaveFilename(center: { name: string; state: string }) {
  const normalized = center.name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  const slug = `${center.state.toLowerCase()}-${normalized}`;
  return resolve(`prisma/seed/${center.state.toLowerCase()}/${slug}.json`);
}
