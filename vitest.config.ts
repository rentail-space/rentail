import tsconfigPaths from "vite-tsconfig-paths";
import type { ParsedStack } from "vitest";
import { defineConfig } from "vitest/config";
import type { HTMLNode } from "./test/helpers/formatHTML";

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
    hookTimeout: 90_000, // 90 seconds for beforeAll/afterAll (server + browser startup)
    include: ["test/*.test.{ts,tsx}"],
    isolate: true, // NOTE: without isolation sometimes tests hang
    onStackTrace,
    pool: "forks",
    reporters: [
      process.env.GITHUB_ACTIONS ? "github-actions" : "verbose",
      "hanging-process",
    ],
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
      /**
       * Take a screenshot of the page and compare it to the baseline screenshot.
       *
       * @param options - The options for the matcher.
       * @param options.name - The name of the test.
       * @param options.tolerance - The tolerance for the matcher (default: 2.3).
       * @example
       * await expect(page).toMatchScreenshot();
       */
      toMatchScreenshot(options?: {
        name?: string;
        tolerance?: number;
      }): Promise<R>;

      /**
       * Takes the inner HTML of the page and compares it to the baseline HTML.
       *
       * @param options - The options for the matcher.
       * @param options.name - The name of the test.
       * @param options.strip - A function to strip the HTML of any unwanted content.
       * @example
       * await expect(page).toMatchInnerHTML();
       */
      toMatchInnerHTML(options?: {
        name?: string;
        strip?: (html: HTMLNode[]) => void;
      }): Promise<R>;
    }
  }
}
