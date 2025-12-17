import { XMLParser } from "fast-xml-parser";
import { expect } from "playwright/test";
import { beforeAll, describe, it } from "vitest";
import { port } from "./helpers/launchBrowser";

describe("sitemap.xml", () => {
  let sitemapContent: string;
  let xml: { urlset: { url: { loc: string }[] } };

  beforeAll(async () => {
    const response = await fetch(`http://localhost:${port}/sitemap.xml`);
    sitemapContent = await response.text();

    const parser = new XMLParser();
    xml = parser.parse(sitemapContent);
  });

  it("should be valid XML", () => {
    expect(sitemapContent).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toHaveProperty("urlset");
    expect(xml.urlset).toHaveProperty("url");
  });

  it("should include homepage", () => {
    expect(xml.urlset.url).toContainEqual({ loc: "https://rentail.space/" });
  });

  it("should include /for-ai-assistants page", () => {
    expect(xml.urlset.url).toContainEqual({
      loc: "https://rentail.space/for-ai-assistants",
    });
  });

  it("should include glossary page", () => {
    expect(xml.urlset.url).toContainEqual({
      loc: "https://rentail.space/glossary",
    });
  });

  it("should include FAQ page", () => {
    expect(xml.urlset.url).toContainEqual({ loc: "https://rentail.space/faq" });
  });

  it("should include states page", () => {
    expect(xml.urlset.url).toContainEqual({
      loc: "https://rentail.space/states",
    });
  });

  it("should include /api/query in sitemap", () => {
    expect(xml.urlset.url).toContainEqual({
      loc: "https://rentail.space/api/query",
    });
  });

  it("should include /openapi.json in sitemap", () => {
    expect(xml.urlset.url).toContainEqual({
      loc: "https://rentail.space/openapi.json",
    });
  });
});
