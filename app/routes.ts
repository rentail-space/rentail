import { index, type RouteConfig } from "@react-router/dev/routes";
import { flatRoutes } from "@react-router/fs-routes";

export default [
  ...(await flatRoutes({
    ignoredRouteFiles: ["routes/home", "**/*.test.ts", "**/*.test.tsx"],
  })),
  index("routes/home/route.tsx"),
] satisfies RouteConfig;
