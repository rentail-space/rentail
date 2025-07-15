import { expect, test } from "@playwright/test";

test.describe("Homepage Tests", () => {
  test("Title", async ({ page }) => {
    const response = await page.goto("https://rentail.space");
    await page.screenshot({ path: "screenshot.png" });
    if (!response) throw new Error("Failed to navigate to the page");

    expect(response.status()).toBe(200);
    expect(page).toHaveTitle("Find your specialty lease with ease");
    await expect(page).toHaveScreenshot({
      maxDiffPixelRatio: 0.2,
    });
  });
});
