import { readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { URL as URLString } from "node:url";
import debug from "debug";
import { delay } from "es-toolkit";
import {
  type BrowserContext,
  chromium,
  type Page,
  type Route,
} from "playwright";
import { afterAll } from "vitest";
import config from "vitest.config";
import "~/test/helpers/toMatchScreenshot";
import { launchServer, port } from "./launchServer";

const BASE_URL = `http://localhost:${port}`;
const VITE_DEPS_THRESHOLD = 100;
const logging = debug("browser").enabled;
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
  while (true) {
    try {
      const files = await readdir(dirname);
      if (files.length > VITE_DEPS_THRESHOLD) break;
    } catch {}
    await delay(100);
  }

  // Reload with cached dependencies
  await page.goto(path);
  await page.waitForFunction(() => "__reactRouterContext" in window);
}

/**
 * Launch a new browser instance and return the context.
 *
 * @returns The browser context.
 */
export async function launchBrowser(): Promise<BrowserContext> {
  if (context) return context;

  const headless = process.env.CI ? true : !logging;
  context = await chromium.launchPersistentContext("test/context", {
    baseURL: BASE_URL,
    headless,
    slowMo: process.env.SLOW_MO ? Number(process.env.SLOW_MO) : undefined,
  });

  context.route("**", blockOutgoingRequests);

  // Set navigation timeout to 3s less than hook timeout for better error messages
  const hookTimeout = config.test?.hookTimeout ?? 30000;
  context.setDefaultNavigationTimeout(hookTimeout - 3000);

  if (logging) {
    context.on("console", logBrowserConsole);
  }

  return context;
}

function logBrowserConsole(message: import("playwright").ConsoleMessage) {
  const text = message.text();
  if (text.includes("server connection lost")) return;

  const loggers = {
    info: console.info,
    warning: console.warn,
    debug: console.debug,
    error: console.error,
    log: console.log,
  };

  const logger = loggers[message.type() as keyof typeof loggers] ?? console.log;
  logger("[BROWSER]", text);
}

async function blockOutgoingRequests(route: Route): Promise<void> {
  const { hostname } = new URLString(route.request().url());

  if (hostname === "localhost" || hostname === "127.0.0.1") {
    await route.continue();
    return;
  }

  // Abort non-local requests to prevent cookie handling interference
  // (Playwright waits for all requests before completing navigation)
  if (logging) {
    const resourceType = route.request().resourceType();
    console.warn(`[BROWSER] blocking ${resourceType}: ${hostname}`);
  }
  await route.abort();
}

async function cleanup() {
  if (context) {
    if (logging) console.info("[BROWSER] closing context");
    await context.close();
    context = undefined;
    if (logging) console.info("[BROWSER] context closed");
  }
}

process.once("exit", cleanup);
process.once("SIGINT", cleanup);
process.once("SIGTERM", cleanup);

afterAll(cleanup);
