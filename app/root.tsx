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

    // Twitter Meta Tags
    { property: "twitter:card", content: "summary_large_image" },
    { property: "twitter:creator", content: "@rentailspace" },
    { property: "twitter:description", content: description },
    { property: "twitter:image", content: `${url}/og-image.png` },
    { property: "twitter:site", content: "@rentailspace" },
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
];

const structuredData = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "rentail.space",
    url,
    logo: `${url}/logo.png`,
    description:
      "Marketplace for specialty retail spaces and short-term leases. Connect businesses with shopping centers in Los Angeles for pop-up shops and seasonal retail opportunities.",
    address: {
      "@type": "PostalAddress",
      addressRegion: "CA",
      addressCountry: "US",
      addressLocality: "Los Angeles",
    },
    areaServed: {
      "@type": "GeoCircle",
      geoMidpoint: {
        "@type": "GeoCoordinates",
        latitude: 34.0522,
        longitude: -118.2437,
      },
      geoRadius: "50000",
    },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      areaServed: "Los Angeles, CA",
      availableLanguage: "en",
    },
    potentialAction: {
      "@type": "SearchAction",
      target: `${url}/chat?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${url}#the-grove`,
    name: "The Grove - Retail Space Rentals",
    address: {
      "@type": "PostalAddress",
      streetAddress: "189 The Grove Dr",
      addressLocality: "Los Angeles",
      addressRegion: "CA",
      postalCode: "90036",
      addressCountry: "US",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 34.0722,
      longitude: -118.3559,
    },
    telephone: "+1-555-RENTAIL",
    url: `${url}/chat`,
    description:
      "Specialty lease opportunities and short-term retail rentals at The Grove LA",
    priceRange: "$$",
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
        <meta name="robots" content="index, follow" />
        <Meta />
        <Links />
        {structuredData.map((data) => (
          <script key={data.name} type="application/ld+json">
            {JSON.stringify(data)}
          </script>
        ))}
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
