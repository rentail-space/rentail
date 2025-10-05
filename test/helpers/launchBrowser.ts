import { join } from "node:path";
import { URL as URLString } from "node:url";
import { invariant } from "es-toolkit";
import {
  type BrowserContext,
  chromium,
  type Page,
  type Route,
} from "playwright";
import "~/test/helpers/toMatchScreenshot";
import { type ChildProcess, fork } from "node:child_process";
import debug from "debug";
import { afterAll } from "vitest";
import config from "vitest.config";

const port = 9222;
export const URL = `http://localhost:${port}`;

let context: BrowserContext | undefined;
let worker: ChildProcess | undefined;

/**
 * Open a new page in the browser.
 *
 * @returns The page.
 */
export async function openPage(): Promise<Page> {
  await launchServer();
  const context = await launchBrowser();
  const page = await context.newPage();
  page.route("**", (route) => blockBrowserRequest(route));
  return page;
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
    baseURL: URL,
    headless,
    // Slow down all operations to simulate slower CI environment
    // Set SLOW_MO=1000 to add 1 second delay between each operation
    slowMo: process.env.SLOW_MO ? Number(process.env.SLOW_MO) : undefined,
  });

  // Set navigation timeout to 3s less than hook timeout
  // This ensures Playwright fails first with a useful error message
  context.setDefaultNavigationTimeout(
    (config.test?.hookTimeout ?? 30000) - 3000,
  );

  // Always log browser console in CI, or when DEBUG=browser is set
  if (process.env.CI || debug("browser").enabled) {
    context.on("console", (message) => {
      const prefix = "[BROWSER]";
      switch (message.type()) {
        case "info":
          console.info(prefix, message.text());
          break;
        case "warning":
          console.warn(prefix, message.text());
          break;
        case "debug":
          console.debug(prefix, message.text());
          break;
        case "error":
          console.error(prefix, message.text());
          break;
        case "log":
          console.log(prefix, message.text());
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

  worker = fork(join(__dirname, "serverWorker.ts"), {
    stdio: "inherit",
    env: {
      ...process.env,
      PORT: port.toString(),
      NODE_ENV: "test",
    },
  });

  // Listen for worker messages
  await new Promise<void>((resolve, reject) => {
    invariant(worker, "Server worker is not defined");
    worker.on("message", (msg: { type: string; error?: string }) => {
      if (msg.type === "ready") resolve();
      else if (msg.type === "error")
        reject(new Error(`Worker error: ${msg.error}`));
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

async function blockBrowserRequest(route: Route): Promise<void> {
  const { hostname } = new URLString(route.request().url());
  const resourceType = route.request().resourceType();

  if (hostname === "localhost" || hostname === "127.0.0.1") {
    await route.continue();
  } else {
    // NOTE: According to Claud, non-blocked requests can interfere with cookie
    // handling because Playwright waits for all requests to complete before
    // considering a navigation finished, so we must abort blocked requests.
    if (process.env.CI || debug("browser").enabled)
      console.warn(`[BROWSER] blocking ${resourceType}: ${hostname}`);
    await route.abort();
  }
}

afterAll(async () => {
  if (context) await context.close();
  if (worker) worker.kill();
});
