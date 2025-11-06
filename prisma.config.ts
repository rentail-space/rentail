import dotenv from "dotenv";
import { resolve } from "node:path";
import { defineConfig, env } from "prisma/config";

// Load the environment variables
dotenv.config({
  path: process.env.NODE_ENV === "test" ? ".env.test" : ".env",
  quiet: true,
});

export default defineConfig({
  engine: "classic",
  datasource: {
    url: env("DATABASE_URL"),
  },
  migrations: {
    path: resolve("prisma", "migrations"),
    seed: "pnpm tsx prisma/seed.ts",
  },
  schema: resolve("prisma", "schema.prisma"),
  typedSql: { path: resolve("prisma", "sql") },
});
