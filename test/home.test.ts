import { type Page, expect } from "playwright/test";
import { afterAll, beforeAll, describe, it } from "vitest";
import { goto } from "~/test/helpers/launchBrowser";

describe("Home page", () => {
  let page: Page;

  beforeAll(async () => {
    page = await goto("/");
  });

  it("should match inner HTML", async () => {
    await expect(page).toMatchInnerHTML();
  });

  it.runIf(!process.env.CI)("should match visual regression test", async () => {
    await expect(page).toMatchScreenshot();
  });

  afterAll(async () => {
    await page?.close();
  });
});
