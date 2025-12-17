import { expect } from "playwright/test";
import { beforeAll, describe, it } from "vitest";

describe("sitemap.xml", () => {
  let sitemapContent: string;

  beforeAll(async () => {
    const response = await fetch("http://localhost:5173/sitemap.xml");
    sitemapContent = await response.text();
  });

  it("should be valid XML", () => {
    expect(sitemapContent).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(sitemapContent).toContain("<urlset");
    expect(sitemapContent).toContain("</urlset>");
  });

  it("should include homepage", () => {
    expect(sitemapContent).toContain("<loc>https://rentail.space/</loc>");
  });

  it("should include /for-ai-assistants page", () => {
    expect(sitemapContent).toContain(
      "<loc>https://rentail.space/for-ai-assistants</loc>",
    );
  });

  it("should include glossary page", () => {
    expect(sitemapContent).toContain(
      "<loc>https://rentail.space/glossary</loc>",
    );
  });

  it("should include FAQ page", () => {
    expect(sitemapContent).toContain("<loc>https://rentail.space/faq</loc>");
  });

  it("should include states page", () => {
    expect(sitemapContent).toContain("<loc>https://rentail.space/states</loc>");
  });
});
