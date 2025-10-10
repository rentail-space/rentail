import { reactRouter } from "@react-router/dev/vite";
import { sentryReactRouter } from "@sentry/react-router";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import devtoolsJson from "vite-plugin-devtools-json";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(async (config) => ({
  plugins: [
    tailwindcss(),
    reactRouter(),
    tsconfigPaths(),
    devtoolsJson(),
    sentryReactRouter({ telemetry: !!process.env.SENTRY_AUTH_TOKEN }, config),
  ],
  optimizeDeps: {
    include: ["react", "react-dom", "streamdown"],
  },
  ssr: { noExternal: ["streamdown"] },
}));
