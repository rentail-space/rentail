// This file contains setup code that will run before all tests

import * as Sentry from "@sentry/react-router";
import { afterAll, beforeAll } from "vitest";
import prisma from "~/lib/prisma";
import { cleanup } from "~/test/helpers/launchBrowser";
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
  await prisma.user.deleteMany({});
}, 60000);

afterAll(async () => {
  await cleanup();
  msw.close();
  await prisma.$disconnect();
});
