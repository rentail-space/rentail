import type { Page } from "playwright";
import { expect } from "playwright/test";
import { afterAll, beforeAll, describe, it } from "vitest";
import prisma from "~/lib/prisma.server";
import { goto } from "~/test/helpers/launchBrowser";

describe("County shopping centers page", () => {
  let page: Page;
  let testCounty: {
    id: string;
    name: string;
    stateAbbreviation: string;
    state: { name: string; abbreviation: string };
    cities: Array<{ name: string }>;
  };
  let countyCenters: Array<{
    id: string;
    name: string;
    city: string;
  }>;

  beforeAll(async () => {
    // Find a county with cities that have shopping centers
    const county = await prisma.county.findFirst({
      include: { state: true, cities: true },
      where: {
        cities: {
          some: {
            name: {
              in: await prisma.property
                .findMany({ distinct: ["city"], select: { city: true } })
                .then((cities) => cities.map((c) => c.city)),
            },
          },
        },
      },
    });

    if (!county) {
      throw new Error("No county found with shopping centers for testing");
    }

    testCounty = county;
    const cityNames = testCounty.cities.map((city) => city.name);

    // Fetch all shopping centers in cities within this county
    countyCenters = await prisma.property.findMany({
      select: {
        id: true,
        name: true,
        city: true,
      },
      where: {
        city: { in: cityNames },
        stateAbbreviation: testCounty.stateAbbreviation,
      },
      orderBy: { name: "asc" },
    });

    // Navigate to county page
    const slug = `${testCounty.stateAbbreviation.toLowerCase()}-${testCounty.name.toLowerCase().replace(/\s+/g, "-")}`;
    page = await goto(`/county/${slug}`);
  });

  afterAll(async () => {
    await page?.close();
  });

  it("should display county name as the page heading", async () => {
    const heading = page.locator("h1", {
      hasText: `${testCounty.name}, ${testCounty.stateAbbreviation}`,
    });
    await expect(heading).toBeVisible();
  });

  it("should display all shopping centers from the county", async () => {
    expect(countyCenters.length).toBeGreaterThan(0);
    for (const center of countyCenters) {
      const centerHeading = page.locator("h2", { hasText: center.name });
      await expect(centerHeading).toBeVisible();
    }
  });

  it("should display appropriate text for county", async () => {
    const text = page.locator("text=Lease your perfect space in");
    await expect(text).toBeVisible();
  });

  it("should link to each center's detail page", async () => {
    for (const center of countyCenters) {
      const centerLink = page.locator(`a[href="/center/${center.id}"]`).first();
      await expect(centerLink).toBeVisible();
    }
  });

  it("should have proper meta title with county name", async () => {
    const title = await page.title();
    expect(title).toContain(testCounty.name);
    expect(title).toContain(testCounty.stateAbbreviation);
    expect(title).toContain("Shopping Centers");
    expect(title).toContain("Rentail.space");
  });

  it("should have meta description with county-specific content", async () => {
    const metaDescription = page.locator('meta[name="description"]').last();
    const content = await metaDescription.getAttribute("content");
    expect(content).toBeTruthy();
    expect(content).toContain(testCounty.name);
    expect(content).toContain("specialty leasing");
  });

  it("should include valid JSON-LD structured data", async () => {
    const jsonLdContent = await page
      .locator('main script[type="application/ld+json"]')
      .textContent();

    expect(jsonLdContent).toBeTruthy();

    const structuredData = JSON.parse(jsonLdContent ?? "");

    expect(structuredData["@context"]).toBe("https://schema.org");
    expect(structuredData["@graph"][0]["@type"]).toBe("ItemList");
    expect(structuredData["@graph"][0].name).toContain(
      `Shopping Centers in ${testCounty.name}`,
    );
    expect(structuredData["@graph"][0].numberOfItems).toBe(
      countyCenters.length,
    );

    // Validate breadcrumb includes county
    const breadcrumbs = structuredData["@graph"][1];
    expect(breadcrumbs["@type"]).toBe("BreadcrumbList");
    expect(
      breadcrumbs.itemListElement.some(
        (item: { name: string }) => item.name === testCounty.name,
      ),
    ).toBe(true);
  });

  it("should have back link to state page", async () => {
    const backLink = page.locator(
      `a[href="/state/${testCounty.stateAbbreviation.toLowerCase()}"]`,
    );
    await expect(backLink).toBeVisible();
  });

  it("should display cities in the county", async () => {
    const cities = await prisma.city.findMany({
      where: { countyId: testCounty.id },
      orderBy: { name: "asc" },
    });

    if (cities.length > 0) {
      for (const city of cities) {
        if (city.slug) {
          const cityLink = page.locator(`a[href="/city/${city.slug}"]`);
          await expect(cityLink).toBeVisible();
        }
      }
    }
  });
});
