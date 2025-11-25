/**
 * NOTE: Setup code to run before every test suite
 *
 * - Disables Sentry
 * - Cleans up database (once per test suite)
 */

import * as Sentry from "@sentry/react-router";
import { afterAll, beforeAll } from "vitest";
import prisma from "~/lib/prisma";
import "./toMatchInnerHTML";
import "./toMatchScreenshot";
import "./trimConsole";

Sentry.init({ enabled: false });

beforeAll(async () => {
  // Cleanup database
  await Promise.all([
    prisma.user.deleteMany(),
    prisma.verification.deleteMany(),
    prisma.waitlist.deleteMany(),
  ]);
});

afterAll(async () => {
  // Disconnect Prisma with timeout to prevent hanging on macOS
  try {
    await Promise.race([
      prisma.$disconnect(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("disconnect timeout")), 2000),
      ),
    ]);
  } catch (error) {
    // Silently ignore timeout errors - the connection pool will be cleaned up on process exit
    if (!(error instanceof Error) || !error.message.includes("timeout")) {
      console.error("Prisma disconnect error:", error);
    }
  }
});
