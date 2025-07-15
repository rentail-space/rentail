import { reactRouter } from "@react-router/dev/vite";
import { sentryVitePlugin } from "@sentry/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import devtoolsJson from "vite-plugin-devtools-json";
import tsconfigPaths from "vite-tsconfig-paths";

const sentryVite =
  process.env.SENTRY_AUTH_TOKEN &&
  sentryVitePlugin({
    authToken: process.env.SENTRY_AUTH_TOKEN,
    org: "labnotes",
    project: "rentail",
  });

export default defineConfig({
  plugins: [
    tailwindcss(),
    reactRouter(),
    tsconfigPaths(),
    ...(process.env.NODE_ENV === "production"
      ? [sentryVite].filter(Boolean)
      : [devtoolsJson()]),
  ],
});
