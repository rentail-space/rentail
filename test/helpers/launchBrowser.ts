import debug from "debug";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { URL as URLString } from "node:url";
import {
  type BrowserContext,
  type Page,
  type Route,
  chromium,
} from "playwright";

export const port = 9222;

let context: BrowserContext | undefined;
const logger = debug("browser");

/**
 * Open a new page in the browser.
 *
 * @param path - The path to open.
 * @param headers - The headers to set on the page.
 * @param options - Optional navigation options (waitUntil, timeout)
 * @returns The page.
 */
export async function goto(path: string, headers?: HeadersInit): Promise<Page> {
  const context = await newContext();

  const page = await context.newPage();
  await page.setExtraHTTPHeaders(Object.fromEntries(new Headers(headers)));
  await page.setViewportSize({ width: 1024, height: 780 });
  await page.goto(path, { waitUntil: "domcontentloaded" });
  return page;
}

/**
 * Create a new browser context.
 *
 * @returns The browser context.
 */
export async function newContext(): Promise<BrowserContext> {
  if (context) return context;

  const headless = process.env.CI ? true : !logger.enabled;
  const browser = await chromium.launch({
    headless,
    slowMo: process.env.SLOW_MO ? Number(process.env.SLOW_MO) : undefined,
  });

  context = await browser.newContext({
    baseURL: `http://localhost:${port}`,
    viewport: { width: 960, height: 600 },
  });
  context.route("**", blockOutgoingRequests);
  context
    .on("console", (msg) => {
      if (msg.text().includes("Download the React DevTools")) return;
      else if (msg.type() === "error") console.error(msg.text());
      else logger("%s: %s", msg.type(), msg.text());
    })
    .on("weberror", (error) => {
      logger("error: %s", error.error);
    });

  // Set navigation timeout to 5s less than hook timeout for better error messages
  context.setDefaultNavigationTimeout(25_000);
  // Ensure the __screenshots__ directory exists
  await mkdir(resolve("__screenshots__"), { recursive: true });

  return context;
}

async function blockOutgoingRequests(route: Route): Promise<void> {
  const { hostname } = new URLString(route.request().url());

  // Allow local requests to pass through
  if (hostname === "localhost" || hostname === "127.0.0.1")
    return await route.continue();

  // Mock rentail.space requests using localhost
  if (hostname === "rentail.space") {
    const response = await route.fetch();
    return await route.fulfill({ response });
  }

  // Abort non-local requests to prevent cookie handling interference
  // (Playwright waits for all requests before completing navigation)
  const resourceType = route.request().resourceType();
  logger("blocking %s: %s", resourceType, hostname);
  await route.abort();
}

function cleanup() {
  context?.browser()?.close();
}

process.on("exit", cleanup);
process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);
