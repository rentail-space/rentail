import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { last } from "es-toolkit";
import { NuqsAdapter } from "nuqs/adapters/react-router/v7";
import {
  Links,
  Meta,
  Scripts,
  ScrollRestoration,
  type UIMatch,
  useMatches,
} from "react-router";
import schema from "~/data/schema.json";
import "~/global.css";
import { useGoogleAnalytics } from "~/lib/analytics";
import PageFooter from "./PageFooter";
import PageHeader from "./PageHeader";

const description =
  "Discover short-term retail spaces and pop-up shop opportunities nationwide: seasonal retail, temporary stores, and unique business concepts.";
const title = "rentail.space — Find your specialty lease with ease";
const url = "https://rentail.space/";

export type HeaderLink = {
  label: string;
  to: string;
};

export default function PageLayout({
  children,
  hideLayout = false,
}: {
  children: React.ReactNode;
  hideLayout?: boolean;
}) {
  useGoogleAnalytics();
  const matches = useMatches() as UIMatch<
    unknown,
    { headerLinks?: { to: string; label: string }[] }
  >[];
  const { headerLinks } =
    last(
      matches.filter((match) => match.handle && "headerLinks" in match.handle),
    )?.handle || {};

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

        {/* Google / Search Engine Tags */}
        <meta itemProp="description" content={description} />
        <meta itemProp="image" content={`${url}/images/og-image.png`} />
        <meta itemProp="name" content={title} />

        {/* Facebook Meta Tags */}
        <meta property="og:description" content={description} />
        <meta property="og:image" content={`${url}/images/og-image.png`} />
        <meta property="og:title" content={title} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={url} />
        <meta property="og:site_name" content="Rentail.space" />
        <meta property="og:locale" content="en_US" />

        {/* Twitter Meta Tags */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:description" content={description} />
        <meta property="twitter:image" content={`${url}/images/og-image.png`} />
        <meta property="twitter:title" content={title} />
        <meta property="twitter:url" content={url} />

        {/* https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Client_hints */}
        <meta httpEquiv="Accept-CH" content="Width, Downlink, Sec-CH-UA" />

        <Meta />
        <Links />
        <script type="application/ld+json">{JSON.stringify(schema)}</script>
      </head>
      <body className="relative">
        <DevTag />
        <QueryClientProvider client={new QueryClient()}>
          <NuqsAdapter>
            {hideLayout ? (
              children
            ) : (
              <div className="isolate flex min-h-screen flex-col">
                <PageHeader links={headerLinks} />
                {children}
                <PageFooter />
              </div>
            )}
          </NuqsAdapter>
        </QueryClientProvider>
        <ScrollRestoration />
        <Scripts />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}

function DevTag() {
  return (
    process.env.NODE_ENV === "development" && (
      <span className="fixed top-4 left-4 z-1000 rounded-full bg-red-400 px-4 py-2 font-bold text-white shadow-lg">
        DEV
      </span>
    )
  );
}
