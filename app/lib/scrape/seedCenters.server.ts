import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { slugify } from "~/lib/utils";
import { fork } from "radashi";
import { z } from "zod";
import envVars from "~/lib/env";
import prisma from "~/lib/prisma.server";
import debug from "debug";

export const schema = z.object({
  name: z.string(),
  city: z.string(),
  state: z.string(),
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

/**
 * Seed centers from the seed directory. If `centerSlugs` is provided, only the
 * centers with the given slugs will be seeded (global setup for testing).
 * Otherwise, all centers in the seed directory will be seeded (prisma db seed).
 *
 * @param centerSlugs - The slugs of the centers to seed. If not provided, all
 * centers in the seed directory will be seeded.
 */
export default async function seedCenters(centerSlugs?: string[]) {
  const basedir = resolve("prisma/seed");
  const filenames = readdirSync(basedir, { withFileTypes: true })
    .filter((file) => file.isDirectory())
    .flatMap((dir) =>
      readdirSync(join(basedir, dir.name)).map((filename) =>
        join(dir.name, filename),
      ),
    );
  const centers = (centerSlugs || filenames).map((filename) => {
    const data = readFileSync(resolve(basedir, filename), "utf-8");
    return schema.parse(JSON.parse(data)) as z.infer<typeof schema>;
  });

  const states = await prisma.state.findMany();
  const [seedable, noState] = fork(
    centers,
    (center) =>
      !!states.find(({ abbreviation }) => abbreviation === center.state),
  );
  logger("🔄 Seeding %d/%d centers", seedable.length, filenames.length);

  for (const center of seedable) await seedCenter(center);

  const unknownStates = [
    ...new Set(noState.map((center) => center.state)).values(),
  ];
  if (unknownStates.length > 0) logger("❌ Unknown states: %o", unknownStates);
}

export async function seedCenter(rawCenter: z.infer<typeof schema>) {
  const center = schema.parse(rawCenter);
  logger("🔄 Seeding %s %s", center.state, center.name);

  const imageURLs = center.imageURLs.map((url) =>
    envVars.isProduction
      ? new URL(url, "https://rentail.space").toString()
      : url,
  );
  const id = slugify(center.state, center.name);

  // Remove duplicates from center.spaces by space.number and store in 'spaces'
  const spaces = Object.values(
    new Map<string, (typeof center.spaces)[number]>(
      center.spaces.map((space) => [space.number, space]),
    ),
  );
  await prisma.property.upsert({
    create: {
      ...center,
      id,
      state: { connect: { abbreviation: center.state } },
      imageURLs,
      spaces: {
        createMany: { data: spaces },
      },
    },
    update: {
      ...center,
      state: { connect: { abbreviation: center.state } },
      imageURLs,
      spaces: {
        upsert: spaces.map((space) => ({
          where: {
            propertyId_number: { propertyId: id, number: space.number },
          },
          update: space,
          create: { ...space },
        })),
      },
    },
    where: { id },
  });
}
