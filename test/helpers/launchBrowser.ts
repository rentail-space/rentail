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

const URL = `http://localhost:${port}`;
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
 * @param page - The page to wait for.
 * @param path - The path to wait for.
 */
async function waitForDependencies(page: Page, path: string) {
  // We expect 900+ files to be present in .vite/deps
  const dirname = resolve("node_modules/.vite/deps");
  await Promise.all([
    page.goto(path, { waitUntil: "networkidle" }),
    (async () => {
      while (true) {
        try {
          const files = await readdir(dirname);
          if (files.length > 100) break;
        } catch {}
        await delay(100);
      }
    })(),
  ]);

  await page.goto(path);
  // Make sure React is available
  await page.waitForFunction(() => "__reactRouterContext" in window);
}

/**
 * Launch a new browser instance and return the context.
 *
 * @returns The browser context.
 */
export async function launchBrowser(): Promise<BrowserContext> {
  if (context) return context;

  // CI can set DEBUG=browser to see browser logs without opening the browser
  const headless = process.env.CI ? true : !logging;
  context = await chromium.launchPersistentContext("test/context", {
    baseURL: URL,
    headless,
    // Slow down all operations to simulate slower CI environment
    // Set SLOW_MO=1000 to add 1 second delay between each operation
    slowMo: process.env.SLOW_MO ? Number(process.env.SLOW_MO) : undefined,
  });

  // Block all requests that are not localhost or 127.0.0.1
  // For logging, since MSW should also block external requests
  context.route("**", (route) => blockOutgoingRequests(route));

  // Set navigation timeout to 3s less than hook timeout
  // This ensures Playwright fails first with a useful error message
  context.setDefaultNavigationTimeout(
    (config.test?.hookTimeout ?? 30000) - 3000,
  );

  // Always log browser console when DEBUG=browser is set
  if (logging) {
    context.on("console", (message) => {
      const text = message.text();
      // Skip HMR connection warnings (expected during test cleanup)
      if (text.includes("server connection lost")) return;

      const prefix = "[BROWSER]";
      switch (message.type()) {
        case "info":
          console.info(prefix, text);
          break;
        case "warning":
          console.warn(prefix, text);
          break;
        case "debug":
          console.debug(prefix, text);
          break;
        case "error":
          console.error(prefix, text);
          break;
        case "log":
          console.log(prefix, text);
          break;
      }
    });
  }
  return context;
}

async function blockOutgoingRequests(route: Route): Promise<void> {
  const { hostname } = new URLString(route.request().url());
  const resourceType = route.request().resourceType();

  if (hostname === "localhost" || hostname === "127.0.0.1") {
    await route.continue();
  } else {
    // NOTE: According to Claud, non-blocked requests can interfere with cookie
    // handling because Playwright waits for all requests to complete before
    // considering a navigation finished, so we must abort blocked requests.
    if (logging)
      console.warn(`[BROWSER] blocking ${resourceType}: ${hostname}`);
    await route.abort();
  }
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
