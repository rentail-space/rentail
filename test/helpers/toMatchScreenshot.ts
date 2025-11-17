// DO NOT add to setup.ts as vitest.config.js cannot upload file that imports vitest

import { expect } from "@playwright/test";
import { invariant } from "es-toolkit";
import looksSame from "looks-same";
import {
  access,
  constants,
  mkdir,
  readdir,
  readFile,
  unlink,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import type { Page } from "playwright";

const dirname = path.resolve("./__screenshots__");

/**
 * Extend the expect object with a toMatchScreenshot matcher.
 *
 * @param page - The page to take a screenshot of.
 * @param options - The options for the matcher.
 * @param options.maxDifference - The maximum difference allowed between the baseline and the current screenshot.
 * @returns The result of the matcher.
 * @example
 * await expect(page).toMatchScreenshot({ maxDifference: 0.05 });
 */
expect.extend({
  async toMatchScreenshot(
    page: Page,
    options: { maxDifference: number } = { maxDifference: 0.01 },
  ) {
    try {
      const testName = getTestName();
      const filename = path.join(dirname, `${testName}.png`);
      const screenshot = await page.screenshot({
        animations: "disabled",
        caret: "hide",
        scale: "css",
        type: "png",
      });

      try {
        await access(filename, constants.R_OK);
      } catch {
        await mkdir(dirname, { recursive: true });
        await writeFile(filename, screenshot);
        return {
          message: () => `Baseline screenshot created at ${filename}.`,
          pass: true,
        };
      }

      const { differentPixels, diffImage } = await looksSame(
        await readFile(filename),
        screenshot,
        {
          createDiffImage: true,
          ignoreAntialiasing: true,
          ignoreCaret: true,
          tolerance: 5,
        },
      );
      if (diffImage) {
        const diffFilename = path.join(dirname, `diff-${testName}.png`);
        await diffImage.save(diffFilename);
        await writeFile(path.join(dirname, `new-${testName}.png`), screenshot);
        throw new Error(`Image differs from baseline see ${diffFilename}`);
      }

      if (typeof differentPixels === "number") {
        const diff = differentPixels / screenshot.length;
        if (diff / 100 >= options.maxDifference)
          throw new Error(`Image differs from baseline by ${diff.toFixed(2)}%`);
      }

      return { message: () => "Image matches baseline", pass: true };
    } catch (error) {
      return {
        message: () => (error instanceof Error ? error.message : String(error)),
        pass: false,
      };
    }
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
  return testFile.replace(/\.test\.(ts|tsx)$/, "");
}

export async function removeDiffImages() {
  const list = await readdir(dirname);
  for (const file of list)
    if (file.startsWith("diff-") || file.startsWith("new-"))
      await unlink(path.join(dirname, file));
}
