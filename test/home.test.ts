import { expect } from "playwright/test";
import { describe, it } from "vitest";
import { launchBrowser, launchServer, URL } from "./e2e";

describe("Home page", () => {
  it("home page", async () => {
    await launchServer();
    const page = await launchBrowser();
    const response = await page.goto(URL);
    await expect(page).toMatchScreenshot();
    expect(response?.status(), "should respond with 200").toEqual(200);
  });
});
