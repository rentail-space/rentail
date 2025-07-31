// This file contains setup code that will run before all tests

import { afterAll, afterEach, beforeAll } from "vitest";
import { server } from "../mocks/server";

// Add any global mocks or setup here

// Start MSW server before all tests
beforeAll(() => {
  server.listen({
    onUnhandledRequest: "error",
  });
});

// Reset handlers after each test
afterEach(() => {
  server.resetHandlers();
});

// Close MSW server after all tests
afterAll(() => {
  server.close();
});
