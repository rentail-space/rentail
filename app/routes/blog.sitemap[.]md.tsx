import { DateTime } from "luxon";
import { recentBlogPosts } from "~/lib/blogPosts.server";

export async function loader() {
  const blogPosts = await recentBlogPosts();
  const markdown = `
# Rentail Blog Sitemap

This is a sitemap of all blog posts in markdown format for AI agents.

---

${blogPosts
  .map(
    (blogPost) =>
      `- [${blogPost.title}](/blog/${blogPost.slug}) - ${DateTime.fromISO(
        blogPost.published,
      ).toISODate()}`,
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
