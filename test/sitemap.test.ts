import { beforeAll, describe, it } from "vite-plus/test";
import { XMLParser } from "fast-xml-parser";
import { BASE_URL } from "./helpers/launchServer";
import { expect } from "playwright/test";

describe("sitemap.xml", () => {
  let xml: { urlset: { url: { loc: string }[] } };

  beforeAll(async () => {
    const response = await fetch(`${BASE_URL}sitemap.xml`);
    const sitemapContent = await response.text();
    const parser = new XMLParser();
    xml = parser.parse(sitemapContent);
  });

  it("should be valid XML", () => {
    expect(xml).toHaveProperty("urlset");
    expect(xml.urlset).toHaveProperty("url");
  });

  it("should include homepage", () => {
    expect(xml.urlset.url.map((u) => u.loc)).toContain(
      "https://rentail.space/",
    );
  });

  it("should include /for-ai-assistants page", () => {
    expect(xml.urlset.url.map((u) => u.loc)).toContain(
      "https://rentail.space/for-ai-assistants",
    );
  });

  it("should include glossary page", () => {
    expect(xml.urlset.url.map((u) => u.loc)).toContain(
      "https://rentail.space/glossary",
    );
  });

  it("should include FAQ page", () => {
    expect(xml.urlset.url.map((u) => u.loc)).toContain(
      "https://rentail.space/faq",
    );
  });

  it("should include states page", () => {
    expect(xml.urlset.url.map((u) => u.loc)).toContain(
      "https://rentail.space/states",
    );
  });

  it("should include /api/query in sitemap", () => {
    expect(xml.urlset.url.map((u) => u.loc)).toContain(
      "https://rentail.space/api/query",
    );
  });

  it("should include /openapi.json in sitemap", () => {
    expect(xml.urlset.url.map((u) => u.loc)).toContain(
      "https://rentail.space/openapi.json",
    );
  });

  it("should include /benefits in sitemap", () => {
    expect(xml.urlset.url.map((u) => u.loc)).toContain(
      "https://rentail.space/benefits",
    );
  });

  it("should include /pricing in sitemap", () => {
    expect(xml.urlset.url.map((u) => u.loc)).toContain(
      "https://rentail.space/pricing",
    );
  });
});

describe("sitemap.txt", () => {
  let urls: string[];

  beforeAll(async () => {
    const response = await fetch(`${BASE_URL}sitemap.txt`);
    const content = await response.text();
    urls = content.trim().split("\n");
  });

  it("should return text/plain", async () => {
    const response = await fetch(`${BASE_URL}sitemap.txt`);
    expect(response.headers.get("content-type")).toBe("text/plain");
  });

  it("should include homepage", () => {
    expect(urls).toContain("https://rentail.space/");
  });

  it("should include /for-ai-assistants", () => {
    expect(urls).toContain("https://rentail.space/for-ai-assistants");
  });

  it("should include /api/query", () => {
    expect(urls).toContain("https://rentail.space/api/query");
  });

  it("should include /openapi.json", () => {
    expect(urls).toContain("https://rentail.space/openapi.json");
  });

  it("should have same number of URLs as xml sitemap", async () => {
    const xmlResponse = await fetch(`${BASE_URL}sitemap.xml`);
    const parser = new XMLParser();
    const xml = parser.parse(await xmlResponse.text());
    expect(urls.length).toBe(xml.urlset.url.length);
  });
});
