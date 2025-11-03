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
});

export default async function seedProperties() {
  debug("seed")("Seeding properties");

  const dirname = resolve("prisma/seed");
  const filenames = (await readdir(dirname)).filter((filename) =>
    filename.endsWith(".json"),
  );

  for (const filename of filenames) {
    debug("seed")("Seeding %s", filename);
    const data = await readFile(join(dirname, filename), "utf-8");
    const parsed = schema.parse(JSON.parse(data));

    // Generate missing fields
    const id = basename(filename, ".json");

    await prisma.property.upsert({
      create: { ...parsed, id },
      update: parsed,
      where: { id },
    });
  }
  debug("seed")("Seeded %d properties", filenames.length);
}
