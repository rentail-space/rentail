import { PassThrough } from "node:stream";
import { renderToPipeableStream } from "react-dom/server";
import type {
  ActionFunctionArgs,
  AppLoadContext,
  EntryContext,
  LoaderFunctionArgs,
} from "react-router";
import { ServerRouter } from "react-router";
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

// NOTE: MSW is initialized in test mode on the server side
if (envVars.isTest) (await import("~/test/mocks/mswHandlers")).default();

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
  _loadContext?: AppLoadContext,
): Promise<Response> => {
  const start = Date.now();
  console.info("%s %s", request.method, request.url);

  // oxlint-disable-next-line typescript/no-floating-promises
  trackBotVisit(request); // NOTE: run asynchronously

  const url = new URL(request.url);
  if (url.pathname.endsWith(".md")) {
    const md = await tryMarkdown(url.pathname);
    if (md) {
      // oxlint-disable-next-line typescript/no-floating-promises
      trackBotVisit(request);
      return md;
    }
  }

  // Accept: text/markdown → serve markdown at the same URL
  if (
    request.headers
      .get("accept")
      ?.split(",")
      .some((a) => a.trim() === "text/markdown")
  ) {
    const md = await tryMarkdown(url.pathname);
    if (md) {
      // oxlint-disable-next-line typescript/no-floating-promises
      trackBotVisit(request);
      return md;
    }
  }

  const response = await new Promise<Response>((resolve, reject) => {
    const { pipe } = renderToPipeableStream(
      <ServerRouter
        context={routerContext}
        url={request.url}
        nonce={uuidv7()}
      />,
      {
        onShellReady() {
          responseHeaders.set("Content-Type", "text/html");
          const body = new PassThrough();
          resolve(
            new Response(body as unknown as BodyInit, {
              status: responseStatusCode,
              headers: responseHeaders,
            }),
          );
          pipe(body);
        },
        onShellError(error) {
          reject(error);
        },
        onError(error) {
          if (!responseHeaders.has("Content-Type")) reject(error);
        },
      },
    );
  });
  // oxlint-disable-next-line typescript/no-floating-promises
  waitForResponse(response, start).then((duration) => {
    console.info(
      "%s %s => %d (%dms)",
      request.method,
      request.url,
      response.status,
      duration,
    );
  });
  return response;
};

async function waitForResponse(response: Response, start: number) {
  const reader = response.clone().body?.getReader();
  if (reader) {
    while (true) {
      const { done } = await reader.read();
      if (done) break;
    }
  }
  return Date.now() - start;
}

export function handleDataRequest(
  response: Response,
  { request }: LoaderFunctionArgs | ActionFunctionArgs,
) {
  const start = Date.now();
  console.info("%s %s", request.method, request.url);
  void trackBotVisit(request); // NOTE: run asynchronously
  void waitForResponse(response, start).then((duration) => {
    console.info(
      "%s %s => %d (%dms)",
      request.method,
      request.url,
      response.status,
      duration,
    );
  });
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
