/**
 * NOTE: This file contains setup code that will run before all tests
 */

import * as Sentry from "@sentry/react-router";
import { format, styleText } from "node:util";
import seedProperties from "prisma/seed/seedProperties";
import { afterAll, beforeAll } from "vitest";
import whyIsNodeRunning from "why-is-node-running";
import prisma from "~/lib/prisma";
import msw from "~/test/mocks/mswHandlers";

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

// Suppress React hydration warnings in tests - these are expected when Playwright
// interacts with the page (adds inline styles, etc.) and don't affect functionality
const originalConsoleError = console.error;
console.error = (...args: unknown[]) => {
  const message = format(...args);
  if (
    message.includes("A tree hydrated but some attributes") ||
    message.includes("hydration mismatch")
  ) {
    return; // Suppress hydration warnings
  }
  originalConsoleError(...args);
};

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
