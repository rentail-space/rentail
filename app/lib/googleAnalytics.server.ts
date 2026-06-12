import { existsSync } from "node:fs";
import { join } from "node:path";
import { GoogleAuth } from "google-auth-library";
import invariant from "tiny-invariant";
import envVars from "./env";

/**
 * Locate the service account JSON key file.
 *
 * Checks several locations so this works in both dev and production.
 */
function findKeyFilePath(): string | null {
  const candidates = [
    // Project root (dev)
    join(process.cwd(), "google-rentail.json"),
    // One level up (some deployment setups)
    join(process.cwd(), "..", "google-rentail.json"),
    // Absolute path from env
    envVars.GOOGLE_APPLICATION_CREDENTIALS,
  ];
  for (const candidate of candidates) {
    if (candidate && existsSync(candidate)) return candidate;
  }
  return null;
}

/**
 * Create a GoogleAuth client for Google Analytics (GA4) and Search Console.
 *
 * Prefers the service account JSON key file (google-rentail.json) since
 * constructing a JWT from the GOOGLE_ANALYTICS_PRIVATE_KEY env var is
 * error-prone — the PEM key often has literal `\n` sequences that OpenSSL
 * 3.x rejects.  Falls back to the env var when no key file is present.
 */
export function createGoogleAnalyticsAuth(
  scopes: string | string[],
): GoogleAuth {
  const keyFile = findKeyFilePath();
  if (keyFile) return new GoogleAuth({ scopes, keyFile });

  // Fallback: construct from env var
  const privateKey = envVars.GOOGLE_ANALYTICS_PRIVATE_KEY;
  invariant(privateKey, "No Google Analytics credentials found");
  return new GoogleAuth({
    scopes,
    credentials: {
      client_email: "analytics@rentail-480516.iam.gserviceaccount.com",
      private_key: normalizePrivateKey(privateKey),
    },
  });
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
