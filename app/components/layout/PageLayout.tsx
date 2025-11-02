import { SpeedInsights } from "@vercel/speed-insights/react";
import { NuqsAdapter } from "nuqs/adapters/react-router/v7";
import { useEffect } from "react";
import ReactGA from "react-ga4";
import {
  Link,
  Links,
  Meta,
  NavLink,
  Scripts,
  ScrollRestoration,
} from "react-router";
import { Toaster } from "sonner";
import schema from "~/data/schema.json";
import "~/global.css";
import LayoutHeader from "./LayoutHeader";

const description =
  "Discover short-term retail spaces and pop-up shop opportunities nationwide: seasonal retail, temporary stores, and unique business concepts.";
const title = "rentail.space — Find your specialty lease with ease";
const url = "https://rentail.space/";

export default function PageLayout({
  children,
  showHeader = true,
  showFooter = true,
}: {
  children: React.ReactNode;
  showHeader?: boolean;
  showFooter?: boolean;
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
        <meta property="og:site_name" content="Rentail Space" />
        <meta property="og:locale" content="en_US" />

        {/* Twitter Meta Tags */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:description" content={description} />
        <meta property="twitter:image" content={`${url}/images/og-image.png`} />
        <meta property="twitter:title" content={title} />
        <meta property="twitter:url" content={url} />

        <Meta />
        <Links />
        <script type="application/ld+json">{JSON.stringify(schema)}</script>
      </head>
      <body>
        <NuqsAdapter>
          <div className="flex min-h-screen flex-col gap-8">
            {showHeader && <LayoutHeader />}
            {children}
            {showFooter && <LayoutFooter />}
          </div>
        </NuqsAdapter>
        <Toaster richColors />
        <ScrollRestoration />
        <Scripts />
        {process.env.NODE_ENV === "production" && <SpeedInsights />}
      </body>
    </html>
  );
}

function LayoutFooter() {
  return (
    <footer className="footer sm:footer-horizontal footer-center p-4 text-base-content print:hidden">
      <aside className="flex flex-col gap-4 text-gray-600">
        <p className="flex flex-row items-center gap-2">
          <span>© {new Date().getFullYear()}</span>
          <NavLink to="/" className="font-bold" viewTransition>
            <span className="text-indigo-600 hover:underline">rentail</span>
            .space
          </NavLink>
          <span>All rights reserved</span>
          <Link
            className="text-indigo-600 hover:underline"
            to="mailto:hello@rentail.space"
            viewTransition
          >
            Contact us
          </Link>
        </p>
        <p className="flex flex-row items-center gap-2">
          <a href="/terms" className="text-indigo-600 hover:underline">
            Terms of Service
          </a>{" "}
          <a href="/privacy" className="text-indigo-600 hover:underline">
            Privacy Policy
          </a>
        </p>
      </aside>
    </footer>
  );
}
