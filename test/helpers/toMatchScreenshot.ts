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
import type { Locator, Page } from "playwright";

const dirname = path.resolve("./__screenshots__");
const defaultTolerance = 2.3;

/**
 * Extend the expect object with a toMatchScreenshot matcher.
 *
 * @param locator - The locator to take a screenshot of.
 * @param options - The options for the matcher.
 * @param options.name - The name of the test.
 * @param options.tolerance - The tolerance for the matcher (default: 2.3)
 * @returns The result of the matcher.
 * @example
 * await expect(locator).toMatchScreenshot({ tolerance: 2.3 });
 *
 * @see https://github.com/gemini-testing/looks-same
 */
expect.extend({
  async toMatchScreenshot(
    locator: Locator,
    options?: { name?: string; tolerance?: number },
  ): Promise<{ message: () => string; pass: boolean }> {
    // NOTE: handle the case where the page is not fully loaded or scrolls.
    const page: Page = "page" in locator ? locator.page() : locator;
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(100);

    const name = options?.name || getTestName();
    const filename = path.join(dirname, `${name}.png`);
    const screenshot = await locator.screenshot({
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
        tolerance: options?.tolerance ?? defaultTolerance,
        strict: false,
      },
    );

    if (!equal) {
      const diffFilename = path.join(dirname, `${name}.diff.png`);
      await diffImage.save(diffFilename);
      await writeFile(path.join(dirname, `${name}.new.png`), screenshot);
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
    if (file.endsWith(".diff.png") || file.endsWith(".new.png"))
      await unlink(path.join(dirname, file));
}
