import { PassThrough } from "node:stream";
import { createReadableStreamFromReadable } from "@react-router/node";
import * as Sentry from "@sentry/react";
import { renderToPipeableStream } from "react-dom/server";
import type { EntryContext } from "react-router";
import { ServerRouter } from "react-router";
import "./lib/logger.server";

const sentryDsn = process.env.SENTRY_DSN;
if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    environment: process.env.NODE_ENV || "development",
    tracesSampleRate: 1.0,
  });
}

const ABORT_DELAY = 5_000;

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

          resolve(response);
          pipe(body);
        },
        onShellError(error: unknown) {
          Sentry.captureException(error);
          const duration = Date.now() - startTime;
          console.error(
            `${request.method} ${pathname} - ERROR - ${duration}ms`,
            error,
          );
          reject(error);
        },
        onError(error: unknown) {
          Sentry.captureException(error);
          statusCode = 500;
          if (shellRendered) console.error(error);
        },
      },
    );

    setTimeout(abort, ABORT_DELAY);
  });
}
