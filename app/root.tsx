import * as Sentry from "@sentry/react";
import { useEffect } from "react";
import {
  Links,
  type LinksFunction,
  Meta,
  type MetaFunction,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "react-router";
import "./app.css";
import ErrorBoundary from "./components/ErrorBoundary";

export async function loader() {
  return {
    ENV: {
      SENTRY_DSN: process.env.SENTRY_DSN || null,
      NODE_ENV: process.env.NODE_ENV || "development",
    },
  };
}

export const links: LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
  { rel: "canonical", href: "https://rentail.space/" },
];

export const meta: MetaFunction = () => [
  {
    title: "rentail.space",
    description:
      "Find perfect specialty retail spaces for short-term leases. Connect with shopping centers nationwide through rentail.space - your marketplace for pop-up shops and seasonal retail opportunities.",
  },
  {
    property: "og:title",
    content: "Find your speciality lease with ease - rentail.space",
  },
  {
    property: "og:description",
    content:
      "Discover specialty retail spaces for short-term leases. Connect with shopping centers nationwide.",
  },
  {
    property: "og:image",
    content: "https://rentail.space/og-image.jpg",
  },
  {
    property: "og:url",
    content: "https://rentail.space/",
  },
  { property: "og:type", content: "website" },
  { name: "robots", content: "index, follow" },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const { ENV } = useLoaderData<typeof loader>();

  useEffect(() => {
    if (ENV.SENTRY_DSN) {
      Sentry.init({
        dsn: ENV.SENTRY_DSN,
        environment: ENV.NODE_ENV || "development",
        tracesSampleRate: 1.0,
        replaysSessionSampleRate: 0.1,
        replaysOnErrorSampleRate: 1.0,
      });
    }
  }, [ENV]);

  return (
    <ErrorBoundary>
      <Outlet />
    </ErrorBoundary>
  );
}
