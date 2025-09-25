import { readdirSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import env from "env-var";
import { z } from "zod";
import { PrismaClient } from "./generated/client";

// NOTE don't use lib/config here, we don't plan to set all the environment
// variables just to seed the database.

const connectionString =
  process.env.NODE_ENV === "test"
    ? // secretlint-disable-next-line
      "postgresql://postgres:postgres@localhost:5432/postgres"
    : env.get("DATABASE_URL").required().asUrlString();
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({
  adapter,
  errorFormat: "pretty",
  log: ["error", "warn", "query", "info"],
});

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
    create: { ...json, spaces: { create: json.spaces } },
    update: {
      name: json.name,
      address: json.address,
      city: json.city,
      state: json.state,
      country: json.country,
      latitude: json.latitude,
      longitude: json.longitude,
      spaces: { deleteMany: {}, create: json.spaces },
    },
    where: { id: json.id },
  });
}
