/**
 * Tests for markdown content negotiation routes.
 *
 * Every HTML page serves a .md version at {path}.md and redirects to it
 * when Accept: text/markdown is set. This suite verifies both paths.
 */

import { expect } from "playwright/test";
import { beforeAll, describe, it } from "vitest";
import { port } from "~/test/helpers/launchBrowser";

const BASE = `http://localhost:${port}`;
const MD_HEADER = "text/markdown";

async function fetchMd(path: string) {
  return fetch(`${BASE}${path}`, {
    headers: { "User-Agent": "Googlebot" },
  });
}

async function fetchHtmlWithAccept(path: string) {
  return fetch(`${BASE}${path}`, {
    headers: {
      accept: "text/markdown",
      "User-Agent": "Googlebot",
    },
    redirect: "manual",
  });
}

// ── Static markdown routes ──────────────────────────────────────────────

function mdRouteTests(
  label: string,
  path: string,
  htmlLink: string,
  ...contentChecks: string[]
) {
  describe(`${path}`, () => {
    let response: Response;
    let body: string;

    beforeAll(async () => {
      response = await fetchMd(path);
      body = await response.text();
    });

    it("should return 200", () => {
      expect(response.status).toBe(200);
    });

    it("should return text/markdown content type", () => {
      expect(response.headers.get("content-type")).toContain(MD_HEADER);
    });

    it("should have Link header pointing to HTML version", () => {
      const link = response.headers.get("link");
      expect(link).toContain(`<${htmlLink}>`);
      expect(link).toContain('rel="alternate"');
      expect(link).toContain('type="text/html"');
    });

    for (const check of contentChecks) {
      it(`should contain "${check}"`, () => {
        expect(body).toContain(check);
      });
    }
  });
}

mdRouteTests(
  "About",
  "/about.md",
  "https://rentail.space/about",
  "# Making retail space accessible for everyone",
  "Assaf Arkin",
);
mdRouteTests(
  "Benefits",
  "/benefits.md",
  "https://rentail.space/benefits",
  "# Why Smart Retailers Choose Rentail.space",
  "No Broker Fees",
);
mdRouteTests(
  "FAQ",
  "/faq.md",
  "https://rentail.space/faq",
  "# Frequently Asked Questions",
  "Still have questions?",
);
mdRouteTests(
  "Glossary",
  "/glossary.md",
  "https://rentail.space/glossary",
  "# Specialty Leasing Glossary",
  "This glossary is maintained by",
);
mdRouteTests(
  "Pricing",
  "/pricing.md",
  "https://rentail.space/pricing",
  "# Simple, transparent pricing",
  "15% commission",
);
mdRouteTests("Privacy", "/privacy.md", "https://rentail.space/privacy", "", "");
mdRouteTests("Terms", "/terms.md", "https://rentail.space/terms", "", "");
mdRouteTests(
  "States",
  "/states.md",
  "https://rentail.space/states",
  "# US States",
  "Browse specialty leasing",
);
mdRouteTests(
  "For AI Assistants",
  "/for-ai-assistants.md",
  "https://rentail.space/for-ai-assistants",
  "**For AI Assistants**",
  "Blog Sitemap",
);

// ── Dynamic markdown routes ─────────────────────────────────────────────

