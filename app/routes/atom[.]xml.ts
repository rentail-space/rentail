import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import fm from "front-matter";
import { DateTime } from "luxon";
import { marked } from "marked";
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

    const entries = await Promise.all(
      blogPosts.map(async (file) => {
        const content = await readFile(path.join(blogDir, file), "utf8");
        const { attributes, body } = fm<{ title: string }>(content);
        const slug = file.replace(".md", "");
        const published = DateTime.fromISO(
          slug.match(/^\d{4}-\d{2}-\d{2}/)?.[0] ?? "",
          { zone: "utc" },
        );

        return {
          content: await marked.parse(body, { breaks: true, gfm: true }),
          id: `https://rentail.space/blog/${slug}`,
          links: [{ href: `https://rentail.space/blog/${slug}`, rel: "self" }],
          published: published.toJSDate(),
          summary: truncateWords(removeMd(body), 50),
          title: attributes.title,
          updated: published.toJSDate(),
        };
      }),
    );

    const lastBuildDate = last(entries)?.published;
    invariant(lastBuildDate, "Last build date is required");

    const atom = generateAtomFeed({
      title: "Rentail Space Blog",
      logo: "https://rentail.space/og-image.png",
      id: "https://rentail.space/",
      updated: lastBuildDate,
      links: [{ href: "https://rentail.space", rel: "self" }],
      subtitle: "Short-term retail space marketplace insights and guides",
      authors: [{ email: "info@rentail.space", name: "Rentail Space" }],
      entries,
    });

    return new Response(atom, {
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

import { invariant, last } from "es-toolkit";
import { generateAtomFeed, generateRssFeed } from "feedsmith";
import type { Entry } from "node_modules/feedsmith/dist/feeds/atom/common/types";
