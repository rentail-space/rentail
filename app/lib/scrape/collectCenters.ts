import { invariant, partition } from "es-toolkit";
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
  // From Claude we collect very basic information about the centers:
  // name, address, city, state.
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
      // From Google Places we collect all additional information about the center:
      // website, phone, rating, review count, photos, opening hours, etc.
      console.info("\x1b[32m  Stage 2: Fetching Google Places data...\x1b[0m");
      await rateLimiter.throttle();
      const google = await fromGooglePlaces(center.name);
      invariant(google, "Failed to fetch Google Places data");

      // From the website we collect the center's spaces and body text:
      // - The body text is used to enrich the center with additional data.
      // - The description comes from meta description tag (if available).
      console.info("\x1b[32m  Stage 3: Scraping website...\x1b[0m");
      const { bodyText, description } = await retryWithBackoff(() =>
        scrapeCenter(google.website),
      );

      // For each center we scrape the spaces page and collect the spaces:
      // - Space number
      // - Space type (Cart, Inline, Storage, Other)
      // - Space size (in square feet)
      // - Space floor (1-10)
      // - Space available (true/false)
      // - Space image URLs (array of image URLs)
      const spaces = await retryWithBackoff(() =>
        scrapeSpaces(google.website, center.name),
      );

      // From the scraped data we enrich the center with additional data:
      // - Square footage
      // - Store count
      // - Demographic summary
      // - Center type (RegionalMall, CommunityCenter, etc)
      // - Tier (1-3)
      // - Description (based on scraped website data)
      console.info("\x1b[32m  Stage 4: Enriching center...\x1b[0m");
      await rateLimiter.throttle();
      const enriched = await retryWithBackoff(() =>
        enrichCenter({ center, bodyText, description }),
      );

      const filename = getSaveFilename({ state, name });
      console.info("\x1b[32m  Stage 5:  Saving %s...\x1b[0m", filename);
      await mkdir(dirname(filename), { recursive: true });
      google.photos = []; // We don't need photos in the seed file
      await writeFile(
        filename,
        JSON.stringify(
          {
            ...center, // From Claude
            ...google, // Overwritten by Google Places API
            ...enriched, // Additional data from Claude
            spaces, // Spaces scraped from website
          },
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
