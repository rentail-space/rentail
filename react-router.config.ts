import type { Config } from "@react-router/dev/config";
import { sentryOnBuildEnd } from "@sentry/react-router";

export default {
  buildEnd: process.env.SENTRY_AUTH_TOKEN ? sentryOnBuildEnd : undefined,
  ssr: true,
  prerender: process.env.NODE_ENV === "production",
} satisfies Config;
