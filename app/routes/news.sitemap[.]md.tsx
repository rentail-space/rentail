import { DateTime } from "luxon";
import { recentNewsItems } from "~/lib/newsItems.server";
import pageMeta from "~/lib/pageMeta";
import type { Route } from "./+types/news._index";

export function meta(): Route.MetaDescriptors {
  return pageMeta({
    title: "News",
    description: "Discover the latest news and updates from Rentail.space.",
    url: "/news",
    keywords: "news, rentail.space, retail spaces, specialty leasing",
  });
}

export async function loader() {
  const posts = await recentNewsItems();
  const markdown = `
# Rentail News Sitemap

This is a sitemap of all news articles in markdown format for AI agents.

---

${posts
  .map(
    (post) =>
      `- [${post.title}](/news/${post.slug}) - ${DateTime.fromISO(
        post.published,
      ).toISODate()}`,
  )
  .join("\n")}

---

## Related Sitemaps

- [Blog Sitemap](/blog/sitemap.md)
  `.trim();
  return new Response(markdown, {
    headers: { "Content-Type": "text/markdown" },
  });
}
