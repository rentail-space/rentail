import fs from "node:fs";
import path from "node:path";
import { generateRemixSitemap } from "@forge42/seo-tools/remix/sitemap";
import { flatRoutes } from "@react-router/fs-routes";
import type { LoaderFunctionArgs } from "react-router";

export async function loader({ request }: LoaderFunctionArgs) {
  const domain = `${new URL(request.url).origin}`;
  const routes = Object.fromEntries<{
    id: string;
    module: string;
    path: string;
  }>(
    (await flatRoutes()).map((route) => [
      route.id ?? "unknown",
      {
        id: route.id ?? "unknown",
        module: route.file,
        path: route.path === "home" ? "/" : (route.path ?? ""),
      },
    ]),
  );

  const sitemap = await generateRemixSitemap({
    domain,
    ignore: ["*/\\*", "/api/*"],
    routes: { ...routes, ...blogPosts("app/data") },
  });

  return new Response(sitemap, {
    headers: { "Content-Type": "application/xml" },
  });
}

function blogPosts(
  dir: string,
): Record<string, { id: string; module: string }> {
  const filenames = fs
    .readdirSync(path.join(process.cwd(), dir))
    .filter((filename: string) => filename.endsWith(".md"));
  return Object.fromEntries(
    filenames.map((file) => [
      `routes/blog/${path.basename(file, ".md")}`,
      {
        id: `routes/blog/${path.basename(file, ".md")}`,
        module: "app/routes/blog.$",
        path: `/blog/${path.basename(file, ".md")}`,
        lastmod: new Date(
          fs.statSync(path.join(process.cwd(), dir, file)).mtime,
        ).toISOString(),
        changefreq: "daily",
        priority: 0.8,
      },
    ]),
  );
}
