/**
 * E2E Tests for Blog Sitemap
 *
 * Tests ensure that the blog sitemap renders correctly with:
 * - Markdown format for AI agents
 * - Links to all blog posts
 * - Proper date formatting
 * - First blog post is accessible
 */

import { beforeAll, describe, it } from "vite-plus/test";
import { BASE_URL } from "~/test/helpers/launchServer";
import { expect } from "playwright/test";

describe("Blog Sitemap", () => {
  let content: string;
  let response: Response;

  beforeAll(async () => {
    response = await fetch(`${BASE_URL}blog/sitemap.md`, {
      headers: { "User-Agent": "Googlebot" },
    });
    content = await response.text();
  });

  it("should return markdown content type", () => {
    expect(response.headers.get("content-type")).toContain("text/markdown");
  });

  it("should HTTP link to /blog", () => {
    expect(response.headers.get("link")).toContain(
      '<https://rentail.space/blog>; rel="alternate"; type="text/html"',
    );
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
});
