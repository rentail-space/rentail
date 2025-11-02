/**
 * NOTE: This file contains setup code that will run before all tests
 */

import * as Sentry from "@sentry/react-router";
import { format, styleText } from "node:util";
import seedProperties from "prisma/seed/seedProperties";
import { afterAll, beforeAll } from "vitest";
import whyIsNodeRunning from "why-is-node-running";
import prisma from "~/lib/prisma";
import msw from "~/test/mocks/msw.server";

Sentry.init({
  enabled: false,
  environment: "development",
  defaultIntegrations: false,
  beforeSend(event) {
    console.error(
      styleText("red", format("%s %o", event.message, event.extra)),
    );
    return event;
  },
});

beforeAll(async () => {
  // Cleanup database and seed it
  await Promise.all([
    prisma.property.deleteMany(),
    prisma.user.deleteMany(),
    prisma.verification.deleteMany(),
    prisma.waitlist.deleteMany(),
  ]);
  await seedProperties();

  // Start MSW server before all tests
  msw.listen({ onUnhandledRequest: "error" });
});

afterAll(async () => {
  await prisma.$disconnect();

  msw.close();

  // Debug what's keeping Node alive (if tests hang)
  if (process.env.DEBUG_HANG) {
    setTimeout(() => {
      console.warn("\n=== WHY IS NODE STILL RUNNING? ===");
      whyIsNodeRunning();
    }, 2_000);
  }
});
