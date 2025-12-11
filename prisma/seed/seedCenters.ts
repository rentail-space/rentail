import { PrismaPg } from "@prisma/adapter-pg";
import debug from "debug";
import dotenv from "dotenv";
import { invariant } from "es-toolkit";
import { readdirSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path, { basename, resolve } from "node:path";
import { PrismaClient } from "prisma/generated/client";
import { z } from "zod";

dotenv.config({ quiet: true });
invariant(process.env.DATABASE_URL, "DATABASE_URL is required");

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DIRECT_URL,
  }),
  errorFormat: "pretty",
  log: debug.enabled("prisma") ? ["error", "warn", "query", "info"] : ["error"],
});

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

export default async function seedCenters() {
  logger("Seeding centers");

  const dirname = resolve("prisma/seed");
  const filenames = readdirSync(dirname).filter((filename) =>
    filename.endsWith(".json"),
  );

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
