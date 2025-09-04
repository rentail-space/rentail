import { reactRouter } from "@react-router/dev/vite";
import {
  type SentryReactRouterBuildOptions,
  sentryReactRouter,
} from "@sentry/react-router";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import devtoolsJson from "vite-plugin-devtools-json";
import tsconfigPaths from "vite-tsconfig-paths";

const sentryConfig: SentryReactRouterBuildOptions | undefined = process.env
  .SENTRY_AUTH_TOKEN
  ? {
      authToken: process.env.SENTRY_AUTH_TOKEN,
      org: "labnotes",
      project: "rentail",
    }
  : undefined;

export default defineConfig((config) => ({
  plugins: [
    tailwindcss(),
    reactRouter(),
    tsconfigPaths(),
    sentryConfig ? sentryReactRouter(sentryConfig, config) : devtoolsJson(),
  ],
  ssr: { noExternal: ["streamdown"] },
}));
