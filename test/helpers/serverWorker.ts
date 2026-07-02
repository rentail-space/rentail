/**
 * This file is used to start the Vite dev server in a forked process.  It is
 * used to avoid sharing the same node instance, which could cause issues with
 * some libraries (eg Prisma). It is also used to allow the process to exit
 * cleanly when the test is done.
 */

import { rm } from "node:fs/promises";
import { resolve } from "node:path";
import invariant from "tiny-invariant";

// Import Vite the same way react-router dev CLI does — using dynamic import
// of the "vite" package. The test server needs React Router's SSR middleware
// properly wired, which only works when Vite is loaded via the standard
// vite package (not through vite-plus's re-export of the internal fork).
const vite = await import("vite-plus");

// Import and start the server
async function startServer(this: void) {
  const send = process.send?.bind(process);
  invariant(send, "process.send is not defined");
  const port = Number(process.env.PORT);
  invariant(port, "PORT is not defined");
  try {
    // Use a test-specific cache directory so tests don't interfere with the
    // dev server cache (node_modules/.vite). Clear it on each run to ensure
    // a clean start — Vite will re-optimize all listed deps from scratch.
    const testCacheDir = resolve("node_modules/.vite-test");
    await rm(testCacheDir, { recursive: true, force: true });

    const devServer = await vite.createServer({
      build: {
        minify: false,
        sourcemap: true,
      },
      cacheDir: testCacheDir,
      clearScreen: false,
      logLevel: "warn",
      root: process.cwd(),
      optimizeDeps: {
        // entries covers all route files so Vite crawls and discovers every
        // transitive CJS dep before the browser makes its first request.
        // Combined with Vite's default holdUntilCrawlEnd:true, the browser
        // waits for the single full optimization pass to finish — no
        // mid-session re-optimization, no two-React-instances errors.
        //
        // Do NOT use force: true — it triggers eager node_modules scanning on
        // startup, hits macOS's open-file limit (EMFILE), and crashes before
        // any test runs.
        entries: ["app/root.tsx", "app/routes/**/*.tsx", "app/routes/**/*.ts"],
        include: [
          "react",
          "react/jsx-runtime",
          "react/jsx-dev-runtime",
          // Must be react-dom/client, not react-dom — the app imports the
          // /client sub-path.
          "react-dom/client",
          "react-router",
          "@ai-sdk/react",
          "lucide-react",
          "use-stick-to-bottom",
        ],
      },
      server: {
        fs: { allow: ["."] },
        hmr: false,
        middlewareMode: false,
        port,
        strictPort: true,
        warmup: { clientFiles: ["/", "/chat", "/chat?q=test"] },
        watch: null,
      },
    });

    // Start the Vite dev server
    await devServer.listen(port);
    // Unref the server to allow process to exit cleanly
    devServer.httpServer?.unref();

    async function shutdown() {
      try {
        await devServer?.close();
      } catch {
        // Vite's optimizer may leave a non-empty deps_temp_* directory
        // and fail to remove it with fs.rmdir. This is a Vite issue
        // (non-recursive rmdir on a non-empty dir). Ignore it — we clean
        // the whole cache dir on the next startup anyway.
      }
      await rm(testCacheDir, { recursive: true, force: true }).catch(() => {});
      process.exit(0);
    }

    // Handle graceful shutdown on parent process termination
    process.on("message", async (msg) => {
      if (msg === "shutdown") await shutdown();
    });
    process.on("disconnect", () => process.exit(0));
    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);

    // Signal ready immediately. Vite's holdUntilCrawlEnd (default: true) will
    // hold the first browser request until dep optimization completes.
    send({ type: "ready" });
  } catch (error) {
    send({
      type: "error",
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

await startServer();
