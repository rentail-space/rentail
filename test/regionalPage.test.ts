import type { Page } from "playwright";
import { expect } from "playwright/test";
import { afterAll, beforeAll, describe, it } from "vite-plus/test";
import prisma from "~/lib/prisma.server";
import { goto } from "~/test/helpers/launchBrowser";

describe("Regional area shopping centers page", () => {
  let page: Page;
  let testRegional: {
    name: string;
    stateAbbreviation: string;
    state: { name: string; abbreviation: string };
    metroArea: { name: string };
    relatedCities: Array<{ name: string }>;
  };
  let regionalCenters: Array<{
    id: string;
    name: string;
    city: string;
  }>;

  beforeAll(async () => {
    // Find a regional name with cities that have shopping centers
    const regional = await prisma.regionalName.findFirst({
      include: {
        state: true,
        metroArea: true,
        relatedCities: true,
      },
      where: {
        relatedCities: {
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

    if (!regional) {
      throw new Error(
        "No regional name found with shopping centers for testing",
      );
    }

    testRegional = regional;
    const cityNames = testRegional.relatedCities.map((city) => city.name);

    // Fetch all shopping centers in cities within this regional area
    regionalCenters = await prisma.property.findMany({
      select: {
        id: true,
        name: true,
        city: true,
      },
      where: {
        city: { in: cityNames },
        stateAbbreviation: testRegional.stateAbbreviation,
      },
      orderBy: { name: "asc" },
    });

    // Navigate to regional page
    const slug = `${testRegional.stateAbbreviation.toLowerCase()}-${testRegional.name.toLowerCase().replace(/\s+/g, "-")}`;
    page = await goto(`/regional/${slug}`);
  });

  afterAll(async () => {
    await page?.close();
  });

  it("should display regional name as the page heading", async () => {
    const heading = page.locator("h1", {
      hasText: testRegional.name,
    });
    await expect(heading).toBeVisible();
  });

  it("should display all shopping centers from the regional area", async () => {
    expect(regionalCenters.length).toBeGreaterThan(0);
    for (const center of regionalCenters) {
      const centerHeading = page.locator("h2", { hasText: center.name });
      await expect(centerHeading).toBeVisible();
    }
  });

  it("should display appropriate text for regional area", async () => {
    const text = page.locator("text=Lease your perfect space in");
    await expect(text).toBeVisible();
  });

  it("should link to each center's detail page", async () => {
    for (const center of regionalCenters) {
      const centerLink = page.locator(`a[href="/center/${center.id}"]`).first();
      await expect(centerLink).toBeVisible();
    }
  });

  it("should have proper meta title with regional name", async () => {
    const title = await page.title();
    expect(title).toContain(testRegional.name);
    expect(title).toContain("Shopping Centers");
    expect(title).toContain("Rentail.space");
  });

  it("should have meta description with regional area-specific content", async () => {
    const metaDescription = page.locator('meta[name="description"]').last();
    const content = await metaDescription.getAttribute("content");
    expect(content).toBeTruthy();
    expect(content).toContain(testRegional.name);
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
      `Shopping Centers in ${testRegional.name}`,
    );
    expect(structuredData["@graph"][0].numberOfItems).toBe(
      regionalCenters.length,
    );

    // Validate breadcrumb includes regional name
    const breadcrumbs = structuredData["@graph"][1];
    expect(breadcrumbs["@type"]).toBe("BreadcrumbList");
    expect(
      breadcrumbs.itemListElement.some(
        (item: { name: string }) => item.name === testRegional.name,
      ),
    ).toBe(true);
  });

  it("should have back link to metro area page", async () => {
    const backLink = page.locator(
      `a[href="/metro/${testRegional.stateAbbreviation.toLowerCase()}-${testRegional.metroArea.name.toLowerCase().replace(/\s+/g, "-")}"]`,
    );
    await expect(backLink).toBeVisible();
  });
});
