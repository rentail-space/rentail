import { recentBlogPosts } from "~/lib/blogPosts.server";
import { trackBotVisit } from "~/lib/middleware/botTracking.server";
import type { Route } from "./+types/blog.sitemap[.]md";

export async function loader({ request }: Route.LoaderArgs) {
  await trackBotVisit(request);
  const blogPosts = await recentBlogPosts();
  const markdown = `
# Rentail Blog Sitemap

This is a sitemap of all blog posts in markdown format for AI agents.

---

${blogPosts
  .map(
    (blogPost) =>
      `- [${blogPost.title}](/blog/${blogPost.slug}) - ${blogPost.published.toString().slice(0, 10)}`,
  )
  .join("\n")}

---

## Related Sitemaps

- [News Sitemap](/news/sitemap.md)
- [For AI Assistants](/for-ai-assistants.md)
  `.trim();
  return new Response(markdown, {
    headers: {
      "Content-Type": "text/markdown",
      Link: `<https://rentail.space/blog>; rel="alternate"; type="text/html"`,
    },
  });
}
