import { routes } from "virtual:react-router/server-build";
import { generateRemixSitemap } from "@forge42/seo-tools/remix/sitemap";
import { href } from "react-router";
import { recentBlogPosts } from "~/lib/blogPosts.server";

export async function loader() {
  // NOTE: Google does not support changefreq and priority.
  // They do support lastmod, but seo-tools doesn't seem to support it.
  // https://developers.google.com/search/blog/2023/06/sitemaps-lastmod-ping

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
  const filenames = await recentBlogPosts();
  return Object.fromEntries(
    filenames.map(({ slug }) => [
      `routes/blog/${slug}.md`,
      {
        id: `routes/blog/${slug}`,
        module: slug,
        path: href("/blog/:post", { post: slug }),
      },
    ]),
  );
}
