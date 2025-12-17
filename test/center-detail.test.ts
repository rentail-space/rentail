import { type Page, expect } from "playwright/test";
import { afterAll, beforeAll, describe, it } from "vitest";
import prisma from "~/lib/prisma";
import { goto } from "~/test/helpers/launchBrowser";

describe("Center detail page", () => {
  let page: Page;
  const centerId = "test-center-1";

  beforeAll(async () => {
    // Create a test center
    await prisma.property.create({
      data: {
        id: centerId,
        name: "Los Cerritos Center",
        address: "239 Los Cerritos Center",
        city: "Cerritos",
        state: "CA",
        country: "US",
        latitude: 33.8622482,
        longitude: -118.0948809,
        website: "https://www.shoploscerritos.com/",
        phone: "+15624027467",
        imageURLs: [
          "https://rentail.space/images/malls/ca-los-cerritos-center-1.jpg",
        ],
        description:
          "Los Cerritos Center is a premier shopping destination featuring stores, dining, and entertainment.",
        summary:
          "Spacious shopping center offers a range of brand-name retailers, plus well-known chain restaurants.",
        squareFootage: 1200000,
        numberOfStores: 130,
        openFrom: 1000,
        openUntil: 2100,
      },
    });

    page = await goto(`/center/${centerId}`);
  });

  afterAll(async () => {
    await page?.close();
    await prisma.property.delete({ where: { id: centerId } });
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
    expect(structuredData["@type"]).toBe("ShoppingCenter");
    expect(structuredData.name).toBe("Los Cerritos Center");
  });

  it("should have PostalAddress with complete address fields", async () => {
    const jsonLdContent = await page
      .locator('script[type="application/ld+json"]')
      .nth(1)
      .textContent();

    const structuredData = JSON.parse(jsonLdContent ?? "");

    expect(structuredData.address).toBeDefined();
    expect(structuredData.address["@type"]).toBe("PostalAddress");
    expect(structuredData.address.streetAddress).toBeTruthy();
    expect(structuredData.address.addressLocality).toBeTruthy();
    expect(structuredData.address.addressRegion).toBeTruthy();
    expect(structuredData.address.addressCountry).toBeTruthy();
  });

  it("should have GeoCoordinates with latitude and longitude", async () => {
    const jsonLdContent = await page
      .locator('script[type="application/ld+json"]')
      .nth(1)
      .textContent();

    const structuredData = JSON.parse(jsonLdContent ?? "");

    expect(structuredData.geo).toBeDefined();
    expect(structuredData.geo["@type"]).toBe("GeoCoordinates");
    expect(typeof structuredData.geo.latitude).toBe("number");
    expect(typeof structuredData.geo.longitude).toBe("number");
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
});
