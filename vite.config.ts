import { execSync } from "node:child_process";
import { resolve } from "node:path";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite-plus";
import devtoolsJson from "vite-plugin-devtools-json";

/**
 * Load secrets from Infisical into a flat env object for Vitest.
 * Falls back gracefully if Infisical CLI is unavailable or
 * unauthenticated — tests will use whatever is already in process.env.
 */
function loadInfisicalEnv(): Record<string, string> {
  try {
    const raw = execSync(
      "infisical export --env test --format dotenv-export --silent",
      { encoding: "utf-8", timeout: 10_000 },
    );
    const secrets: Record<string, string> = {};
    for (const line of raw.split("\n")) {
      const match = line.match(
        /^export\s+(\w+)=('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|[^\s]+)/,
      );
      if (match) {
        let value = match[2];
        // Strip surrounding quotes (single or double)
        if (
          (value.startsWith("'") && value.endsWith("'")) ||
          (value.startsWith('"') && value.endsWith('"'))
        ) {
          value = value.slice(1, -1);
        }
        secrets[match[1]] = value;
      }
    }
    return secrets;
  } catch {
    console.warn(
      "Infisical: unable to load secrets — falling back to process.env",
    );
    return {};
  }
}

export default defineConfig({
  staged: {
    "*": "vp check --fix",
  },
  fmt: {
    ignorePatterns: [
      ".claude/**",
      ".cursor/**",
      ".devtools/**",
      ".git/**",
      ".github/**",
      ".opencode/**",
      ".react-router/**",
      ".vscode/**",
      "__screenshots__/**",
      "build/**",
      "node_modules/**",
      "prisma/backup.sql",
      "prisma/generated/**",
      "prisma/seed/**",
    ],
    printWidth: 80,
    tabWidth: 2,
    singleQuote: false,
    semi: true,
  },
  lint: {
    ignorePatterns: [
      ".claude/**",
      ".cursor/**",
      ".devtools/**",
      ".git/**",
      ".github/**",
      ".opencode/**",
      ".react-router/**",
      ".vscode/**",
      "__screenshots__/**",
      "build/**",
      "node_modules/**",
      "prisma/backup.sql",
      "prisma/generated/**",
      "prisma/seed/**",
    ],
    options: {
      reportUnusedDisableDirectives: "warn",
      typeAware: true,
      typeCheck: true,
    },
    rules: {
      "no-console": ["error", { allow: ["assert", "error", "info", "warn"] }],
      "oxc/no-barrel-file": "warn",
      "react-hooks/exhaustive-deps": "warn",
      "react-hooks/rules-of-hooks": "error",
      "react/no-danger": "error",
      "typescript/no-explicit-any": "warn",
      "typescript/no-unsafe-declaration-merging": "error",
      "unicorn/no-array-for-each": "warn",
      "unicorn/prefer-array-flat-map": "error",
    },
  },

  test: {
    bail: 3, // Stop after 3 failing tests
    browser: { screenshotDirectory: "__screenshots__" },
    disableConsoleIntercept: !process.env.CI,
    // Secrets from Infisical; process.env takes precedence so overrides
    // via the CLI or .env files still work.
    env: { ...loadInfisicalEnv(), ...process.env },
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
  },

  plugins: [tailwindcss(), reactRouter(), devtoolsJson()],
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
  optimizeDeps: {
    include: ["react", "react-dom", "streamdown", "rehype-harden"],
  },
  ssr: {
    noExternal: [
      // NOTE: recommended by the Streamdown docs
      // @see https://streamdown.ai/docs/faq#why-do-i-get-a-css-loading-error-when-using-streamdown-with-vite-ssr
      "streamdown",
      // NOTE: without rehype-harden here we get "Cannot require() ES Module in a cycle."
      "rehype-harden",
    ],
  },
  server: {
    allowedHosts: [".ngrok-free.app"],
  },
});
