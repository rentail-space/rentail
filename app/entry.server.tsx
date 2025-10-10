import * as Sentry from "@sentry/react-router";
import { handleRequest } from "@vercel/react-router/entry.server";
import debug from "debug";
import type {
  ActionFunctionArgs,
  AppLoadContext,
  EntryContext,
  LoaderFunctionArgs,
} from "react-router";
import { RouterContextProvider } from "react-router";
import env from "~/lib/env";
import "~/lib/instrument.server";
import appContext from "~/context";

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
  const context = new RouterContextProvider();
  context.set(appContext, {});
  return context;
}

export default Sentry.wrapSentryHandleRequest(
  async (
    request: Request,
    responseStatusCode: number,
    responseHeaders: Headers,
    routerContext: EntryContext,
    loadContext: RouterContextProvider | AppLoadContext,
  ) => {
    const nonce = crypto.randomUUID();
    const response = await handleRequest(
      request,
      responseStatusCode,
      responseHeaders,
      routerContext,
      loadContext as AppLoadContext,
      { nonce },
    );
    response.headers.set("Document-Policy", "js-profiling");
    return response;
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
