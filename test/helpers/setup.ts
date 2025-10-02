// This file contains setup code that will run before all tests

import * as Sentry from "@sentry/react-router";
import { afterAll, beforeAll } from "vitest";
import prisma from "~/lib/prisma";
import server from "../mocks/msw.server";
import { cleanupServer } from "./launchBrowser";

Sentry.init({
  enabled: false,
  environment: "development",
  defaultIntegrations: false,
  beforeSend(event) {
    console.error("\x1b[91m[SENTRY] %s %o\x1b[0m", event.message, event.extra);
    return event;
  },
});

// Start MSW server before all tests
beforeAll(async () => {
  server.listen({ onUnhandledRequest: "error" });

  // Clean up database
  await prisma.user.deleteMany({});
});

// Close MSW server and test server after all tests
afterAll(async () => {
  server.close();
  await cleanupServer();
});
