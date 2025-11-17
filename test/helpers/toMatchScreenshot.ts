// DO NOT add to setup.ts as vitest.config.js cannot upload file that imports vitest

import { expect } from "@playwright/test";
import { invariant } from "es-toolkit";
import looksSame from "looks-same";
import {
  access,
  constants,
  mkdir,
  readFile,
  readdir,
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
 * @param options.tolerance - The tolerance for the matcher (default: 2.3)
 * @returns The result of the matcher.
 * @example
 * await expect(page).toMatchScreenshot({ tolerance: 2.3 });
 *
 * @see https://github.com/gemini-testing/looks-same
 */
expect.extend({
  async toMatchScreenshot(
    page: Page,
    options: { tolerance: number } = { tolerance: 3 },
  ): Promise<{ message: () => string; pass: boolean }> {
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
    const { diffImage, equal } = await looksSame(
      await readFile(filename),
      screenshot,
      {
        createDiffImage: true,
        ignoreAntialiasing: true,
        ignoreCaret: true,
        tolerance: options.tolerance,
        strict: false,
      },
    );

    if (!equal) {
      const diffFilename = path.join(dirname, `${testName}-diff.png`);
      await diffImage.save(diffFilename);
      await writeFile(path.join(dirname, `${testName}-new.png`), screenshot);
      return {
        message: () => `Image differs from baseline see ${diffFilename}`,
        pass: false,
      };
    }

    return { message: () => "Image matches baseline", pass: true };
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
    if (file.endsWith("-diff.png") || file.endsWith("-new.png"))
      await unlink(path.join(dirname, file));
}
