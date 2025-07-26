import { expect } from "playwright/test";
import { describe, it } from "vitest";
import { launch, URL } from "./e2e";

describe("Home page", () => {
  it("home page", async () => {
    const page = await launch();
    const response = await page.goto(URL);
    expect(response?.status(), "should respond with 200").toEqual(200);
    await expect(page).toMatchScreenshot();
  });
});
