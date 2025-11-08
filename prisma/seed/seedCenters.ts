import prisma from "app/lib/prisma";
import debug from "debug";
import { readdir, readFile } from "node:fs/promises";
import { basename, join, resolve } from "node:path";
import { z } from "zod";

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

export default async function seedCenters() {
  debug("seed")("Seeding centers");

  const dirname = resolve("prisma/seed");
  const filenames = (await readdir(dirname)).filter((filename) =>
    filename.endsWith(".json"),
  );

  for (const filename of filenames) {
    debug("seed")("Seeding %s", filename);
    const data = await readFile(join(dirname, filename), "utf-8");
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
  debug("seed")("Seeded %d centers", filenames.length);
}
