/**
 * This file is used to start the Vite dev server in a forked process.  It is
 * used to avoid sharing the same node instance, which could cause issues with
 * some libraries (eg Prisma). It is also used to allow the process to exit
 * cleanly when the test is done.
 */

import { invariant } from "es-toolkit";
import { rm } from "node:fs/promises";
import { resolve } from "node:path";
import * as vite from "vite";

// Import and start the server
async function startServer() {
  invariant(process.send, "process.send is not defined");
  const port = Number(process.env.PORT);
  invariant(port, "PORT is not defined");
  try {
    // Remove the directory at "deps" before starting the dev server
    await rm(resolve("node_modules/.vite/deps"), {
      recursive: true,
      force: true,
    });

    // Create Vite dev server with cached dependencies
    const devServer = await vite.createServer({
      clearScreen: false,
      logLevel: "info",
      root: process.cwd(),
      server: {
        hmr: false,
        middlewareMode: false,
        port,
        strictPort: true,
        watch: null,
      },
    });

    // Start the Vite dev server
    await devServer.listen(port);
    await devServer.waitForRequestsIdle();
    await devServer.warmupRequest("/");

    // Unref the server to allow process to exit cleanly
    devServer.httpServer?.unref();

    // Handle graceful shutdown on parent process termination
    process.on("message", async (msg) => {
      if (msg === "shutdown") {
        await devServer?.close();
        process.exit(0);
      }
    });

    // Send ready signal immediately - first test navigation will trigger optimization
    process.send({ type: "ready" });
  } catch (error) {
    process.send({
      type: "error",
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

await startServer();
