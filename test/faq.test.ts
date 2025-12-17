import { type Page, expect } from "playwright/test";
import { afterAll, beforeAll, describe, it } from "vitest";
import faq from "~/routes/faq/faq";
import { goto } from "~/test/helpers/launchBrowser";

describe("FAQ page", () => {
  let page: Page;
  const totalQuestions = faq.reduce(
    (sum, category) => sum + category.questions.length,
    0,
  );

  beforeAll(async () => {
    page = await goto("/faq");
  });

  afterAll(async () => {
    await page?.close();
  });

  it("should display all FAQ categories", async () => {
    for (const category of faq) {
      const heading = page.locator("h2", { hasText: category.category });
      await expect(heading).toBeVisible();
    }
  });

  it("should display all questions", async () => {
    for (const category of faq) {
      for (const item of category.questions) {
        const question = page.locator("h3", { hasText: item.question });
        await expect(question).toBeVisible();
      }
    }
  });

  it("should include valid FAQPage JSON-LD structured data", async () => {
    const jsonLdContent = await page
      .locator('main script[type="application/ld+json"]')
      .textContent();

    expect(jsonLdContent).toBeTruthy();

    const structuredData = JSON.parse(jsonLdContent ?? "");

    expect(structuredData["@context"]).toBe("https://schema.org");
    expect(structuredData["@type"]).toBe("FAQPage");
    expect(Array.isArray(structuredData.mainEntity)).toBe(true);
    expect(structuredData.mainEntity.length).toBe(totalQuestions);

    // Validate first question structure
    const firstQuestion = structuredData.mainEntity[0];
    expect(firstQuestion["@type"]).toBe("Question");
    expect(firstQuestion.name).toBeTruthy();
    expect(firstQuestion.acceptedAnswer).toBeDefined();
    expect(firstQuestion.acceptedAnswer["@type"]).toBe("Answer");
    expect(firstQuestion.acceptedAnswer.text).toBeTruthy();
  });

  it("should have FAQPage microdata on section", async () => {
    const section = page.locator(
      "section[itemscope][itemtype='https://schema.org/FAQPage']",
    );
    await expect(section).toBeVisible();
  });

  it("should have Question microdata on each FAQ item", async () => {
    const questions = page.locator(
      "details[itemscope][itemtype='https://schema.org/Question']",
    );
    const count = await questions.count();
    expect(count).toBe(totalQuestions);
  });

  it("should have Answer microdata on each answer", async () => {
    const answers = page.locator(
      "div[itemscope][itemtype='https://schema.org/Answer']",
    );
    const count = await answers.count();
    expect(count).toBe(totalQuestions);
  });

  it("should match inner HTML snapshot", async () => {
    await expect(page.locator("main")).toMatchInnerHTML();
  });

  it("should match visual regression test", async () => {
    await expect(page.locator("main")).toMatchScreenshot();
  });
});
