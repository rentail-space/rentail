import { join } from "node:path";
import { URL as URLString } from "node:url";
import { delay, invariant } from "es-toolkit";
import {
  type BrowserContext,
  chromium,
  type Page,
  type Route,
} from "playwright";
import "~/test/helpers/toMatchScreenshot";
import { type ChildProcess, fork } from "node:child_process";
import { readdir } from "node:fs/promises";
import debug from "debug";
import { afterAll } from "vitest";
import config from "vitest.config";

const port = 9222;
const URL = `http://localhost:${port}`;

export let context: BrowserContext | undefined;
export let worker: ChildProcess | undefined;

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
  const dirname = join(import.meta.dirname, "../../node_modules/.vite/deps");
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

  const logging = debug("browser").enabled;
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

/**
 * Launch a new server instance.
 *
 * @returns The server worker.
 */
export async function launchServer(): Promise<void> {
  if (worker) return;

  const logging = debug("server").enabled;
  if (logging) console.info("[SERVER] launching server");

  // Start the server as forked process, that way we don't share the same node
  // instance, which could cause issues with some libraries (eg Prisma)
  worker = fork(join(__dirname, "serverWorker.ts"), {
    stdio: "inherit",
    env: {
      ...process.env,
      NODE_ENV: "test",
      PORT: port.toString(),
    },
  });

  // Listen for worker messages
  await new Promise<void>((resolve, reject) => {
    invariant(worker, "Server worker is not defined");
    worker.on("message", (msg: { type: string; error?: string }) => {
      if (msg.type === "ready") resolve();
      if (msg.type === "error") reject(new Error(`Worker error: ${msg.error}`));
    });

    worker.on("error", (error) => {
      if (logging) console.error("[SERVER] worker error:", error);
      reject(error);
    });

    worker.on("exit", (code) => {
      if (code !== 0)
        reject(new Error(`Worker stopped with exit code ${code}`));
    });
  });

  if (logging) console.info("[SERVER] server is ready");
}

async function blockOutgoingRequests(route: Route): Promise<void> {
  const { hostname } = new URLString(route.request().url());
  const resourceType = route.request().resourceType();
  const logging = debug("browser").enabled;

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
  const logging = debug("browser").enabled || debug("server").enabled;

  if (context) {
    if (logging) console.info("[BROWSER] closing context");
    await context.close();
    context = undefined;
    if (logging) console.info("[BROWSER] context closed");
  }

  if (worker && !worker.killed) {
    if (logging) console.info("[SERVER] killing worker");
    worker.once("exit", () => {
      worker = undefined;
    });
    worker.kill("SIGTERM");
    // Force kill after 1s if still running
    await delay(1000);
    if (worker && !worker.killed) worker.kill("SIGKILL");
  }
  worker = undefined;

  if (logging) console.info("[CLEANUP] complete");
}

process.once("exit", cleanup);
process.once("SIGINT", cleanup);
process.once("SIGTERM", cleanup);

afterAll(cleanup);
