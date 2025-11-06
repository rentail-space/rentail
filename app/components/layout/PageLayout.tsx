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
          <div className="flex min-h-screen flex-col">
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
    <footer className="border-t bg-gray-50 px-6 py-12 print:hidden">
      <div className="container mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="flex flex-col gap-4">
            <NavLink to="/" className="font-bold text-2xl" viewTransition>
              <span className="text-blue-600">rentail</span>.space
            </NavLink>
            <p className="text-gray-600 text-sm">
              AI-powered short-term retail space marketplace
            </p>
          </div>

          {/* Product */}
          <div className="flex flex-col gap-3">
            <h3 className="font-semibold text-gray-900 text-sm">Product</h3>
            <nav className="flex flex-col gap-2">
              <Link
                to="/pricing"
                className="text-gray-600 text-sm transition-colors hover:text-blue-600"
              >
                Pricing
              </Link>
              <Link
                to="/faq"
                className="text-gray-600 text-sm transition-colors hover:text-blue-600"
              >
                FAQ
              </Link>
            </nav>
          </div>

          {/* Resources */}
          <div className="flex flex-col gap-3">
            <h3 className="font-semibold text-gray-900 text-sm">Resources</h3>
            <nav className="flex flex-col gap-2">
              <Link
                to="/blog"
                className="text-gray-600 text-sm transition-colors hover:text-blue-600"
              >
                Blog
              </Link>
              <Link
                to="/about"
                className="text-gray-600 text-sm transition-colors hover:text-blue-600"
              >
                About
              </Link>
              <Link
                to="mailto:hello@rentail.space"
                className="text-gray-600 text-sm transition-colors hover:text-blue-600"
              >
                Contact
              </Link>
            </nav>
          </div>

          {/* Legal */}
          <div className="flex flex-col gap-3">
            <h3 className="font-semibold text-gray-900 text-sm">Legal</h3>
            <nav className="flex flex-col gap-2">
              <Link
                to="/privacy"
                className="text-gray-600 text-sm transition-colors hover:text-blue-600"
              >
                Privacy Policy
              </Link>
              <Link
                to="/terms"
                className="text-gray-600 text-sm transition-colors hover:text-blue-600"
              >
                Terms of Service
              </Link>
            </nav>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 border-t pt-8">
          <p className="text-center text-gray-600 text-sm">
            © {new Date().getFullYear()} rentail.space. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
