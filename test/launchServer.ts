import { spawn } from "node:child_process";
import { existsSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import invariant from "tiny-invariant";

const port = 9222;
const lockFile = join(tmpdir(), `rentail-server-${port}.lock`);

let server:
  | {
      port: number;
      stop: () => boolean;
    }
  | undefined;

export async function launchServer() {
  if (server) return server;

  // Check if lock file exists and server is running
  if (existsSync(lockFile)) {
    try {
      const pidStr = readFileSync(lockFile, "utf8");
      const pid = Number.parseInt(pidStr, 10);

      if (await checkServerHealth()) {
        // Server is already running and healthy
        server = {
          port,
          stop: () => {
            try {
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
      } catch {}
    } catch {
      // Clean up corrupted lock files
      try {
        unlinkSync(lockFile);
      } catch {}
    }
  }

  // Start new server instance
  const process = spawn("react-router", ["dev", "--port", port.toString()], {
    detached: true,
    stdio: ["pipe", "pipe", "pipe"],
  });

  // Create lock file
  invariant(process.pid, "Server process ID is not available");
  writeFileSync(lockFile, process.pid.toString());

  return await new Promise<{
    port: number;
    stop: () => boolean;
  }>((resolve, reject) => {
    const timeout = setTimeout(() => {
      process.kill("SIGTERM");
      reject(new Error("Server failed to start within 30 seconds"));
    }, 30000);

    process.once("error", (error) => {
      clearTimeout(timeout);
      try {
        unlinkSync(lockFile);
      } catch {}
      reject(error);
    });

    if (process.stdout === null) {
      clearTimeout(timeout);
      return reject(new Error("Failed to start server."));
    }

    process.stdout.on("data", (stream: Buffer) => {
      if (stream.toString().includes(port.toString())) {
        clearTimeout(timeout);
        server = {
          port,
          stop: () => {
            try {
              process.kill();
              unlinkSync(lockFile);
              return true;
            } catch {
              return false;
            }
          },
        };
        return resolve(server);
      }

      // console.debug(stream.toString());
    });
  });
}

async function checkServerHealth(): Promise<boolean> {
  try {
    const response = await fetch(`http://localhost:${port}`);
    return response.ok;
  } catch {
    return false;
  }
}

export const URL = `http://localhost:${port}`;
