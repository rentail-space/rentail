import { Feed } from "feed";
import { marked } from "marked";
import { recentBlogPosts } from "~/lib/blogPosts.server";

export async function loader() {
  try {
    const feed = new Feed({
      author: { email: "info@rentail.space", name: "Rentail.space" },
      copyright: "Copyright 2025 Rentail.space",
      description: "Short-term retail space marketplace insights and guides",
      favicon: "https://rentail.space/favicon-96x96.png",
      feedLinks: { atom: "https://rentail.space/blog/feed" },
      id: "rentail.space",
      image: "https://rentail.space/images/og-image.png",
      language: "en-US",
      link: "https://rentail.space/blog/feed",
      title: "The Rentail Blog",
      updated: new Date(),
    });

    const blogPosts = await recentBlogPosts();
    const recent = blogPosts.slice(0, 10); // Take most recent 10

    // Blog post entries for feed
    for (const { body, slug, published, summary, title } of recent) {
      feed.addItem({
        content: await marked.parse(body, { gfm: true }),
        date: published,
        description: summary,
        id: `rentail.space:${slug}`,
        link: `https://rentail.space/blog/${slug}`,
        published: published,
        title: title,
      });
    }

    return new Response(feed.atom1(), {
      headers: {
        "Content-Type": "application/atom+xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Error generating Atom feed:", error);
    throw new Response("Internal Server Error", { status: 500 });
  }
}
