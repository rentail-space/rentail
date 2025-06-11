import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("api/chat", "./api/chat.tsx"),
  route("demo", "./routes/demo.tsx"),
] satisfies RouteConfig;
