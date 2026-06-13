import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { JWT } from "google-auth-library";
import invariant from "tiny-invariant";
import envVars from "./env";

const SERVICE_ACCOUNT_EMAIL =
  "analytics@rentail-480516.iam.gserviceaccount.com";

/**
 * Locate the service account JSON key file.
 */
function findKeyFilePath(): string | null {
  const candidates = [
    join(process.cwd(), "google-rentail.json"),
    join(process.cwd(), "..", "google-rentail.json"),
    envVars.GOOGLE_APPLICATION_CREDENTIALS,
  ];
  for (const candidate of candidates) {
    if (candidate && existsSync(candidate)) return candidate;
  }
  return null;
}

/**
 * Read the service account JSON and extract the private key.
 *
 * Using `JSON.parse` on the file content properly converts `\n` escape
 * sequences in the private_key field to real newlines, which is what
 * OpenSSL 3.x requires.
 */
function readKeyFileCredentials(): {
  client_email: string;
  private_key: string;
} | null {
  const keyFile = findKeyFilePath();
  if (!keyFile) return null;
  try {
    const data = JSON.parse(readFileSync(keyFile, "utf8"));
    return {
      client_email: data.client_email,
      private_key: data.private_key,
    };
  } catch {
    return null;
  }
}

/**
 * Normalize a PEM private key stored in an environment variable.
 *
 * When copied from a Google service account JSON, the key contains literal
 * `\n` sequences (backslash followed by n).  OpenSSL 3.x rejects these —
 * it requires actual newline characters.
 */
function normalizePrivateKey(key: string): string {
  if (key.includes("\\n")) return key.replace(/\\n/g, "\n");
  return key;
}

/**
 * Create a JWT auth client for Google Analytics (GA4) and Search Console.
 *
 * Prefers the service account JSON key file (google-rentail.json) since
 * `JSON.parse` properly converts `\n` → real newlines. Falls back to the
 * GOOGLE_ANALYTICS_PRIVATE_KEY env var with manual normalization.
 */
export function createGoogleAnalyticsAuth(scopes: string | string[]): JWT {
  // 1. Try the JSON key file (most reliable — JSON.parse handles \n for us)
  const fileCreds = readKeyFileCredentials();
  if (fileCreds) {
    return new JWT({
      scopes,
      email: fileCreds.client_email,
      key: fileCreds.private_key,
    });
  }

  // 2. Fall back to the env var
  const privateKey = envVars.GOOGLE_ANALYTICS_PRIVATE_KEY;
  invariant(privateKey, "No Google Analytics credentials found");
  return new JWT({
    scopes,
    email: SERVICE_ACCOUNT_EMAIL,
    key: normalizePrivateKey(privateKey),
  });
}
