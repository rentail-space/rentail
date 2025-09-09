/**
 * E2E Tests for Blog Listing
 *
 * Tests ensure that the blog listing on the home page renders correctly with:
 * - List of blog posts with proper links
 * - Excerpts and titles
 * - Navigation to individual posts
 */

import { expect } from "playwright/test";
import { describe, it } from "vitest";
import { launchBrowser, URL } from "./helpers/launchBrowser";

describe("Blog Listing", () => {
  it("displays blog posts on home page", async () => {
    const page = await launchBrowser();
    const response = await page.goto(URL);

    expect(response?.status(), "should respond with 200").toEqual(200);

    // Check if blog posts section exists
    const blogSection = page.locator("section.prose").first();
    await expect(blogSection).toBeVisible();

    // Check if blog post links are present
    const blogLinks = page.locator('a[href^="/blog/"]');
    const linkCount = await blogLinks.count();
    expect(linkCount).toBeGreaterThan(0);

    await page.close();
  });

  it("blog post links have proper titles and excerpts", async () => {
    const page = await launchBrowser();
    await page.goto(URL);

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

    await page.close();
  });

  it("navigates to blog post when clicking link", async () => {
    const page = await launchBrowser();
    await page.goto(URL);

    // Find first blog post link
    const firstBlogLink = page.locator('a[href^="/blog/"]').first();
    await expect(firstBlogLink).toBeVisible();

    // Get the href to verify navigation
    const href = await firstBlogLink.getAttribute("href");
    expect(href).toMatch(/^\/blog\/.+/);

    // Click the link
    await firstBlogLink.click();

    // Wait for navigation to complete
    await page.waitForURL(/.*\/blog\/.*/, { timeout: 10000 });

    // Verify we're on a blog post page
    expect(page.url()).toContain("/blog/");

    // Verify blog post content is loaded
    const article = page.locator("article");
    await expect(article).toBeVisible();

    const title = page.locator("article h1");
    await expect(title).toBeVisible();

    await page.close();
  });

  it("blog listing has proper prose styling", async () => {
    const page = await launchBrowser();
    await page.goto(URL);

    // Check blog section styling
    const blogSection = page.locator("section.prose").first();
    if (await blogSection.isVisible()) {
      const sectionClasses = await blogSection.getAttribute("class");
      expect(sectionClasses).toContain("prose-xl");
      expect(sectionClasses).toContain("min-w-4xl");
      expect(sectionClasses).toContain("mx-auto");
    }

    await page.close();
  });

  it("blog links have hover styling", async () => {
    const page = await launchBrowser();
    await page.goto(URL);

    // Check blog post links for hover classes
    const blogLinks = page.locator('a[href^="/blog/"]');
    if ((await blogLinks.count()) > 0) {
      const firstLink = blogLinks.first();
      const linkClasses = await firstLink.getAttribute("class");
      expect(linkClasses).toContain("link");
      expect(linkClasses).toContain("link-hover");
    }

    await page.close();
  });

  it("displays multiple blog posts if available", async () => {
    const page = await launchBrowser();
    await page.goto(URL);

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

    await page.close();
  });

  it("blog listing visual regression test", async () => {
    const page = await launchBrowser();
    // Set consistent viewport for screenshots
    await page.setViewportSize({ width: 1280, height: 720 });

    await page.goto(URL);
    await page.waitForLoadState("networkidle");

    // Scroll to blog section if it exists
    const blogSection = page.locator("section.prose").first();
    if (await blogSection.isVisible()) {
      await blogSection.scrollIntoViewIfNeeded();
    }

    // Take screenshot for visual regression testing of the blog section
    await expect(page).toMatchScreenshot();

    await page.close();
  });
});
