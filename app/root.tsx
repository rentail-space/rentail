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
  useLocation,
} from "react-router";
import "./app.css";
import ReactGA from "react-ga4";
import ErrorBoundary from "./components/ErrorBoundary";
import serverConfig from "./lib/config";

export async function loader() {
  return {
    ENV: {
      SENTRY_DSN: serverConfig.SENTRY_DSN || null,
      NODE_ENV: serverConfig.isProduction ? "production" : "development",
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
  { rel: "canonical", href: url },
];

const url = "https://rentail.space/";
const title = "rentail.space — Find your specialty lease with ease";
const description =
  "Discover short-term retail spaces and pop-up shop opportunities in shopping centers nationwide. Connect with landlords offering specialty leases for seasonal retail, temporary stores, and unique business concepts.";

export const meta: MetaFunction = () => [
  {
    title,
  },
  {
    name: "description",
    content: description,
  },
  {
    name: "keywords",
    content: [
      "pop-up retail space",
      "pop-up shop space for rent",
      "seasonal retail space",
      "shopping center kiosk rental",
      "short term retail lease",
      "specialty lease",
      "temporary retail space rental",
    ],
  },
  { property: "og:title", content: title },
  { property: "og:description", content: description },
  { property: "og:image", content: `${url}/og-image.png` },
  { property: "og:url", content: url },
  { property: "og:type", content: "website" },
  { property: "og:site_name", content: "rentail.space" },
  { name: "twitter:card", content: "summary_large_image" },
  { name: "twitter:site", content: "@rentailspace" },
  { name: "twitter:creator", content: "@rentailspace" },
  { name: "twitter:title", content: title },
  { name: "twitter:description", content: description },
  { name: "twitter:image", content: `${url}/og-image.png` },
  { name: "robots", content: "index, follow" },
  { name: "author", content: "rentail.space" },
  { name: "theme-color", content: "#2563eb" },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "rentail.space",
    url,
    logo: `${url}/logo.png`,
    description:
      "Marketplace for specialty retail spaces and short-term leases. Connect businesses with shopping centers nationwide for pop-up shops and seasonal retail opportunities.",
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      areaServed: "US",
      availableLanguage: "en",
    },
    sameAs: ["https://twitter.com/rentailspace"],
    potentialAction: {
      "@type": "SearchAction",
      target: `${url}/chat?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  const { ENV } = useLoaderData<typeof loader>();
  useEffect(() => ReactGA.initialize("G-HLE5G8GC5Y"), []);
  const location = useLocation();
  useEffect(() => {
    if (ENV.NODE_ENV === "production")
      ReactGA.send({ hitType: "pageview", page: location.pathname });
  }, [location.pathname, ENV.NODE_ENV]);

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
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
    if (ENV.SENTRY_DSN && ENV.NODE_ENV === "production") {
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
