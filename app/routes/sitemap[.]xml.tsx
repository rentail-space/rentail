import fs from "node:fs/promises";
import path from "node:path";
import { flatRoutes } from "@react-router/fs-routes";

export async function loader() {
  const mapped = [...(await dynamicRoutes()), ...(await blogPosts("app/data"))];
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd" xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${mapped
    .map(
      (route) =>
        `<url><loc>${route.loc}</loc><lastmod>${route.lastmod}</lastmod><changefreq>${route.changefreq}</changefreq><priority>${route.priority}</priority></url>`,
    )
    .join("\n")}
</urlset>`,
    { headers: { "Content-Type": "application/xml" } },
  );
}

type SitemapEntry = {
  changefreq: string;
  lastmod: string;
  loc: string;
  priority: number;
};

async function dynamicRoutes(): Promise<SitemapEntry[]> {
  return [
    {
      changefreq: "daily",
      lastmod: new Date().toISOString(),
      loc: "https://rentail.space",
      priority: 1,
    },
  ].concat(
    (
      await flatRoutes({
        ignoredRouteFiles: ["routes/home.tsx", "**/*.test.ts", "**/*.test.tsx"],
      })
    ).map((route) => ({
      changefreq: "daily",
      lastmod: new Date().toISOString(),
      loc: `https://rentail.space/${route.path}`,
      priority: 0.8,
    })),
  );
}

async function blogPosts(dir: string): Promise<SitemapEntry[]> {
  return (await fs.readdir(path.join(process.cwd(), dir)))
    .filter((file: string) => file.endsWith(".md"))
    .map((file: string) => ({
      changefreq: "daily",
      lastmod: new Date().toISOString(),
      loc: `https://rentail.space/blog/${path.basename(file, ".md")}`,
      priority: 0.8,
    }));
}
