import type { Route } from "../../+types/root";

const loggingMiddleware: Route.MiddlewareFunction = async (
  { request },
  next,
) => {
  const start = Date.now();
  const { method } = request;
  const { pathname } = new URL(request.url);

  console.info(`[SERVER] ${method} ${pathname}`);

  // Call next middleware/loader
  const response = await next();

  const duration = Date.now() - start;
  const status = response.status;

  console.info(`[SERVER] ${method} ${pathname} => ${status} (${duration}ms)`);

  return response;
};

export default loggingMiddleware;
