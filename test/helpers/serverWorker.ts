import { invariant } from "es-toolkit";
import type { ViteDevServer } from "vite";

let devServer: ViteDevServer | undefined;

// Import and start the server
async function startServer() {
  invariant(process.send, "process.send is not defined");
  try {
    const port = process.env.PORT ? Number(process.env.PORT) : 9222;
    const vite = await import("vite");

    // Create Vite dev server with cached dependencies
    devServer = await vite.createServer({
      root: process.cwd(),
      server: {
        port,
        strictPort: true,
        middlewareMode: false,
        hmr: false,
      },
      ssr: {
        noExternal: ["streamdown"],
      },
      optimizeDeps: {
        force: true, // Always rebuild
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

// Clean shutdown on SIGTERM
process.on("SIGTERM", async () => {
  try {
    if (devServer) {
      await devServer.close();
    }
  } finally {
    process.exit(0);
  }
});

// Fallback cleanup handlers
process.on("SIGINT", () => process.exit(0));
process.on("disconnect", () => process.exit(0));

startServer();
