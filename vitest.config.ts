import tsconfigPaths from "vite-tsconfig-paths";
import type { ParsedStack } from "vitest";
import { defineConfig } from "vitest/config";

process.env.NODE_ENV = "test";

export default defineConfig({
  build: {
    sourcemap: false, // Disable source maps in tests to save memory
  },
  plugins: [tsconfigPaths()],
  esbuild: {
    // Reduce memory usage for esbuild transformations
    logLevel: "error",
  },
  test: {
    bail: 3, // Stop after 3 failing tests
    browser: { screenshotDirectory: "__screenshots__" },
    exclude: ["build", "node_modules"],
    fileParallelism: false,
    globals: false,
    hideSkippedTests: false,
    maxConcurrency: 1, // Run tests sequentially to reduce memory pressure
    maxWorkers: 1, // Use only 1 worker to minimize memory usage
    hookTimeout: 30_000, // 30 seconds for beforeAll/afterAll (server + browser startup)
    include: ["test/**/*.test.{ts,tsx}"],
    isolate: true, // NOTE: isolation required for test safety
    onStackTrace,
    pool: "forks",
    reporters: [
      process.env.GITHUB_ACTIONS ? "github-actions" : "verbose",
      "hanging-process",
    ],
    setupFiles: "test/helpers/testSuiteSetup.ts",
    globalSetup: "test/helpers/globalSetup.ts",
    teardownTimeout: 3_000, // 3 seconds - Prisma disconnect will timeout anyway on macOS
    testTimeout: process.env.CI ? 30_000 : 15_000, // 15s locally, 30s on CI
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
