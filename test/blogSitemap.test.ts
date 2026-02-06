/**
 * E2E Tests for Blog Sitemap
 *
 * Tests ensure that the blog sitemap renders correctly with:
 * - Markdown format for AI agents
 * - Links to all blog posts
 * - Proper date formatting
 * - First blog post is accessible
 */

import { invariant, last } from "es-toolkit";
import { expect } from "playwright/test";
import { beforeAll, describe, it } from "vitest";
import { port } from "~/test/helpers/launchBrowser";

describe("Blog Sitemap", () => {
  let content: string;
  let response: Response;

  beforeAll(async () => {
    response = await fetch(`http://localhost:${port}/blog/sitemap.md`);
    content = await response.text();
  });

  it("should return markdown content type", () => {
    expect(response.headers.get("content-type")).toContain("text/markdown");
  });

  it("should have the correct sitemap title on the first line", () => {
    const lines = content.split("\n").filter(Boolean);
    expect(lines[0]).toBe("# Rentail Blog Sitemap");
  });

  it("should include description for AI agents", () => {
    const lines = content.split("\n").filter(Boolean);
    expect(lines[1]).toBe(
      "This is a sitemap of all blog posts in markdown format for AI agents.",
    );
  });

  it("should list blog posts with links", () => {
    const parts = content.split("---").filter(Boolean);
    expect(parts[1]).toMatch(/\[.*\]\(\/blog\/[^\s]+\)/);
  });

  it("should include dates in ISO format", () => {
    const parts = content.split("---").filter(Boolean);
    expect(parts[1]).toMatch(/\d{4}-\d{2}-\d{2}/);
  });

  it("should include link to news sitemap in the related sitemaps section", () => {
    const parts = content.split("---").filter(Boolean);
    expect(parts[2]).toContain("[News Sitemap](/news/sitemap.md)");
  });

  it("should include link back to For AI Assistants", () => {
    const parts = content.split("---").filter(Boolean);
    expect(parts[2]).toContain("[For AI Assistants](/for-ai-assistants.md)");
  });

  describe("first blog post", () => {
    let blogPostContent: string;
    let blogPostResponse: Response;

    beforeAll(async () => {
      // Extract first blog post slug from sitemap
      const match = content.match(/\[([^\]]+)\]\(\/blog\/([^)]+)\)/);
      expect(match, "should find at least one blog post link").toBeDefined();
      invariant(match, "should find at least one blog post link");

      const slug = match[2];
      expect(slug).toBe(
        "2026-01-30-how-do-i-find-short-term-retail-space-in-shopping-malls",
      );

      // Fetch first news item (with .md extension for markdown format)
      blogPostResponse = await fetch(`http://localhost:${port}/blog/${slug}`, {
        headers: { accept: "text/markdown" },
      });
      blogPostContent = await blogPostResponse.text();
    });

    it("should return markdown content type", () => {
      expect(blogPostResponse.headers.get("content-type")).toContain(
        "text/markdown",
      );
    });

    it("should include blog post title", () => {
      const lines = blogPostContent.split("\n");
      expect(lines[0]).toBe(
        "# How Do I Find Short-Term Retail Space in Shopping Malls?",
      );
    });

    it("should include published date", () => {
      expect(blogPostContent).toContain(
        "**Published:** Friday, January 30, 2026",
      );
    });

    it("should include image with alt text", () => {
      const parts = blogPostContent.split("---").filter(Boolean);
      const image = parts[1].match(/!\[([^\]]*)\]\(([^)]+)\)/);
      expect(image?.[1]).toBe(
        "Modern shopping mall interior with empty retail kiosks and temporary spaces available for lease, showing high ceilings and natural light",
      );
      expect(image?.[2]).toMatch(
        /^\/blog\/2026-01-30-how-do-i-find-space\.jpg$/,
      );
    });

    it("should allow downloading the image with fetch and confirm it's a JPEG", async () => {
      // Extract image URL from the blog post markdown
      const imgMatch = blogPostContent.match(/!\[[^\]]*\]\(([^)]+)\)/);
      expect(imgMatch, "should find image URL").toBeTruthy();

      const imageUrl = imgMatch?.[1];
      expect(imageUrl).toMatch(/^\/blog\/2026-01-30-how-do-i-find-space\.jpg$/);

      // Download image from local server
      const imageResponse = await fetch(`http://localhost:${port}${imageUrl}`);
      expect(imageResponse.ok).toBe(true);

      const contentType = imageResponse.headers.get("content-type");
      expect(contentType).toMatch(/^image\/jpeg/);

      // Optionally, check a JPEG magic number (0xFFD8FFE0)
      const buffer = new Uint8Array(await imageResponse.arrayBuffer());
      expect(buffer[0]).toBe(0xff);
      expect(buffer[1]).toBe(0xd8);
      // 3rd byte may vary (FFE0 - FFE8), only check start
      expect(buffer[2]).toBe(0xff);
    });

    it("should include blog post body content", () => {
      const parts = blogPostContent.split("---").filter(Boolean);
      expect(parts[1]).toContain(
        "Finding short-term retail space in shopping malls used to mean calling dozens of leasing offices and hoping someone picks up.",
      );
    });

    it("should include link back to sitemap", () => {
      const parts = blogPostContent.split("---").filter(Boolean);
      expect(last(parts)).toContain(
        "📚 **More blog posts:** [All blog posts](/blog/sitemap.md)",
      );
    });
  });
});
