import { type ChildProcess, spawn } from "node:child_process";
import { existsSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { URL as URLString } from "node:url";
import { invariant } from "es-toolkit";
import {
  type Browser,
  type BrowserContext,
  chromium,
  type Page,
  type Route,
} from "playwright";
import env from "~/lib/env";
import "./toMatchScreenshot";
import { afterAll } from "vitest";

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

    try {
      if (await checkServerHealth())
        throw new Error("Server is already running and healthy");

      // Clean up stale lock files
      try {
        if (logging) console.debug("[TEST] cleaning up stale lock file");
        unlinkSync(lockFile);
      } catch (error) {
        console.error("[TEST] error cleaning up lock file\n\t%s", error);
      }
    } catch {
      // Clean up corrupted lock files
      try {
        unlinkSync(lockFile);
      } catch (error) {
        console.error("[TEST] error cleaning up lock file\n\t%s", error);
      }
    }
  }

  // Start new server instance in test mode
  const serverProcess = spawn(
    "react-router",
    ["dev", "--port", port.toString()],
    {
      detached: true,
      stdio: ["pipe", "pipe", "pipe"],
      env: {
        ...process.env,
        NODE_ENV: "test",
      },
    },
  );
  process.on("beforeExit", () => {
    if (logging) console.debug("[TEST] server process exited, killing server");
    serverProcess.kill("SIGTERM");
  });

  // Create lock file
  invariant(serverProcess.pid, "Server process ID is not available");
  writeFileSync(lockFile, serverProcess.pid.toString());

  return await new Promise<ChildProcess>((resolve, reject) => {
    const timeout = setTimeout(() => {
      serverProcess.kill("SIGTERM");
      reject(new Error("Server failed to start within 30 seconds"));
    }, 30000);

    serverProcess.once("error", (error) => {
      clearTimeout(timeout);
      try {
        unlinkSync(lockFile);
      } catch (error) {
        console.error("[TEST] error cleaning up lock file\n\t%s", error);
      }
      reject(error);
    });

    if (serverProcess.stdout === null) {
      clearTimeout(timeout);
      return reject(new Error("Failed to start server."));
    }

    if (logging)
      serverProcess.stdout.on("data", (stream: Buffer) =>
        process.stdout.write(stream),
      );

    afterAll(() => {
      serverProcess.kill("SIGTERM");
      unlinkSync(lockFile);
    });

    serverProcess.stdout.on("data", (stream: Buffer) => {
      if (stream.toString().includes(port.toString())) {
        clearTimeout(timeout);
        setTimeout(() => {
          server = serverProcess;
          return resolve(server);
        }, 10);
      }
    });
  });
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
