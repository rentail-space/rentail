import debug from "debug";
import { invariant } from "es-toolkit";
import { type ChildProcess, execSync, fork } from "node:child_process";
import { resolve } from "node:path";
import { afterAll } from "vitest";
import "~/test/helpers/toMatchScreenshot";

export const port = 9222;

let worker: ChildProcess | undefined;

/**
 * Launch a new server instance.
 *
 * @returns The server worker.
 */
export async function launchServer(): Promise<void> {
  if (worker) return;

  debug("server")("launching server");
  try {
    const pids = execSync(`lsof -ti:${port}`, { encoding: "utf8" }).split("\n");
    for (const pid of pids) execSync(`kill -9 ${pid}`, { stdio: "ignore" });
  } catch {}

  // Start the server as forked process, that way we don't share the same node
  // instance, which could cause issues with some libraries (eg Prisma)
  worker = fork(resolve("test/helpers/serverWorker.ts"), {
    execArgv: ["--import", "tsx/esm"],
    stdio: debug.enabled("server") ? "inherit" : "pipe",
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
      debug("server")("worker error:", error);
      reject(error);
    });

    worker.on("exit", (code) => {
      if (code !== 0)
        reject(new Error(`Worker stopped with exit code ${code}`));
    });
  });

  debug("server")("server is ready");
}

async function cleanup() {
  if (worker && !worker.killed) {
    debug("server")("killing worker");
    worker.kill("SIGTERM");
    // Force kill after 1s if still running
    setTimeout(() => {
      if (worker && !worker.killed) worker.kill("SIGKILL");
    }, 1000);
    debug("server")("worker killed");
  }
  worker = undefined;
}

process.once("exit", cleanup);
process.once("SIGINT", cleanup);
process.once("SIGTERM", cleanup);

afterAll(cleanup);
