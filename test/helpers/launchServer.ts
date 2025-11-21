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
    stdio: debug.enabled("server") ? "inherit" : "pipe",
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
      .on("message", (msg: { type: string; error?: string }) => {
        if (msg.type === "ready") resolve();
        if (msg.type === "error")
          reject(new Error(`Worker error: ${msg.error}`));
      })
      .on("error", (error) => {
        logger("worker error:", error);
        reject(error);
      })
      .on("exit", (code) => {
        reject(new Error(`Worker stopped with exit code ${code}`));
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
    // Wait briefly for graceful shutdown, then kill if needed
    await delay(500);
    worker.kill("SIGKILL");
  }
}
