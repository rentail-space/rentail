import * as Sentry from "@sentry/react-router";
import { handleRequest } from "@vercel/react-router/entry.server";
import type {
  ActionFunctionArgs,
  EntryContext,
  LoaderFunctionArgs,
} from "react-router";
import { v7 as uuidv7 } from "uuid";
import envVars from "~/lib/env";
import msw from "~/test/mocks/mswHandlers";
import { trackBotVisit } from "./lib/middleware/botTracking";

// Only enable Sentry in production
if (envVars.isProduction) {
  Sentry.init({
    dsn: "https://gkbTW4mifBshCeYcJiZDRH3s@s1693597.eu-nbg-2.betterstackdata.com/1693597",
    enableLogs: true,
    environment: "production",
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

// Initialize MSW in test mode (on the server side)
if (envVars.isTest) msw();

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
    const start = Date.now();
    console.info("%s %s", request.method, request.url);

    trackBotVisit(request); // NOTE: run asynchronously
    const response = await handleRequest(
      request,
      responseStatusCode,
      responseHeaders,
      routerContext,
      loadContext,
      { nonce: uuidv7() },
    );
    waitForResponse(response, start).then((duration) => {
      console.info(
        "%s %s => %d (%dms)",
        request.method,
        request.url,
        response.status,
        duration,
      );
    });
    return response;
  },
);

async function waitForResponse(response: Response, start: number) {
  const reader = response.clone().body?.getReader();
  if (reader) {
    while (true) {
      const { done } = await reader.read();
      if (done) break;
    }
  }
  return Date.now() - start;
}

export function handleDataRequest(
  response: Response,
  { request }: LoaderFunctionArgs | ActionFunctionArgs,
) {
  const start = Date.now();
  console.info("%s %s", request.method, request.url);
  waitForResponse(response, start).then((duration) => {
    console.info(
      "%s %s => %d (%dms)",
      request.method,
      request.url,
      response.status,
      duration,
    );
  });
  return response;
}

export function handleError(
  error: unknown,
  { request }: LoaderFunctionArgs | ActionFunctionArgs,
) {
  if (!request.signal.aborted) {
    Sentry.captureException(error, { extra: { request } });
    console.error(error);
  }
}
