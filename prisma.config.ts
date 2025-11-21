import dotenv from "dotenv";
import { resolve } from "node:path";
import { defineConfig, env } from "prisma/config";

// Load environment variables only if not already set (e.g., by Doppler)
// This prevents overwriting variables injected by tools like Doppler
if (!process.env.DATABASE_URL) {
  dotenv.config({
    path: process.env.NODE_ENV === "test" ? ".env.test" : ".env",
    quiet: true,
  });
}

// @see https://www.prisma.io/docs/orm/overview/databases/supabase#specific-considerations
export default defineConfig({
  datasource: {
    url: env("DIRECT_URL"),
  },
  migrations: {
    path: resolve("prisma", "migrations"),
    seed: "pnpm tsx prisma/seed.ts",
  },
  schema: resolve("prisma", "schema.prisma"),
  typedSql: { path: resolve("prisma", "sql") },
});
