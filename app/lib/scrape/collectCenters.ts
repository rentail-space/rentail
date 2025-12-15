import { delay, partition } from "es-toolkit";
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import discoverCenters from "~/lib/scrape/discoverCenters";
import enrichCenter from "~/lib/scrape/enrichCenter";
import { fromGooglePlaces } from "~/lib/scrape/fromGooglePlaces";
import RateLimiter from "~/lib/scrape/rateLimiter";
import retryWithBackoff from "~/lib/scrape/retryWithBackoff";
import scrapeCenter from "~/lib/scrape/scrapeCenter";
import scrapeSpaces from "~/lib/scrape/scrapeSpaces";

export default async function collectCenters(countyName: string) {
  console.info('Starting collection for: "%s"', countyName);
  const rateLimiter = new RateLimiter(1200);

  console.info("\x1b[32m  Stage 1: Discovering centers...\x1b[0m");
  await rateLimiter.throttle();
  const centers = await retryWithBackoff(() => discoverCenters(countyName));

  // Partition centers into creating and updating so we process new centers
  // first and then update existing ones.
  const [creating, updating] = partition(centers, (center) =>
    existsSync(getSaveFilename(center)),
  );

  let successCount = 0;
  let failCount = 0;

  for (const center of [...creating, ...updating]) {
    const { state, name } = center;
    try {
      console.info("\x1b[32m  Stage 2: Fetching Google Places data...\x1b[0m");
      await rateLimiter.throttle();
      const google = await fromGooglePlaces(center.name);
      if (!google || !google.website) {
        console.error("\x1b[31m  ✗ Failed: %s has no website\x1b[0m", name);
        failCount++;
        continue;
      }

      console.info("\x1b[32m  Stage 3: Scraping website...\x1b[0m");
      const { website } = google;
      const { scraped, spaces } = await scrapeWebsite({ name, website });

      console.info("\x1b[32m  Stage 4: Enriching center...\x1b[0m");
      await rateLimiter.throttle();
      const enriched = await retryWithBackoff(() =>
        enrichCenter({ center, bodyText: scraped.bodyText }),
      );

      const filename = getSaveFilename({ state, name });
      console.info("\x1b[32m  Stage 5:  Saving %s...\x1b[0m", filename);
      await mkdir(dirname(filename), { recursive: true });
      await writeFile(
        filename,
        JSON.stringify(
          { ...center, ...google, ...scraped, ...enriched, spaces },
          null,
          2,
        ),
      );
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

async function scrapeWebsite(center: {
  name: string;
  website: string;
}): Promise<{
  scraped: Awaited<ReturnType<typeof scrapeCenter>>;
  spaces: Awaited<ReturnType<typeof scrapeSpaces>>;
}> {
  await delay(2000 + Math.random() * 1000);
  const scraped = await scrapeCenter(center.website);

  await delay(3000 + Math.random() * 2000);
  const spaces = await retryWithBackoff(() =>
    scrapeSpaces(center.website, center.name),
  );
  return { scraped, spaces };
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
