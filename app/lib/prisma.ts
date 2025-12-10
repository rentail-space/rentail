import { PrismaPg } from "@prisma/adapter-pg";
import debug from "debug";
import dotenv from "dotenv";
import { invariant } from "es-toolkit";
import { PrismaClient } from "prisma/generated/client";

dotenv.config({ quiet: true });
invariant(process.env.DATABASE_URL, "DATABASE_URL is required");

export default new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  errorFormat: "pretty",
  log: debug.enabled("prisma") ? ["error", "warn", "query", "info"] : ["error"],
});
