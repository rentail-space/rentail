import { readFile } from "node:fs/promises";
import { Feed } from "feed";
import fm from "front-matter";
import { marked } from "marked";
import removeMd from "remove-markdown";
import { recentBlogPosts } from "~/lib/blogPosts.server";
import truncateWords from "~/lib/truncateWords";

export async function loader() {
  try {
    const feed = new Feed({
      author: { email: "info@rentail.space", name: "Rentail" },
      copyright: "Copyright 2025 Rentail Space",
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
    const filenames = blogPosts.slice(0, 10); // Take most recent 10

    // Blog post entries for feed
    for (const { filename, slug, published } of filenames) {
      const content = await readFile(filename, "utf8");
      const { attributes, body } = fm<{ title: string }>(content);
      feed.addItem({
        content: await marked.parse(body, { gfm: true }),
        id: `rentail.space:${slug}`,
        link: `https://rentail.space/blog/${slug}`,
        published: published,
        description: truncateWords(removeMd(body), 200),
        title: attributes.title,
        date: published,
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
