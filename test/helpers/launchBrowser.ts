import { join } from "node:path";
import { URL as URLString } from "node:url";
import { Worker } from "node:worker_threads";
import { invariant, withTimeout } from "es-toolkit";
import {
  type BrowserContext,
  chromium,
  type Page,
  type Route,
} from "playwright";
import "~/test/helpers/toMatchScreenshot";
import debug from "debug";

const port = 9222;
export const URL = `http://localhost:${port}`;

let context: BrowserContext | undefined;
let serverWorker: Worker | undefined;

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
  const headless = process.env.CI ? true : !debug("browser").enabled;
  if (!context) {
    context = await chromium.launchPersistentContext("test/context", {
      baseURL: URL,
      headless,
      // Slow down all operations to simulate slower CI environment
      // Set SLOW_MO=1000 to add 1 second delay between each operation
      slowMo: process.env.SLOW_MO ? Number(process.env.SLOW_MO) : undefined,
    });

    // Set navigation timeout to 8s (less than 10s hook timeout)
    // This ensures Playwright fails first with a useful error message
    context.setDefaultNavigationTimeout(8000);

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
  }
  return context;
}

/**
 * Launch a new server instance.
 *
 * @returns The server worker.
 */
export async function launchServer(): Promise<void> {
  if (serverWorker) return;

  const logging = debug("server").enabled;
  if (logging) console.info("[SERVER] launching server");

  // Start server as Worker thread
  serverWorker = new Worker(join(__dirname, "serverWorker.ts"), {
    workerData: { port },
    env: {
      ...process.env,
    },
  });

  // Listen for worker messages
  await withTimeout(
    async () => {
      return new Promise<void>((resolve, reject) => {
        invariant(serverWorker, "Server worker is not defined");
        serverWorker.on("message", (msg: { type: string; error?: string }) => {
          if (msg.type === "ready") {
            if (logging) console.info("[SERVER] server is ready");
            resolve();
          } else if (msg.type === "error")
            reject(new Error(`Worker error: ${msg.error}`));
        });

        serverWorker.on("error", (error) => {
          if (logging) console.error("[SERVER] worker error:", error);
          reject(error);
        });

        serverWorker.on("exit", (code) => {
          if (code !== 0)
            reject(new Error(`Worker stopped with exit code ${code}`));
        });
      });
    },
    10000, // 10 seconds timeout for server startup
  );
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
