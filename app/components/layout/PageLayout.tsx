import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { NuqsAdapter } from "nuqs/adapters/react-router/v7";
import { useEffect } from "react";
import ReactGA from "react-ga4";
import { Links, Meta, Scripts, ScrollRestoration } from "react-router";
import schema from "~/data/schema.json";
import "~/global.css";
import PageFooter from "./PageFooter";
import PageHeader from "./PageHeader";

const description =
  "Discover short-term retail spaces and pop-up shop opportunities nationwide: seasonal retail, temporary stores, and unique business concepts.";
const title = "rentail.space — Find your specialty lease with ease";
const url = "https://rentail.space/";

const headerLinks = [
  {
    to: "/about",
    label: "About",
  },
  {
    to: "/pricing",
    label: "Pricing",
  },
  {
    to: "/blog",
    label: "Blog",
  },
  {
    to: "/faq",
    label: "FAQ",
  },
];

export default function PageLayout({
  children,
  hideLayout = false,
}: {
  children: React.ReactNode;
  hideLayout?: boolean;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === "production")
      ReactGA.initialize("G-HLE5G8GC5Y");
  }, []);

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
      <body>
        <DevTag />
        <NuqsAdapter>
          {hideLayout ? (
            children
          ) : (
            <div className="flex min-h-screen flex-col">
              <PageHeader links={headerLinks} />
              {children}
              <PageFooter />
            </div>
          )}
        </NuqsAdapter>
        <ScrollRestoration />
        <Scripts />
        {process.env.NODE_ENV === "production" && <Analytics />}
        {process.env.NODE_ENV === "production" && <SpeedInsights />}
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
