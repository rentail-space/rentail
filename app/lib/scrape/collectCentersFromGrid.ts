/**
 * Grid-based shopping center collection
 * Comprehensive coverage using Google Places Nearby Search
 */

import { invariant, partition } from "es-toolkit";
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { chromium } from "playwright";
import ora from "ora";
import { resolveMetroArea } from "./metroAreas";
import { geocodeCounty, mergeBounds, type BoundingBox } from "./geocoding";
import { estimateGridSize, generateHexGrid } from "./gridSearch";
import { nearbySearch, type PlaceResult } from "./nearbySearch";
import enrichCenter from "./enrichCenter";
import { fromGooglePlaces } from "./fromGooglePlaces";
import scrapeCenter from "./scrapeCenter";
import scrapeSpaces from "./scrapeSpaces";

interface DiscoveredCenter {
  address: string;
  city: string;
  id: string;
  name: string;
  state: string;
}

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
  console.info(
    "Coverage area: (%.4f, %.4f) to (%.4f, %.4f)",
    mergedBounds.south,
    mergedBounds.west,
    mergedBounds.north,
    mergedBounds.east,
  );

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
  const allResults: PlaceResult[] = [];

  for (let i = 0; i < grid.length; i++) {
    const point = grid[i];
    spinner.text = `Searching grid point ${i + 1}/${grid.length}`;

    try {
      const results = await nearbySearch(point, radiusKm * 1000); // Convert km to meters
      allResults.push(...results);
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

  // Step 6: Deduplicate by place ID
  const seenIds = new Set<string>();
  const uniqueCenters: DiscoveredCenter[] = [];

  for (const result of allResults) {
    if (!seenIds.has(result.placeId)) {
      seenIds.add(result.placeId);

      // Extract state from result (we'll get it from Google Places details later)
      // For now, use the first county's state as fallback
      const fallbackState =
        geocoded[0]?.formattedAddress.match(/,\s+([A-Z]{2})/)?.[1];

      uniqueCenters.push({
        id: result.placeId,
        name: result.name,
        address: "", // Will be filled by Google Places
        city: "", // Will be filled by Google Places
        state: fallbackState ?? "CA",
      });
    }
  }

  console.info(
    "\x1b[32m  ✓ Found %d unique centers (from %d total results)\x1b[0m",
    uniqueCenters.length,
    allResults.length,
  );

  // Save grid metadata for cache/resume capability
  await saveGridMetadata({
    cityInput,
    counties,
    bounds: mergedBounds,
    gridPoints: grid,
    centersFound: uniqueCenters.length,
  });

  // Step 7: Enrich each center (same as collectCenters.ts)
  // Partition into new vs existing
  const [_, creating] = partition(uniqueCenters, (center) =>
    existsSync(getSaveFilename(center)),
  );

  console.info(
    "\x1b[33m  → Processing %d new centers (skipping %d existing)\x1b[0m",
    creating.length,
    uniqueCenters.length - creating.length,
  );

  const browser = await chromium.launch({ headless: true });
  let successCount = 0;
  let failCount = 0;

  for (const center of creating) {
    try {
      // Fetch Google Places data
      const google = await fromGooglePlaces({
        placeName: center.name,
        placeID: center.id,
      });
      invariant(google, "Failed to fetch Google Places data");
      invariant(google.website, "Google Places data missing website");

      // Update center with Google data
      center.address = google.address;
      center.city = google.city;
      center.state = google.state;

      // Scrape website
      const { bodyText } = await scrapeCenter({ browser, url: google.website });

      // Extract spaces
      const spaces = await scrapeSpaces({
        browser,
        centerName: center.name,
        url: google.website,
      });

      // Enrich with Claude
      const enriched = await enrichCenter({ center, bodyText });
      const summary = google.summary ?? enriched.summary;

      // Save to file
      const filename = getSaveFilename({
        state: center.state,
        name: center.name,
      });
      await mkdir(dirname(filename), { recursive: true });
      await writeFile(
        filename,
        JSON.stringify(
          {
            ...center,
            ...google,
            ...enriched,
            summary,
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
    uniqueCenters.length,
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
