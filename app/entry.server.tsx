import type {
  ActionFunctionArgs,
  EntryContext,
  LoaderFunctionArgs,
} from "react-router";
import { ServerRouter } from "react-router";
import { isbot } from "isbot";
import { renderToReadableStream } from "react-dom/server";
import { v7 as uuidv7 } from "uuid";
import envVars from "~/lib/env";
import {
  renderAbout,
  renderBenefits,
  renderBlogPost,
  renderBlogSitemap,
  renderCenter,
  renderCity,
  renderCounty,
  renderFaq,
  renderForAiAssistants,
  renderGlossary,
  renderIndex,
  renderMetro,
  renderNewsItem,
  renderNewsSitemap,
  renderPricing,
  renderPrivacy,
  renderRegional,
  renderState,
  renderStates,
  renderTerms,
} from "~/lib/markdown.server";
import { trackBotVisit } from "~/lib/middleware/botTracking.server";
import { utmCaptureSession } from "~/lib/middleware/utm.server";

// NOTE: MSW is initialized in test mode on the server side
if (envVars.isTest) (await import("~/test/mocks/mswHandlers")).default();

// Max time (ms) the server will wait for the streaming render before flushing
// whatever is ready. Bots and SPA-mode renders always wait for the full shell.
export const streamTimeout = 5_000;

// Pages that act on the visitor or answer an API call are never cached, even
// when they happen to set no cookie. Prefixes have no trailing slash so both
// `/profile` and `/profile/settings` are covered. `/cron` is here because those
// endpoints do work (rank checks, LLM visibility runs): caching their response
// would silently skip the run.
const CDN_UNCACHEABLE_PREFIXES = [
  "/admin",
  "/api",
  "/auth",
  "/chat",
  "/cron",
  "/email",
  "/profile",
];

// Catalog pages change only when the catalog does, so they get a week of CDN
// caching; the rest of the site keeps the short window.
const CRAWLER_LONG_CACHE_PREFIXES = [
  "/blog",
  "/center/",
  "/city/",
  "/county/",
  "/metro/",
  "/news",
  "/regional/",
  "/state",
];

/**
 * Serve visitor-independent responses from the CDN. A response that sets no
 * cookie carries no per-visitor state - documents render no user or chat data,
 * and the session is fetched by the browser instead - so the edge can hand the
 * same bytes to everyone and skip the function on the next request.
 */
async function cacheAtEdge(request: Request, response: Response) {
  const { pathname } = new URL(request.url);
  if (
    request.method !== "GET" ||
    response.status !== 200 ||
    response.headers.getSetCookie().length > 0 ||
    CDN_UNCACHEABLE_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  )
    return response;

  // The middleware appends the first-touch cookie after this response is built:
  // a response that is about to receive it carries per-visitor state.
  if (await utmCaptureSession(request)) return response;

  // Markdown sitemaps are discovery documents, not content: they keep the short
  // window so new posts and centers reach crawlers within the hour.
  const sMaxAge =
    !pathname.endsWith("/sitemap.md") &&
    CRAWLER_LONG_CACHE_PREFIXES.some((prefix) => pathname.startsWith(prefix))
      ? 604800
      : 3600;

  response.headers.set(
    "Vercel-CDN-Cache-Control",
    `public, s-maxage=${sMaxAge}, stale-while-revalidate=86400`,
  );
  response.headers.set("Cache-Control", "public, max-age=0, must-revalidate");
  return response;
}

const MARKDOWN_ROUTES: Record<
  string,
  | { type: "static"; fn: () => { body: string; link: string } }
  | {
      type: "async";
      fn: (...args: string[]) => Promise<{ body: string; link: string }>;
    }
> = {
  index: { type: "static", fn: () => renderIndex([]) },
  about: { type: "static", fn: renderAbout },
  benefits: { type: "static", fn: renderBenefits },
  faq: { type: "static", fn: renderFaq },
  glossary: { type: "static", fn: renderGlossary },
  pricing: { type: "static", fn: renderPricing },
  privacy: { type: "static", fn: renderPrivacy },
  terms: { type: "static", fn: renderTerms },
  states: { type: "async", fn: renderStates },
  "for-ai-assistants": { type: "static", fn: renderForAiAssistants },
};

