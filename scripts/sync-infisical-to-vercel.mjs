#!/usr/bin/env node

/**
 * Copy Infisical prod secrets into a Vercel project.
 *
 * Requires: infisical CLI logged in, vercel CLI logged in.
 *
 * Usage:
 *   node scripts/sync-infisical-to-vercel.mjs --project rentail [--force]
 *
 * Skips keys that already exist in Vercel unless --force is passed.
 */

import { execFileSync } from "node:child_process";
import { argv } from "node:process";

const force = argv.includes("--force");
const projectArg = (() => {
  const index = argv.indexOf("--project");
  if (index === -1) throw new Error("Missing --project <name> argument");
  return ["--project", argv[index + 1]];
})();

function infisicalExport() {
  return JSON.parse(
    execFileSync("infisical", ["export", "--env", "prod", "--format=json"], {
      encoding: "utf8",
      maxBuffer: 50 * 1024 * 1024,
    }),
  );
}

function vercel(args, input) {
  return execFileSync("vercel", [...args, ...projectArg], {
    encoding: "utf8",
    input,
    stdio: ["pipe", "pipe", "pipe"],
  });
}

function existingKeys() {
  try {
    const out = vercel(["env", "ls", "production", "--json"]);
    const entries = JSON.parse(out);
    return new Set((entries.envs ?? entries).map((e) => e.key));
  } catch {
    return new Set();
  }
}

const secrets = infisicalExport();
const keys = existingKeys();
let added = 0;
let skipped = 0;

for (const { key, value } of secrets) {
  if (value === undefined || value === null) {
    console.info(`skip  ${key} (no value)`);
    continue;
  }
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
