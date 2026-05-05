import * as Sentry from "@sentry/react-router";
import { StrictMode, startTransition } from "react";
import { hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";

const SENTRY_DSN =
  "https://gkbTW4mifBshCeYcJiZDRH3s@s1693597.eu-nbg-2.betterstackdata.com/1693597";

// Only enable Sentry in production build with valid DSN
if (import.meta.env.PROD && SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: "production",
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.browserProfilingIntegration(),
    ],
    replaysOnErrorSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,
    sendDefaultPii: true,
    tracesSampleRate: 1.0,
  });
}

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <HydratedRouter />
    </StrictMode>,
  );
});
