/**
 * E2E Tests for Blog Listing
 *
 * Tests ensure that the blog listing on the home page renders correctly with:
 * - List of blog posts with proper links
 * - Excerpts and titles
 * - Navigation to individual posts
 */

import { delay } from "es-toolkit";
import { expect, type Page } from "playwright/test";
import { afterAll, beforeAll, describe, it } from "vitest";
import { goto } from "~/test/helpers/launchBrowser";

describe("Blog Listing", () => {
  let page: Page;

  beforeAll(async () => {
    page = await goto("/");
  });

  it("displays blog posts on home page", async () => {
    // Check if blog posts section exists
    const blogSection = page.locator("section.blog-posts-section").first();
    await expect(blogSection).toBeVisible();

    // Check if blog post links are present
    const blogLinks = page.locator('a[href^="/blog/"]');
    const linkCount = await blogLinks.count();
    expect(linkCount).toBeGreaterThan(0);
  });

  it("blog post links have proper titles and excerpts", async () => {
    // Find blog post links
    const blogLinks = page.locator('a[href^="/blog/"]');
    const linkCount = await blogLinks.count();

    if (linkCount > 0) {
      const firstLink = blogLinks.first();

      // Check for title (h4 element)
      const title = firstLink.locator("h4");
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

  it("blog links have hover styling", async () => {
    // Check blog post links for hover classes
    const blogLinks = page.locator('a[href^="/blog/"]');
    if ((await blogLinks.count()) > 0) {
      const firstLink = blogLinks.first();
      const linkClasses = await firstLink.getAttribute("class");
      expect(linkClasses).toContain("link");
      expect(linkClasses).toContain("link-hover");
    }
  });

  it("displays multiple blog posts if available", async () => {
    // Count blog post links
    const blogLinks = page.locator('a[href^="/blog/"]');
    const linkCount = await blogLinks.count();

    // We know there are at least 2 blog posts from the file structure
    expect(linkCount).toBeGreaterThanOrEqual(2);

    // Verify each link has a unique href
    const hrefs = new Set();
    for (let i = 0; i < linkCount; i++) {
      const href = await blogLinks.nth(i).getAttribute("href");
      expect(href).toBeDefined();
      expect(hrefs.has(href)).toBe(false);
      hrefs.add(href);
    }
  });

  it("blog listing visual regression test", async () => {
    // Set consistent viewport for screenshots
    await page.setViewportSize({ width: 1280, height: 720 });

    await page.reload();
    await page.waitForLoadState("networkidle");

    // Scroll to blog section if it exists
    const blogSection = page.locator("section.blog-posts-section").first();
    expect(blogSection).toBeVisible();
    await blogSection.scrollIntoViewIfNeeded();

    // Take screenshot for visual regression testing of the blog section
    await expect(blogSection).toMatchScreenshot();
  });

  describe("clicks blog post link", () => {
    beforeAll(async () => {
      const firstBlogLink = page.locator('a[href^="/blog/"]').first();
      await expect(firstBlogLink).toBeVisible();
      await firstBlogLink.click();
    });

    it("navigates to blog post when clicking link", async () => {
      // Wait for navigation to complete
      await page.waitForURL(/.*\/blog\/.*/, { timeout: 10000 });

      // Verify we're on a blog post page
      expect(page.url()).toContain("/blog/");

      // Verify blog post content is loaded
      const article = page.locator("article");
      await expect(article).toBeVisible();

      const title = page.locator("article h1");
      await expect(title).toBeVisible();
    });

    afterAll(async () => {
      await delay(10000);
    });
  });
});
