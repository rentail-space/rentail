import { expect, type Page } from "playwright/test";
import { afterEach, beforeEach, describe, it } from "vitest";
import { openPage, URL } from "./helpers/launchBrowser";

describe("Home page", () => {
  let page: Page;

  beforeEach(async () => {
    page = await openPage();
  });

  it("home page", async () => {
    const response = await page.goto(URL);
    expect(response?.status(), "should respond with 200").toEqual(200);
    await expect(page).toMatchScreenshot();
  });

  afterEach(async () => {
    await page.close();
  });
});
