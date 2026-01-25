import type { Page } from "playwright";
import { expect } from "playwright/test";
import { afterAll, beforeAll, describe, it } from "vitest";
import prisma from "~/lib/prisma";
import { goto } from "~/test/helpers/launchBrowser";

describe("City shopping centers page", () => {
  let page: Page;
  let testCity: {
    name: string;
    stateAbbreviation: string;
    state: { name: string; abbreviation: string };
  };
  let cityCenters: Array<{
    id: string;
    name: string;
    city: string;
  }>;

  beforeAll(async () => {
    // Find a city with at least one shopping center
    const city = await prisma.city.findFirst({
      include: { state: true },
      where: {
        name: {
          in: await prisma.property
            .findMany({ distinct: ["city"], select: { city: true } })
            .then((cities) => cities.map((c) => c.city)),
        },
      },
    });

    if (!city) {
      throw new Error("No city found with shopping centers for testing");
    }

    testCity = city;

    // Fetch all shopping centers in this city
    cityCenters = await prisma.property.findMany({
      select: {
        id: true,
        name: true,
        city: true,
      },
      where: {
        city: testCity.name,
        stateAbbreviation: testCity.stateAbbreviation,
      },
      orderBy: { name: "asc" },
    });

    // Navigate to city page
    const slug = `${testCity.stateAbbreviation.toLowerCase()}-${testCity.name.toLowerCase().replace(/\s+/g, "-")}`;
    page = await goto(`/city/${slug}`);
  });

  afterAll(async () => {
    await page?.close();
  });

  it("should display city name as the page heading", async () => {
    const heading = page.locator("h1", {
      hasText: `${testCity.name}, ${testCity.stateAbbreviation}`,
    });
    await expect(heading).toBeVisible();
  });

  it("should display all shopping centers from the city", async () => {
    expect(cityCenters.length).toBeGreaterThan(0);
    for (const center of cityCenters) {
      const centerHeading = page.locator("h2", { hasText: center.name });
      await expect(centerHeading).toBeVisible();
    }
  });

  it("should display appropriate text for city", async () => {
    const text = page.locator("text=Lease your perfect space in");
    await expect(text).toBeVisible();
  });

  it("should link to each center's detail page", async () => {
    for (const center of cityCenters) {
      const centerLink = page.locator(`a[href="/center/${center.id}"]`).first();
      await expect(centerLink).toBeVisible();
    }
  });

  it("should have proper meta title with city name", async () => {
    const title = await page.title();
    expect(title).toContain(testCity.name);
    expect(title).toContain(testCity.stateAbbreviation);
    expect(title).toContain("Shopping Centers");
    expect(title).toContain("Rentail.space");
  });

  it("should have meta description with city-specific content", async () => {
    const metaDescription = page.locator('meta[name="description"]').last();
    const content = await metaDescription.getAttribute("content");
    expect(content).toBeTruthy();
    expect(content).toContain(testCity.name);
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
      `Shopping Centers in ${testCity.name}`,
    );
    expect(structuredData["@graph"][0].numberOfItems).toBe(cityCenters.length);

    // Validate breadcrumb includes city
    const breadcrumbs = structuredData["@graph"][1];
    expect(breadcrumbs["@type"]).toBe("BreadcrumbList");
    expect(
      breadcrumbs.itemListElement.some(
        (item: { name: string }) => item.name === testCity.name,
      ),
    ).toBe(true);
  });

  it("should have back link to state page", async () => {
    const backLink = page.locator(
      `a[href="/state/${testCity.stateAbbreviation.toLowerCase()}"]`,
    );
    await expect(backLink).toBeVisible();
  });
});
