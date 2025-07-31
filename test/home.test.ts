import { expect } from "playwright/test";
import { describe, it } from "vitest";
import { launchBrowser, URL } from "./helpers/launchBrowser";

describe("Home page", () => {
  it("home page", async () => {
    const page = await launchBrowser();
    const response = await page.goto(URL);
    expect(response?.status(), "should respond with 200").toEqual(200);
    await expect(page).toMatchScreenshot();
  });
});
