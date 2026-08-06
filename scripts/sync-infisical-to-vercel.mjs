#!/usr/bin/env node

/**
 * One-shot migration helper: copy Infisical prod secrets into the Vercel project.
 *
 * Run once after creating the Vercel project (and `vercel link` if you want
 * to skip VERCEL_ORG_ID/VERCEL_PROJECT_ID):
 *
 *   VERCEL_TOKEN=<token> node scripts/sync-infisical-to-vercel.mjs
 *
 * Requires: infisical CLI logged in, VERCEL_TOKEN (or `vercel login`).
 * Skips keys that already exist in Vercel unless --force is passed.
 */

import { execFileSync } from "node:child_process";
import { argv } from "node:process";

const force = argv.includes("--force");

function infisicalExport() {
  return execFileSync(
    "infisical",
    ["export", "--env", "prod", "--format=dotenv"],
    {
      encoding: "utf8",
      maxBuffer: 10 * 1024 * 1024,
    },
  );
}

function parseDotenv(text) {
  const vars = {};
  for (const line of text.split("\n")) {
    const match = line.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    let value = match[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    vars[match[1]] = value;
  }
  return vars;
}

function vercel(args, input) {
  return execFileSync("vercel", args, {
    encoding: "utf8",
    input,
    stdio: ["pipe", "pipe", "pipe"],
  });
}

function existingKeys() {
  try {
    const out = vercel(["env", "ls", "production", "--json"]);
    const entries = JSON.parse(out);
    return new Set(entries.map((e) => e.key));
  } catch {
    return new Set();
  }
}

const vars = parseDotenv(infisicalExport());
const keys = existingKeys();
let added = 0;
let skipped = 0;

for (const [key, value] of Object.entries(vars)) {
  if (!force && keys.has(key)) {
    console.info(`skip  ${key} (already exists)`);
    skipped += 1;
    continue;
  }
  if (keys.has(key)) vercel(["env", "rm", key, "production", "-y"]);
  vercel(["env", "add", key, "production"], `${value}\n`);
  console.info(`added ${key}`);
  added += 1;
}

console.info(`\nDone: ${added} added, ${skipped} skipped.`);
console.info("Next: add rentail.space to the Vercel project, then deploy.");
