/**
 * NOTE: Setup code to run before every test suite
 *
 * - Disables Sentry
 * - Cleans up database (once per test suite)
 */

import { afterAll, beforeAll } from "vite-plus/test";
import prisma from "~/lib/prisma.server";
import "~/test/mocks/mockMapbox";
import msw from "~/test/mocks/mswHandlers";
import "./toMatchInnerHTML";
import "./toMatchScreenshot";
import "./trimConsole";

beforeAll(async () => {
  // Cleanup database
  await Promise.all([
    prisma.user.deleteMany(),
    prisma.verification.deleteMany(),
    prisma.cache.deleteMany(),
  ]);

  msw();
});

afterAll(async () => {
  await prisma.$disconnect();
  // Must run with NODE_OPTIONS="--expose-gc"
  if ("gc" in global && global.gc) global.gc();
});
