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
    process.env.SENTRY_AUTH_TOKEN
      ? sentryReactRouter({ telemetry: true }, config)
      : undefined,
  ],
  optimizeDeps: {
    include: ["react", "react-dom", "streamdown"],
  },
  ssr: {
    noExternal: [
      // NOTE: recommended by the Streamdown docs
      "streamdown",
      // NOTE: without rehype-harden here we get "Cannot require() ES Module in a cycle."
      "rehype-harden",
    ],
  },
}));
