import dotenv from "dotenv";
import { resolve } from "node:path";
import { defineConfig, env } from "prisma/config";

if (process.env.NODE_ENV === "test") {
  dotenv.configDotenv({ path: ".env.test", override: true });
  dotenv.configDotenv({ path: ".env", override: false });
} else {
  dotenv.configDotenv({ path: ".env", quiet: true });
}

// @see https://www.prisma.io/docs/orm/overview/databases/supabase#specific-considerations
export default defineConfig({
  datasource: {
    url: env("DIRECT_URL"),
  },
  migrations: {
    path: "prisma/migrations",
    seed: "pnpm tsx prisma/seed.ts",
  },
  schema: "prisma/schema.prisma",
  typedSql: { path: resolve("prisma", "sql") },
});
