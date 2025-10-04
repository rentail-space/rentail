import { expect, type Page } from "playwright/test";
import { afterAll, beforeAll, describe, it } from "vitest";
import { openPage } from "~/test/helpers/launchBrowser";

describe("Home page", () => {
  let page: Page;

  beforeAll(async () => {
    page = await openPage();
  });

  it("home page", async () => {
    const response = await page.goto("/");
    expect(response?.status(), "should respond with 200").toEqual(200);
    await expect(page).toMatchScreenshot();
  });

  afterAll(async () => {
    if (page) await page.close();
  });
});
