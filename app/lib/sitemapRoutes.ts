import { recentBlogPosts } from "~/lib/blogPosts.server";
import prisma from "~/lib/prisma.server";

const DOMAIN = "https://rentail.space";

const STATIC_PATHS = [
  "/",
  "/benefits",
  "/pricing",
  "/faq",
  "/states",
  "/about",
  "/blog",
  "/glossary",
  "/news",
  "/for-ai-assistants",
  "/privacy",
  "/terms",
  "/api/query",
  "/openapi.json",
  "/index.md",
  "/about.md",
  "/benefits.md",
  "/faq.md",
  "/glossary.md",
  "/pricing.md",
  "/privacy.md",
  "/terms.md",
  "/states.md",
  "/for-ai-assistants.md",
  "/blog/sitemap.md",
  "/news/sitemap.md",
];

async function dynamicPaths(): Promise<string[]> {
  const results = await Promise.all([
    recentBlogPosts().then((posts) => posts.map(({ slug }) => `/blog/${slug}`)),
    prisma.property
      .findMany({ select: { id: true } })
      .then((properties) => properties.map(({ id }) => `/center/${id}`)),
    prisma.state
      .findMany({ select: { abbreviation: true } })
      .then((states) =>
        states.map(({ abbreviation }) => `/state/${abbreviation}`),
      ),
    prisma.county
      .findMany({ select: { slug: true } })
      .then((counties) => counties.map(({ slug }) => `/county/${slug}`)),
    prisma.city
      .findMany({ select: { slug: true } })
      .then((cities) => cities.map(({ slug }) => `/city/${slug}`)),
    prisma.metroArea
      .findMany({ select: { slug: true } })
      .then((metros) => metros.map(({ slug }) => `/metro/${slug}`)),
    prisma.regionalName
      .findMany({ select: { slug: true } })
      .then((regions) => regions.map(({ slug }) => `/regional/${slug}`)),
  ]);

  return results.flat();
}

export default async function getSitemapRoutes(): Promise<string[]> {
  const dynamic = await dynamicPaths();
  return [...STATIC_PATHS, ...dynamic].map((p) => `${DOMAIN}${p}`);
}
