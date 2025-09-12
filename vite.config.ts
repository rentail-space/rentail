import { reactRouter } from "@react-router/dev/vite";
import { sentryReactRouter } from "@sentry/react-router";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import devtoolsJson from "vite-plugin-devtools-json";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig((config) => ({
  plugins: [
    tailwindcss(),
    reactRouter(),
    tsconfigPaths(),
    process.env.SENTRY_AUTH_TOKEN
      ? sentryReactRouter(
          {
            authToken: process.env.SENTRY_AUTH_TOKEN,
            org: "labnotes",
            project: "rentail",
          },
          config,
        )
      : devtoolsJson(),
  ],
  ssr: { noExternal: ["streamdown"] },
}));
