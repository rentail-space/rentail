import debug from "debug";
import { readFile } from "node:fs/promises";
import { basename } from "node:path";
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
  rating: z.number().min(10).max(50).optional(),
  reviewCount: z.number().int().positive().optional(),
  centerType: z.enum([
    "RegionalMall",
    "CommunityCenter",
    "StripCenter",
    "OutletCenter",
    "LifestyleCenter",
  ]),

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

export default async function seedCenter(filename: string) {
  logger("🔄 Seeding %s", filename);
  const data = await readFile(filename, "utf-8");
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
