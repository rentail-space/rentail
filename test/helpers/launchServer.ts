import debug from "debug";
import { delay } from "es-toolkit";
import { type ChildProcess, fork } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
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

  logger("Launching server on port %s", port);

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
  worker.on("error", (error) => {
    console.error("Server error: %s", error);
  });

  // Wait for the server to build all the dependencies.  This is necessary
  // because the server builds the dependencies on the fly, and we need to wait
  // for it to finish before we can start the tests.
  logger("Waiting for dependencies to be built …");
  const path = resolve("node_modules/.vite/deps");
  while (!existsSync(path) || readdirSync(path).length < 850) await delay(100);

  logger("Server is ready");
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
