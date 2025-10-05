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
 * @returns The page.
 */
export async function goto(path: string): Promise<Page> {
  await launchServer();
  const context = await launchBrowser();
  const page = await context.newPage();
  page.route("**", (route) => blockBrowserRequest(route));
  await waitForDependencies(page, path);
  return page;
}

/**
 * Wait for dev server to build all cached dependencies.
 *
 * @param page - The page to wait for.
 * @param path - The path to wait for.
 */
async function waitForDependencies(page: Page, path: string) {
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
  await page.goto(path, { waitUntil: "networkidle" });
  await page.waitForFunction(() => "__reactRouterContext" in window);
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

  worker = fork(join(__dirname, "serverWorker.ts"), {
    stdio: "inherit",
    env: {
      ...process.env,
      PORT: port.toString(),
      NODE_ENV: "test",
    },
  });

  // Ensure worker is killed when parent process exits or receives signals
  const cleanup = () => {
    if (worker && !worker.killed) {
      if (logging) console.info("[SERVER] killing worker");
      worker.kill("SIGTERM");
    }
  };
  process.once("exit", cleanup);
  process.once("SIGINT", cleanup);
  process.once("SIGTERM", cleanup);

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

export async function cleanup() {
  if (context) {
    await context.close();
    context = undefined;
  }
  if (worker && !worker.killed) {
    worker.kill("SIGTERM");
    // Force kill after 1s if still running
    await new Promise((resolve) => {
      const timeout = setTimeout(() => {
        if (worker && !worker.killed) {
          worker.kill("SIGKILL");
        }
        resolve(undefined);
      }, 1000);
      worker?.once("exit", () => {
        clearTimeout(timeout);
        resolve(undefined);
      });
    });
    worker = undefined;
  }
}

afterAll(cleanup);
