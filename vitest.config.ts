import { resolve } from "node:path";
import type { ParsedStack } from "vitest";
import { defineConfig } from "vitest/config";

process.env.NODE_ENV = "test";

export default defineConfig({
  build: {
    sourcemap: false, // Disable source maps in tests to save memory
  },
  plugins: [],
  logLevel: process.env.CI ? "error" : "warn", // Only show errors in CI
  resolve: {
    alias: [
      { find: "~/test", replacement: resolve("test") },
      { find: "~", replacement: resolve("app") },
      {
        find: "prisma/generated/models",
        replacement: resolve("prisma/generated/models"),
      },
      {
        find: "prisma/generated",
        replacement: resolve("prisma/generated/client"),
      },
      { find: "+types", replacement: resolve(".react-router/types") },
    ],
  },

  test: {
    bail: 3, // Stop after 3 failing tests
    browser: { screenshotDirectory: "__screenshots__" },
    disableConsoleIntercept: !process.env.CI,
    exclude: ["test/conversations/**/*.ts"],
    execArgv: ["--max-old-space-size=3072"],
    fileParallelism: false,
    globalSetup: "test/helpers/globalSetup.ts",
    hookTimeout: 30_000, // 30 seconds for beforeAll/afterAll (server + browser startup)
    include: ["test/**/*.test.ts"],
    maxConcurrency: 1, // Run tests sequentially to reduce memory pressure
    maxWorkers: 1, // Use only 1 worker to minimize memory usage
    pool: "forks",
    printConsoleTrace: !process.env.CI,
    reporters: process.env.GITHUB_ACTIONS
      ? ["github-actions", "verbose"]
      : ["verbose"],
    setupFiles: "test/helpers/testSuiteSetup.ts",
    teardownTimeout: 5_000, // 5 seconds - Prisma disconnect will timeout anyway on macOS
    testTimeout: 30_000, // 30 seconds

    onConsoleLog: (log: string, type: "stdout" | "stderr") => {
      if (type === "stderr") process.stderr.write(log);
      else process.stdout.write(log);
    },

    onStackTrace: (error: { name?: string }, { file }: ParsedStack) => {
      // If we've encountered a ReferenceError, show the whole stack.
      if (error.name === "ReferenceError") return true;
      // Reject all frames from third party libraries.
      return !file.includes("node_modules");
    },
  },
});
