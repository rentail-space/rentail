import { trackBotVisit } from "~/lib/middleware/botTracking.server";
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

const ROUTES: Record<
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

export async function loader({
  params,
  request,
}: {
  params: { "*": string };
  request: Request;
}) {
  await trackBotVisit(request);

  const path = params["*"]?.replace(/\.md$/, "") || "index";

  // Static/known routes
  if (path in ROUTES) {
    const route = ROUTES[path];
    const result = route.type === "async" ? await route.fn() : route.fn();
    return new Response(result.body, {
      headers: {
        "Content-Type": "text/markdown",
        Link: `<${result.link}>; rel="alternate"; type="text/html"`,
      },
    });
  }

  // state/{abbreviation}
  const stateMatch = path.match(/^state\/(.+)$/);
  if (stateMatch) {
    const result = await renderState(stateMatch[1]);
    return new Response(result.body, {
      headers: {
        "Content-Type": "text/markdown",
        Link: `<${result.link}>; rel="alternate"; type="text/html"`,
      },
    });
  }

  // center/{id}
  const centerMatch = path.match(/^center\/(.+)$/);
  if (centerMatch) {
    const result = await renderCenter(centerMatch[1]);
    return new Response(result.body, {
      headers: {
        "Content-Type": "text/markdown",
        Link: `<${result.link}>; rel="alternate"; type="text/html"`,
      },
    });
  }

  // city/{slug}
  const cityMatch = path.match(/^city\/(.+)$/);
  if (cityMatch) {
    const result = await renderCity(cityMatch[1]);
    return new Response(result.body, {
      headers: {
        "Content-Type": "text/markdown",
        Link: `<${result.link}>; rel="alternate"; type="text/html"`,
      },
    });
  }

  // county/{slug}
  const countyMatch = path.match(/^county\/(.+)$/);
  if (countyMatch) {
    const result = await renderCounty(countyMatch[1]);
    return new Response(result.body, {
      headers: {
        "Content-Type": "text/markdown",
        Link: `<${result.link}>; rel="alternate"; type="text/html"`,
      },
    });
  }

  // metro/{slug}
  const metroMatch = path.match(/^metro\/(.+)$/);
  if (metroMatch) {
    const result = await renderMetro(metroMatch[1]);
    return new Response(result.body, {
      headers: {
        "Content-Type": "text/markdown",
        Link: `<${result.link}>; rel="alternate"; type="text/html"`,
      },
    });
  }

  // regional/{slug}
  const regionalMatch = path.match(/^regional\/(.+)$/);
  if (regionalMatch) {
    const result = await renderRegional(regionalMatch[1]);
    return new Response(result.body, {
      headers: {
        "Content-Type": "text/markdown",
        Link: `<${result.link}>; rel="alternate"; type="text/html"`,
      },
    });
  }

  // blog/{slug}
  const blogPostMatch = path.match(/^blog\/([^/]+)$/);
  if (blogPostMatch) {
    if (blogPostMatch[1] === "sitemap") {
      const result = await renderBlogSitemap();
      return new Response(result.body, {
        headers: {
          "Content-Type": "text/markdown",
          Link: `<${result.link}>; rel="alternate"; type="text/html"`,
        },
      });
    }
    const result = await renderBlogPost(blogPostMatch[1]);
    return new Response(result.body, {
      headers: {
        "Content-Type": "text/markdown",
        Link: `<${result.link}>; rel="alternate"; type="text/html"`,
      },
    });
  }

  // news/{slug}
  const newsPostMatch = path.match(/^news\/([^/]+)$/);
  if (newsPostMatch) {
    if (newsPostMatch[1] === "sitemap") {
      const result = await renderNewsSitemap();
      return new Response(result.body, {
        headers: {
          "Content-Type": "text/markdown",
          Link: `<${result.link}>; rel="alternate"; type="text/html"`,
        },
      });
    }
    const result = await renderNewsItem(newsPostMatch[1]);
    return new Response(result.body, {
      headers: {
        "Content-Type": "text/markdown",
        Link: `<${result.link}>; rel="alternate"; type="text/html"`,
      },
    });
  }

  throw new Response("Not Found", { status: 404 });
}
