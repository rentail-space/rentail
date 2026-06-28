import { execSync } from "node:child_process";
import { resolve } from "node:path";
import type { Connect } from "vite-plus";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite-plus";

/**
 * Vite middleware that forces no-cache on every response.
 *
 * Safari bfcache (back/forward cache) and HTTP cache both aggressively
 * retain JavaScript modules. Even with Cache-Control headers on the
 * document, Safari will serve stale transformed modules from its cache.
 * This middleware runs at the Connect level, before Vite's own layer,
 * and stamps every response with kill-cache headers.
 *
 * The `Surrogate-Control` header is respected by Safari where plain
 * `Cache-Control` is sometimes ignored for modulepreload resources.
 */
function noCachePlugin(): import("vite-plus").Plugin {
  return {
    name: "no-cache",
    configureServer(server) {
      server.middlewares.use(
        (
          _req: Connect.IncomingMessage,
          res: import("http").ServerResponse,
          next: Connect.NextFunction,
        ) => {
          res.setHeader(
            "Cache-Control",
            "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
          );
          res.setHeader("Pragma", "no-cache");
          res.setHeader("Expires", "0");
          res.setHeader("Surrogate-Control", "no-store");
          next();
        },
      );
    },
  };
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
      // tsgolint (oxc's typescript-go backend) overflows its recursion limit
      // on this file's complex `defineConfig`/`Plugin` generics, producing
      // false-positive "Excessive stack depth" errors. tsc 6.0.3 type-checks
      // it cleanly. Re-enable once tsgolint handles the recursion.
      "vite.config.ts",
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
    // Fetch secrets via Infisical REST API (Machine Identity) or fall back to process.env.
    // Uses a sync helper script because vite config is evaluated synchronously.
    env: (() => {
      try {
        const raw = execSync("node scripts/fetch-infisical-secrets.mjs", {
          encoding: "utf-8",
          timeout: 10_000,
          stdio: ["pipe", "pipe", "pipe"],
        });
        const env: Record<string, string> = {};
        for (const line of raw.split("\n")) {
          const match = line.match(/^export\s+(\w+)=(.*)$/);
          if (match) env[match[1]] = match[2];
        }
        return { ...env, ...process.env };
      } catch {
        // Infisical credentials not configured — use process.env only
        return { ...process.env };
      }
    })(),
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

  plugins: [noCachePlugin(), tailwindcss(), reactRouter()],
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
