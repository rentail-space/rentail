import fs from "node:fs";
import path from "node:path";
import { generateRemixSitemap } from "@forge42/seo-tools/remix/sitemap";
import dayjs from "dayjs";
import { href } from "react-router";

export async function loader() {
  // NOTE Google does not support changefreq and priority.
  // They do support lastmod, but seo-tools doesn't seem to support it.
  // https://developers.google.com/search/blog/2023/06/sitemaps-lastmod-ping

  const { routes } = await import("virtual:react-router/server-build");
  const sitemap = await generateRemixSitemap({
    domain: "https://rentail.space",
    ignore: ["*/\\*", "/api/*"],
    routes: { ...routes, ...blogPosts("app/data/blog") },
  });
  return new Response(sitemap, {
    headers: { "Content-Type": "application/xml" },
  });
}

function blogPosts(
  dir: string,
): Record<string, { id: string; module: string; path: string }> {
  const today = dayjs();
  const filenames = fs
    .readdirSync(path.join(process.cwd(), dir))
    .filter((filename: string) => filename.endsWith(".md"))
    .filter((filename) =>
      today.isAfter(new Date(filename.match(/\d{4}-\d{2}-\d{2}/)?.[0] ?? "")),
    );
  return Object.fromEntries(
    filenames.map((filename) => [
      `routes/blog/${path.basename(filename, ".md")}`,
      {
        id: `routes/blog/${path.basename(filename, ".md")}`,
        module: filename,
        path: href("/blog/:post", { post: path.basename(filename, ".md") }),
      },
    ]),
  );
}
