import tsconfigPaths from "vite-tsconfig-paths";
import type { ParsedStack } from "vitest";
import { defineConfig } from "vitest/config";

process.env.NODE_ENV = "test";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    bail: 3,
    browser: { screenshotDirectory: "__screenshots__" },
    exclude: ["build", "node_modules"],
    fileParallelism: false,
    globals: false,
    hideSkippedTests: false,
    hookTimeout: 90_000, // 90 seconds for beforeAll/afterAll (server + browser startup)
    include: ["test/*.test.{ts,tsx}"],
    isolate: true, // NOTE: without isolation sometimes tests hang
    onStackTrace,
    pool: "forks",
    reporters: process.env.GITHUB_ACTIONS
      ? ["github-actions", "hanging-process"]
      : ["verbose"],
    setupFiles: "test/helpers/setup.ts",
    globalSetup: "test/helpers/globalSetup.ts",
    teardownTimeout: 10_000, // 10 seconds for browser/server cleanup
    testTimeout: 60_000, // 60 seconds for E2E tests with browser interaction
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

declare global {
  namespace PlaywrightTest {
    interface Matchers<R> {
      toMatchScreenshot(): Promise<R>;
    }
  }
}
