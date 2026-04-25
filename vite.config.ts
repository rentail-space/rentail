import { reactRouter } from "@react-router/dev/vite";
import { sentryReactRouter } from "@sentry/react-router";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite-plus";
import devtoolsJson from "vite-plugin-devtools-json";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  staged: {
    "*": "vp check --fix",
  },
  lint: {
    rules: {
      "oxc/no-barrel-file": "warn",
    },
  },
  plugins: [
    tailwindcss(),
    reactRouter(),
    tsconfigPaths(),
    devtoolsJson(),
    process.env.NODE_ENV === "production"
      ? sentryReactRouter({ telemetry: false })
      : undefined,
  ],
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
