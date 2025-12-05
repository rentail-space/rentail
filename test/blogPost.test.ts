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

import { type Page, type Response, expect } from "playwright/test";
import { afterAll, beforeAll, describe, it } from "vitest";
import { goto } from "~/test/helpers/launchBrowser";

describe("Blog Post Rendering", () => {
  let page: Page;

  beforeAll(async () => {
    page = await goto("/blog/2025-10-31-the-name");
  });

  it("should render blog post with proper title and metadata", async () => {
    // Check title rendering
    const title = await page.locator("article h1").textContent();
    expect(title).toBe("The Birth of Rentail Space");
  });

  it("should render blog post image with proper attributes", async () => {
    // Check if hero image is rendered
    const heroImage = page.locator("figure img");
    expect(heroImage).toBeVisible();

    // Check image styling classes
    const imageClasses = await heroImage.getAttribute("class");
    expect(imageClasses).toContain("w-full");
    expect(imageClasses).toContain("h-[60vh]");
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
    await page.waitForLoadState("load");

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

  describe("non-existent blog post", () => {
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

  afterAll(async () => {
    await page?.close();
  });
});