describe("Dynamic markdown routes", () => {
  describe("/state/ca.md", () => {
    let body: string;

    beforeAll(async () => {
      const res = await fetchMd("/state/ca.md");
      expect(res.status).toBe(200);
      body = await res.text();
    });

    it("should have state title", () => {
      expect(body).toContain("# California");
    });

    it("should have content", () => {
      expect(body).toContain("California runs");
    });

    it("should list centers", () => {
      expect(body).toContain("## Shopping Centers");
    });
  });

  describe("/center/ca-los-cerritos-center.md", () => {
    let body: string;
    let response: Response;

    beforeAll(async () => {
      response = await fetchMd("/center/ca-los-cerritos-center.md");
      body = await response.text();
    });

    it("should return 200", () => {
      expect(response.status).toBe(200);
    });

    it("should return text/markdown", () => {
      expect(response.headers.get("content-type")).toContain(MD_HEADER);
    });

    it("should have Link header", () => {
      const link = response.headers.get("link");
      expect(link).toContain(
        "<https://rentail.space/center/ca-los-cerritos-center>",
      );
    });

    it("should have center name as heading", () => {
      expect(body).toContain("# Los Cerritos Center");
    });

    it("should include address", () => {
      expect(body).toContain("**Address:**");
    });

    it("should include description section", () => {
      expect(body).toContain("## Description");
    });
  });

  describe("/city/ca-los-angeles.md", () => {
    let response: Response;
    let body: string;

    beforeAll(async () => {
      response = await fetchMd("/city/ca-los-angeles.md");
      body = await response.text();
    });

    it("should return 200", () => {
      expect(response.status).toBe(200);
    });

    it("should have city heading", () => {
      expect(body).toContain("# Los Angeles, CA");
    });

    it("should have Link header", () => {
      const link = response.headers.get("link");
      expect(link).toContain("<https://rentail.space/city/ca-los-angeles>");
    });
  });

  describe("/county/ca-los-angeles-county.md", () => {
    let response: Response;
    let body: string;

    beforeAll(async () => {
      response = await fetchMd("/county/ca-los-angeles-county.md");
      body = await response.text();
    });

    it("should return 200", () => {
      expect(response.status).toBe(200);
    });

    it("should have county heading", () => {
      expect(body).toContain("# Los Angeles County");
    });

    it("should have Link header", () => {
      const link = response.headers.get("link");
      expect(link).toContain(
        "<https://rentail.space/county/ca-los-angeles-county>",
      );
    });

    it("should have cities section", () => {
      expect(body).toContain("## Cities");
    });
  });

  describe("/metro/ca-los-angeles-long-beach-anaheim.md", () => {
    let response: Response;
    let body: string;

    beforeAll(async () => {
      response = await fetchMd("/metro/ca-los-angeles-long-beach-anaheim.md");
      body = await response.text();
    });

    it("should return 200", () => {
      expect(response.status).toBe(200);
    });

    it("should have metro heading", () => {
      expect(body).toContain("# Los Angeles-Long Beach-Anaheim Metro Area");
    });

    it("should have Link header", () => {
      const link = response.headers.get("link");
      expect(link).toContain(
        "<https://rentail.space/metro/ca-los-angeles-long-beach-anaheim>",
      );
    });

    it("should have Browse by Area section", () => {
      expect(body).toContain("## Browse by Area");
    });
  });

  describe("/regional/ca-bay-area.md", () => {
    let response: Response;
    let body: string;

    beforeAll(async () => {
      response = await fetchMd("/regional/ca-bay-area.md");
      body = await response.text();
    });

    it("should return 200", () => {
      expect(response.status).toBe(200);
    });

    it("should have regional heading", () => {
      expect(body).toContain("# Bay Area");
    });

    it("should have Link header", () => {
      const link = response.headers.get("link");
      expect(link).toContain("<https://rentail.space/regional/ca-bay-area>");
    });
  });

  describe("blog/sitemap.md", () => {
    let response: Response;
    let body: string;

    beforeAll(async () => {
      response = await fetchMd("/blog/sitemap.md");
      body = await response.text();
    });

    it("should return 200", () => {
      expect(response.status).toBe(200);
    });

    it("should have sitemap title", () => {
      expect(body).toContain("# Rentail Blog Sitemap");
    });

    it("should list blog posts", () => {
      expect(body).toMatch(/\[.*\]\(\/blog\/[^\s]+\)/);
    });
  });

  describe("news/sitemap.md", () => {
    let response: Response;
    let body: string;

    beforeAll(async () => {
      response = await fetchMd("/news/sitemap.md");
      body = await response.text();
    });

    it("should return 200", () => {
      expect(response.status).toBe(200);
    });

    it("should have sitemap title", () => {
      expect(body).toContain("# Rentail News Sitemap");
    });

    it("should list news items", () => {
      expect(body).toMatch(/\[.*\]\(\/news\/[^\s]+\)/);
    });
  });

  describe("blog post .md", () => {
    let response: Response;
    let body: string;

    beforeAll(async () => {
      response = await fetchMd(
        "/blog/2025-12-19-why-hunkering-down-kills-momentum.md",
      );
      body = await response.text();
    });

    it("should return 200", () => {
      expect(response.status).toBe(200);
    });

    it("should have blog post title", () => {
      expect(body).toContain("# The Hermit Leader Problem");
    });

    it("should have published date", () => {
      expect(body).toContain("**Published:**");
    });
  });

  describe("news post .md", () => {
    let response: Response;
    let body: string;

    beforeAll(async () => {
      response = await fetchMd("/news/2026-01-20-launch.md");
      body = await response.text();
    });

    it("should return 200", () => {
      expect(response.status).toBe(200);
    });

    it("should have news title", () => {
      expect(body).toContain("# Rentail.space Launches");
    });

    it("should have published date", () => {
      expect(body).toContain("**Published:**");
    });
  });
});

// ── Accept header → inline markdown ──────────────────────────────────────

