/**
 * NOTE: Setup code to run before every test suite
 *
 * - Disables Sentry
 * - Cleans up database (once per test suite)
 */

import * as Sentry from "@sentry/react-router";
import { invariant } from "es-toolkit";
import Redis from "ioredis";
import { afterAll, beforeAll } from "vitest";
import envVars from "~/lib/env";
import prisma from "~/lib/prisma.server";
import "~/test/mocks/mockMapbox";
import msw from "~/test/mocks/mswHandlers";
import "./toMatchInnerHTML";
import "./toMatchScreenshot";
import "./trimConsole";

Sentry.init({ enabled: false });

beforeAll(async () => {
  // Cleanup database
  await Promise.all([
    prisma.user.deleteMany(),
    prisma.verification.deleteMany(),
  ]);

  // Cleanup Redis to avoid stale data between tests
  const redis = new Redis(envVars.REDIS_URL);
  await redis.flushdb();

  msw();
});

afterAll(async () => {
  await prisma.$disconnect();

  // Must run with NODE_OPTIONS="--expose-gc"
  if (process.env.CI) {
    invariant(global.gc, "global.gc is not defined");
    global.gc();
  }
});
