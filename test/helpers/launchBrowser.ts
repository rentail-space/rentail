import debug from "debug";
import { readdir, watch } from "node:fs/promises";
import { resolve } from "node:path";
import { URL as URLString } from "node:url";
import {
  type Browser,
  type BrowserContext,
  chromium,
  type Page,
  type Route,
} from "playwright";
import "~/test/helpers/toMatchScreenshot";
import { launchServer } from "./launchServer";

let browser: Browser | undefined;
let context: BrowserContext | undefined;
const logger = debug("browser");

/**
 * Open a new page in the browser.
 *
 * @param path - The path to open.
 * @param headers - The headers to set on the page.
 * @returns The page.
 */
export async function goto(path: string, headers?: HeadersInit): Promise<Page> {
  const { port } = await launchServer();
  const context = await newContext(port);
  const page = await context.newPage();
  if (headers)
    await page.setExtraHTTPHeaders(Object.fromEntries(new Headers(headers)));

  await page.goto("/");
  await waitForDependencies(page);

  await page.goto(path);
  return page;
}

/**
 * Create a new browser context.
 *
 * @returns The browser context.
 */
async function newContext(port: number): Promise<BrowserContext> {
  if (context) return context;

  const browser = await launchBrowser();
  context = await browser.newContext({
    baseURL: `http://localhost:${port}`,
  });
  context.route("**", blockOutgoingRequests);
  context
    .on("console", (msg) => {
      if (msg.type() === "error") console.error(msg.text());
      else logger("%s: %s", msg.type(), msg.text());
    })
    .on("weberror", (error) => {
      logger("error:", error);
    });

  // Set navigation timeout to 5s less than hook timeout for better error messages
  context.setDefaultNavigationTimeout(25_000);

  return context;
}

/**
 * Launch a new browser instance and return it.
 *
 * @returns The browser.
 */
async function launchBrowser(): Promise<Browser> {
  if (browser) return browser;

  const headless = process.env.CI ? true : !logger.enabled;
  browser = await chromium.launch({
    headless,
    slowMo: process.env.SLOW_MO ? Number(process.env.SLOW_MO) : undefined,
  });
  return browser;
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
  logger("blocking %s: %s", resourceType, hostname);
  await route.abort();
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
export async function waitForDependencies(page: Page) {
  const dirname = resolve("node_modules/.vite/deps");

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
