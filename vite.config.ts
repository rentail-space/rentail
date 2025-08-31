import { reactRouter } from "@react-router/dev/vite";
import { sentryVitePlugin } from "@sentry/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import devtoolsJson from "vite-plugin-devtools-json";
import tsconfigPaths from "vite-tsconfig-paths";

const SENTRY_AUTH_TOKEN =
  "***REMOVED***";

export default defineConfig({
  plugins: [
    tailwindcss(),
    reactRouter(),
    tsconfigPaths(),
    process.env.NODE_ENV === "production"
      ? sentryVitePlugin({
          authToken: SENTRY_AUTH_TOKEN,
          org: "labnotes",
          project: "rentail",
        })
      : devtoolsJson(),
  ],
  ssr: {
    noExternal: ["streamdown"],
  },
});
