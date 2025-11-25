import type { Config } from "@react-router/dev/config";
import { sentryOnBuildEnd } from "@sentry/react-router";
import { vercelPreset } from "@vercel/react-router/vite";

export default {
  future: {
    v8_middleware: true,
  },
  buildEnd: process.env.SENTRY_AUTH_TOKEN ? sentryOnBuildEnd : undefined,
  prerender: async () => [],
  presets: [vercelPreset()],
  ssr: true,
} satisfies Config;
