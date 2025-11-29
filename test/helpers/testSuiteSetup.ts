/**
 * NOTE: Setup code to run before every test suite
 *
 * - Disables Sentry
 * - Cleans up database (once per test suite)
 */

import * as Sentry from "@sentry/react-router";
import Redis from "ioredis";
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

  // Cleanup Redis to avoid stale data between tests
  const redis = new Redis();
  await redis.flushdb();
});

afterAll(async () => {
  await prisma.$disconnect();
});
