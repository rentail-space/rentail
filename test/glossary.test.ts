import { type Page, expect } from "playwright/test";
import { afterAll, beforeAll, describe, it } from "vitest";
import { goto } from "~/test/helpers/launchBrowser";

describe("Glossary page", () => {
  let page: Page;

  const expectedTerms = [
    "Specialty Leasing",
    "Kiosk",
    "Cart",
    "Pop-up Shop",
    "Inline Space",
    "Common Area",
    "Seasonal Retail",
    "Brand Activation",
  ];

  beforeAll(async () => {
    page = await goto("/glossary");
  });

  afterAll(async () => {
    await page?.close();
  });

  it("should display the glossary heading", async () => {
    const heading = page.locator("h1", {
      hasText: "Specialty Leasing Glossary",
    });
    await expect(heading).toBeVisible();
  });

  it("should display all glossary terms", async () => {
    for (const term of expectedTerms) {
      const termHeading = page.locator("h2", { hasText: term });
      await expect(termHeading).toBeVisible();
    }
  });

  it("should display definitions for all terms", async () => {
    const definitions = page.locator(
      '[itemscope][itemtype="https://schema.org/DefinedTerm"] p[itemprop="description"]',
    );
    const count = await definitions.count();
    expect(count).toBe(expectedTerms.length);
  });

  it("should display alternate names for terms", async () => {
    // Check that "Also known as:" appears for terms with alternates
    const alternateLabels = page.locator('p:has-text("Also known as:")');
    const count = await alternateLabels.count();
    expect(count).toBeGreaterThan(0);
  });

  it("should include valid DefinedTermSet JSON-LD structured data", async () => {
    const jsonLdContent = await page
      .locator('main script[type="application/ld+json"]')
      .textContent();

    expect(jsonLdContent).toBeTruthy();

    const structuredData = JSON.parse(jsonLdContent ?? "");

    expect(structuredData["@context"]).toBe("https://schema.org");
    expect(structuredData["@type"]).toBe("DefinedTermSet");
    expect(structuredData.name).toBe("Specialty Leasing Glossary");
    expect(
      structuredData.description,
    ).toContain("Authoritative glossary");
    expect(Array.isArray(structuredData.hasDefinedTerm)).toBe(true);
    expect(structuredData.hasDefinedTerm.length).toBe(expectedTerms.length);

    // Validate first term structure
    const firstTerm = structuredData.hasDefinedTerm[0];
    expect(firstTerm["@type"]).toBe("DefinedTerm");
    expect(firstTerm.name).toBe("Specialty Leasing");
    expect(firstTerm.description).toBeTruthy();
    expect(firstTerm.inDefinedTermSet).toBe("https://rentail.space/glossary");

    // Validate publisher
    expect(structuredData.publisher).toBeDefined();
    expect(structuredData.publisher["@type"]).toBe("Organization");
    expect(structuredData.publisher.name).toBe("Rentail.space");
  });

  it("should have DefinedTermSet microdata on container", async () => {
    const container = page.locator(
      "div[itemscope][itemtype='https://schema.org/DefinedTermSet']",
    );
    await expect(container).toBeVisible();
  });

  it("should have DefinedTerm microdata on each term", async () => {
    const terms = page.locator(
      "div[itemscope][itemtype='https://schema.org/DefinedTerm']",
    );
    const count = await terms.count();
    expect(count).toBe(expectedTerms.length);
  });

  it("should have proper microdata attributes for each term", async () => {
    // Check first term has all required microdata
    const firstTerm = page
      .locator(
        "div[itemscope][itemtype='https://schema.org/DefinedTerm']",
      )
      .first();

    const name = firstTerm.locator("h2[itemprop='name']");
    await expect(name).toBeVisible();

    const description = firstTerm.locator("p[itemprop='description']");
    await expect(description).toBeVisible();
  });

  it("should display about section with authority claim", async () => {
    const aboutSection = page.locator("text=About This Glossary");
    await expect(aboutSection).toBeVisible();

    const authorityText = page.locator(
      "text=authoritative reference for specialty leasing terminology",
    );
    await expect(authorityText).toBeVisible();
  });

  it("should link back to home page", async () => {
    const homeLink = page.locator('a[href="/"]').first();
    await expect(homeLink).toBeVisible();
  });

  it("should match inner HTML snapshot", async () => {
    await expect(page.locator("main")).toMatchInnerHTML();
  });

  it("should match visual regression test", async () => {
    await expect(page.locator("main")).toMatchScreenshot();
  });
});
