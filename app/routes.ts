import { index, type RouteConfig } from "@react-router/dev/routes";
import { flatRoutes } from "@react-router/fs-routes";

export default [
  index("routes/home/_index.tsx"),
  ...(await flatRoutes({
    ignoredRouteFiles: ["routes/home.tsx", "**/*.test.ts", "**/*.test.tsx"],
  })),
] satisfies RouteConfig;
