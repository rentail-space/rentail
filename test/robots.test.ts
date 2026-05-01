import { expect } from "playwright/test";
import { beforeAll, describe, it } from "vitest";
import { port } from "./helpers/launchBrowser";

describe("robots.txt", () => {
  let lines: string[];
  let comments: string[];
  let statements: string[];

  beforeAll(async () => {
    const response = await fetch(`http://localhost:${port}/robots.txt`);
    const robotsContent = await response.text();
    lines = robotsContent.split("\n").filter(Boolean);
    statements = lines.filter((line) => !line.startsWith("#"));
    comments = lines.filter((line) => line.startsWith("#"));
  });

  it("should reference both sitemaps", () => {
    expect(statements).toContain("Sitemap: https://rentail.space/sitemap.xml");
    expect(statements).toContain("Sitemap: https://rentail.space/sitemap.txt");
  });

  it("should have AI bot rules before catch-all", () => {
    const agentIdx = (ua: string) => statements.indexOf(`User-agent: ${ua}`);
    const gptIdx = agentIdx("GPTBot");
    const claudeIdx = agentIdx("ClaudeBot");
    const perpIdx = agentIdx("PerplexityBot");
    const allIdx = agentIdx("*");

    expect(gptIdx).toBeGreaterThanOrEqual(0);
    expect(claudeIdx).toBeGreaterThanOrEqual(0);
    expect(perpIdx).toBeGreaterThanOrEqual(0);

    expect(gptIdx).toBeLessThan(allIdx);
    expect(claudeIdx).toBeLessThan(allIdx);
    expect(perpIdx).toBeLessThan(allIdx);
  });

  it("should allow crawling of root path", () => {
    expect(statements).toContain("Allow: /");
  });

  it("should allow all user agents", () => {
    expect(statements).toContain("User-agent: *");
  });

  it("should disallow API routes", () => {
    expect(statements).toContain("Disallow: /api/*");
  });

  it("should allow crawling of /for-ai-assistants", () => {
    // Should not be in disallow list
    expect(statements).not.toContain("Disallow: /for-ai-assistants");
  });

  it("should include API comment", () => {
    const comment = comments[0];
    expect(comment).toContain("API for AI assistants");
    expect(comment).toContain("https://rentail.space/api/query");
  });

  it("should include OpenAPI spec comment", () => {
    const comment = comments[1];
    expect(comment).toContain("OpenAPI spec");
    expect(comment).toContain("https://rentail.space/openapi.json");
  });

  it("should allow /api/query endpoint", () => {
    expect(lines).toContain("Allow: /api/query");
  });
});
