/**
 * This file is used to start the Vite dev server in a forked process.  It is
 * used to avoid sharing the same node instance, which could cause issues with
 * some libraries (eg Prisma). It is also used to allow the process to exit
 * cleanly when the test is done.
 */

import { invariant } from "es-toolkit";
import type { ViteDevServer } from "vite";
import * as vite from "vite";
import config from "vite.config";

let devServer: ViteDevServer | undefined;

// Import and start the server
async function startServer() {
  invariant(process.send, "process.send is not defined");
  try {
    const port = process.env.PORT ? Number(process.env.PORT) : 9222;

    // Create Vite dev server with cached dependencies
    devServer = await vite.createServer({
      // NOTE: for dependencies use the same configuration as the main server
      ...config,
      root: process.cwd(),
      server: {
        hmr: false,
        middlewareMode: false,
        port,
        strictPort: true,
      },
      logLevel: "info",
    });

    // Start the Vite dev server
    await devServer.listen(port);
    await devServer.waitForRequestsIdle();

    // Unref the server to allow process to exit cleanly
    devServer.httpServer?.unref();

    // Send ready signal immediately - first test navigation will trigger optimization
    process.send({ type: "ready" });
  } catch (error) {
    process.send({
      type: "error",
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

function cleanup() {
  if (devServer) devServer.close();
}

// Clean shutdown on SIGTERM
process.on("SIGTERM", cleanup);
process.on("SIGINT", cleanup);
process.on("disconnect", cleanup);

startServer();
