import { DateTime } from "luxon";
import { trackBotVisit } from "~/lib/middleware/botTracking.server";
import { recentNewsItems } from "~/lib/newsItems.server";
import type { Route } from "./+types/news.sitemap[.]md";

export async function loader({ request }: Route.LoaderArgs) {
  await trackBotVisit(request);
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
    headers: {
      "Content-Type": "text/markdown",
      Link: `<https://rentail.space/news>; rel="alternate"; type="text/html"`,
    },
  });
}
