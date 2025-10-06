import path from "node:path";
import { generateRemixSitemap } from "@forge42/seo-tools/remix/sitemap";
import { href } from "react-router";
import { listBlogPosts } from "~/lib/blogPosts.server";

export async function loader() {
  // NOTE Google does not support changefreq and priority.
  // They do support lastmod, but seo-tools doesn't seem to support it.
  // https://developers.google.com/search/blog/2023/06/sitemaps-lastmod-ping

  const { routes } = await import("virtual:react-router/server-build");
  const sitemap = await generateRemixSitemap({
    domain: "https://rentail.space",
    ignore: ["*/\\*", "/api/*"],
    routes: { ...routes, ...(await blogPosts()) },
  });
  return new Response(sitemap, {
    headers: { "Content-Type": "application/xml" },
  });
}

async function blogPosts(): Promise<
  Record<string, { id: string; module: string; path: string }>
> {
  const filenames = await listBlogPosts();
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
