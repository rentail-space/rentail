import { type ChildProcess, spawn } from "node:child_process";
import { existsSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { URL as URLString } from "node:url";
import { invariant, withTimeout } from "es-toolkit";
import {
  type BrowserContext,
  chromium,
  type Page,
  type Route,
} from "playwright";
import "~/test/helpers/toMatchScreenshot";
import debug from "debug";
import { afterAll } from "vitest";

const port = 9222;
const lockFile = join(tmpdir(), `rentail-server-${port}.lock`);

export const URL = `http://localhost:${port}`;

let context: BrowserContext;
let server: ChildProcess;

afterAll(async () => {
  if (context) await context.close();
  if (server) server.kill("SIGTERM");
});

/**
 * Open a new page in the browser.
 *
 * @returns The page.
 */
export async function openPage(): Promise<Page> {
  await launchServer();
  await launchBrowser();
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
 * @returns The server process.
 */
export async function launchServer(): Promise<ChildProcess> {
  if (server) return server;

  const logging = debug("server").enabled;
  if (logging) console.info("[TEST] launching server");

  // Check if lock file exists and server is running
  if (existsSync(lockFile)) {
    if (logging)
      console.debug(
        "[TEST] lockFile exists, checking server health\n\t%s",
        lockFile,
      );

    if (await checkServerHealth())
      throw new Error("[TEST] server is already running");

    // Clean up stale lock files
    try {
      if (logging)
        console.debug("[TEST] cleaning up stale lock file\n\t%s", lockFile);
      unlinkSync(lockFile);
    } catch (error) {
      console.error("[TEST] error cleaning up lock file\n\t%s", error);
    }
  }

  // Start new server instance in test mode
  server = spawn("react-router", ["dev", "--port", port.toString()], {
    detached: true,
    stdio: ["pipe", "pipe", "pipe"],
    env: {
      ...process.env,
      NODE_ENV: "test",
    },
  });

  process.on("exit", () => {
    if (logging) console.debug("[TEST] server process exited, killing server");
    unlinkSync(lockFile);
    server.kill("SIGTERM");
  });

  // Create lock file
  invariant(server.pid, "Server process ID is not available");
  writeFileSync(lockFile, server.pid.toString());

  // Set up logging if requested
  if (logging && server.stdout && server.stderr) {
    server.stdout.on("data", (stream: Buffer) =>
      process.stdout.write(`\x1b[92m${stream}\x1b[0m`),
    );
    server.stderr.on("data", (stream: Buffer) =>
      process.stderr.write(`\x1b[91m${stream}\x1b[0m`),
    );
  }

  // Handle server errors
  server.once("error", (error) => {
    try {
      unlinkSync(lockFile);
      server.kill("SIGTERM");
    } catch (cleanupError) {
      console.error("[TEST] error cleaning up lock file\n\t%s", cleanupError);
    }
    throw error;
  });

  // Poll server health instead of waiting for stdout
  // This is more reliable across different environments
  if (logging) console.info("[TEST] waiting for server to be ready...");

  return await withTimeout(
    async () => {
      while (true) {
        if (await checkServerHealth()) {
          if (logging) console.info("[TEST] server is ready");
          return server;
        }
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    },
    30000, // 30 seconds timeout for server startup
  );
}

/**
 * Check if the server is healthy.
 * @returns True if the server is running and responding to requests.
 */
async function checkServerHealth(): Promise<boolean> {
  try {
    const response = await fetch(URL);
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Cleanup server and browser resources when all tests finish.
 */
export async function cleanupServer(): Promise<void> {
  const logging = debug("server").enabled;
  if (logging) console.info("[TEST] cleaning up server and browser");

  // Close browser
  if (context) {
    await context.close();
    // @ts-expect-error - Resetting to undefined
    context = undefined;
  }

  // Kill server
  if (server) {
    if (logging) console.info("[TEST] killing server process");
    server.kill("SIGTERM");
    // @ts-expect-error - Resetting to undefined
    server = undefined;
  }

  // Remove lock file
  if (existsSync(lockFile)) {
    try {
      unlinkSync(lockFile);
      if (logging) console.info("[TEST] removed lock file");
    } catch (error) {
      console.error("[TEST] error removing lock file:", error);
    }
  }
}

async function blockBrowserRequest(route: Route): Promise<void> {
  const { hostname } = new URLString(route.request().url());
  const url = route.request().url();
  if (url.startsWith("http://localhost:")) {
    await route.continue();
  } else {
    // NOTE: According to Claud, non-blocked requests can interfere with cookie
    // handling because Playwright waits for all requests to complete before
    // considering a navigation finished, so we must abort blocked requests.
    await route.abort();
    if (debug("browser").enabled)
      console.warn(`[BROWSER] blocking request to ${hostname}`);
  }
}
