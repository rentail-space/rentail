import { readdir, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import prisma from "app/lib/prisma";
import debug from "debug";
import { omit } from "es-toolkit";
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
        ...omit(json, ["latitude", "longitude"]),
        spaces: { create: json.spaces },
        id: json.id,
      },
      update: {
        ...omit(json, ["latitude", "longitude"]),
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
    const point = `POINT(${json.longitude} ${json.latitude})`;
    await prisma.$executeRaw`UPDATE "properties" SET location = ST_GeomFromText(${point}) WHERE ID=${json.id};`;
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
  latitude: z.string(),
  longitude: z.string(),
  name: z.string(),
  state: z.string(),
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
