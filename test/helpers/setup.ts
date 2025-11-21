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

// Suppress the birpc RPC closure error that occurs during test teardown
// This happens when Vite dependency optimization is still running while the worker shuts down
process.on("unhandledRejection", (reason) => {
  const message = reason instanceof Error ? reason.message : String(reason);
  if (message.includes("birpc") && message.includes("rpc is closed"))
    // Silently ignore - this is expected during test teardown when Vite is optimizing dependencies
    return;
  // Re-throw other unhandled rejections
  else throw reason;
});

beforeAll(async () => {
  // Cleanup database
  await Promise.all([
    prisma.user.deleteMany(),
    prisma.verification.deleteMany(),
    prisma.waitlist.deleteMany(),
  ]);
});

afterAll(async () => {
  await prisma.$disconnect();
});
