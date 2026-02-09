import { DateTime } from "luxon";
import { loadBlogPost } from "~/lib/blogPosts.server";
import type { Route } from "./+types/blog.$slug";

export async function loader({ params }: Route.LoaderArgs) {
  try {
    const { slug } = params;
    const post = await loadBlogPost(slug);
    const md = `
# ${post.title}

**Published:** ${DateTime.fromISO(post.published).toLocaleString(
      DateTime.DATE_HUGE,
    )}

---

![${post.alt}](/blog/${post.image})

${post.body}

---

**More blog posts:** [All blog posts](/blog/sitemap.md)
    `.trim();
    return new Response(md, {
      headers: {
        "Content-Type": "text/markdown",
        Link: `<https://rentail.space/blog/${slug}>; rel="alternate"; type="text/html"`,
      },
    });
  } catch {
    throw new Response("Not Found", { status: 404 });
  }
}
