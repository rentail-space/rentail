import type { Config } from "@react-router/dev/config";
import { sentryOnBuildEnd } from "@sentry/react-router";

export default {
  buildEnd: process.env.SENTRY_AUTH_TOKEN ? sentryOnBuildEnd : undefined,
  future: {
    v8_middleware: true,
  },
  prerender: async () => {
    return [];
  },
  ssr: true,
} satisfies Config;
