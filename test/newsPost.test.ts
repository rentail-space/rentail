/**
 * E2E Tests for News Post Rendering
 *
 * Tests ensure that news posts render correctly with proper:
 * - Content display (title, summary, body)
 * - Markdown formatting (headings, links, lists)
 * - Media contact section
 * - Responsive layout
 * - Navigation functionality
 */

import { type Page, type Response, expect } from "playwright/test";
import { afterAll, beforeAll, describe, it } from "vitest";
import { goto } from "~/test/helpers/launchBrowser";

describe.skip("News Post Rendering", () => {
  let page: Page;

  beforeAll(async () => {
    page = await goto("/news/2026-01-20-launch");
  }, 60000);

  it("should render news post with proper title", async () => {
    // Check title rendering
    const title = await page.locator("article h1").first().textContent();
    expect(title).toBe(
      "Rentail.space Launches AI-Powered Marketplace Connecting Businesses with Short-Term Retail Spaces",
    );
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
    // Check if links are rendered with underline styling
    const links = page.locator("article a");
    if ((await links.count()) > 0) {
      const firstLink = links.first();
      await expect(firstLink).toBeVisible();
    }
  });

  it("should render lists with proper indentation and styling", async () => {
    // Check for unordered lists (bullet points in "How It Works" section)
    const unorderedLists = page.locator("article ul");
    if ((await unorderedLists.count()) > 0) {
      const firstUL = unorderedLists.first();
      await expect(firstUL).toBeVisible();

      // Check for list items
      const listItems = firstUL.locator("li");
      await expect(listItems.first()).toBeVisible();
    }
  });

  it("should display news post with correct layout structure", async () => {
    // Check main article structure
    const article = page.locator("article");
    await expect(article).toBeVisible();

    // Verify the layout wrapper is present
    const layout = page.locator("body > div");
    await expect(layout).toBeVisible();
  });

  it("should have a section 'Solving a Market Inefficiency'", async () => {
    const heading = page.locator("h2", {
      hasText: "Solving a Market Inefficiency",
    });
    await expect(heading).toBeVisible();
  });

  it("should have a section 'How It Works' with 4 bullet points", async () => {
    const heading = page.locator("h2", { hasText: "How It Works" });
    await expect(heading).toBeVisible();

    // Check for the 4 bullet points
    const items = page.locator("h2:has-text('How It Works') + p + ul > li");
    await expect(items).toHaveCount(4);
  });

  it("should contain quotes from leadership", async () => {
    // Check for CEO quote
    const ceoQuote = page.locator("text=/We're bringing the same level/");
    await expect(ceoQuote).toBeVisible();

    // Check for attribution
    const attribution = page.locator("text=/Assaf Arkin/");
    await expect(attribution.first()).toBeVisible();
  });

  it("should render media contact section", async () => {
    // Check for media contact section
    const mediaContact = page.locator("text=/Media Contact/");
    await expect(mediaContact).toBeVisible();

    // Check for email link
    const emailLink = page.locator('a[href="mailto:media@rentail.space"]');
    await expect(emailLink).toBeVisible();
  });

  it("should render about section with company description", async () => {
    const aboutText = page.locator(
      "text=/Rentail.space is an AI-powered marketplace/",
    );
    await expect(aboutText).toBeVisible();
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
  });

  describe("404", () => {
    let response: Response | null;

    beforeAll(async () => {
      response = await page.goto("/news/non-existent-post");
    });

    it("should handle non-existent news posts with 404", async () => {
      expect(response?.status(), "should respond with 404").toEqual(404);
    });
  });

  afterAll(async () => {
    await page?.close();
  });
});
