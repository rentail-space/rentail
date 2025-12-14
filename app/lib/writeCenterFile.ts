import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { generateSlug } from "~/lib/generateSlug";

interface CenterData {
  name: string;
  state: string;
  [key: string]: unknown;
}

export async function writeCenterFile(
  centerData: CenterData,
  countyName: string,
): Promise<string> {
  const slug = generateSlug(centerData.name, centerData.state);
  const countySlug = countyName
    .toLowerCase()
    .replace(/\s+county\s*/i, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");

  const outputPath = resolve(
    `prisma/seed/${centerData.state.toLowerCase()}/${countySlug}/${slug}.json`,
  );

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, JSON.stringify(centerData, null, 2));

  return outputPath;
}
