#!/usr/bin/env nub

/**
 * Normalize malformed phone numbers in the database.
 *
 *   infisical --env prod run -- nub scripts/normalize-phones.ts
 *
 * Background: the Google Places collector normalized phone numbers with the
 * regex /D/g (literal "D") instead of /\D/g (non-digits). Every collected
 * phone was stored as "++1 555-123-4567" instead of "+15551234567", and any
 * phone with an extension (e.g. "++1 714-687-0000 ext. 400") had the
 * extension digits merged into the base number. This script one-shot fixes
 * all existing rows so the chat agent — which shares `phone` and `website`
 * from the center record — no longer sees garbage and reports "not available".
 *
 * Idempotent: safe to run multiple times. Rows whose phone already equals its
 * normalized form are skipped. Rows with a null phone are left alone. The
 * normalization logic is shared with the collector via `normalizePhone`, so
 * the script and the write path can never drift.
 *
 * This script constructs its own PrismaClient (rather than importing
 * ~/lib/prisma.server) because nub does not resolve extensionless `.server`
 * imports — it treats the `.server` suffix as the file extension — while tsc
 * forbids explicit `.ts` import extensions. Package/alias imports without a
 * dot in the final segment (like `prisma/generated` and `~/lib/normalizePhone`)
 * resolve under both.
 */
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "prisma/generated";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import dotenv from "dotenv";
import normalizePhone from "~/lib/normalizePhone";

dotenv.configDotenv({ quiet: true });

if (!process.env.DATABASE_URL)
  throw new Error("DATABASE_URL is required (use infisical --env prod run)");

// The production database requires SSL with the project's CA cert; a local dev
// database does not. Gate SSL on the connection host so the same script runs
// in both environments (mirrors the verifyLocalhost guard in lib/env.ts).
const isProdDatabase =
  new URL(process.env.DATABASE_URL).hostname !== "localhost";

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL,
    max: 1,
    idleTimeoutMillis: 0,
    connectionTimeoutMillis: 0,
    allowExitOnIdle: true,
    ...(isProdDatabase && {
      ssl: {
        cert: readFileSync(resolve("prisma/prod-ca-2021.crt")),
        rejectUnauthorized: false,
      },
    }),
  }),
  errorFormat: "pretty",
});

const centers = await prisma.property.findMany({
  select: { id: true, name: true, phone: true },
  where: { phone: { not: null } },
});

let fixed = 0;
let skipped = 0;

for (const center of centers) {
  const phone = center.phone!;
  const normalized = normalizePhone(phone);
  if (!normalized) {
    console.warn(
      "  ⚠ %s (%s): no digits in %j — skipping",
      center.name,
      center.id,
      phone,
    );
    skipped++;
    continue;
  }
  if (normalized === phone) {
    skipped++;
    continue;
  }
  await prisma.property.update({
    data: { phone: normalized },
    where: { id: center.id },
  });
  console.info("  ✓ %s: %j → %j", center.name, phone, normalized);
  fixed++;
}

console.info(
  "\n✓ Done. Fixed %d, skipped %d (already normalized or empty).",
  fixed,
  skipped,
);
await prisma.$disconnect();
