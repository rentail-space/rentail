/**
 * This file is used to start the Vite dev server in a forked process.  It is
 * used to avoid sharing the same node instance, which could cause issues with
 * some libraries (eg Prisma). It is also used to allow the process to exit
 * cleanly when the test is done.
 */

import { delay, invariant } from "es-toolkit";
import { existsSync } from "node:fs";
import { readdir, rm, watch } from "node:fs/promises";
import { resolve } from "node:path";
import type { ViteDevServer } from "vite";
import * as vite from "vite";
import config from "vite.config";

let devServer: ViteDevServer | undefined;
const deps = resolve("node_modules/.vite/deps");

// Import and start the server
async function startServer() {
  invariant(process.send, "process.send is not defined");
  try {
    const port = process.env.PORT ? Number(process.env.PORT) : 9222;

    // Remove the directory at "deps" before starting the dev server
    await rm(deps, { recursive: true, force: true });

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
    await waitForDependencies();

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

/**
 * Wait for Vite to generate dependency cache (900+ files expected) and return when found
 */
export async function waitForDependencies() {
  while (!existsSync(deps)) await delay(10);

  const files = await readdir(deps);
  if (files.length > 100) return;

  const watcher = watch(deps);
  for await (const _event of watcher) {
    const files = await readdir(deps);
    if (files.length > 100) break;
  }
}

startServer();
