import { generateRemixSitemap } from "@forge42/seo-tools/remix/sitemap";
import { href } from "react-router";
import { recentBlogPosts } from "~/lib/blogPosts.server";

export async function loader() {
  // NOTE: Google does not support changefreq and priority.
  // They do support lastmod, but seo-tools doesn't seem to support it.
  // https://developers.google.com/search/blog/2023/06/sitemaps-lastmod-ping

  const sitemap = await generateRemixSitemap({
    domain: "https://rentail.space",
    ignore: ["*/\\*", "/api/*", "!/api/query", "/error", "/.well-known/*"],
    routes: { ...routes, ...(await blogPosts()) },
  });
  return new Response(sitemap, {
    headers: { "Content-Type": "application/xml" },
  });
}

const routes = {
  "/": { id: "routes/home/route.tsx", module: "home", path: "/" },
  "/privacy": { id: "routes/privacy.tsx", module: "privacy", path: "/privacy" },
  "/terms": { id: "routes/terms.tsx", module: "terms", path: "/terms" },
  "/glossary": {
    id: "routes/glossary/route.tsx",
    module: "glossary",
    path: "/glossary",
  },
  "/faq": { id: "routes/faq/route.tsx", module: "faq", path: "/faq" },
  "/states": { id: "routes/states.tsx", module: "states", path: "/states" },
  "/for-ai-assistants": {
    id: "routes/for-ai-assistants.tsx",
    module: "for-ai-assistants",
    path: "/for-ai-assistants",
  },
  "/api/query": {
    id: "routes/api.query.ts",
    module: "api.query",
    path: "/api/query",
  },
  "/openapi.json": {
    id: "routes/openapi[.]json.ts",
    module: "openapi.json",
    path: "/openapi.json",
  },
};

async function blogPosts(): Promise<
  Record<string, { id: string; module: string; path: string }>
> {
  const filenames = await recentBlogPosts();
  return Object.fromEntries(
    filenames.reverse().map(({ slug }) => [
      `routes/blog/${slug}.md`,
      {
        id: `routes/blog/${slug}`,
        module: slug,
        path: href("/blog/:slug", { slug }),
      },
    ]),
  );
}
