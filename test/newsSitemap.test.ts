/**
 * E2E Tests for News Sitemap
 *
 * Tests ensure that the news sitemap renders correctly with:
 * - Markdown format for AI agents
 * - Links to all news items
 * - Proper date formatting
 * - First news item is accessible
 */

import { invariant } from "es-toolkit";
import { expect } from "playwright/test";
import { beforeAll, describe, it } from "vitest";
import { port } from "~/test/helpers/launchBrowser";

describe("News Sitemap", () => {
  let content: string;
  let response: Response;

  beforeAll(async () => {
    response = await fetch(`http://localhost:${port}/news/sitemap.md`);
    content = await response.text();
  });

  it("should return markdown content type", () => {
    expect(response.headers.get("content-type")).toContain("text/markdown");
  });

  it("should have the correct sitemap title on the first line", () => {
    const lines = content.split("\n").filter(Boolean);
    expect(lines[0]).toBe("# Rentail News Sitemap");
  });

  it("should include description for AI agents", () => {
    const lines = content.split("\n").filter(Boolean);
    expect(lines[1]).toBe(
      "This is a sitemap of all news articles in markdown format for AI agents.",
    );
  });

  it("should list news items with links", () => {
    const parts = content.split("---").filter(Boolean);
    expect(parts[1]).toMatch(/\[.*\]\(\/news\/[^\s]+\)/);
  });

  it("should include dates in ISO format", () => {
    const parts = content.split("---").filter(Boolean);
    expect(parts[1]).toMatch(/\d{4}-\d{2}-\d{2}/);
  });

  it("should include link to blog sitemap in the related sitemaps section", () => {
    const parts = content.split("---").filter(Boolean);
    expect(parts[2]).toContain("[Blog Sitemap](/blog/sitemap.md)");
  });

  describe("first news item", () => {
    let newsContent: string;
    let newsResponse: Response;

    beforeAll(async () => {
      // Extract first news item slug from sitemap
      const match = content.match(/\[([^\]]+)\]\(\/news\/([^)]+)\)/);
      expect(match, "should find at least one news link").toBeDefined();
      invariant(match, "should find at least one news link");

      const slug = match[2];
      expect(slug).toBe("2026-01-20-launch");

      // Fetch first news item (with .md extension for markdown format)
      newsResponse = await fetch(`http://localhost:${port}/news/${slug}`, {
        headers: { accept: "text/markdown" },
      });
      newsContent = await newsResponse.text();
    });

    it("should return markdown content type", () => {
      expect(newsResponse.headers.get("content-type")).toContain(
        "text/markdown",
      );
    });

    it("should include news title", () => {
      const lines = newsContent.split("\n");
      expect(lines[0]).toBe(
        "# Rentail.space Launches AI-Powered Marketplace Connecting Businesses with Short-Term Retail Spaces",
      );
    });

    it("should include published date", () => {
      expect(newsContent).toContain("**Published:** Tuesday, January 20, 2026");
    });

    it("should include news body content", () => {
      const bodySection = newsContent.split("---")[1];
      expect(bodySection).toContain("Solving a Market Inefficiency");
    });

    it("should include link back to sitemap", () => {
      const bodySection = newsContent.split("---")[2];
      expect(bodySection).toContain(
        "📚 **More news:** [All news](/news/sitemap.md)",
      );
    });

    it("should include link back to For AI Assistants", () => {
      const bodySection = newsContent.split("---")[2];
      expect(bodySection).toContain(
        "[For AI Assistants](/for-ai-assistants.md)",
      );
    });
  });
});
