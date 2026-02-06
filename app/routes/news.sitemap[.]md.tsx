import { DateTime } from "luxon";
import { recentNewsItems } from "~/lib/newsItems.server";

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
- [For AI Assistants](/for-ai-assistants.md)
  `.trim();
  return new Response(markdown, {
    headers: { "Content-Type": "text/markdown" },
  });
}
