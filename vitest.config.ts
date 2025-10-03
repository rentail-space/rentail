import tsconfigPaths from "vite-tsconfig-paths";
import type { ErrorWithDiff, ParsedStack } from "vitest";
import { defineConfig } from "vitest/config";

process.env.NODE_ENV = "test";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    browser: { screenshotDirectory: "./__screenshots__" },
    fileParallelism: false,
    globals: false,
    exclude: ["./build", "./node_modules"],
    include: ["./**/*.test.{ts,tsx}"],
    pool: "forks",
    setupFiles: "./test/helpers/setup.ts",
    testTimeout: 10000, // 10 seconds for E2E tests with browser interaction
    hookTimeout: 10000, // 10 seconds for beforeAll/afterAll (server + browser startup)
    teardownTimeout: 1000,
    hideSkippedTests: true,
    reporters: process.env.GITHUB_ACTIONS ? ["github-actions"] : ["verbose"],
    bail: 3,
    onStackTrace(error: ErrorWithDiff, { file }: ParsedStack) {
      // If we've encountered a ReferenceError, show the whole stack.
      if (error.name === "ReferenceError") return true;
      // Reject all frames from third party libraries.
      if (file.includes("node_modules")) return false;
    },
  },
});

declare global {
  namespace PlaywrightTest {
    interface Matchers<R> {
      toMatchScreenshot(): Promise<R>;
    }
  }
}
