import {
  data,
  type HeadersFunction,
  isRouteErrorResponse,
  type LinksFunction,
  Outlet,
  type useMatches,
  useRouteError,
} from "react-router";
import "~/app.css";
import Footer from "~/components/layout/Footer";
import Header from "~/components/layout/Header";
import loggingMiddleware from "~/lib/middleware/logging";
import type { Route } from "./+types/root";
import Layout from "./components/layout/Layout";
import { getUserChat } from "./sessions.server";

export const middleware: Route.MiddlewareFunction[] = [loggingMiddleware];

export async function loader({ request }: Route.LoaderArgs) {
  const { chat, messages, headers } = await getUserChat(request.headers);
  return data({ chat, messages }, { headers });
}

export const headers: HeadersFunction = () => {
  return {
    "Document-Policy": "js-profiling",
  };
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

export default function App({
  matches,
}: {
  matches: ReturnType<typeof useMatches>;
}) {
  const hideLayout = matches.some(
    (match) =>
      (match.handle as { hideLayout?: boolean } | undefined)?.hideLayout ===
      true,
  );

  return (
    <Layout>
      {hideLayout ? (
        <Outlet />
      ) : (
        <div className="flex min-h-screen flex-col gap-8">
          <Header />
          <Outlet />
          <Footer />
        </div>
      )}
    </Layout>
  );
}

export function HydrateFallback() {
  return (
    <Layout>
      <main className="prose prose-lg mx-auto flex flex-col gap-4 items-center justify-center">
        <div className="flex flex-col items-center justify-center">
          <div className="animate-spin h-12 w-12 border-4 border-blue-600 rounded-full border-t-transparent" />
        </div>
        <p className="text-sm text-gray-500">Loading, please wait...</p>
      </main>
    </Layout>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();

  return (
    <Layout>
      <main className="prose prose-lg mx-auto">
        {isRouteErrorResponse(error) ? (
          <h1 className="flex flex-row gap-2 text-4xl mx-auto mt-24 justify-center">
            <span className="text-red-500 font-bold">{error.status}</span>
            <span className="text-gray-500">
              {error.statusText || error.data}
            </span>
          </h1>
        ) : error instanceof Error ? (
          <h1 className="flex flex-row gap-2 text-4xl mx-auto mt-24 justify-center">
            <span className="text-red-500 font-bold">Error</span>
            <span className="text-gray-500">{error.message}</span>
          </h1>
        ) : (
          <h1 className="flex flex-row gap-2 text-4xl mx-auto mt-24 justify-center">
            <span className="text-red-500 font-bold">Unknown Error</span>
          </h1>
        )}
      </main>
    </Layout>
  );
}
