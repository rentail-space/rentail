import * as Sentry from "@sentry/react-router";
import { createReadableStreamFromReadable } from "@react-router/node";
import debug from "debug";
import { PassThrough } from "node:stream";
import { renderToPipeableStream } from "react-dom/server";
import type {
  ActionFunctionArgs,
  AppLoadContext,
  EntryContext,
  LoaderFunctionArgs,
} from "react-router";
import { RouterContextProvider, ServerRouter } from "react-router";
import env from "~/lib/env";
import "~/lib/instrument.server";

if (env.SENTRY_DSN) {
  Sentry.init({
    dsn: env.SENTRY_DSN,
    enableLogs: true,
    environment: env.isProduction ? "production" : "development",
    integrations: [
      Sentry.consoleLoggingIntegration({ levels: ["log", "warn", "error"] }),
      Sentry.anthropicAIIntegration({
        recordInputs: true,
        recordOutputs: true,
      }),
      Sentry.vercelAIIntegration({ recordInputs: true, recordOutputs: true }),
    ],
    tracesSampleRate: 1.0,
  });
}

if (env.isTest) {
  debug("msw")("Initializing MSW for test mode");

  // Initialize MSW in test mode
  const { default: server } = await import("~/test/mocks/msw.server");
  server.listen({ onUnhandledRequest: "error" });
}

export function getLoadContext() {
  return new RouterContextProvider();
}

export default Sentry.wrapSentryHandleRequest(
  (
    request: Request,
    responseStatusCode: number,
    responseHeaders: Headers,
    routerContext: EntryContext,
    loadContext: RouterContextProvider | AppLoadContext,
  ) => {
    return new Promise((resolve, reject) => {
      const { pipe } = renderToPipeableStream(
        <ServerRouter context={routerContext} url={request.url} />,
        {
          onShellReady() {
            responseHeaders.set("Content-Type", "text/html");
            responseHeaders.set("Document-Policy", "js-profiling");

            const body = new PassThrough();
            const stream = createReadableStreamFromReadable(body);

            resolve(
              new Response(stream, {
                headers: responseHeaders,
                status: responseStatusCode,
              }),
            );

            pipe(body);
          },
          onShellError(error: unknown) {
            reject(error);
          },
        },
      );
    });
  },
);

export function handleError(
  error: unknown,
  { request }: LoaderFunctionArgs | ActionFunctionArgs,
) {
  if (!request.signal.aborted) {
    Sentry.captureException(error, { extra: { request } });
    console.error(error);
  }
}
