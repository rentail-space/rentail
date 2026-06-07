import { execSync } from "node:child_process";

/**
 * Load secrets from Infisical into a flat env object.
 *
 * Falls back gracefully if Infisical CLI is unavailable or unauthenticated —
 * callers will use whatever is already in process.env.
 */
export function loadInfisicalEnv(): Record<string, string> {
  try {
    const raw = execSync(
      "infisical export --env test --format dotenv-export --silent",
      { encoding: "utf-8", timeout: 10_000 },
    );
    const secrets: Record<string, string> = {};
    for (const line of raw.split("\n")) {
      const match = line.match(
        /^export\s+(\w+)=('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|[^\s]+)/,
      );
      if (match) {
        let value = match[2];
        // Strip surrounding quotes (single or double)
        if (
          (value.startsWith("'") && value.endsWith("'")) ||
          (value.startsWith('"') && value.endsWith('"'))
        ) {
          value = value.slice(1, -1);
        }
        secrets[match[1]] = value;
      }
    }
    return secrets;
  } catch {
    console.warn(
      "Infisical: unable to load secrets — falling back to process.env",
    );
    return {};
  }
}

/**
 * Load secrets from Infisical into process.env (in place).
 *
 * Existing values in process.env take precedence, so CLI overrides or
 * .env files still work.
 */
export function loadInfisicalIntoEnv(): void {
  const secrets = loadInfisicalEnv();
  for (const [key, value] of Object.entries(secrets)) {
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}
