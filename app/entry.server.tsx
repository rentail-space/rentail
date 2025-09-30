import { PassThrough } from "node:stream";
import { createReadableStreamFromReadable } from "@react-router/node";
import * as Sentry from "@sentry/react-router";
import { renderToPipeableStream } from "react-dom/server";
import type {
  ActionFunctionArgs,
  EntryContext,
  LoaderFunctionArgs,
} from "react-router";
import { ServerRouter } from "react-router";
import env from "./lib/env";
import logtail from "./lib/logger.server";
import "./lib/instrument.server";

if (env.SENTRY_DSN) {
  Sentry.init({
    dsn: env.SENTRY_DSN,
    enableLogs: true,
    environment: env.isProduction ? "production" : "development",
    integrations: [
      Sentry.consoleLoggingIntegration({ levels: ["log", "warn", "error"] }),
    ],
    tracesSampleRate: 1.0,
  });
}

if (env.isTest) {
  console.info("[MSW] Initializing MSW for test mode");
  // Initialize MSW in test mode
  const { default: server } = await import("../test/mocks/msw.server");
  server.listen({ onUnhandledRequest: "error" });
}

function handleRequest(
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
    const { pipe } = renderToPipeableStream(
      <ServerRouter context={entryContext} url={request.url} />,
      {
        onShellReady() {
          const body = new PassThrough();
          const stream = createReadableStreamFromReadable(body);
          responseHeaders.set("content-type", "text/html");
          responseHeaders.set("Document-Policy", "js-profiling");
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
          pipe(Sentry.getMetaTagTransformer(body));
        },
        onError(error: unknown) {
          Sentry.captureException(error);
          console.error(`[500] ${request.method} ${pathname}:`, error);
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
  });
}

export default Sentry.wrapSentryHandleRequest(handleRequest);

export function handleError(
  error: unknown,
  { request }: LoaderFunctionArgs | ActionFunctionArgs,
) {
  if (!request.signal.aborted) Sentry.captureException(error);
  console.error(error);
}
