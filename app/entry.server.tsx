import { PassThrough } from "node:stream";
import { createReadableStreamFromReadable } from "@react-router/node";
import * as Sentry from "@sentry/react";
import { renderToPipeableStream } from "react-dom/server";
import type { EntryContext } from "react-router";
import { ServerRouter } from "react-router";
import serverConfig from "./lib/config";
import { pushHTTPResponse, pushProcessMetrics } from "./lib/instrument.server";
import logtail from "./lib/logger.server";

if (serverConfig.SENTRY_DSN) {
  Sentry.init({
    dsn: serverConfig.SENTRY_DSN,
    environment: serverConfig.isProduction ? "production" : "development",
    tracesSampleRate: 1.0,
  });
}

// Start metrics collection with proper cleanup
const metricsInterval = setInterval(
  async () => pushProcessMetrics(),
  serverConfig.METRICS_COLLECTION_INTERVAL_MS,
);

// Cleanup function to clear the interval
const cleanup = () => {
  if (metricsInterval) {
    clearInterval(metricsInterval);
  }
};

// Handle graceful shutdown
process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);
process.on("exit", cleanup);

export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  entryContext: EntryContext,
) {
  let statusCode = responseStatusCode || 200;

  // Log the incoming request
  const startTime = Date.now();
  const { pathname } = new URL(request.url);
  return new Promise<Response>((resolve, reject) => {
    let shellRendered = false;
    const { pipe, abort } = renderToPipeableStream(
      <ServerRouter context={entryContext} url={request.url} />,
      {
        onShellReady() {
          shellRendered = true;
          const body = new PassThrough();
          const stream = createReadableStreamFromReadable(body);
          responseHeaders.set("content-type", "text/html");
          const response = new Response(stream, {
            headers: responseHeaders,
            status: statusCode,
          });

          // Log the response
          const duration = Date.now() - startTime;
          console.info(
            `${request.method} ${pathname} - ${statusCode} - ${duration}ms`,
          );
          logtail.info("request", {
            duration: duration.toString(),
            referrer: request.headers.get("Referer") ?? "",
            request_method: request.method,
            request_path: pathname,
            response_status: statusCode.toString(),
          });
          // Add metrics
          pushHTTPResponse({ request, statusCode, duration });

          resolve(response);
          pipe(body);
        },
        onShellError(error: unknown) {
          Sentry.captureException(error);
          console.error(error);
          reject(error);
        },
        onError(error: unknown) {
          Sentry.captureException(error);
          const duration = Date.now() - startTime;
          if (shellRendered)
            console.error(
              `${request.method} ${pathname} - ERROR - ${duration}ms`,
              error,
            );
          logtail.flush();
          pushHTTPResponse({ request, statusCode: 500, duration });
          statusCode = 500;
        },
      },
    );

    setTimeout(abort, serverConfig.SSR_REQUEST_TIMEOUT_MS);
  });
}
