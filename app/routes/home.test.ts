/**
 * To learn more about Playwright Test visit:
 * https://checklyhq.com/docs/browser-checks/playwright-test/
 * https://playwright.dev/docs/writing-tests
 */

import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import pixelmatch from "pixelmatch";
import { chromium, type Page } from "playwright";
import { PNG } from "pngjs";
import invariant from "tiny-invariant";
import { describe, expect, it } from "vitest";

const dirname = path.resolve("__screenshots__");

expect.extend({
  async toMatchScreenshot(page: Page) {
    invariant(this.testPath, "Test name must be defined");
    const testName = path.basename(this.testPath, ".ts");

    const screenshot = await page.screenshot();
    const filename = path.join(dirname, `${testName}.jpg`);
    if (!existsSync(filename)) {
      await writeFile(filename, screenshot);
      return {
        message: () =>
          `Baseline screenshot created at ${filename}. Please run the test again to compare.`,
        pass: true,
      };
    }

    const img1 = PNG.sync.read(await readFile(filename));
    const img2 = PNG.sync.read(screenshot);
    if (img1.width !== img2.width || img1.height !== img2.height) {
      return {
        message: () =>
          `Image dimensions don't match: ${img1.width}x${img1.height} vs ${img2.width}x${img2.height}`,
        pass: false,
      };
    }

    const { width, height } = img1;
    const diff = new PNG({ width, height });

    // Compare images
    const numDiffPixels = pixelmatch(
      img1.data,
      img2.data,
      diff.data,
      width,
      height,
    );

    const diffPercentage = (numDiffPixels / (width * height)) * 100;
    const maxDiffPercentage = 1; // Set your threshold for differences
    const matches = diffPercentage <= maxDiffPercentage;
    if (!matches)
      await writeFile(
        path.join(dirname, `diff-${testName}.jpg`),
        PNG.sync.write(diff),
      );

    return {
      message: () =>
        matches
          ? `Image matches baseline (diff: ${diffPercentage.toFixed(2)}%)`
          : `Image differs from baseline by ${diffPercentage.toFixed(2)}% (threshold: ${maxDiffPercentage}%). See diff: ${dirname}`,
      pass: matches,
    };
  },
});

const URL = "http://localhost:9222";

describe("Home page", () => {
  it("home page", async () => {
    await chromium.launchServer({
      headless: false,
      port: 9222,
    });

    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();
    const response = await page.goto(URL);
    await page.screenshot({ path: "homepage.jpg" });
    await expect(page).toMatchScreenshot();
    expect(response?.status(), "should respond with 200").toEqual(200);
  });
});
