import type { Config } from "@react-router/dev/config";
import { sentryOnBuildEnd } from "@sentry/react-router";

export default {
  ssr: true,
  prerender: false,
  buildEnd: async ({ viteConfig, reactRouterConfig, buildManifest }) => {
    +(await sentryOnBuildEnd({ viteConfig, reactRouterConfig, buildManifest }));
  },
} satisfies Config;
