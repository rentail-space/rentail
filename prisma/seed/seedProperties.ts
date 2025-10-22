import prisma from "app/lib/prisma";
import debug from "debug";
import { readdir, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { z } from "zod";

export default async function seedProperties() {
  const log = debug("seed");
  log("Seeding properties");

  const dirname = resolve("prisma/seed");
  const filenames = (await readdir(dirname)).filter((filename) =>
    filename.endsWith(".json"),
  );

  for (const filename of filenames) {
    log("Seeding %s", filename);
    const data = await readFile(join(dirname, filename), "utf-8");
    const json = property.parse(JSON.parse(data));
    await prisma.property.upsert({
      create: {
        ...json,
        id: json.id,
        spaces: { create: json.spaces },
      },
      update: {
        ...json,
        spaces: {
          upsert: json.spaces.map((space) => ({
            create: space,
            update: space,
            where: { id: space.id },
          })),
        },
      },
      where: { id: json.id },
    });
  }
  debug("seed")("Seeded %d properties", filenames.length);
}

const property = z.object({
  address: z.string(),
  city: z.string(),
  country: z.string(),
  description: z.string(),
  id: z.cuid2(),
  imageURLs: z.array(z.url()),
  latitude: z.number(),
  longitude: z.number(),
  name: z.string(),
  slug: z.string(),
  state: z.string(),
  website: z.string(),
  spaces: z.array(
    z.object({
      available: z.literal(["week", "weekends"]),
      cost: z.number(),
      details: z.string(),
      footTraffic: z.number(),
      id: z.cuid2(),
      imageURLs: z.array(z.url()),
      name: z.string(),
      size: z.number(),
    }),
  ),
});
