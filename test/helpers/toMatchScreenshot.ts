// DO NOT add to setup.ts as vitest.config.js cannot upload file that imports vitest
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
import { expect } from "@playwright/test";
import type { AsyncExpectationResult } from "@vitest/expect";
import looksSame from "looks-same";
import type { Page } from "playwright";
import invariant from "tiny-invariant";

const dirname = path.resolve("./__screenshots__");

expect.extend({
  async toMatchScreenshot(page: Page): AsyncExpectationResult {
    await cleanBeforeTest();

    const testName = getTestName();
    const filename = path.join(dirname, `${testName}.jpg`);
    const screenshot = await page.screenshot();
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

    const { differentPixels, diffImage } = await looksSame(
      await readFile(filename),
      screenshot,
      {
        createDiffImage: true,
        ignoreAntialiasing: true,
        ignoreCaret: true,
        tolerance: 3,
      },
    );
    const diff = differentPixels / screenshot.length;
    if (diffImage) {
      const diffFilename = path.join(dirname, `diff-${testName}.jpg`);
      await diffImage.save(diffFilename);
      return {
        message: () =>
          `Image differs from baseline by ${diff.toFixed(2)}%, see: ${diffFilename}`,
        pass: false,
      };
    }
    return {
      message: () => `Image matches baseline (diff: ${diff.toFixed(2)}%)`,
      pass: true,
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

async function cleanBeforeTest() {
  const list = await readdir(dirname);
  for (const file of list)
    if (file.startsWith("diff-")) await unlink(path.join(dirname, file));
}
