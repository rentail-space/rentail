import { generateRemixSitemap } from "@forge42/seo-tools/remix/sitemap";
import { recentBlogPosts } from "~/lib/blogPosts.server";
import prisma from "~/lib/prisma.server";

export async function loader() {
  // NOTE: Google does not support changefreq and priority.
  // They do support lastmod, but seo-tools doesn't seem to support it.
  // https://developers.google.com/search/blog/2023/06/sitemaps-lastmod-ping

  const sitemap = await generateRemixSitemap({
    domain: "https://rentail.space",
    ignore: ["*/\\*", "/error", "/.well-known/*"],
    routes: { ...routes, ...(await allOtherRoutes()) },
  });
  return new Response(sitemap, {
    headers: { "Content-Type": "application/xml" },
  });
}

const routes = {
  "/": { id: "routes/home/route.tsx", module: "home", path: "/" },
  "/benefits": {
    id: "routes/benefits/route.tsx",
    module: "benefits",
    path: "/benefits",
  },
  "/pricing": {
    id: "routes/pricing/route.tsx",
    module: "pricing",
    path: "/pricing",
  },
  "/faq": { id: "routes/faq/route.tsx", module: "faq", path: "/faq" },
  "/states": { id: "routes/states.tsx", module: "states", path: "/states" },

  "/about": { id: "routes/about/route.tsx", module: "about", path: "/about" },
  "/blog": {
    id: "routes/blog._index.tsx",
    module: "blog",
    path: "/blog",
  },
  "/glossary": {
    id: "routes/glossary/route.tsx",
    module: "glossary",
    path: "/glossary",
  },
  "/news": {
    id: "routes/news._index.tsx",
    module: "news",
    path: "/news",
  },
  "/for-ai-assistants": {
    id: "routes/for-ai-assistants.tsx",
    module: "for-ai-assistants",
    path: "/for-ai-assistants",
  },

  "/privacy": { id: "routes/privacy.tsx", module: "privacy", path: "/privacy" },
  "/terms": { id: "routes/terms.tsx", module: "terms", path: "/terms" },

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

async function allOtherRoutes(): Promise<
  Record<string, { id: string; module: string; path: string }>
> {
  const all = await Promise.all([
    blogPosts(),
    centerPages(),
    states(),
    counties(),
    cities(),
    metroAreas(),
    regionalNames(),
  ]);

  return Object.fromEntries(
    all
      .flat()
      .map((path) => [
        `routes/${path}`,
        { id: `routes/${path}`, module: path, path: `/${path}` },
      ]),
  );
}

async function centerPages(): Promise<string[]> {
  const centers = await prisma.property.findMany({ select: { id: true } });
  return centers.map(({ id }) => `center/${id}`);
}

async function states(): Promise<string[]> {
  const states = await prisma.state.findMany({
    select: { abbreviation: true },
  });
  return states.map(({ abbreviation }) => `state/${abbreviation}`);
}

async function counties(): Promise<string[]> {
  const counties = await prisma.county.findMany({ select: { slug: true } });
  return counties.map(({ slug }) => `county/${slug}`);
}

async function cities(): Promise<string[]> {
  const cities = await prisma.city.findMany({ select: { slug: true } });
  return cities.map(({ slug }) => `city/${slug}`);
}

async function metroAreas(): Promise<string[]> {
  const metroAreas = await prisma.metroArea.findMany({
    select: { slug: true },
  });
  return metroAreas.map(({ slug }) => `metro/${slug}`);
}

async function regionalNames(): Promise<string[]> {
  const regionalNames = await prisma.regionalName.findMany({
    select: { slug: true },
  });
  return regionalNames.map(({ slug }) => `regional/${slug}`);
}

async function blogPosts(): Promise<string[]> {
  const filenames = await recentBlogPosts();
  return filenames.reverse().map(({ slug }) => `blog/${slug}`);
}
