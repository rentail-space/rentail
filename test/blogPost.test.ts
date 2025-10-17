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

import { expect, type Page } from "playwright/test";
import { beforeAll, describe, test } from "vitest";
import { goto } from "~/test/helpers/launchBrowser";

describe("Blog Post Rendering", () => {
  let page: Page;

  beforeAll(async () => {
    page = await goto("/blog/2025-07-19-ultimate-guide");
  });

  test("renders blog post with proper title and metadata", async () => {
    // Check title rendering
    const title = await page.locator("article h1").textContent();
    expect(title).toBe("A Step-by-Step Guide for First-Time Business Owners");

    // Check date formatting
    const dateElement = await page
      .locator(".text-sm.text-gray-500")
      .textContent();
    expect(dateElement).toContain("July 19, 2025");
  });

  test("renders blog post image with proper attributes", async () => {
    // Check if hero image is rendered
    const heroImage = page.locator("figure img");
    expect(heroImage).toBeVisible();

    // Check image styling classes
    const imageClasses = await heroImage.getAttribute("class");
    expect(imageClasses).toContain("w-full");
    expect(imageClasses).toContain("h-[60vh]");
    expect(imageClasses).toContain("object-cover");
  });

  test("renders markdown content with proper formatting", async () => {
    // Check for proper heading rendering
    const heading = page.locator("h2").first();
    await expect(heading).toBeVisible();
    const headingText = await heading.textContent();
    expect(headingText).toContain("Step 1:");

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

  test("handles links with proper styling", async () => {
    // Check if links are rendered with blue styling
    const links = page.locator("article a");
    if ((await links.count()) > 0) {
      const firstLink = links.first();
      const linkClasses = await firstLink.getAttribute("class");
      expect(linkClasses).toContain("underline");
    }
  });

  test("renders lists with proper indentation and styling", async () => {
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

  test("displays blog post with correct layout structure", async () => {
    // Check main article structure
    const article = page.locator("article");
    await expect(article).toBeVisible();

    // Verify the layout wrapper is present
    const layout = page.locator("body > div"); // Assuming Layout component wraps content
    await expect(layout).toBeVisible();
  });

  test("blog post visual regression test", async () => {
    // Set consistent viewport for screenshots
    await page.setViewportSize({ width: 1280, height: 720 });

    await page.reload();

    // Wait for any images to load
    await page.waitForLoadState("networkidle");

    // Take screenshot for visual regression testing
    await expect(page).toMatchScreenshot();
  });

  test("blog post is responsive on mobile viewport", async () => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.reload();
    await page.waitForLoadState("networkidle");

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
    test("handles non-existent blog posts with 404", async () => {
      const response = await page.goto("/blog/non-existent-post");
      expect(response?.status()).toEqual(404);
    });
  });

  describe("second blog post", () => {
    test("renders second blog post correctly", async () => {
      const response = await page.goto("/blog/2025-07-24-specialty-leasing");
      expect(response?.status(), "should respond with 200").toEqual(200);

      await expect(
        page.getByRole("heading", {
          name: "Specialty Leasing for Small Business",
        }),
      ).toBeVisible();

      // Check date formatting for second post
      const dateElement = await page
        .locator(".text-sm.text-gray-500")
        .textContent();
      expect(dateElement).toContain("July 24, 2025");
    });
  });
});
