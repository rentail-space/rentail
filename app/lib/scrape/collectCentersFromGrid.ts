/**
 * Grid-based shopping center collection
 * Comprehensive coverage using Google Places Nearby Search
 */

import { partition } from "es-toolkit";
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import ora from "ora";
import { chromium } from "playwright";
import enrichCenter from "./enrichCenter";
import { nearbySearch } from "./fromGooglePlaces";
import { type BoundingBox, geocodeCounty, mergeBounds } from "./geocoding";
import { estimateGridSize, generateHexGrid } from "./gridSearch";
import { resolveMetroArea } from "./metroAreas";
import scrapeCenter from "./scrapeCenter";
import scrapeSpaces from "./scrapeSpaces";

/**
 * Collect shopping centers using grid-based search
 *
 * @param cityInput City name or alias (e.g., "LA", "Los Angeles")
 */
export default async function collectCentersFromGrid(cityInput: string) {
  console.info('Starting grid-based collection for: "%s"', cityInput);

  // Step 1: Resolve metro area
  const counties = resolveMetroArea(cityInput);
  console.info("Metro area counties: %s", counties.join(", "));

  // Step 2: Geocode all counties
  const geocoded = await Promise.all(counties.map((c) => geocodeCounty(c)));

  // Step 3: Merge bounding boxes
  const mergedBounds = mergeBounds(geocoded.map((g) => g.bounds));

  // Step 4: Generate grid
  const radiusKm = 50; // Google Places max radius
  const grid = generateHexGrid(mergedBounds, radiusKm);
  const estimate = estimateGridSize(mergedBounds, radiusKm);
  console.info(
    "Generated %d grid points (estimated %d needed)",
    grid.length,
    estimate,
  );

  // Step 5: Search each grid point
  const spinner = ora("Searching grid points...").start();
  const centers: Awaited<ReturnType<typeof nearbySearch>> = [];

  for (let i = 0; i < grid.length; i++) {
    const point = grid[i];
    spinner.text = `Searching grid point ${i + 1}/${grid.length}`;

    try {
      const results = await nearbySearch(point, radiusKm * 1000); // Convert km to meters
      centers.push(...results);
    } catch (error) {
      console.error(
        "\x1b[31m  ✗ Grid point %d/%d failed: %s\x1b[0m",
        i + 1,
        grid.length,
        error instanceof Error ? error.message : String(error),
      );
    }
  }
  spinner.succeed(`Searched ${grid.length} grid points`);

  console.info("\x1b[32m  ✓ Found %d unique centers\x1b[0m", centers.length);

  // Save grid metadata for cache/resume capability
  await saveGridMetadata({
    cityInput,
    counties,
    bounds: mergedBounds,
    gridPoints: grid,
    centersFound: centers.length,
  });

  // Step 7: Enrich each center (same as collectCenters.ts)
  // Partition into new vs existing
  const [_, creating] = partition(centers, (center) =>
    existsSync(getSaveFilename(center)),
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
      const filename = getSaveFilename({
        name: center.name,
        state: center.state,
      });
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
function getSaveFilename(center: { name: string; state: string }) {
  const normalized = center.name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  const slug = `${center.state.toLowerCase()}-${normalized}`;
  return resolve(`prisma/seed/${center.state.toLowerCase()}/${slug}.json`);
}

/**
 * Save grid metadata for resumability
 */
async function saveGridMetadata(metadata: {
  cityInput: string;
  counties: string[];
  bounds: BoundingBox;
  gridPoints: Array<{ lat: number; lng: number }>;
  centersFound: number;
}) {
  const slug = metadata.cityInput
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");

  const filename = resolve(`prisma/seed/grid-${slug}.json`);
  await writeFile(
    filename,
    JSON.stringify(
      {
        ...metadata,
        searchDate: new Date().toISOString(),
      },
      null,
      2,
    ),
  );

  console.info("\x1b[32m  ✓ Saved grid metadata: %s\x1b[0m", filename);
}
