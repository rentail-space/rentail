/**
 * E2E Tests for Blog Listing
 *
 * Tests ensure that the blog listing on the home page renders correctly with:
 * - List of blog posts with proper links
 * - Excerpts and titles
 * - Navigation to individual posts
 */

import { expect, type Page } from "playwright/test";
import { beforeAll, describe, it } from "vitest";
import { goto } from "~/test/helpers/launchBrowser";

describe("Blog Listing", () => {
  let page: Page;

  beforeAll(async () => {
    page = await goto("/");
  });

  it("should display blog posts on home page", async () => {
    // Check if blog posts section exists
    const blogSection = page.locator("section.blog-posts").first();
    await expect(blogSection).toBeVisible();

    // Check if blog post links are present
    const blogLinks = page.locator('a[href^="/blog/"]');
    const linkCount = await blogLinks.count();
    expect(linkCount).toBeGreaterThan(0);
  });

  it("should have proper titles and excerpts", async () => {
    // Find blog post links
    const blogLinks = page.locator('a[href^="/blog/"]');
    const linkCount = await blogLinks.count();

    if (linkCount > 0) {
      const firstLink = blogLinks.first();

      // Check for title (h2 element)
      const title = firstLink.locator("h2");
      await expect(title).toBeVisible();
      const titleText = await title.textContent();
      expect(titleText).toBeDefined();
      expect(titleText?.length).toBeGreaterThan(0);

      // Check for excerpt (p element)
      const excerpt = firstLink.locator("p");
      await expect(excerpt).toBeVisible();
      const excerptText = await excerpt.textContent();
      expect(excerptText).toBeDefined();
      expect(excerptText?.length).toBeGreaterThan(0);
    }
  });

  it("should have hover styling", async () => {
    // Check blog post links for hover classes
    const blogLinks = page.locator('a[href^="/blog/"]');
    if ((await blogLinks.count()) > 0) {
      const firstLink = blogLinks.first();
      const linkClasses = await firstLink.getAttribute("class");
      expect(linkClasses).toContain("hover:border-blue-500");
      expect(linkClasses).toContain("hover:shadow-xl");
    }
  });

  it("should display multiple blog posts if available", async () => {
    const blogLinks = page.locator('a[href^="/blog/"]');
    const linkCount = await blogLinks.count();
    expect(linkCount).toBeGreaterThan(0);
  });

  it("should match visual regression test", async () => {
    // Set consistent viewport for screenshots
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Scroll to blog section if it exists
    const blogSection = page.locator("section.blog-posts").first();
    await expect(blogSection).toBeVisible();
    await blogSection.scrollIntoViewIfNeeded();

    // Take screenshot for visual regression testing of the blog section
    await expect(blogSection).toMatchScreenshot();
  });

  describe("clicks blog post link", () => {
    beforeAll(async () => {
      await page.locator('a[href^="/blog/"]').last().click();
      await page.waitForURL(/.*\/blog\/.*/);
      await page.waitForLoadState("networkidle");
    });

    it("should navigate to blog post when clicking link", async () => {
      // Verify we're on a blog post page
      expect(page.url()).toContain("/blog/");
    });

    it("should display the blog post content", async () => {
      const article = page.locator("article");
      await expect(article).toBeVisible();
      await expect(page.locator("h1").first()).toHaveText(
        "The Birth of Rentail Space",
      );
    });
  });
});
