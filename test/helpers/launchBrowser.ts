import { spawn } from "node:child_process";
import { existsSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  type Browser,
  type BrowserContext,
  chromium,
  type Page,
  type Route,
} from "playwright";
import invariant from "tiny-invariant";
import "./toMatchScreenshot";
import { URL as URLString } from "node:url";
import config from "~/lib/config";

const port = 9222;
const lockFile = join(tmpdir(), `rentail-server-${port}.lock`);

export const URL = `http://localhost:${port}`;

let browser: Browser;
let context: BrowserContext;
let server: { port: number; stop: () => boolean };

/**
 * Launch the server and browser. Returns instance of server and browser page.
 * @returns The browser page.
 */
export async function launchBrowser(): Promise<Page> {
  if (!server) await launchServer();
  if (!browser) browser = await chromium.launch();
  if (!context) context = await browser.newContext();
  const page = await context.newPage();
  page.route("**", blockBrowserRequest);
  return page;
}

/**
 * Launch a new server instance.
 * @returns The server instance.
 */
async function launchServer() {
  // Check if lock file exists and server is running
  if (existsSync(lockFile)) {
    if (config.isDebug)
      console.debug(
        "[TEST] lockFile exists, checking server health\n\t%s",
        lockFile,
      );

    try {
      const pidStr = readFileSync(lockFile, "utf8");
      const pid = Number.parseInt(pidStr, 10);

      if (await checkServerHealth()) {
        // Server is already running and healthy
        if (config.isDebug)
          console.debug("[TEST] server is already running and healthy");
        server = {
          port,
          stop: () => {
            try {
              if (config.isDebug) console.debug("[TEST] killing server");
              process.kill(pid);
              unlinkSync(lockFile);
              return true;
            } catch {
              return false;
            }
          },
        };
        return server;
      }

      // Clean up stale lock files
      try {
        if (config.isDebug) console.debug("[TEST] cleaning up stale lock file");
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
    if (config.isDebug)
      console.debug("[TEST] server process exited, killing server");
    serverProcess.kill("SIGTERM");
  });

  // Create lock file
  invariant(serverProcess.pid, "Server process ID is not available");
  writeFileSync(lockFile, serverProcess.pid.toString());

  return await new Promise<{
    port: number;
    stop: () => boolean;
  }>((resolve, reject) => {
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

    serverProcess.stdout.on("data", (stream: Buffer) => {
      if (stream.toString().includes(port.toString())) {
        clearTimeout(timeout);
        server = {
          port,
          stop: () => {
            try {
              serverProcess.kill();
              unlinkSync(lockFile);
              return true;
            } catch {
              return false;
            }
          },
        };
        return resolve(server);
      }
    });

    if (config.isDebug)
      serverProcess.stdout.on("data", (stream: Buffer) =>
        process.stdout.write(stream),
      );
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
    if (config.isDebug) console.warn(`[TEST] blocking request to ${hostname}`);
    await route.abort("accessdenied");
  }
}
