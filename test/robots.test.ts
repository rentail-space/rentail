import { expect } from "playwright/test";
import { beforeAll, describe, it } from "vitest";
import { port } from "./helpers/launchBrowser";

describe("robots.txt", () => {
  let lines: string[];

  beforeAll(async () => {
    const response = await fetch(`http://localhost:${port}/robots.txt`);
    const robotsContent = await response.text();
    lines = robotsContent.split("\n").filter(Boolean);
  });

  it("should reference sitemap.xml", () => {
    expect(lines).toContain("Sitemap: https://rentail.space/sitemap.xml");
  });

  it("should allow crawling of root path", () => {
    expect(lines).toContain("Allow: /");
  });

  it("should allow all user agents", () => {
    expect(lines).toContain("User-agent: *");
  });

  it("should disallow API routes", () => {
    expect(lines).toContain("Disallow: /api/*");
  });

  it("should allow crawling of /for-ai-assistants", () => {
    // Should not be in disallow list
    expect(lines).not.toContain("Disallow: /for-ai-assistants");
  });
});
