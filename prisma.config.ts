import * as dotenv from "dotenv";
import { defineConfig } from "prisma/config";

// Load the environment variables
dotenv.config({
  path: process.env.NODE_ENV === "test" ? ".env.test" : ".env",
  quiet: true,
});

export default defineConfig({
  migrations: { seed: "pnpm dlx tsx prisma/seed.ts" },
  schema: "prisma/schema.prisma",
  typedSql: { path: "prisma/sql" },
});
