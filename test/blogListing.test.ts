/**
 * E2E Tests for Blog Listing
 *
 * Tests ensure that the blog listing on the home page renders correctly with:
 * - List of blog posts with proper links
 * - Excerpts and titles
 * - Navigation to individual posts
 */

import { type Locator, type Page, expect } from "playwright/test";
import { afterAll, beforeAll, describe, it } from "vitest";
import { goto } from "~/test/helpers/launchBrowser";

describe("Blog Listing", () => {
  let page: Page;
  let blogSection: Locator;

  beforeAll(async () => {
    page = await goto("/blog");
    blogSection = page.locator("section.blog-posts").first();
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

  it("should display multiple blog posts if available", async () => {
    const blogLinks = page.locator('a[href^="/blog/"]');
    const linkCount = await blogLinks.count();
    expect(linkCount).toBeGreaterThan(0);
  });

  it("should match inner HTML", async () => {
    await expect(blogSection).toMatchInnerHTML();
  });

  it("should match visual regression test", async () => {
    await expect(blogSection).toMatchScreenshot();
  });

  describe("clicks blog post link", () => {
    beforeAll(async () => {
      await page.goto("/");
      await page
        .locator('a[href^="/blog/2025-11-07-ultimate-guide"]')
        .last()
        .click();
      await page.waitForURL(/.*\/blog\/.*/);
    });

    it("should navigate to blog post when clicking link", async () => {
      // Verify we're on a blog post page
      expect(page.url()).toContain("/blog/2025-11-07-ultimate-guide");
    });

    it("should display the blog post content", async () => {
      // Wait for article to appear on the page
      await page.waitForSelector("article");
      const article = page.locator("article");
      await expect(article).toBeVisible();
      const h1 = page.locator("h1").first();
      await expect(h1).toBeVisible();
      await expect(h1).toHaveText("The Ultimate Guide");
    });
  });

  afterAll(async () => {
    await page?.close();
  });
});
