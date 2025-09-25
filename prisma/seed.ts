import { readdirSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import prisma from "app/lib/prisma";
import { z } from "zod";

// NOTE don't use lib/config here, we don't plan to set all the environment
// variables just to seed the database.

// NOTE We're using postgis to find nearby shopping centers.
await prisma.$executeRaw`CREATE EXTENSION IF NOT EXISTS postgis;`;
await addShoppingCenters();

async function addShoppingCenters() {
  const shoppingCenter = z.object({
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

  const dirname = join(import.meta.dirname, "seed");
  for (const file of readdirSync(dirname)) {
    console.info(`Seeding ${file}`);
    const data = await readFile(join(dirname, file), "utf-8");
    const json = shoppingCenter.parse(JSON.parse(data));
    await prisma.shoppingCenter.upsert({
      create: {
        name: json.name,
        address: json.address,
        city: json.city,
        state: json.state,
        country: json.country,
        description: json.description,
        imageURLs: json.imageURLs,
        spaces: { create: json.spaces },
      },
      update: {
        name: json.name,
        address: json.address,
        city: json.city,
        state: json.state,
        country: json.country,
        description: json.description,
        imageURLs: json.imageURLs,
        spaces: { deleteMany: {}, create: json.spaces },
      },
      where: { id: json.id },
    });
    const point = `POINT(${json.longitude} ${json.latitude})`;
    await prisma.$queryRaw`UPDATE "shopping_centers" SET location = ST_GeomFromText(${point}, 4326) WHERE ID=${json.id};`;
  }
}
