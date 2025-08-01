import { spawn } from "node:child_process";
import { existsSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  type Browser,
  type BrowserContext,
  chromium,
  type Page,
} from "playwright";
import invariant from "tiny-invariant";
import "./toMatchScreenshot";
import config from "~/lib/config";

const port = 9222;
const lockFile = join(tmpdir(), `rentail-server-${port}.lock`);

export const URL = `http://localhost:${port}`;

let browser: Browser;
let context: BrowserContext;
let server: { port: number; stop: () => boolean };
const stdout = process.stdout;

/**
 * Launch the server and browser. Returns instance of server and browser page.
 * @returns The browser page.
 */
export async function launchBrowser(): Promise<Page> {
  if (!server) await launchServer();
  if (!browser) browser = await chromium.launch();
  if (!context) context = await browser.newContext();
  return await context.newPage();
}

/**
 * Launch a new server instance.
 * @returns The server instance.
 */
async function launchServer() {
  // Check if lock file exists and server is running
  if (existsSync(lockFile)) {
    console.debug(
      "[TEST] lockFile exists, checking server health\n\t%s",
      lockFile,
    );
    try {
      const pidStr = readFileSync(lockFile, "utf8");
      const pid = Number.parseInt(pidStr, 10);

      if (await checkServerHealth()) {
        // Server is already running and healthy
        console.debug("[TEST] server is already running and healthy");
        server = {
          port,
          stop: () => {
            try {
              console.debug("[TEST] killing server");
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
  process.on("exit", () => {
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
      serverProcess.stdout.on("data", (stream: Buffer) => stdout.write(stream));
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
