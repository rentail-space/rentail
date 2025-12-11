import { PrismaPg } from "@prisma/adapter-pg";
import debug from "debug";
import dotenv from "dotenv";
import { invariant } from "es-toolkit";
import pg from "pg";
import { PrismaClient } from "prisma/generated/client";

dotenv.config({ quiet: true });
invariant(process.env.DATABASE_URL, "DATABASE_URL is required");

// Configure pg Pool for Supabase pooler compatibility
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 1, // Limit connections for Supabase pooler
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

export default new PrismaClient({
  adapter: new PrismaPg(pool),
  errorFormat: "pretty",
  log: debug.enabled("prisma") ? ["error", "warn", "query", "info"] : ["error"],
});
