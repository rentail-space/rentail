/**
 * E2E Tests for News Sitemap
 *
 * Tests ensure that the news sitemap renders correctly with:
 * - Markdown format for AI agents
 * - Links to all news items
 * - Proper date formatting
 * - First news item is accessible
 */

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

  it("should HTTP link to /news", () => {
    expect(response.headers.get("link")).toContain(
      '<https://rentail.space/news>; rel="alternate"; type="text/html"',
    );
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

  it("should include link back to For AI Assistants", () => {
    const parts = content.split("---").filter(Boolean);
    expect(parts[2]).toContain("[For AI Assistants](/for-ai-assistants.md)");
  });
});
