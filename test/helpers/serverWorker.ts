import { invariant } from "es-toolkit";

// Import and start the server
async function startServer() {
  invariant(process.send, "process.send is not defined");
  try {
    const port = process.env.PORT ? Number(process.env.PORT) : 9222;
    const vite = await import("vite");

    // Create Vite dev server with cached dependencies
    const devServer = await vite.createServer({
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
        force: false, // Use cached dependencies
      },
      logLevel: "info",
    });

    // Start the Vite dev server
    await devServer.listen(port);

    // Send ready signal immediately - first test navigation will trigger optimization
    process.send({ type: "ready" });
  } catch (error) {
    process.send({
      type: "error",
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

startServer();
