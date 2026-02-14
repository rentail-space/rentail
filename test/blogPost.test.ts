/**
 * E2E Tests for Blog Post Rendering
 *
 * Tests ensure that blog posts render correctly with proper:
 * - Content display (title, date, body)
 * - Image rendering and alt text
 * - Markdown formatting (headings, links, lists)
 * - Responsive layout
 * - Navigation functionality
 */

import { last } from "es-toolkit";
import { type Page, type Response, expect } from "playwright/test";
import { afterAll, beforeAll, describe, it } from "vitest";
import prisma from "~/lib/prisma.server";
import { goto, port } from "~/test/helpers/launchBrowser";

describe("Blog Post Rendering", () => {
  let page: Page;

  beforeAll(async () => {
    page = await goto("/blog/2025-12-19-why-hunkering-down-kills-momentum");
  });

  it("should render blog post with proper title and metadata", async () => {
    // Check title rendering
    const title = await page.locator("article h1").first().textContent();
    expect(title).toBe(
      "The Hermit Leader Problem: Why Hunkering Down Kills Momentum",
    );
  });

  it("should render blog post image with proper attributes", async () => {
    // Check if hero image is rendered
    const heroImage = page.locator("figure img");
    expect(heroImage).toBeVisible();

    // Check image styling classes
    const imageClasses = await heroImage.getAttribute("class");
    expect(imageClasses).toContain("w-full");
    expect(imageClasses).toContain("object-cover");
  });

  it("should render markdown content with proper formatting", async () => {
    // Check for proper heading rendering
    const heading = page.locator("h2").first();
    await expect(heading).toBeVisible();

    // Check paragraph styling
    const paragraphs = page.locator("article p");
    await expect(paragraphs.first()).toBeVisible();

    // Verify prose styling is applied
    const article = page.locator("article");
    const articleClasses = await article.getAttribute("class");
    expect(articleClasses).toContain("prose");
    expect(articleClasses).toContain("prose-lg");
    expect(articleClasses).toContain("mx-auto");
  });

  it("should handle links with proper styling", async () => {
    // Check if links are rendered with blue styling
    const links = page.locator("article a");
    if ((await links.count()) > 0) {
      const firstLink = links.first();
      const linkClasses = await firstLink.getAttribute("class");
      expect(linkClasses).toContain("underline");
    }
  });

  it("should render lists with proper indentation and styling", async () => {
    // Check for ordered lists
    const orderedLists = page.locator("article ol");
    if ((await orderedLists.count()) > 0) {
      const firstOL = orderedLists.first();
      const olClasses = await firstOL.getAttribute("class");
      expect(olClasses).toContain("list-decimal");
    }

    // Check for unordered lists
    const unorderedLists = page.locator("article ul");
    if ((await unorderedLists.count()) > 0) {
      const firstUL = unorderedLists.first();
      const ulClasses = await firstUL.getAttribute("class");
      expect(ulClasses).toContain("list-disc");
    }
  });

  it("should display blog post with correct layout structure", async () => {
    // Check main article structure
    const article = page.locator("article");
    await expect(article).toBeVisible();

    // Verify the layout wrapper is present
    const layout = page.locator("body > div"); // Assuming Layout component wraps content
    await expect(layout).toBeVisible();
  });

  it("should have a section FAQ with 4 question items", async () => {
    const faq = page.locator("h2", { hasText: "FAQ" });
    await expect(faq).toBeVisible();
    const items = page.locator("h2:has-text('FAQ') ~ h3");
    await expect(items).toHaveCount(4);
  });

  it("should match inner HTML", async () => {
    await expect(page.locator("article")).toMatchInnerHTML();
  });

  it("should match visual regression test", async () => {
    await expect(page.locator("article")).toMatchScreenshot();
  });

  it("should be responsive on mobile viewport", async () => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();

    // Check that content is still visible and properly formatted
    const article = page.locator("article");
    await expect(article).toBeVisible();

    // Verify responsive prose classes
    const articleClasses = await article.getAttribute("class");
    expect(articleClasses).toContain("prose");
    expect(articleClasses).toContain("mx-auto");

    // Check that image is responsive
    const heroImage = page.locator("figure img");
    if (await heroImage.isVisible()) {
      const imageClasses = await heroImage.getAttribute("class");
      expect(imageClasses).toContain("w-full");
    }
  });

  it("should link to Markdown version of the blog post", async () => {
    const link = page.locator(
      "head > link[href$='/blog/2025-12-19-why-hunkering-down-kills-momentum.md']",
    );
    await expect(link).toHaveAttribute("rel", "alternate");
    await expect(link).toHaveAttribute("type", "text/markdown");
    await expect(link).toHaveAttribute(
      "href",
      "https://rentail.space/blog/2025-12-19-why-hunkering-down-kills-momentum.md",
    );
  });

  describe("404", () => {
    let response: Response | null;

    beforeAll(async () => {
      response = await page.goto("/blog/non-existent-post");
    });

    it("should handle non-existent blog posts with 404", async () => {
      expect(response?.status(), "should respond with 404").toEqual(404);
    });
  });

  describe("second blog post", () => {
    let response: Response | null;

    beforeAll(async () => {
      response = await page.goto("/blog/2025-11-07-ultimate-guide");
    });

    it("should respond with 200", async () => {
      expect(response?.status(), "should respond with 200").toEqual(200);
    });

    it("should render second blog post correctly", async () => {
      await expect(
        page.getByRole("heading", {
          name: "The Ultimate Guide",
        }),
      ).toBeVisible();
    });
  });

  describe("Markdown version of the blog post", () => {
    let content: string;
    let headers: Headers;

    beforeAll(async () => {
      await prisma.botVisit.deleteMany();
      const response = await fetch(
        `http://localhost:${port}/blog/2025-12-19-why-hunkering-down-kills-momentum.md`,
        { headers: { "User-Agent": "Googlebot" } },
      );
      content = await response.text();
      headers = response.headers;
    });

    it("should return markdown content type", () => {
      expect(headers.get("content-type")).toContain("text/markdown");
    });

    it("should HTTP link to /blog", () => {
      expect(headers.get("link")).toContain(
        '<https://rentail.space/blog/2025-12-19-why-hunkering-down-kills-momentum>; rel="alternate"; type="text/html"',
      );
    });

    it("should include blog post title", () => {
      const lines = content.split("\n");
      expect(lines[0]).toBe(
        "# The Hermit Leader Problem: Why Hunkering Down Kills Momentum",
      );
    });

    it("should include published date", () => {
      expect(content).toContain("**Published:** Friday, December 19, 2025");
    });

    it("should include image with alt text", () => {
      const parts = content.split("---").filter(Boolean);
      const image = parts[1].match(/!\[([^\]]*)\]\(([^)]+)\)/);
      expect(image?.[1]).toBe(
        "Row of matches with one burnt match among unlit ones, representing leader burnout and withdrawal that extinguishes team momentum while others remain ready to ignite",
      );
      expect(image?.[2]).toMatch(/^\/blog\/2025-12-19-matches\.jpg$/);
    });

    it("should allow downloading the image with fetch and confirm it's a JPEG", async () => {
      // Extract image URL from the blog post markdown
      const imgMatch = content.match(/!\[[^\]]*\]\(([^)]+)\)/);
      expect(imgMatch, "should find image URL").toBeTruthy();

      const imageUrl = imgMatch?.[1];
      expect(imageUrl).toMatch(/^\/blog\/2025-12-19-matches\.jpg$/);

      // Download image from local server
      const imageResponse = await fetch(`http://localhost:${port}${imageUrl}`);
      expect(imageResponse.ok).toBe(true);

      const contentType = imageResponse.headers.get("content-type");
      expect(contentType).toMatch(/^image\/jpeg/);

      // Optionally, check a JPEG magic number (0xFFD8FFE0)
      const buffer = new Uint8Array(await imageResponse.arrayBuffer());
      expect(buffer[0]).toBe(0xff);
      expect(buffer[1]).toBe(0xd8);
      // 3rd byte may vary (FFE0 - FFE8), only check start
      expect(buffer[2]).toBe(0xff);
    });

    it("should include blog post body content", () => {
      const parts = content.split("---").filter(Boolean);
      expect(parts[1]).toContain(
        "Missed sales target. Key hire quits. Product launch flops.",
      );
    });

    it("should include link back to sitemap", () => {
      const parts = content.split("---").filter(Boolean);
      expect(last(parts)).toContain(
        "**More blog posts:** [All blog posts](/blog/sitemap.md)",
      );
    });

    it("track blog post visit", async () => {
      const visits = await prisma.botVisit.findMany();
      expect(visits).toHaveLength(1);
      expect(visits[0].path).toBe(
        "/blog/2025-12-19-why-hunkering-down-kills-momentum.md",
      );
    });
  });

  afterAll(async () => {
    await page?.close();
  });
});
