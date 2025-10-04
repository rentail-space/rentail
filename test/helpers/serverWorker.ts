import { parentPort, workerData } from "node:worker_threads";

const { port } = workerData;

// Import and start the server
async function startServer() {
  try {
    // Set environment variables
    process.env.PORT = port.toString();
    process.env.NODE_ENV = "test";

    const vite = await import("vite");

    // Import the built server
    // Use Vite dev server for testing instead of importing the built server
    const devServer = await vite.createServer({
      root: process.cwd(),
      server: {
        port,
        strictPort: true,
        middlewareMode: false,
      },
      logLevel: "info",
    });

    // Start the Vite dev server
    await devServer.listen(port, true);

    // The server starts automatically when imported
    // Send ready signal
    if (parentPort) parentPort.postMessage({ type: "ready" });
  } catch (error) {
    if (parentPort)
      parentPort.postMessage({
        type: "error",
        error: error instanceof Error ? error.message : String(error),
      });
  }
}

startServer();
