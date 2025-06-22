/**
 * To learn more about Playwright Test visit:
 * https://checklyhq.com/docs/browser-checks/playwright-test/
 * https://playwright.dev/docs/writing-tests
 */

import { chromium } from "playwright";
import { describe, expect, it } from "vitest";
import "../../test/toMatchScreenshot";

const URL = "http://localhost:9222";

describe("Home page", () => {
  it("home page", async () => {
    await chromium.launchServer({
      headless: true,
      port: 9222,
    });

    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();
    const response = await page.goto(URL);
    await expect(page).toMatchScreenshot();
    expect(response?.status(), "should respond with 200").toEqual(200);
  });
});
