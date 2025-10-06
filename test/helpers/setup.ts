// This file contains setup code that will run before all tests

import * as Sentry from "@sentry/react-router";
import { afterAll, beforeAll } from "vitest";
import whyIsNodeRunning from "why-is-node-running";
import prisma from "~/lib/prisma";
import msw from "~/test/mocks/msw.server";

Sentry.init({
  enabled: false,
  environment: "development",
  defaultIntegrations: false,
  beforeSend(event) {
    console.error("\x1b[91m[SENTRY] %s %o\x1b[0m", event.message, event.extra);
    return event;
  },
});

beforeAll(async () => {
  // Start MSW server before all tests
  msw.listen({ onUnhandledRequest: "error" });
  // Clean up database
  await Promise.all([
    prisma.shoppingCenter.deleteMany(),
    prisma.user.deleteMany(),
    prisma.verification.deleteMany(),
    prisma.waitlist.deleteMany(),
  ]);
});

afterAll(async () => {
  msw.close();
  await prisma.$disconnect();

  // Debug what's keeping Node alive (if tests hang)
  if (process.env.DEBUG_HANG) {
    setTimeout(() => {
      console.warn("\n=== WHY IS NODE STILL RUNNING? ===");
      whyIsNodeRunning();
    }, 2000);
  }
});
