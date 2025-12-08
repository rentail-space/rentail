import tsconfigPaths from "vite-tsconfig-paths";
import type { ParsedStack } from "vitest";
import { defineConfig } from "vitest/config";

process.env.NODE_ENV = "test";

export default defineConfig({
  plugins: [tsconfigPaths()],
  esbuild: {
    // Reduce memory usage for esbuild transformations
    logLevel: "error",
  },
  optimizeDeps: {
    // Reduce memory pressure during dependency optimization
    esbuildOptions: {
      // Target modern browsers to reduce transform work
      target: "es2022",
    },
  },
  test: {
    bail: process.env.CI ? 10 : 5,
    browser: { screenshotDirectory: "__screenshots__" },
    exclude: ["build", "node_modules"],
    fileParallelism: false,
    globals: false,
    hideSkippedTests: false,
    maxConcurrency: 1, // Run tests sequentially to reduce memory pressure
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
