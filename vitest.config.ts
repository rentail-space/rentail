import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./test/setup.ts"],
    include: ["./app/**/*.test.{ts,tsx}"],
    exclude: ["./app/build", "./app/node_modules"],
    browser: {
      screenshotDirectory: "./__screenshots__",
    },
  },
});
