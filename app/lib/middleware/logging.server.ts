import type { Route } from "+types/app/+types/root";
import logtail from "~/lib/logger.server";
import debug from "debug";

const logger = debug("server");

const loggingMiddleware: Route.MiddlewareFunction = async (
  { request },
  next,
) => {
  const start = Date.now();
  const { method } = request;
  const { pathname } = new URL(request.url);
  const referrer = request.headers.get("referer") ?? "";

  logger("%s %s", method, pathname);

  // Call next middleware/loader
  const response = await next();

  const duration = Date.now() - start;
  const status = response.status;
  if (response.status >= 500) {
    logger("%s %s => %d (%dms)", method, pathname, status, duration);
    void logtail?.error("request", {
      duration,
      referrer,
      method,
      pathname,
      status,
    });
    void logtail?.flush();
  } else {
    logger("%s %s => %d (%dms)", method, pathname, status, duration);
    void logtail?.info("request", {
      duration,
      referrer,
      method,
      pathname,
      status,
    });
  }

  return response;
};

export default loggingMiddleware;
