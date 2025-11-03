import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { URL as URLString } from "node:url";
import debug from "debug";
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
const warmedUpPorts = new Set<number>();
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

  // Warm up Vite on first page load to avoid mid-test reloads
  // Track warmup per port since each test file gets its own Vite server
  if (!warmedUpPorts.has(port)) {
    logger("Warming up Vite for port %d", port);
    const warmupPage = await context.newPage();
    try {
      await warmupPage.goto("/chat", { waitUntil: "load" });
      // Wait for Vite to finish optimizing and trigger the reload
      await warmupPage.waitForLoadState("networkidle");
      // Give Vite time to trigger the optimization reload
      await warmupPage.waitForTimeout(3000);
      // Wait for the post-optimization reload to complete
      await warmupPage.waitForLoadState("networkidle");
      await warmupPage.waitForTimeout(500);
      logger("Vite warmed up for port %d", port);
    } catch (error) {
      logger(
        "Vite warmup failed for port %d (continuing anyway): %O",
        port,
        error,
      );
    } finally {
      await warmupPage.close();
      warmedUpPorts.add(port);
    }
  }

  const page = await context.newPage();
  if (headers)
    await page.setExtraHTTPHeaders(Object.fromEntries(new Headers(headers)));

  await page.goto(path);
  await page.waitForLoadState("networkidle");
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
    viewport: { width: 960, height: 600 },
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

  // Ensure the __screenshots__ directory exists
  await mkdir(resolve("__screenshots__"), { recursive: true });

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