describe("Accept: text/markdown serves inline markdown", () => {
  const paths = [
    { path: "/", title: "# Rentail.space" },
    { path: "/about", title: "# Making retail space accessible" },
    { path: "/benefits", title: "# Why Smart Retailers" },
    { path: "/faq", title: "# Frequently Asked Questions" },
    { path: "/glossary", title: "# Specialty Leasing Glossary" },
    { path: "/pricing", title: "# Simple, transparent pricing" },
    { path: "/privacy", title: "# Privacy Policy" },
    { path: "/terms", title: "# Terms of Service" },
    { path: "/states", title: "# US States" },
    { path: "/state/ca", title: "# California" },
    { path: "/for-ai-assistants", title: "For AI Assistants" },
    {
      path: "/center/ca-los-cerritos-center",
      title: "# Los Cerritos Center",
    },
    { path: "/city/ca-los-angeles", title: "Los Angeles" },
  ];

  for (const { path, title } of paths) {
    it(`should serve markdown for ${path}`, async () => {
      const res = await fetchHtmlWithAccept(path);
      expect(res.status).toBe(200);
      expect(res.headers.get("content-type")).toBe("text/markdown");
      const body = await res.text();
      expect(body).toContain(title);
    });
  }
});

// ── Link header on HTML pages ────────────────────────────────────────────

describe("HTML pages link to .md alternate", () => {
  const linkCases = [
    { path: "/about", expected: "<https://rentail.space/about.md>" },
    { path: "/benefits", expected: "<https://rentail.space/benefits.md>" },
    { path: "/faq", expected: "<https://rentail.space/faq.md>" },
    { path: "/glossary", expected: "<https://rentail.space/glossary.md>" },
    { path: "/pricing", expected: "<https://rentail.space/pricing.md>" },
    { path: "/privacy", expected: "<https://rentail.space/privacy.md>" },
    { path: "/terms", expected: "<https://rentail.space/terms.md>" },
    { path: "/states", expected: "<https://rentail.space/states.md>" },
    { path: "/state/ca", expected: "<https://rentail.space/state/ca.md>" },
    {
      path: "/center/ca-los-cerritos-center",
      expected: "<https://rentail.space/center/ca-los-cerritos-center.md>",
    },
    {
      path: "/city/ca-los-angeles",
      expected: "<https://rentail.space/city/ca-los-angeles.md>",
    },
  ];

  for (const { path, expected } of linkCases) {
    it(`should have Link header on ${path}`, async () => {
      const res = await fetch(`${BASE}${path}`, {
        headers: { "User-Agent": "Googlebot" },
      });
      const link = res.headers.get("link");
      expect(link).toContain(expected);
      expect(link).toContain('rel="alternate"');
      expect(link).toContain('type="text/markdown"');
    });
  }
});

// ── 404 on unknown .md paths ─────────────────────────────────────────────

describe("Unknown .md paths", () => {
  it("should return 404 for non-existent page", async () => {
    const res = await fetchMd("/nonexistent-page.md");
    expect(res.status).toBe(404);
  });

  it("should return 404 for non-existent state", async () => {
    const res = await fetchMd("/state/xx.md");
    expect(res.status).toBe(404);
  });

  it("should return 404 for non-existent center", async () => {
    const res = await fetchMd("/center/nonexistent.md");
    expect(res.status).toBe(404);
  });

  it("should return 404 for non-existent city", async () => {
    const res = await fetchMd("/city/nonexistent.md");
    expect(res.status).toBe(404);
  });

  it("should return 404 for non-existent county", async () => {
    const res = await fetchMd("/county/nonexistent.md");
    expect(res.status).toBe(404);
  });

  it("should return 404 for non-existent metro", async () => {
    const res = await fetchMd("/metro/nonexistent.md");
    expect(res.status).toBe(404);
  });

  it("should return 404 for non-existent regional", async () => {
    const res = await fetchMd("/regional/nonexistent.md");
    expect(res.status).toBe(404);
  });

  it("should return 404 for non-existent blog post", async () => {
    const res = await fetchMd("/blog/nonexistent.md");
    expect(res.status).toBe(404);
  });

  it("should return 404 for non-existent news item", async () => {
    const res = await fetchMd("/news/nonexistent.md");
    expect(res.status).toBe(404);
  });
});

// ── Homepage index.md ───────────────────────────────────────────────────

describe("Homepage markdown (/index.md)", () => {
  let response: Response;
  let body: string;

  beforeAll(async () => {
    response = await fetchMd("/index.md");
    body = await response.text();
  });

  it("should return 200", () => {
    expect(response.status).toBe(200);
  });

  it("should have page title", () => {
    expect(body).toContain("# Rentail.space");
  });

  it("should have features section", () => {
    expect(body).toContain("## Features");
  });

  it("should have services section", () => {
    expect(body).toContain("## Services");
  });

  it("should have quick links", () => {
    expect(body).toContain("## Quick Links");
  });

  it("should have Link header pointing to HTML version", () => {
    const link = response.headers.get("link");
    expect(link).toContain("<https://rentail.space/>");
  });
});
