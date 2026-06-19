import { type Page, expect } from "playwright/test";
import { afterAll, beforeAll, describe, it } from "vite-plus/test";
import { goto } from "~/test/helpers/launchBrowser";

describe("Home page", () => {
  let page: Page;

  beforeAll(async () => {
    page = await goto("/");
  });

  it("should match inner HTML", async () => {
    await expect(page.locator("main")).toMatchInnerHTML();
  });

  it("should match visual regression test", async () => {
    await expect(page.locator("main")).toMatchScreenshot();
  });

  afterAll(async () => {
    await page?.close();
  });
});
