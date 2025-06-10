import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
	index("routes/home.tsx"),
	route("chat", "./routes/chat.tsx"),
	route("demo", "./routes/demo.tsx"),
] satisfies RouteConfig;
