import fs from "node:fs";
import path from "node:path";
import { generateRemixSitemap } from "@forge42/seo-tools/remix/sitemap";
import type { LoaderFunctionArgs } from "react-router";
import { href } from "react-router";

export async function loader({ request }: LoaderFunctionArgs) {
  const { routes } = await import("virtual:react-router/server-build");
  const { origin } = new URL(request.url);
  const sitemap = await generateRemixSitemap({
    domain: origin,
    ignore: ["*/\\*", "/api/*"],
    routes: { ...routes, ...blogPosts("app/data") },
  });
  return new Response(sitemap, {
    headers: { "Content-Type": "application/xml" },
  });
}

function blogPosts(
  dir: string,
): Record<string, { id: string; module: string; path: string }> {
  const filenames = fs
    .readdirSync(path.join(process.cwd(), dir))
    .filter((filename: string) => filename.endsWith(".md"));
  return Object.fromEntries(
    filenames.map((filename) => [
      `routes/blog/${path.basename(filename, ".md")}`,
      {
        id: `routes/blog/${path.basename(filename, ".md")}`,
        module: filename,
        path: href("/blog/*", { "*": path.basename(filename, ".md") }),
      },
    ]),
  );
}