const MD_DYNAMIC: {
  pattern: RegExp;
  handler: (key: string) => Promise<{ body: string; link: string }>;
}[] = [
  {
    pattern: /^state\/(.+)$/,
    handler: (k) => renderState(k.match(/^state\/(.+)$/)![1]),
  },
  {
    pattern: /^center\/(.+)$/,
    handler: (k) => renderCenter(k.match(/^center\/(.+)$/)![1]),
  },
  {
    pattern: /^city\/(.+)$/,
    handler: (k) => renderCity(k.match(/^city\/(.+)$/)![1]),
  },
  {
    pattern: /^county\/(.+)$/,
    handler: (k) => renderCounty(k.match(/^county\/(.+)$/)![1]),
  },
  {
    pattern: /^metro\/(.+)$/,
    handler: (k) => renderMetro(k.match(/^metro\/(.+)$/)![1]),
  },
  {
    pattern: /^regional\/(.+)$/,
    handler: (k) => renderRegional(k.match(/^regional\/(.+)$/)![1]),
  },
  { pattern: /^blog\/sitemap$/, handler: () => renderBlogSitemap() },
  {
    pattern: /^blog\/(.+)$/,
    handler: (k) => renderBlogPost(k.match(/^blog\/(.+)$/)![1]),
  },
  { pattern: /^news\/sitemap$/, handler: () => renderNewsSitemap() },
  {
    pattern: /^news\/(.+)$/,
    handler: (k) => renderNewsItem(k.match(/^news\/(.+)$/)![1]),
  },
];

function tryMarkdown(path: string): Promise<Response | null> {
  let key = path.replace(/^\/|\.md$/g, "");
  if (key === "") key = "index";

  const execute = (
    result:
      | Promise<{ body: string; link: string }>
      | { body: string; link: string },
  ) =>
    Promise.resolve(result)
      .then(mdResponse)
      .catch((e) => {
        if (e instanceof Response) return e;
        return null;
      });

  if (key in MARKDOWN_ROUTES) {
    const route = MARKDOWN_ROUTES[key];
    return execute(route.type === "async" ? route.fn() : route.fn());
  }

  for (const { pattern, handler } of MD_DYNAMIC) {
    if (pattern.test(key)) return execute(handler(key));
  }

  return Promise.resolve(null);
}

function mdResponse({ body, link }: { body: string; link: string }) {
  return new Response(body, {
    headers: {
      "Content-Type": "text/markdown",
      Link: `<${link}>; rel="alternate"; type="text/html"`,
    },
  });
}

export function getLoadContext() {
  return {};
}

export default async (
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
): Promise<Response> => {
  const start = Date.now();
  console.info("%s %s", request.method, request.url);
  void trackBotVisit(request); // NOTE: run asynchronously

  const url = new URL(request.url);
  const userAgent = request.headers.get("user-agent");

  if (url.pathname.endsWith(".md")) {
    const md = await tryMarkdown(url.pathname);
    if (md) return await cacheAtEdge(request, md);
  }

  // Accept: text/markdown → serve markdown at the same URL
  if (
    request.headers
      .get("accept")
      ?.split(",")
      .some((a) => a.trim() === "text/markdown")
  ) {
    const md = await tryMarkdown(url.pathname);
    if (md) return await cacheAtEdge(request, md);
  }

  // https://httpwg.org/specs/rfc9110.html#HEAD
  // Not cached: the CDN cache key is the URL, so a bodyless entry could be
  // served to a later GET.
  if (request.method.toUpperCase() === "HEAD") {
    return new Response(null, {
      status: responseStatusCode,
      headers: responseHeaders,
    });
  }

  // Web Streams render. React Router already uses Web Streams internally, so
  // this avoids the Web↔Node stream conversions that renderToPipeableStream
  // requires (PassThrough bridging). Shell errors reject the awaited promise
  // and surface via handleError; post-shell errors are logged here.
  let shellRendered = false;

  const body = await renderToReadableStream(
    <ServerRouter context={routerContext} url={request.url} nonce={uuidv7()} />,
    {
      signal: AbortSignal.timeout(streamTimeout + 1000),
      onError(error: unknown) {
        responseStatusCode = 500;
        // Only log errors that occur after the shell has streamed; shell
        // errors reject the await above and are handled by handleError.
        if (shellRendered) console.error(error);
      },
    },
  );
  shellRendered = true;

  // Bots and SPA-mode renders wait for the full document before responding, so
  // crawlers receive complete HTML.
  // https://react.dev/reference/react-dom/server/renderToReadableStream#waiting-for-all-content-to-load-for-crawlers-and-static-generation
  if ((userAgent && isbot(userAgent)) || routerContext.isSpaMode) {
    await body.allReady;
  }

  responseHeaders.set("Content-Type", "text/html");
  const response = new Response(body, {
    status: responseStatusCode,
    headers: responseHeaders,
  });

  console.info(
    "%s %s => %d (%dms)",
    request.method,
    request.url,
    response.status,
    Date.now() - start,
  );
  return await cacheAtEdge(request, response);
};

export function handleDataRequest(
  response: Response,
  { request }: LoaderFunctionArgs | ActionFunctionArgs,
) {
  console.info("%s %s => %d", request.method, request.url, response.status);
  void trackBotVisit(request); // NOTE: run asynchronously
  return response;
}

export function handleError(
  error: unknown,
  { request }: LoaderFunctionArgs | ActionFunctionArgs,
) {
  if (!request.signal.aborted) {
    console.error(error);
  }
}
