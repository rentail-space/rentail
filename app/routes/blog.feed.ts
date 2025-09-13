import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { Feed } from "feed";
import fm from "front-matter";
import { DateTime } from "luxon";
import { marked } from "marked";
import removeMd from "remove-markdown";
import truncateWords from "~/lib/truncateWords";

export async function loader() {
  try {
    const feed = new Feed({
      // entries: await getEntries(),
      author: { email: "info@rentail.space", name: "Rentail" },
      copyright: "Copyright 2025 Rentail Space",
      description: "Short-term retail space marketplace insights and guides",
      favicon: "https://rentail.space/favicon-96x96.png",
      feedLinks: { atom: "https://rentail.space/blog/feed" },
      id: "https://rentail.space/blog/feed",
      image: "https://rentail.space/og-image.png",
      language: "en-US",
      link: "https://rentail.space/blog/feed",
      title: "Rentail Blog",
      updated: new Date(),
    });

    const blogDir = path.join(process.cwd(), "app/data/blog");
    const files = await readdir(blogDir);

    // Filter and sort markdown files by date (most recent first)
    const blogPosts = files
      .filter((file) => file.endsWith(".md"))
      .filter((file) => {
        const dateMatch = file.match(/^\d{4}-\d{2}-\d{2}/);
        if (!dateMatch) return false;
        const publishDate = DateTime.fromISO(dateMatch[0], { zone: "utc" });
        return publishDate.isValid && publishDate <= DateTime.now();
      })
      .sort((a, b) => b.localeCompare(a)) // Reverse chronological order
      .slice(0, 10); // Take most recent 10

    // Blog post entries for feed
    for (const file of blogPosts) {
      const content = await readFile(path.join(blogDir, file), "utf8");
      const { attributes, body } = fm<{ title: string }>(content);
      const slug = file.replace(".md", "");
      const published = DateTime.fromISO(
        slug.match(/^\d{4}-\d{2}-\d{2}/)?.[0] ?? "",
        { zone: "utc" },
      );
      feed.addItem({
        content: await marked.parse(body, { gfm: true }),
        id: `https://rentail.space/blog/${slug}`,
        link: `https://rentail.space/blog/${slug}`,
        published: published.toJSDate(),
        description: truncateWords(removeMd(body), 50),
        title: attributes.title,
        date: published.toJSDate(),
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
