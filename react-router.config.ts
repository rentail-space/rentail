import type { Config } from "@react-router/dev/config";

export default {
  // In React Router v8 the former `future.v8_*` flags were graduated:
  // - v8_splitRouteModules        → top-level `splitRouteModules` (default `true`)
  // - v8_middleware               → always enabled
  // - v8_viteEnvironmentApi       → always enabled
  // - v8_passThroughRequests      → default behavior
  // - v8_trailingSlashAwareDataRequests → default behavior
  splitRouteModules: true,
  prerender: async () => [],
  ssr: true,
} satisfies Config;
