import type { Config } from "@react-router/dev/config";
import { sentryOnBuildEnd } from "@sentry/react-router";

export default {
  ssr: true,
  prerender: false,
  ...(process.env.SENTRY_AUTH_TOKEN
    ? {
        buildEnd: async ({ viteConfig, reactRouterConfig, buildManifest }) => {
          await sentryOnBuildEnd({
            buildManifest,
            reactRouterConfig,
            viteConfig,
          });
        },
      }
    : null),
} satisfies Config;
