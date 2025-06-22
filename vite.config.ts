import { reactRouter } from "@react-router/dev/vite";
import { sentryVitePlugin } from "@sentry/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import env from "env-var";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    tailwindcss(),
    reactRouter(),
    tsconfigPaths(),
    ...(process.env.NODE_ENV === "production"
      ? [
          sentryVitePlugin({
            authToken: env.get("SENTRY_AUTH_TOKEN").asString(),
            org: "labnotes",
            project: "rentail",
          }),
        ]
      : []),
  ],
});
