import dotenv from "dotenv";
import { invariant } from "es-toolkit";
import { resolve } from "node:path";
import { defineConfig } from "prisma/config";

// Load environment variables only if not already set (e.g., by Doppler)
// This prevents overwriting variables injected by tools like Doppler
dotenv.configDotenv({ quiet: true });
invariant(process.env.DIRECT_URL, "DIRECT_URL is required");

// @see https://www.prisma.io/docs/orm/overview/databases/supabase#specific-considerations
export default defineConfig({
  datasource: {
    url: process.env.DIRECT_URL,
  },
  migrations: {
    path: "prisma/migrations",
    seed: "pnpm tsx prisma/seed.ts",
  },
  schema: "prisma/schema.prisma",
  typedSql: { path: resolve("prisma", "sql") },
});
