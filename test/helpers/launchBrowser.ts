import { type ChildProcess, spawn } from "node:child_process";
import { existsSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { URL as URLString } from "node:url";
import { invariant, withTimeout } from "es-toolkit";
import {
  type Browser,
  type BrowserContext,
  chromium,
  type Page,
  type Route,
} from "playwright";
import env from "~/lib/env";
import "~/test/helpers/toMatchScreenshot";

const port = 9222;
const lockFile = join(tmpdir(), `rentail-server-${port}.lock`);

export const URL = `http://localhost:${port}`;

let browser: Browser;
let context: BrowserContext;
let server: ChildProcess;

/**
 * Launch a new browser instance and return the context.
 *
 * @param logging - Whether to run the browser in headless mode.
 * @returns The browser context.
 */
export async function launchBrowser(
  logging = env.isDebug,
): Promise<BrowserContext> {
  if (!browser)
    browser = await chromium.launch({
      headless: process.env.CI ? true : !logging,
    });
  if (!context) context = await browser.newContext();
  return context;
}

/**
 * Open a new page in the browser.
 *
 * @param logging - Whether to log debug messages, launch browsr in non-headless mode.
 * @returns The page.
 */
export async function openPage(logging = env.isDebug): Promise<Page> {
  await launchServer(logging);
  const context = await launchBrowser(logging);
  const page = await context.newPage();
  page.route("**", (route) => blockBrowserRequest(route));
  return page;
}

/**
 * Launch a new server instance.
 *
 * @param logging - Whether to log debug messages.
 * @returns The server process.
 */
export async function launchServer(
  logging = env.isDebug,
): Promise<ChildProcess> {
  if (server) return server;

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

  return await withTimeout(
    () =>
      new Promise<ChildProcess>((resolve, reject) => {
        server.once("error", (error) => {
          try {
            unlinkSync(lockFile);
            server.kill("SIGTERM");
          } catch (error) {
            console.error("[TEST] error cleaning up lock file\n\t%s", error);
          }
          reject(error);
        });

        if (server.stdout === null) {
          unlinkSync(lockFile);
          server.kill("SIGTERM");
          return reject(new Error("Failed to start server."));
        }

        if (logging) {
          server.stdout.on("data", (stream: Buffer) =>
            process.stdout.write(`\x1b[92m${stream}\x1b[0m`),
          );
          server.stderr?.on("data", (stream: Buffer) =>
            process.stderr.write(`\x1b[91m${stream}\x1b[0m`),
          );
        }

        server.stdout.on("data", (stream: Buffer) => {
          if (stream.toString().includes(port.toString()))
            setTimeout(() => resolve(server), 10);
        });
      }),
    3000,
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
  if (env.isDebug) console.info("[TEST] cleaning up server and browser");

  // Close browser
  if (context) {
    await context.close();
    // @ts-expect-error - Resetting to undefined
    context = undefined;
  }
  if (browser) {
    await browser.close();
    // @ts-expect-error - Resetting to undefined
    browser = undefined;
  }

  // Kill server
  if (server) {
    if (env.isDebug) console.info("[TEST] killing server process");
    server.kill("SIGTERM");
    // @ts-expect-error - Resetting to undefined
    server = undefined;
  }

  // Remove lock file
  if (existsSync(lockFile)) {
    try {
      unlinkSync(lockFile);
      if (env.isDebug) console.info("[TEST] removed lock file");
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
    if (env.isDebug) console.debug(`[BROWSER] blocking request to ${hostname}`);
    await route.abort("accessdenied");
  }
}
