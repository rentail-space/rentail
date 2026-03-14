import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { Links, Meta, Scripts, ScrollRestoration } from "react-router";
import schema from "~/data/schema.json";
import "~/global.css";
import { useGoogleAnalytics } from "~/lib/useAnalytics";
import PageFooter from "./PageFooter";
import PageHeader from "./PageHeader";

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

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
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
        <meta itemProp="image" content={`${url}/images/og-image.png`} />
        <meta itemProp="name" content={title} />

        {/* https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Client_hints */}
        <meta httpEquiv="Accept-CH" content="Width, Downlink, Sec-CH-UA" />

        <link rel="me" href="https://mas.to/@assaf" />
        <link rel="me" href="https://www.linkedin.com/company/rentail-space" />
        <link rel="me" href="https://www.reddit.com/user/rentails" />
        <link rel="me" href="https://github.com/rentail-space" />

        <Meta />
        <Links />
        <script type="application/ld+json">{JSON.stringify(schema)}</script>
      </head>
      <body className="relative">
        <DevTag />
        <QueryClientProvider client={new QueryClient()}>
          {hideLayout ? (
            children
          ) : (
            <div className="isolate flex min-h-screen flex-col">
              <PageHeader />
              {children}
              <PageFooter />
            </div>
          )}
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
