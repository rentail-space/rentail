// This file contains setup code that will run before all tests
import { afterAll, beforeAll } from "vitest";
import prisma from "~/lib/prisma";
import { cleanupServer } from "./launchBrowser";
import server from "../mocks/msw.server";

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
