import {
  type RouteConfig,
  index,
  prefix,
  route,
} from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("demo", "routes/demo.tsx"),
  ...prefix("api", [route("chat", "routes/api/chat.tsx")]),
] satisfies RouteConfig;
