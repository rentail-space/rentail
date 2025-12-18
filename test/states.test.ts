import { type Page, expect } from "playwright/test";
import { afterAll, beforeAll, describe, it } from "vitest";
import { goto } from "~/test/helpers/launchBrowser";

describe("States listing page", () => {
  let page: Page;

  beforeAll(async () => {
    // Navigate to states page
    page = await goto("/states");
  });

  afterAll(async () => {
    await page?.close();
  });

  it("should display California in the list", async () => {
    const californiaHeading = page.locator("h2", { hasText: "California" });
    await expect(californiaHeading).toBeVisible();
  });

  it("should include valid JSON-LD structured data", async () => {
    // Extract JSON-LD script content from main element
    const jsonLdContent = await page
      .locator('main script[type="application/ld+json"]')
      .textContent();

    expect(jsonLdContent).toBeTruthy();

    // Parse and validate the structured data
    const structuredData = JSON.parse(jsonLdContent ?? "");

    expect(structuredData["@context"]).toBe("https://schema.org");
    expect(structuredData["@type"]).toBe("ItemList");
    expect(structuredData.name).toBe("US States with Shopping Centers");
    expect(structuredData.description).toContain("Complete list of US states");
    expect(structuredData.numberOfItems).toBeGreaterThan(0);
    expect(Array.isArray(structuredData.itemListElement)).toBe(true);

    // Find California in the list
    const californiaItem = structuredData.itemListElement.find(
      (item: { name: string }) => item.name === "California",
    );

    expect(californiaItem).toBeDefined();
    expect(californiaItem["@type"]).toBe("ListItem");
    expect(californiaItem.position).toBeGreaterThan(0);
    expect(californiaItem.url).toBe("https://rentail.space/state/ca");
    expect(californiaItem.description).toContain(
      "shopping centers in California",
    );
  });

  it("should have microdata attributes on the list", async () => {
    const list = page.locator(
      "ul[itemscope][itemtype='https://schema.org/ItemList']",
    );
    await expect(list).toBeVisible();

    const listItems = page.locator(
      "li[itemscope][itemtype='https://schema.org/ListItem']",
    );
    const count = await listItems.count();
    expect(count).toBeGreaterThan(0);
  });

  it("should link to California state page", async () => {
    const californiaLink = page.locator("a", {
      has: page.locator("h2", { hasText: "California" }),
    });

    await expect(californiaLink).toHaveAttribute("href", "/state/ca");
  });

  it("should match inner HTML snapshot", async () => {
    await expect(page.locator("main")).toMatchInnerHTML();
  });

  it("should match visual regression test", async () => {
    await expect(page.locator("main")).toMatchScreenshot();
  });

  it("should have proper meta title", async () => {
    const title = await page.title();
    expect(title).toContain("US States");
    expect(title).toContain("Specialty Leasing");
    expect(title).toContain("Rentail.space");
  });

  it("should have meta description with specialty leasing keywords", async () => {
    const metaDescription = page.locator('meta[name="description"]').last();
    const content = await metaDescription.getAttribute("content");
    expect(content).toBeTruthy();
    expect(content).toContain("specialty leasing");
    expect(content).toContain("kiosk");
    expect(content).toContain("pop-up");
  });

  it("should have meta keywords", async () => {
    const metaKeywords = page.locator('meta[name="keywords"]').last();
    const content = await metaKeywords.getAttribute("content");
    expect(content).toBeTruthy();
    expect(content).toContain("specialty leasing");
    expect(content).toContain("by state");
  });

  describe("clicks California state link", () => {
    beforeAll(async () => {
      const californiaLink = page.locator("a", {
        has: page.locator("h2", { hasText: "California" }),
      });
      await californiaLink.click();
      await page.waitForURL("**/state/ca");
    });

    it("should navigate to California state page when clicked", async () => {
      expect(page.url()).toContain("/state/ca");
      // Verify we're on the California page
      const heading = page.locator("h1", { hasText: "California" });
      await expect(heading).toBeVisible();
    });
  });
});
