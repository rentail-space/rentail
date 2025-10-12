import { readdir, watch } from "node:fs/promises";
import { resolve } from "node:path";
import { URL as URLString } from "node:url";
import debug from "debug";
import {
  type BrowserContext,
  chromium,
  type Page,
  type Route,
} from "playwright";
import { afterAll } from "vitest";
import "~/test/helpers/toMatchScreenshot";
import { launchServer, port } from "./launchServer";

let context: BrowserContext | undefined;

/**
 * Open a new page in the browser.
 *
 * @param path - The path to open.
 * @returns The page.
 */
export async function goto(
  path: string,
  headers?: Record<string, string>,
): Promise<Page> {
  await launchServer();
  const context = await launchBrowser();
  const page = await context.newPage();
  await page.setExtraHTTPHeaders(headers ?? {});
  await waitForDependencies(page, path);
  return page;
}

/**
 * Wait for dev server to build all cached dependencies and open the page.
 *
 * First navigation triggers Vite to build dependencies, then we wait for them
 * to be ready before reloading the page.
 *
 * @param page - The page to wait for.
 * @param path - The path to wait for.
 */
async function waitForDependencies(page: Page, path: string) {
  const dirname = resolve("node_modules/.vite/deps");

  // Trigger initial build
  await page.goto(path);

  // Wait for Vite to generate dependency cache (900+ files expected)
  if (!(await hasEnoughDependencies(dirname))) {
    try {
      const watcher = watch(dirname);
      for await (const _event of watcher)
        if (await hasEnoughDependencies(dirname)) break;
    } catch {
      // Directory doesn't exist yet, wait a bit and try again
      await page.waitForTimeout(1000);
    }
  }

  // Reload with cached dependencies
  await page.goto(path);
  await page.waitForFunction(() => "__reactRouterContext" in window);
}

async function hasEnoughDependencies(dirname: string) {
  try {
    const files = await readdir(dirname);
    return files.length > 100;
  } catch {
    return false;
  }
}

/**
 * Launch a new browser instance and return the context.
 *
 * @returns The browser context.
 */
export async function launchBrowser(): Promise<BrowserContext> {
  if (context) return context;

  const headless = process.env.CI ? true : !debug("browser").enabled;
  context = await chromium.launchPersistentContext("test/context", {
    baseURL: `http://localhost:${port}`,
    headless,
    slowMo: process.env.SLOW_MO ? Number(process.env.SLOW_MO) : undefined,
  });

  context.route("**", blockOutgoingRequests);

  // Set navigation timeout to 3s less than hook timeout for better error messages
  context.setDefaultNavigationTimeout(10_000);

  context.on("console", (msg) => debug("browser")(msg.text()));

  return context;
}

async function blockOutgoingRequests(route: Route): Promise<void> {
  const { hostname } = new URLString(route.request().url());

  if (hostname === "localhost" || hostname === "127.0.0.1") {
    await route.continue();
    return;
  }

  // Abort non-local requests to prevent cookie handling interference
  // (Playwright waits for all requests before completing navigation)
  const resourceType = route.request().resourceType();
  debug("browser")("blocking %s: %s", resourceType, hostname);
  await route.abort();
}

async function cleanup() {
  if (context) {
    debug("browser")("closing context");
    await context.close();
    context = undefined;
    debug("browser")("context closed");
  }
}

process.once("exit", cleanup);
process.once("SIGINT", cleanup);
process.once("SIGTERM", cleanup);

afterAll(cleanup);
