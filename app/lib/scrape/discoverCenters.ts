import { generateObject } from "ai";
import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { invariant } from "node_modules/es-toolkit/dist/util/invariant.mjs";
import ora from "ora";
import { z } from "zod";
import { conversational } from "~/lib/models";

const discoverySchema = z.object({
  centers: z.array(
    z.object({
      name: z.string().min(1, "Name must not be empty"),
      address: z.string().min(1, "Address must not be empty"),
      city: z.string().min(1, "City must not be empty"),
      state: z
        .string()
        .min(2, "State must be at least 2 characters")
        .max(2, "State must be 2-letter code"),
      website: z.string().url("Must be a valid URL").optional(),
      latitude: z
        .number()
        .min(-90, "Latitude must be >= -90")
        .max(90, "Latitude must be <= 90"),
      longitude: z
        .number()
        .min(-180, "Longitude must be >= -180")
        .max(180, "Longitude must be <= 180"),
    }),
  ),
});

/**
 * Ask Claude to discover shopping centers and malls in a specific area. For
 * example, "Los Angeles County, CA.", "Bay Area, CA.", etc.
 *
 * @param where - The name of the county to discover centers in.
 * @returns The centers discovered in that area.
 */
export default async function discoverCenters(where: string): Promise<
  Array<{
    name: string;
    address: string;
    city: string;
    state: string;
    website?: string;
    latitude: number;
    longitude: number;
  }>
> {
  invariant(where.trim(), "County name is required");

  const cacheFile = getCacheFilePath(where);
  if (existsSync(cacheFile)) {
    const cacheData = await readFile(cacheFile, "utf-8");
    console.info("\x1b[32m  ✓ Loaded %d centers from cache\x1b[0m", cacheFile);
    return JSON.parse(cacheData);
  }

  const prompt = `List all shopping centers and malls in ${where}.
For each center provide:
- Official name
- Full street address
- City, state
- Official website URL (if known)
- Approximate coordinates (latitude/longitude)

Focus on retail shopping centers, strip malls, and enclosed malls.
Exclude individual stores or single-building retail.`;

  const spinner = ora(`Discovering centers in ${where}...`).start();
  const timeout = 90_000;
  try {
    const { object } = await generateObject({
      abortSignal: AbortSignal.timeout(timeout),
      model: conversational.model,
      prompt,
      schema: discoverySchema,
      temperature: 0,
    });
    spinner.succeed();

    const { centers } = object;

    console.info(
      "\x1b[32m  Found %d centers:\n%s\x1b[0m",
      centers.length,
      centers
        .map(
          (center) =>
            `  ${center.name}${center.website ? ` - ${center.website}` : ""}`,
        )
        .join("\n"),
    );

    await writeFile(cacheFile, JSON.stringify(centers, null, 2));
    console.info("\x1b[32m  ✓ Saved discovery: %s\x1b[0m", cacheFile);

    return centers;
  } catch (error) {
    const reason =
      error instanceof Error
        ? error.name === "AbortError"
          ? `Discovery request timed out after ${timeout}ms for ${where}`
          : error.message
        : String(error);
    spinner.fail(reason);
    throw new Error(reason);
  }
}

function getCacheFilePath(query: string): string {
  // Create slug from query for filename
  const slug = query
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return resolve(".cache", `discovery-${slug}.json`);
}
