import { PrismaPg } from "@prisma/adapter-pg";
import debug from "debug";
import dotenv from "dotenv";
import { invariant } from "es-toolkit";
import pg from "pg";
import { PrismaClient } from "prisma/generated/client";

dotenv.configDotenv({ quiet: true });
invariant(process.env.DATABASE_URL, "DATABASE_URL is required");

// Configure pg Pool for Supabase pooler (SSL configured via DATABASE_URL)
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 1,
  idleTimeoutMillis: 0,
  connectionTimeoutMillis: 0,
  allowExitOnIdle: true,
});

export default new PrismaClient({
  adapter: new PrismaPg(pool),
  errorFormat: "pretty",
  log: debug.enabled("prisma") ? ["error", "warn", "query", "info"] : ["error"],
});
