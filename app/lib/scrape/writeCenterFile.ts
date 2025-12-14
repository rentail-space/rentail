import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import generateSlug from "~/lib/scrape/generateSlug";

interface CenterData {
  name: string;
  state: string;
  [key: string]: unknown;
}

export default async function writeCenterFile(
  centerData: CenterData,
): Promise<string> {
  const slug = generateSlug(centerData.name, centerData.state);
  const outputPath = resolve(
    `prisma/seed/${centerData.state.toLowerCase()}/${slug}.json`,
  );
  console.info(
    "\x1b[32m  Saving %s to %s...\x1b[0m",
    centerData.name,
    outputPath,
  );
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, JSON.stringify(centerData, null, 2));
  return outputPath;
}
