import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./test/setup.ts"],
    include: ["./**/*.test.{ts,tsx}"],
    exclude: ["./build", "./node_modules"],
    browser: {
      screenshotDirectory: "./__screenshots__",
    },
  },
});

interface CustomMatchers<R = unknown> {
  toMatchScreenshot: () => Promise<R>;
}

declare module "vitest" {
  interface Matchers<T> extends CustomMatchers<T> {}
}
