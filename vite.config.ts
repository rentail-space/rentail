import { defineConfig } from "vite-plus";
import { reactRouter } from "@react-router/dev/vite";
import { sentryReactRouter } from "@sentry/react-router";
import devtoolsJson from "vite-plugin-devtools-json";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "node:path";

const sentryReleaseName =
  process.env.SENTRY_RELEASE ??
  process.env.VERCEL_GIT_COMMIT_SHA ??
  process.env.GITHUB_SHA;

const sentryConfig = {
  authToken: process.env.SENTRY_AUTH_TOKEN,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  release: {
    name: sentryReleaseName,
  },
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN || !sentryReleaseName,
  },
};

export default defineConfig((config) => ({
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
      ".vercel/**",
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
      ".vercel/**",
      ".vscode/**",
      "__screenshots__/**",
      "build/**",
      "node_modules/**",
      "prisma/backup.sql",
      "prisma/generated/**",
      "prisma/seed/**",
    ],
    options: {
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
  plugins: [
    tailwindcss(),
    reactRouter(),
    sentryReactRouter(sentryConfig, config),
    devtoolsJson(),
  ],
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
}));
