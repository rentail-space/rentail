import { PassThrough } from "node:stream";
import { createReadableStreamFromReadable } from "@react-router/node";
import * as Sentry from "@sentry/react";
import { renderToPipeableStream } from "react-dom/server";
import type { EntryContext } from "react-router";
import { ServerRouter } from "react-router";
import serverConfig from "./lib/config";
import logtail from "./lib/logger.server";

if (serverConfig.SENTRY_DSN) {
  Sentry.init({
    dsn: serverConfig.SENTRY_DSN,
    environment: serverConfig.isProduction ? "production" : "development",
    tracesSampleRate: 1.0,
  });
}

// Initialize MSW in test mode
if (serverConfig.isTest) await import("../test/mocks/msw.server");

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
  return new Promise<Response>((resolve) => {
    const { pipe, abort } = renderToPipeableStream(
      <ServerRouter context={entryContext} url={request.url} />,
      {
        onShellReady() {
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
          logtail?.info("request", {
            duration: duration.toString(),
            referrer: request.headers.get("Referer") ?? "",
            request_method: request.method,
            request_path: pathname,
            response_status: statusCode.toString(),
          });

          resolve(response);
          pipe(body);
        },
        onError(error: unknown) {
          Sentry.captureException(error);
          const duration = Date.now() - startTime;
          logtail?.error("request", {
            duration: duration.toString(),
            error: error instanceof Error ? error.message : "Unknown error",
            request_method: request.method,
            request_path: pathname,
          });
          logtail?.flush();
          statusCode = 500;
        },
      },
    );

    setTimeout(abort, serverConfig.SSR_REQUEST_TIMEOUT_MS);
  });
}
