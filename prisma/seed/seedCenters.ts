import { readdirSync, statSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path, { basename, resolve } from "node:path";
import debug from "debug";
import { z } from "zod";
import prisma from "~/lib/prisma";

const schema = z.object({
  name: z.string(),
  city: z.string(),
  state: z.string(),
  country: z.string(),
  address: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  squareFootage: z.number(),
  numberOfStores: z.number(),
  website: z.string(),
  phone: z.string().optional(),
  imageURLs: z.array(z.url()),
  logoURL: z.url().optional(),
  description: z.string(),
  demographics: z.string().optional(),
  summary: z.string().optional(),
  openFrom: z.number().optional(),
  openUntil: z.number().optional(),
  rating: z.number().optional(),

  spaces: z
    .array(
      z.object({
        number: z.string(),
        type: z.enum(["Cart", "Inline", "Storage", "Other"]),
        size: z.number(),
        floor: z.number(),
        imageURLs: z.array(z.url()).optional(),
        available: z.boolean().default(false),
      }),
    )
    .default([]),
});

const logger = debug("seed");

function findJSONFiles(dir: string): string[] {
  const results: string[] = [];
  const entries = readdirSync(dir);

  for (const entry of entries) {
    const fullPath = path.join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      results.push(...findJSONFiles(fullPath));
    } else if (entry.endsWith(".json")) {
      results.push(fullPath);
    }
  }

  return results;
}

export default async function seedCenters() {
  logger("Seeding centers");
  const dirname = resolve("prisma/seed");
  const filenames = findJSONFiles(dirname);

  for (const filename of filenames) {
    logger("Seeding %s", filename);
    const data = await readFile(path.resolve(dirname, filename), "utf-8");
    const center = schema.parse(JSON.parse(data));

    // Generate missing fields
    const id = basename(filename, ".json");

    await prisma.property.upsert({
      create: {
        ...center,
        id,
        spaces: {
          createMany: {
            data: center.spaces.map((space) => ({
              ...space,
              id: `${id}-${space.number}`,
            })),
          },
        },
      },
      update: {
        ...center,
        spaces: {
          upsert: center.spaces.map((space) => ({
            where: { id: `${id}-${space.number}` },
            update: space,
            create: { ...space, id: `${id}-${space.number}` },
          })),
        },
      },
      where: { id },
    });
  }
  logger("Seeded %d centers", filenames.length);
}
