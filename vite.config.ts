import { reactRouter } from "@react-router/dev/vite";
import {
  type SentryReactRouterBuildOptions,
  sentryReactRouter,
} from "@sentry/react-router";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import devtoolsJson from "vite-plugin-devtools-json";
import tsconfigPaths from "vite-tsconfig-paths";

const sentryConfig: SentryReactRouterBuildOptions = {
  authToken: process.env.SENTRY_AUTH_TOKEN,
  org: "labnotes",
  project: "rentail",
};

export default defineConfig((config) => ({
  plugins: [
    tailwindcss(),
    reactRouter(),
    tsconfigPaths(),
    process.env.NODE_ENV === "production"
      ? sentryReactRouter(sentryConfig, config)
      : devtoolsJson(),
  ],
  ssr: { noExternal: ["streamdown"] },
}));
