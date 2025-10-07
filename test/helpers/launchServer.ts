import { type ChildProcess, fork } from "node:child_process";
import { resolve } from "node:path";
import debug from "debug";
import { invariant } from "es-toolkit";
import { afterAll } from "vitest";
import "~/test/helpers/toMatchScreenshot";

export const port = 9222;

const logging = debug("server").enabled;
let worker: ChildProcess | undefined;

/**
 * Launch a new server instance.
 *
 * @returns The server worker.
 */
export async function launchServer(): Promise<void> {
  if (worker) return;

  if (logging) console.info("[SERVER] launching server");

  // Start the server as forked process, that way we don't share the same node
  // instance, which could cause issues with some libraries (eg Prisma)
  worker = fork(resolve("test/helpers/serverWorker.ts"), {
    stdio: logging ? "inherit" : "pipe",
    env: {
      ...process.env,
      NODE_ENV: "test",
      PORT: port.toString(),
    },
  });

  // Listen for worker messages
  await new Promise<void>((resolve, reject) => {
    invariant(worker, "Server worker is not defined");
    worker.on("message", (msg: { type: string; error?: string }) => {
      if (msg.type === "ready") resolve();
      if (msg.type === "error") reject(new Error(`Worker error: ${msg.error}`));
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

async function cleanup() {
  if (worker && !worker.killed) {
    if (logging) console.info("[SERVER] killing worker");
    worker.once("exit", () => {
      worker = undefined;
    });
    worker.kill("SIGTERM");
    // Force kill after 1s if still running
    setTimeout(() => {
      if (worker && !worker.killed) worker.kill("SIGKILL");
    }, 1000);
  }
  worker = undefined;

  if (logging) console.info("[CLEANUP] complete");
}

process.once("exit", cleanup);
process.once("SIGINT", cleanup);
process.once("SIGTERM", cleanup);

afterAll(cleanup);
