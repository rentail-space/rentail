import debug from "debug";
import type { Route } from "../../+types/root";
import logtail from "../logger.server";

const logging = debug("server").enabled;

const loggingMiddleware: Route.MiddlewareFunction = async (
  { request },
  next,
) => {
  const start = Date.now();
  const { method } = request;
  const { pathname } = new URL(request.url);
  const referrer = request.headers.get("Referer") ?? "";

  if (logging) console.info("%s %s", method, pathname);

  // Call next middleware/loader
  const response = await next();

  const duration = Date.now() - start;
  const status = response.status;
  if (response.status >= 500) {
    if (logging)
      console.error("%s %s => %d (%dms)", method, pathname, status, duration);
    logtail?.error("request", { duration, referrer, method, pathname, status });
    logtail?.flush();
  } else {
    if (logging)
      console.info("%s %s => %d (%dms)", method, pathname, status, duration);
    logtail?.info("request", { duration, referrer, method, pathname, status });
  }

  return response;
};

export default loggingMiddleware;
