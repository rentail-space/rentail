import { type Page, expect } from "playwright/test";
import { afterAll, beforeAll, describe, it } from "vitest";
import { goto } from "~/test/helpers/launchBrowser";

describe("Center detail page", () => {
  let page: Page;

  beforeAll(async () => {
    page = await goto("/center/ca-los-cerritos-center");
  });

  afterAll(async () => {
    await page?.close();
  });

  it("should display the center name", async () => {
    const heading = page.locator("h1");
    await expect(heading).toBeVisible();
    await expect(heading).toContainText("Los Cerritos Center");
  });

  it("should include valid ShoppingCenter JSON-LD structured data", async () => {
    const jsonLdContent = await page
      .locator('script[type="application/ld+json"]')
      .nth(1)
      .textContent();

    expect(jsonLdContent).toBeTruthy();

    const structuredData = JSON.parse(jsonLdContent ?? "");

    expect(structuredData["@context"]).toBe("https://schema.org");
    expect(structuredData["@graph"][0]["@type"]).toBe("ShoppingCenter");
    expect(structuredData["@graph"][0].name).toBe("Los Cerritos Center");
  });

  it("should have PostalAddress with complete address fields", async () => {
    const jsonLdContent = await page
      .locator('script[type="application/ld+json"]')
      .nth(1)
      .textContent();

    const structuredData = JSON.parse(jsonLdContent ?? "");

    expect(structuredData["@graph"][0].address).toBeDefined();
    expect(structuredData["@graph"][0].address["@type"]).toBe("PostalAddress");
    expect(structuredData["@graph"][0].address.streetAddress).toBeTruthy();
    expect(structuredData["@graph"][0].address.addressLocality).toBeTruthy();
    expect(structuredData["@graph"][0].address.addressRegion).toBeTruthy();
    expect(structuredData["@graph"][0].address.addressCountry).toBeTruthy();
  });

  it("should have GeoCoordinates with latitude and longitude", async () => {
    const jsonLdContent = await page
      .locator('script[type="application/ld+json"]')
      .nth(1)
      .textContent();

    const structuredData = JSON.parse(jsonLdContent ?? "");

    expect(structuredData["@graph"][0].geo).toBeDefined();
    expect(structuredData["@graph"][0].geo["@type"]).toBe("GeoCoordinates");
    expect(typeof structuredData["@graph"][0].geo.latitude).toBe("number");
    expect(typeof structuredData["@graph"][0].geo.longitude).toBe("number");
  });

  it("should have image URLs if available", async () => {
    const jsonLdContent = await page
      .locator('script[type="application/ld+json"]')
      .nth(1)
      .textContent();

    const structuredData = JSON.parse(jsonLdContent ?? "");

    if (structuredData.image) {
      expect(Array.isArray(structuredData.image)).toBe(true);
      expect(structuredData.image.length).toBeGreaterThan(0);
    }
  });

  it("should have proper meta title", async () => {
    const title = await page.title();
    expect(title).toContain("Los Cerritos Center");
    expect(title).toContain("Rentail.space");
  });

  it("should have meta description", async () => {
    const metaDescription = page.locator('meta[name="description"]').last();
    const content = await metaDescription.getAttribute("content");
    expect(content).toBeTruthy();
    expect(content).toContain("Los Cerritos Center");
  });

  it("should have meta keywords with relevant terms", async () => {
    const metaKeywords = page.locator('meta[name="keywords"]').last();
    const content = await metaKeywords.getAttribute("content");
    expect(content).toBeTruthy();
    expect(content).toContain("Los Cerritos Center");
    expect(content).toContain("shopping center");
    expect(content).toContain("kiosk rental");
  });

  it("should match inner HTML snapshot", async () => {
    await expect(page.locator("main")).toMatchInnerHTML();
  });

  it("should match visual regression test", async () => {
    await expect(page.locator("main")).toMatchScreenshot();
  });
});
