/**
 * NOTE: This file contains setup code that will run before all tests
 */

import * as Sentry from "@sentry/react-router";
import { format, styleText } from "node:util";
import seedProperties from "prisma/seed/seedProperties";
import { beforeAll } from "vitest";
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

// Suppress expected browser warnings in tests - these don't affect functionality
const originalConsoleError = console.error;
console.error = (...args: unknown[]) => {
  const message = format(...args);
  if (
    // React hydration warnings from Playwright interactions
    message.includes("A tree hydrated but some attributes") ||
    message.includes("hydration mismatch") ||
    // Vite HMR manifest patch failures (dev server interruptions)
    message.includes("Failed to fetch manifest patches") ||
    message.includes("fetchAndApplyManifestPatches") ||
    // Vite optimize dep warnings (dev server interruptions)
    message.includes("status of 504 (Outdated Optimize Dep)")
  )
    return; // Suppress expected test warnings
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
