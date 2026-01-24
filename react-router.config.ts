import type { Config } from "@react-router/dev/config";
import { sentryOnBuildEnd } from "@sentry/react-router";
import { vercelPreset } from "@vercel/react-router/vite";

export default {
  buildEnd: sentryOnBuildEnd,
  future: {},
  prerender: async () => [],
  presets: [vercelPreset()],
  ssr: true,
} satisfies Config;
