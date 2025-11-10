/**
 * NOTE: Setup code to run before every test suite
 *
 * - Disables Sentry
 * - Cleans up database (once per test suite)
 */

import * as Sentry from "@sentry/react-router";
import { beforeAll } from "vitest";
import prisma from "~/lib/prisma";
import "./trimConsole";

Sentry.init({
  enabled: false,
  environment: "development",
  defaultIntegrations: false,
});

beforeAll(async () => {
  // Cleanup database
  await Promise.all([
    prisma.user.deleteMany(),
    prisma.verification.deleteMany(),
    prisma.waitlist.deleteMany(),
  ]);
});
