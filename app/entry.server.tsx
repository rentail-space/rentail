import * as Sentry from "@sentry/react-router";
import { handleRequest } from "@vercel/react-router/entry.server";
import debug from "debug";
import type {
  ActionFunctionArgs,
  EntryContext,
  LoaderFunctionArgs,
} from "react-router";
import { v7 as uuidv7 } from "uuid";
import env from "~/lib/env";
import msw from "~/test/mocks/msw.server";

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
  msw.listen({ onUnhandledRequest: "error" });
}

export function getLoadContext() {
  return {};
}

export default Sentry.wrapSentryHandleRequest(
  async (
    request: Request,
    responseStatusCode: number,
    responseHeaders: Headers,
    routerContext: EntryContext,
    // biome-ignore lint/suspicious/noExplicitAny: Sentry wrapper requires flexible type
    loadContext?: any,
  ) => {
    const nonce = uuidv7();
    return await handleRequest(
      request,
      responseStatusCode,
      responseHeaders,
      routerContext,
      loadContext,
      { nonce },
    );
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
