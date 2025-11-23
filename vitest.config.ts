import tsconfigPaths from "vite-tsconfig-paths";
import type { ParsedStack } from "vitest";
import { defineConfig } from "vitest/config";

process.env.NODE_ENV = "test";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    bail: process.env.CI ? 10 : 3,
    browser: { screenshotDirectory: "__screenshots__" },
    exclude: ["build", "node_modules"],
    fileParallelism: false,
    globals: false,
    hideSkippedTests: false,
    hookTimeout: 30_000, // 30 seconds for beforeAll/afterAll (server + browser startup)
    include: ["test/*.test.{ts,tsx}"],
    isolate: true, // NOTE: without isolation sometimes tests hang
    onStackTrace,
    pool: "forks",
    reporters: [
      process.env.GITHUB_ACTIONS ? "github-actions" : "verbose",
      "hanging-process",
    ],
    setupFiles: "test/helpers/testSuiteSetup.ts",
    globalSetup: "test/helpers/globalSetup.ts",
    teardownTimeout: 30_000, // 30 seconds for browser/server cleanup (increased to allow proper shutdown)
    testTimeout: 30_000, // 30 seconds for E2E tests with browser interaction
  },
});

function onStackTrace(
  error: { name?: string },
  { file }: ParsedStack,
): boolean {
  // If we've encountered a ReferenceError, show the whole stack.
  if (error.name === "ReferenceError") return true;
  // Reject all frames from third party libraries.
  return !file.includes("node_modules");
}
