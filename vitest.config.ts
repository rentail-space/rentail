import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

process.env.NODE_ENV = "test";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    browser: { screenshotDirectory: "./__screenshots__" },
    exclude: ["./build", "./node_modules"],
    fileParallelism: false,
    globals: true,
    include: ["./**/*.test.{ts,tsx}"],
    pool: "forks",
    setupFiles: ["./test/helpers/setup.ts"],
    testTimeout: 10000, // 10 seconds for E2E tests with browser interaction
    hookTimeout: 10000, // 10 seconds for beforeAll/afterAll (server + browser startup)
    teardownTimeout: 1000,
    silent: "passed-only",
    hideSkippedTests: true,
  },
});

declare global {
  namespace PlaywrightTest {
    interface Matchers<R> {
      toMatchScreenshot(): Promise<R>;
    }
  }
}
