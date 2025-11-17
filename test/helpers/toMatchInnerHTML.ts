// DO NOT add to setup.ts as vitest.config.js cannot upload file that imports vitest

import { expect } from "@playwright/test";
import { invariant } from "es-toolkit";
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
import { formatHTMLTree } from "./formatHTML";

const dirname = path.resolve("./__screenshots__");

/**
 * Extend the expect object with a toMatchInnerHTML matcher.
 *
 * @param page - The page to get the inner HTML of.
 * @returns The result of the matcher.
 * @example
 * await expect(page).toMatchInnerHTML();
 */
expect.extend({
  async toMatchInnerHTML(
    page: Page,
  ): Promise<{ message: () => string; pass: boolean }> {
    const testName = getTestName();
    const filename = path.join(dirname, `${testName}.html`);
    await page.evaluate(() => {
      for (const script of document.body.querySelectorAll("script"))
        script.remove();
    });
    const rawHtml = await page.innerHTML("body");
    const html = formatHTMLTree(rawHtml);

    try {
      await access(filename, constants.R_OK);
    } catch {
      await mkdir(dirname, { recursive: true });
      await writeFile(filename, html);
      return {
        message: () => `Baseline HTML created at ${filename}.`,
        pass: true,
      };
    }

    const original = await readFile(filename, "utf-8");
    if (html !== original) {
      const newFilename = path.join(dirname, `${testName}-new.html`);
      await writeFile(newFilename, html);
      return {
        message: () => `HTML differs from baseline see ${newFilename}`,
        pass: false,
      };
    }
    return { message: () => "HTML matches baseline", pass: true };
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

export async function removeNewHTML() {
  const list = await readdir(dirname);
  for (const file of list)
    if (file.endsWith("-new.html")) await unlink(path.join(dirname, file));
}
