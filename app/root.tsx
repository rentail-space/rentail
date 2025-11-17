import { last } from "es-toolkit";
import {
  type HeadersFunction,
  type LinksFunction,
  Outlet,
  type UIMatch,
  isRouteErrorResponse,
  useRouteError,
} from "react-router";
import "~/global.css";
import loggingMiddleware from "~/lib/middleware/logging";
import type { Route } from "./+types/root";
import PageLayout from "./components/layout/PageLayout";
import { findUserAndLastChat } from "./sessions.server";

export const middleware: Route.MiddlewareFunction[] = [loggingMiddleware];

export async function loader({ request }: Route.LoaderArgs) {
  return await findUserAndLastChat(request.headers);
}

export const headers: HeadersFunction = () => {
  return {
    "Document-Policy": "js-profiling",
  };
};

export const links: LinksFunction = () => [
  { href: "/favicon.ico", rel: "icon", type: "image/x-icon", sizes: "any" },
  { href: "/favicon.svg", rel: "icon", type: "image/svg+xml", sizes: "any" },
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
    href: "/humans.txt",
    rel: "author",
    type: "text/plain",
  },
  {
    href: "https://rentail.space/blog/feed",
    rel: "alternate",
    title: "Rentail.space Blog",
    type: "application/atom+xml",
  },
];

export default function App({
  matches,
}: {
  matches: UIMatch<unknown, { hideLayout?: boolean }>[];
}) {
  const { hideLayout } = last(
    matches.filter((match) => match.handle && "hideLayout" in match.handle),
  )?.handle || { hideLayout: false };

  return (
    <PageLayout hideLayout={hideLayout}>
      <Outlet />
    </PageLayout>
  );
}

export function HydrateFallback() {
  return (
    <PageLayout hideLayout={true}>
      <main className="prose prose-lg mx-auto flex flex-col items-center justify-center gap-4">
        <div className="flex flex-col items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
        <p className="text-gray-500 text-sm">Loading, please wait...</p>
      </main>
    </PageLayout>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();

  return (
    <PageLayout hideLayout={true}>
      <main className="prose prose-lg mx-auto py-32">
        {isRouteErrorResponse(error) ? (
          <h1 className="mx-auto flex flex-row justify-center gap-2 text-4xl">
            <span className="font-bold text-red-500">{error.status}</span>
            <span className="text-gray-500">
              {error.statusText || error.data}
            </span>
          </h1>
        ) : (
          <h1 className="mx-auto flex flex-row justify-center gap-2 text-4xl">
            <span className="font-bold text-red-500">500</span>
            <span className="text-gray-500">Unknown error</span>
          </h1>
        )}
      </main>
    </PageLayout>
  );
}
