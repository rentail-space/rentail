// DO NOT add to setup.ts as vitest.config.js cannot upload file that imports vitest
import {
  access,
  constants,
  mkdir,
  readFile,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { expect } from "@playwright/test";
import type { AsyncExpectationResult } from "@vitest/expect";
import pixelmatch from "pixelmatch";
import type { Page } from "playwright";
import { PNG } from "pngjs";
import invariant from "tiny-invariant";

expect.extend({
  async toMatchScreenshot(page: Page): AsyncExpectationResult {
    const testName = getTestName();
    const dirname = path.resolve("./__screenshots__");
    const screenshot = await page.screenshot();
    const filename = path.join(dirname, `${testName}.jpg`);
    try {
      await access(filename, constants.R_OK);
    } catch {
      await mkdir(dirname, { recursive: true });
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
    const maxDiffPercentage = 1;
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

function getTestName(): string {
  const error = new Error();
  const stackLines = error.stack?.split("\n") || [];
  const callerLine = stackLines.find(
    (line) => line.includes(".test.") && !line.includes("node_modules"),
  );
  invariant(callerLine, "Could not determine test file name");
  const match = callerLine.match(/\/(.+?):\d+/);
  const testFile = match ? path.basename(match[1]) : "unknown";
  return testFile.replace(".test.ts", "");
}
