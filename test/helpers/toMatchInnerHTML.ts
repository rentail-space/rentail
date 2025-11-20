// DO NOT add to setup.ts as vitest.config.js cannot upload file that imports vitest

import { expect } from "@playwright/test";
import { diffLines } from "diff";
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
import type { Locator, Page } from "playwright";
import { formatHTMLTree } from "./formatHTML";

const dirname = path.resolve("./__screenshots__");

expect.extend({
  async toMatchInnerHTML(
    locator: Locator,
    options?: { name?: string; strip?: (html: string) => string },
  ): Promise<{ message: () => string; pass: boolean }> {
    const name = options?.name || getTestName();
    const filename = path.resolve(dirname, `${name}.html`);

    const rawHtml =
      "content" in locator
        ? await (locator as unknown as Page).locator("body").innerHTML()
        : await locator.innerHTML();
    const formattedHTML = formatHTMLTree(rawHtml);
    const cleanHTML = options?.strip
      ? options.strip(formattedHTML)
      : formattedHTML;

    try {
      await access(filename, constants.R_OK);
    } catch {
      await mkdir(dirname, { recursive: true });
      await writeFile(filename, cleanHTML);
      return {
        message: () => `Baseline HTML created at ${filename}.`,
        pass: true,
      };
    }

    const original = await readFile(filename, "utf-8");
    if (cleanHTML !== original) {
      const newFilename = path.resolve(dirname, `${name}.new.html`);
      await writeFile(newFilename, cleanHTML);

      const diff = diffHTMLs(original, cleanHTML);
      await writeFile(path.resolve(dirname, `${name}.html.diff`), diff);

      return {
        message: () => `HTML differs from baseline see ${newFilename}\n${diff}`,
        pass: false,
      };
    }
    return { message: () => "HTML matches baseline", pass: true };
  },
});

function diffHTMLs(html: string, original: string): string {
  const diffs = diffLines(html, original, { ignoreWhitespace: true });
  return diffs
    .map((diff) =>
      diff.added
        ? lines(diff.value, true)
        : diff.removed
          ? lines(diff.value, false)
          : false,
    )
    .filter(Boolean)
    .join("\n");
}

function lines(lines: string, added: boolean): string {
  return lines
    .split("\n")
    .map((line) => (added ? `+ ${line}` : `- ${line}`))
    .join("\n");
}

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
    if (file.endsWith(".new.html") || file.endsWith(".html.diff"))
      await unlink(path.resolve(dirname, file));
}
