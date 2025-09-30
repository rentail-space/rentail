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
import { Toaster } from "sonner";
import ErrorBoundary from "./components/ErrorBoundary";
import schema from "./data/schema.json";
import env from "./lib/env";

export async function loader() {
  return {
    ENV: {
      NODE_ENV: env.isProduction ? "production" : "development",
      SENTRY_DSN: env.SENTRY_DSN,
    },
  };
}

const description =
  "Discover short-term retail spaces and pop-up shop opportunities nationwide: seasonal retail, temporary stores, and unique business concepts.";
const title = "rentail.space — Find your specialty lease with ease";
const url = "https://rentail.space/";

export const meta: MetaFunction<typeof loader> = () => {
  return [
    { title: title },

    // Google / Search Engine Tags
    { itemProp: "description", content: description },
    { itemProp: "image", content: `${url}/og-image.png` },
    { itemProp: "name", content: title },

    // Facebook Meta Tags
    { property: "og:description", content: description },
    { property: "og:image", content: `${url}/og-image.png` },
    { property: "og:title", content: title },
    { property: "og:type", content: "website" },
    { property: "og:url", content: url },
    { property: "og:site_name", content: "Rentail Space" },
    { property: "og:locale", content: "en_US" },

    // Twitter Meta Tags
    { property: "twitter:card", content: "summary_large_image" },
    { property: "twitter:description", content: description },
    { property: "twitter:image", content: `${url}/og-image.png` },
    { property: "twitter:title", content: title },
    { property: "twitter:url", content: url },
  ];
};

export const links: LinksFunction = () => [
  { href: "/favicon.ico", rel: "icon", type: "image/x-icon", sizes: "any" },
  { href: "/favicon.svg", rel: "icon", type: "image/svg+xml", sizes: "any" },
  { href: "/site.webmanifest", rel: "manifest" },
  { href: "/apple-touch-icon.png", rel: "apple-touch-icon", sizes: "180x180" },
  {
    href: "/android-chrome-512x512.png",
    rel: "icon",
    type: "image/png",
    sizes: "512x512",
  },
  {
    href: "/android-chrome-192x192.png",
    rel: "icon",
    type: "image/png",
    sizes: "192x192",
  },
  {
    href: "/favicon-96x96.png",
    rel: "icon",
    type: "image/png",
    sizes: "96x96",
  },
  {
    href: "/favicon-32x32.png",
    rel: "icon",
    type: "image/png",
    sizes: "32x32",
  },
  {
    href: "/favicon-16x16.png",
    rel: "icon",
    type: "image/png",
    sizes: "16x16",
  },
  {
    href: "/humans.txt",
    rel: "author",
    type: "text/plain",
  },
  {
    href: "/blog/feed",
    rel: "alternate",
    title: "Rentail Blog",
    type: "application/atom+xml",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const fromLoader = useLoaderData<typeof loader | undefined>();
  useEffect(() => ReactGA.initialize("G-HLE5G8GC5Y"), []);
  const location = useLocation();
  useEffect(() => {
    if (fromLoader?.ENV.NODE_ENV === "production")
      ReactGA.send({ hitType: "pageview", page: location.pathname });
  }, [location.pathname, fromLoader?.ENV.NODE_ENV]);
  const canonicalUrl = `https://rentail.space${location.pathname}`;

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content={description} />
        <meta
          name="keywords"
          content="pop-up retail space, pop-up shop space for rent, seasonal retail space, shopping center kiosk rental, short term retail lease, specialty lease, temporary retail space rental"
        />
        <meta name="author" content="rentail.space" />
        <meta name="theme-color" content="#2563eb" />
        <meta
          name="robots"
          content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
        />
        {/* Touch web app title */}
        <meta name="application-name" content="rentail.space" />
        <meta name="apple-mobile-web-app-title" content="rentail.space" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="canonical" href={canonicalUrl} />
        <Meta />
        <Links />
        <script type="application/ld+json">{JSON.stringify(schema)}</script>
      </head>
      <body>
        <NuqsAdapter>{children}</NuqsAdapter>
        <Toaster richColors />

        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

import { NuqsAdapter } from "nuqs/adapters/react-router/v7";

export default function App() {
  return (
    <ErrorBoundary>
      <Outlet />
    </ErrorBoundary>
  );
}

export function HydrateFallback() {
  return (
    <div className="flex flex-col gap-4 h-screen w-screen items-center justify-center">
      <div className="flex flex-col items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-blue-600 rounded-full border-t-transparent" />
      </div>
      <p className="text-sm text-gray-500">Loading, please wait...</p>
    </div>
  );
}
