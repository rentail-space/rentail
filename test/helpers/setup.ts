// This file contains setup code that will run before all tests
import { afterAll, beforeAll } from "vitest";
import prisma from "~/lib/prisma";
import server from "../mocks/msw.server";

// Start MSW server before all tests
beforeAll(async () => {
  server.listen({ onUnhandledRequest: "error" });

  // Clean up database
  await prisma.user.deleteMany({});
});

// Close MSW server after all tests
afterAll(() => server.close());
