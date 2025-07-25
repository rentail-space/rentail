import { type ChildProcess, spawn } from "node:child_process";
import { existsSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const port = 9222;
const lockFile = join(tmpdir(), `rentail-server-${port}.lock`);
const pidFile = join(tmpdir(), `rentail-server-${port}.pid`);

let server:
  | {
      port: number;
      stop: () => boolean;
    }
  | undefined;

function isProcessRunning(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

async function checkServerHealth(): Promise<boolean> {
  try {
    const response = await fetch(`http://localhost:${port}`);
    return response.ok;
  } catch {
    return false;
  }
}

export async function launchServer() {
  if (server) return server;

  // Check if lock file exists and server is running
  if (existsSync(lockFile)) {
    try {
      const pidStr = readFileSync(pidFile, "utf8");
      const pid = Number.parseInt(pidStr, 10);

      if (isProcessRunning(pid) && (await checkServerHealth())) {
        // Server is already running and healthy
        server = {
          port,
          stop: () => {
            try {
              process.kill(pid, "SIGTERM");
              unlinkSync(lockFile);
              unlinkSync(pidFile);
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
        unlinkSync(pidFile);
      } catch {}
    } catch {
      // Clean up corrupted lock files
      try {
        unlinkSync(lockFile);
        unlinkSync(pidFile);
      } catch {}
    }
  }

  // Start new server instance
  const instance = spawn("react-router", ["dev", "--port", port.toString()], {
    detached: true,
    stdio: ["pipe", "pipe", "pipe"],
  });

  // Create lock file
  writeFileSync(lockFile, new Date().toISOString());
  if (instance.pid) writeFileSync(pidFile, instance.pid.toString());

  return await new Promise<{
    port: number;
    stop: () => boolean;
  }>((resolve, reject) => {
    const timeout = setTimeout(() => {
      instance.kill("SIGTERM");
      reject(new Error("Server failed to start within 30 seconds"));
    }, 30000);

    instance.once("error", (error) => {
      clearTimeout(timeout);
      try {
        unlinkSync(lockFile);
        unlinkSync(pidFile);
      } catch {}
      reject(error);
    });

    if (instance.stdout === null) {
      clearTimeout(timeout);
      return reject(new Error("Failed to start server."));
    }

    instance.stdout.on("data", (stream: Buffer) => {
      if (stream.toString().includes(port.toString())) {
        clearTimeout(timeout);
        server = {
          port,
          stop: () => {
            try {
              instance.kill("SIGTERM");
              unlinkSync(lockFile);
              unlinkSync(pidFile);
              return true;
            } catch {
              return false;
            }
          },
        };
        return resolve(server);
      }
    });
  });
}

export const URL = `http://localhost:${port}`;
