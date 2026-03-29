/**
 * NOTE: This is used by `db seed` (prisma/seed.ts) but also when running test
 * suite (test/helpers/globalSetup.ts)
 */

import { PrismaPg } from "@prisma/adapter-pg";
import debug from "debug";
import dotenv from "dotenv";
import { invariant } from "es-toolkit";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PrismaClient } from "prisma/generated";

dotenv.configDotenv({ quiet: true });
invariant(process.env.DATABASE_URL, "DATABASE_URL is required");

export default new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL,
    max: 1,
    idleTimeoutMillis: 0,
    connectionTimeoutMillis: 0,
    allowExitOnIdle: true,
    ssl: process.env.NODE_ENV === "production" && {
      cert: readFileSync(resolve("prisma/prod-ca-2021.crt")),
      rejectUnauthorized: false,
    },
  }),
  errorFormat: "pretty",
  log: debug.enabled("prisma") ? ["error", "warn", "query", "info"] : ["error"],
});
