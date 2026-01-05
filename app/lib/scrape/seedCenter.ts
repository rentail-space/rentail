import debug from "debug";
import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import { z } from "zod";
import prisma from "~/lib/prisma";
import envVars from "../env";

const schema = z.object({
  name: z.string(),
  city: z.string(),
  state: z.string(),
  country: z.string(),
  address: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  squareFootage: z.int().positive().optional(),
  numberOfStores: z.int().positive().optional(),
  website: z.string(),
  phone: z.string().optional(),
  imageURLs: z.array(z.string()),
  logoURL: z.url().optional(),
  description: z.string(),
  demographics: z.string().optional(),
  summary: z.string().optional(),
  openFrom: z.int().optional(),
  openUntil: z.int().optional(),
  rating: z.number().min(1).max(5).optional(),
  reviewCount: z.int().positive().optional(),
  centerType: z.enum([
    "RegionalMall",
    "CommunityCenter",
    "StripCenter",
    "OutletCenter",
    "LifestyleCenter",
  ]),
  googlePlaceID: z.string(),

  spaces: z
    .array(
      z.object({
        number: z.string(),
        type: z.enum(["Cart", "Inline", "Storage", "Other"]),
        size: z.number().optional(),
        floor: z.number().optional(),
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
  const imageURLs = center.imageURLs.map((url) =>
    envVars.isProduction
      ? new URL(url, "https://rentail.space").toString()
      : url,
  );
  const id = basename(filename, ".json");

  await prisma.property.upsert({
    create: {
      ...center,
      id,
      imageURLs,
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
      imageURLs,
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
