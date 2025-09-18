import type { Config } from "@react-router/dev/config";
import { sentryOnBuildEnd } from "@sentry/react-router";

export default {
  buildEnd: process.env.SENTRY_AUTH_TOKEN ? sentryOnBuildEnd : undefined,
  prerender: false,
  ssr: true,
} satisfies Config;
