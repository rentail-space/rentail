import type { Page } from "playwright";
import { expect } from "playwright/test";
import { afterAll, beforeAll, describe, it } from "vitest";
import prisma from "~/lib/prisma";
import { goto } from "~/test/helpers/launchBrowser";

describe("Metro area shopping centers page", () => {
  let page: Page;
  let testMetro: {
    name: string;
    stateAbbreviation: string;
    state: { name: string; abbreviation: string };
    cities: Array<{ name: string }>;
  };
  let metroCenters: Array<{
    id: string;
    name: string;
    city: string;
  }>;

  beforeAll(async () => {
    // Find a metro area with cities that have shopping centers
    const metro = await prisma.metroArea.findFirst({
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

    if (!metro) {
      throw new Error("No metro area found with shopping centers for testing");
    }

    testMetro = metro;
    const cityNames = testMetro.cities.map((city) => city.name);

    // Fetch all shopping centers in cities within this metro area
    metroCenters = await prisma.property.findMany({
      select: {
        id: true,
        name: true,
        city: true,
      },
      where: {
        city: { in: cityNames },
        stateAbbreviation: testMetro.stateAbbreviation,
      },
      orderBy: { name: "asc" },
    });

    // Navigate to metro page
    const slug = `${testMetro.stateAbbreviation.toLowerCase()}-${testMetro.name.toLowerCase().replace(/\s+/g, "-")}`;
    page = await goto(`/metro/${slug}`);
  });

  afterAll(async () => {
    await page?.close();
  });

  it("should display metro area name as the page heading", async () => {
    const heading = page.locator("h1", {
      hasText: `${testMetro.name} Metro Area`,
    });
    await expect(heading).toBeVisible();
  });

  it("should display all shopping centers from the metro area", async () => {
    expect(metroCenters.length).toBeGreaterThan(0);
    for (const center of metroCenters) {
      const centerHeading = page.locator("h2", { hasText: center.name });
      await expect(centerHeading).toBeVisible();
    }
  });

  it("should display appropriate text for metro area", async () => {
    const text = page.locator("text=Find your perfect retail space in the");
    await expect(text).toBeVisible();
    const metroText = page.locator("text=metro area");
    await expect(metroText).toBeVisible();
  });

  it("should link to each center's detail page", async () => {
    for (const center of metroCenters) {
      const centerLink = page.locator(`a[href="/center/${center.id}"]`).first();
      await expect(centerLink).toBeVisible();
    }
  });

  it("should have proper meta title with metro area name", async () => {
    const title = await page.title();
    expect(title).toContain(testMetro.name);
    expect(title).toContain("Metro Area");
    expect(title).toContain("Shopping Centers");
    expect(title).toContain("Rentail.space");
  });

  it("should have meta description with metro area-specific content", async () => {
    const metaDescription = page.locator('meta[name="description"]').last();
    const content = await metaDescription.getAttribute("content");
    expect(content).toBeTruthy();
    expect(content).toContain(testMetro.name);
    expect(content).toContain("metro area");
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
      `Shopping Centers in ${testMetro.name}`,
    );
    expect(structuredData["@graph"][0].numberOfItems).toBe(metroCenters.length);

    // Validate breadcrumb includes metro area
    const breadcrumbs = structuredData["@graph"][1];
    expect(breadcrumbs["@type"]).toBe("BreadcrumbList");
    expect(
      breadcrumbs.itemListElement.some(
        (item: { name: string }) =>
          item.name === `${testMetro.name} Metro Area`,
      ),
    ).toBe(true);
  });

  it("should have back link to state page", async () => {
    const backLink = page.locator(
      `a[href="/state/${testMetro.stateAbbreviation.toLowerCase()}"]`,
    );
    await expect(backLink).toBeVisible();
  });
});
