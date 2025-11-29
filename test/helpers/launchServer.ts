import debug from "debug";
import { delay, invariant } from "es-toolkit";
import { type ChildProcess, fork } from "node:child_process";
import { resolve } from "node:path";

let worker: ChildProcess | undefined;

const logger = debug("server");

/**
 * Launch a new server instance.
 *
 * @param port - The port to launch the server on.
 */
export async function launchServer(port: number): Promise<void> {
  if (worker) return;

  logger("launching server");

  // Start the server as forked process, that way we don't share the same node
  // instance, which could cause issues with some libraries (eg Prisma)
  worker = fork(resolve("test/helpers/serverWorker.ts"), {
    execArgv: ["--import", "tsx/esm"],
    stdio: "inherit",
    env: {
      ...process.env,
      NODE_ENV: "test",
      PORT: port.toString(),
    },
  });

  // Listen for worker's ready and error messages
  await new Promise<void>((resolve, reject) => {
    invariant(worker, "Server worker is not defined");
    worker
      .on("error", (error) => {
        console.error("Worker error: %s", error);
        reject(error);
      })
      .on("message", (msg?: { type: "ready" }) => {
        if (msg?.type === "ready") resolve();
      });
  });

  logger("server is ready");
}

/**
 * Close the server gracefully.
 */
export async function closeServer(): Promise<void> {
  if (worker) {
    // Send graceful shutdown message first
    worker.send("shutdown");
    // Wait for graceful shutdown (increased from 500ms to allow Vite server to fully close)
    await delay(1000);
    // Check if process exited, only kill if it's still running
    if (!worker.killed) worker.kill("SIGKILL");
    worker.disconnect();
  }
}
