#!/usr/bin/env node

/**
 * Load a .env file into process.env and run a command with it.
 *
 * Usage: node scripts/load-env.mjs [envFile] -- command [args...]
 *
 *   envFile defaults to ".env". The command inherits stdio and exits with
 *   the child's exit code. Values already in process.env take precedence.
 *
 * Example:
 *   node scripts/load-env.mjs .env.test -- prisma db push
 */

import { spawn } from "node:child_process";
import dotenv from "dotenv";

const { config } = dotenv;

const separator = process.argv.indexOf("--");
if (separator === -1) {
  console.error(
    "Usage: node scripts/load-env.mjs [envFile] -- command [args...]",
  );
  process.exit(1);
}

const envFile = separator > 2 ? process.argv[2] : ".env";
const command = process.argv.slice(separator + 1);

const { parsed } = config({ path: envFile, quiet: true });
const env = { ...process.env, ...parsed };

const child = spawn(command[0], command.slice(1), { env, stdio: "inherit" });
const code = await new Promise((resolve) => child.on("exit", resolve));
process.exit(code ?? 1);
