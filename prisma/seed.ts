import debug from "debug";
import { readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import seedCenter from "../app/lib/scrape/seedCenter";

debug.enable("seed");
const logger = debug("seed");

/**
 * Recursively find all files in a directory.
 *
 * @param dirname The directory to start searching in.
 * @returns Array of absolute file paths.
 */
function findAllFilesRecursively(dirname: string): string[] {
  let results: string[] = [];
  const filenames = readdirSync(dirname);

  for (const filename of filenames) {
    const fullPath = join(dirname, filename);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      results = results.concat(
        findAllFilesRecursively(fullPath).map((childFilename) =>
          join(dirname, filename, childFilename),
        ),
      );
    } else results.push(filename);
  }
  return results;
}

const filenames = findAllFilesRecursively(resolve("prisma/seed"));
logger("Seeding %s files", filenames.length);
for (const filename of filenames)
  await seedCenter(resolve("prisma/seed", filename));
logger("✅ Done");
