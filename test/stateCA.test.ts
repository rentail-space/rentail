import type { Page } from "playwright";
import { expect } from "playwright/test";
import { afterAll, beforeAll, describe, it } from "vitest";
import prisma from "~/lib/prisma";
import { goto } from "~/test/helpers/launchBrowser";

describe("State shopping centers page", () => {
  let page: Page;
  let californiaCenters: Array<{
    id: string;
    name: string;
    rating: number | null;
    squareFootage: number | null;
    numberOfStores: number | null;
    city: string | null;
  }>;

  beforeAll(async () => {
    // Fetch all shopping centers in California
    californiaCenters = await prisma.property.findMany({
      select: {
        id: true,
        name: true,
        rating: true,
        squareFootage: true,
        numberOfStores: true,
        city: true,
      },
      where: { stateAbbreviation: "CA" },
      orderBy: { name: "asc" },
    });

    // Navigate to California state page
    page = await goto("/state/ca");
  });

  afterAll(async () => {
    await page?.close();
  });

  it("should display California as the page heading", async () => {
    const heading = page.locator("h1", { hasText: "California" });
    await expect(heading).toBeVisible();
  });

  it("should display all shopping centers from California", async () => {
    expect(californiaCenters.length).toBeGreaterThan(5);
    for (const center of californiaCenters) {
      const centerHeading = page.locator("h2", { hasText: center.name });
      await expect(centerHeading).toBeVisible();
    }
  });

  it("should display star ratings for centers with ratings > 3", async () => {
    const centersWithRatings = californiaCenters.filter(
      (c) => c.rating !== null && c.rating > 3,
    );

    for (const center of centersWithRatings) {
      // Find the center's list item
      const centerListItem = page.locator("li", {
        has: page.locator("h2", { hasText: center.name }),
      });

      // Check for star rating display
      const ratingStars = centerListItem.locator(
        'span[itemType="https://schema.org/AggregateRating"]',
      );
      await expect(ratingStars).toBeVisible();

      // Verify the rating value is present as title
      const titleAttr = (await ratingStars.getAttribute("title")) ?? "";
      expect(Number.parseFloat(titleAttr)).toBeGreaterThanOrEqual(1);
      expect(Number.parseFloat(titleAttr)).toBeLessThanOrEqual(5);
    }
  });

  it("should display square footage for large centers", async () => {
    const centersWithLargeSquareFootage = californiaCenters.filter(
      (c) => c.squareFootage !== null && c.squareFootage >= 10_0000,
    );

    for (const center of centersWithLargeSquareFootage) {
      const centerListItem = page.locator("li", {
        has: page.locator("h2", { hasText: center.name }),
      });

      const squareFootageText = `${center.squareFootage?.toLocaleString()} square feet`;
      const squareFootageElement = centerListItem.locator(
        `text=${squareFootageText}`,
      );
      await expect(squareFootageElement).toBeVisible();
    }
  });

  it("should display number of stores for centers with 30+ stores", async () => {
    const centersWithManyStores = californiaCenters.filter(
      (c) => c.numberOfStores !== null && c.numberOfStores >= 30,
    );

    for (const center of centersWithManyStores) {
      const centerListItem = page.locator("li", {
        has: page.locator("h2", { hasText: center.name }),
      });

      const storesText = `${center.numberOfStores?.toLocaleString()} stores`;
      const storesElement = centerListItem.locator(`text=${storesText}`);
      await expect(storesElement).toBeVisible();
    }
  });

  it("should display city name for each center", async () => {
    const centersWithCity = californiaCenters.filter((c) => c.city !== null);

    for (const center of centersWithCity) {
      const centerListItem = page.locator("li", {
        has: page.locator("h2", { hasText: center.name }),
      });

      // Use .last() to get the city span (not the one in the center name)
      const cityElement = centerListItem.locator(`text=${center.city}`).last();
      await expect(cityElement).toBeVisible();
    }
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
    expect(structuredData["@graph"][0]["@type"]).toBe("ItemList");
    expect(structuredData["@graph"][0].name).toContain(
      "Shopping Centers in CA",
    );
    expect(structuredData["@graph"][0].description).toContain("California");
    expect(structuredData["@graph"][0].numberOfItems).toBe(
      californiaCenters.length,
    );
    expect(Array.isArray(structuredData["@graph"][0].itemListElement)).toBe(
      true,
    );
    expect(structuredData["@graph"][0].itemListElement.length).toBe(
      californiaCenters.length,
    );

    // Validate each shopping center in the structured data
    for (const [index, center] of californiaCenters.entries()) {
      const centerItem = structuredData["@graph"][0].itemListElement[index];

      expect(centerItem["@type"]).toEqual(["ListItem", "ShoppingCenter"]);
      expect(centerItem.position).toBe(index + 1);
      expect(centerItem.name).toContain(center.name);
      expect(centerItem.url).toBe(`https://rentail.space/center/${center.id}`);

      // Validate rating if present
      if (center.rating !== null && center.rating > 3) {
        expect(centerItem.aggregateRating).toBeDefined();
        expect(centerItem.aggregateRating["@type"]).toBe("AggregateRating");
        expect(centerItem.aggregateRating.ratingValue).toBeGreaterThanOrEqual(
          1,
        );
        expect(centerItem.aggregateRating.ratingValue).toBeLessThanOrEqual(5);
        expect(centerItem.aggregateRating.bestRating).toBe(5);
        expect(centerItem.aggregateRating.worstRating).toBe(1);
      }
    }
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
    expect(count).toBe(californiaCenters.length);
  });

  it("should link to each center's detail page", async () => {
    for (const center of californiaCenters) {
      const centerLink = page.locator(`a[href="/center/${center.id}"]`).first();
      await expect(centerLink).toBeVisible();
    }
  });

  it("should match inner HTML snapshot", async () => {
    await expect(page.locator("main")).toMatchInnerHTML();
  });

  it("should match visual regression test", async () => {
    await expect(page.locator("main")).toMatchScreenshot();
  });

  it("should have proper meta title with state name", async () => {
    const title = await page.title();
    expect(title).toContain("California");
    expect(title).toContain("Shopping Centers");
    expect(title).toContain("Rentail.space");
  });

  it("should have meta description with state-specific content", async () => {
    const metaDescription = page.locator('meta[name="description"]').last();
    const content = await metaDescription.getAttribute("content");
    expect(content).toBeTruthy();
    expect(content).toContain("California");
    expect(content).toContain("specialty leasing");
    expect(content).toContain("kiosk");
    expect(content).toContain("CA");
  });

  it("should have meta keywords with state-specific terms", async () => {
    const metaKeywords = page.locator('meta[name="keywords"]').last();
    const content = await metaKeywords.getAttribute("content");
    expect(content).toBeTruthy();
    expect(content).toContain("California");
    expect(content).toContain("CA");
    expect(content).toContain("specialty leasing");
  });

  it("should display metro areas and counties in California", async () => {
    const metroAreas = await prisma.metroArea.findMany({
      where: { stateAbbreviation: "CA" },
    });

    const counties = await prisma.county.findMany({
      where: { stateAbbreviation: "CA" },
    });

    if (metroAreas.length > 0 || counties.length > 0) {
      for (const metro of metroAreas) {
        const metroLink = page.locator(`a[href="/metro/${metro.slug}"]`);
        await expect(metroLink).toBeVisible();
      }

      for (const county of counties) {
        const countyLink = page.locator(`a[href="/county/${county.slug}"]`);
        await expect(countyLink).toBeVisible();
      }
    }
  });

  describe("clicks center link", () => {
    let firstCenter: { id: string; name: string };

    beforeAll(async () => {
      firstCenter = californiaCenters[0];
      // Find the first center and click its link
      firstCenter = californiaCenters[0];
      const centerLink = page
        .locator(`a[href="/center/${firstCenter.id}"]`)
        .first();

      await centerLink.click();
      await page.waitForURL(`**/center/${firstCenter.id}`);
    });

    it("should navigate to a center detail page when clicked", async () => {
      expect(page.url()).toContain(`/center/${firstCenter.id}`);

      // Verify we're on the center page
      const heading = page.locator("h1", { hasText: firstCenter.name });
      await expect(heading).toBeVisible();
    });
  });
});
