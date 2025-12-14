import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

interface CenterData {
  name: string;
  state: string;
  [key: string]: unknown;
}

export default async function saveCenterFile(
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

function generateSlug(name: string, state: string): string {
  const normalized = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // Remove special chars
    .replace(/\s+/g, "-") // Spaces to hyphens
    .replace(/-+/g, "-") // Collapse multiple hyphens
    .replace(/^-|-$/g, ""); // Trim hyphens

  return `${state.toLowerCase()}-${normalized}`;
}
