import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

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
    testTimeout: 30000, // 30 seconds for E2E tests with browser launches
  },
});

declare global {
  namespace PlaywrightTest {
    interface Matchers<R> {
      toMatchScreenshot(): Promise<R>;
    }
  }
}
