/**
 * NOTE: This file contains setup code that will run before all tests
 */

import * as Sentry from "@sentry/react-router";
import { beforeAll } from "vitest";
import prisma from "~/lib/prisma";
import msw from "~/test/mocks/mswHandlers";
import "./trimConsole";

Sentry.init({
  enabled: false,
  environment: "development",
  defaultIntegrations: false,
});

beforeAll(async () => {
  // Cleanup database and seed it
  await Promise.all([
    prisma.user.deleteMany(),
    prisma.verification.deleteMany(),
    prisma.waitlist.deleteMany(),
  ]);

  // Start MSW server before all tests
  msw.listen({ onUnhandledRequest: "error" });
});
