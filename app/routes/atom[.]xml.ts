import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import fm from "front-matter";
import { DateTime } from "luxon";
import removeMd from "remove-markdown";
import truncateWords from "~/lib/truncateWords";

export async function loader() {
  try {
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

    const posts = await Promise.all(
      blogPosts.map(async (file) => {
        const content = await readFile(path.join(blogDir, file), "utf8");
        const { attributes, body } = fm<{ title: string }>(content);
        const slug = file.replace(".md", "");
        const published = DateTime.fromISO(
          slug.match(/^\d{4}-\d{2}-\d{2}/)?.[0] ?? "",
          { zone: "utc" },
        );

        return {
          title: attributes.title,
          slug,
          content: body,
          published,
          description: truncateWords(removeMd(body), 50),
        };
      }),
    );

    const lastBuildDate =
      posts.length > 0 ? posts[0].published : DateTime.now();

    const atomFeed = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Rentail Space Blog</title>
  <subtitle>Short-term retail space marketplace insights and guides</subtitle>
  <link href="https://rentail.space/atom.xml" rel="self"/>
  <link href="https://rentail.space/"/>
  <id>https://rentail.space/</id>
  <updated>${lastBuildDate.toISO()}</updated>
  <author>
    <name>Rentail Space</name>
    <email>info@rentail.space</email>
  </author>
  <generator>React Router v7</generator>
${posts
  .map(
    (post) => `  <entry>
    <title>${escapeXml(post.title)}</title>
    <link href="https://rentail.space/blog/${post.slug}"/>
    <id>https://rentail.space/blog/${post.slug}</id>
    <updated>${post.published.toISO()}</updated>
    <summary type="text">${escapeXml(post.description)}</summary>
    <content type="html"><![CDATA[${post.content}]]></content>
  </entry>`,
  )
  .join("\n")}
</feed>`;

    return new Response(atomFeed, {
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

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
