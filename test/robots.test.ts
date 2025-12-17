import { expect } from "playwright/test";
import { beforeAll, describe, it } from "vitest";

describe("robots.txt", () => {
  let robotsContent: string;

  beforeAll(async () => {
    const response = await fetch("http://localhost:5173/robots.txt");
    robotsContent = await response.text();
  });

  it("should reference sitemap.xml", () => {
    expect(robotsContent).toContain(
      "Sitemap: https://rentail.space/sitemap.xml",
    );
  });

  it("should allow crawling of root path", () => {
    expect(robotsContent).toContain("Allow: /");
  });

  it("should allow all user agents", () => {
    expect(robotsContent).toContain("User-agent: *");
  });

  it("should disallow API routes", () => {
    expect(robotsContent).toContain("Disallow: /api/*");
  });

  it("should allow crawling of /for-ai-assistants", () => {
    // Should not be in disallow list
    expect(robotsContent).not.toContain("Disallow: /for-ai-assistants");
  });
});
