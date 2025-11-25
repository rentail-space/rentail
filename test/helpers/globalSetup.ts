/**
 * NOTE: Setup code to run only once before all tests
 *
 * - Seeds database with known centers
 * - Launches Web server once per test suite
 * - Starts MSW server (used by Web server)
 */

import { exec, execFile } from "node:child_process";
import { promisify } from "node:util";
import seedCenters from "prisma/seed/seedCenters";
import prisma from "~/lib/prisma";
import msw from "../mocks/mswHandlers";
import { port } from "./launchBrowser";
import { launchServer } from "./launchServer";
import { removeNewHTML } from "./toMatchInnerHTML";
import { removeDiffImages } from "./toMatchScreenshot";

const execFileAsync = promisify(execFile);
const execAsync = promisify(exec);

export default async function setup() {
  await killServerOnPort(port);

  // Clean up database and seed it again
  await prisma.user.deleteMany();
  await prisma.property.deleteMany();
  await seedCenters();

  // Remove regression testing diff images
  await removeDiffImages();
  await removeNewHTML();

  // Launch server and start test env MSW handlers
  await launchServer(port);
  msw.listen({ onUnhandledRequest: "error" });
}

async function killServerOnPort(port: number) {
  try {
    const { stdout } = await execFileAsync("lsof", [`-ti:${port}`]);
    const pid = stdout.trim().match(/^\s*(\d+)/m)?.[1];
    if (pid) await execAsync(`kill -9 ${pid}`);
  } catch {}
}

export async function teardown() {
  // Notify completion
  try {
    await execAsync(
      'terminal-notifier -sound default -title "Test Suite" -message "Done!"',
    );
  } catch {
    // Ignore if terminal-notifier fails (not installed on all systems)
  }

  // Force exit after 5 seconds to prevent hanging on macOS
  const forceExitTimer = setTimeout(() => {
    console.warn("Test cleanup timeout - forcing exit");
    process.exit(0);
  }, 5000);

  try {
    // Close MSW first to stop intercepting requests
    msw.close();

    // Disconnect Prisma with timeout
    await Promise.race([
      prisma.$disconnect(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("disconnect timeout")), 2000),
      ),
    ]);

    clearTimeout(forceExitTimer);
  } catch (error) {
    // Silently ignore errors on teardown
    if (error instanceof Error && error.message.includes("timeout")) {
      // Connection pool will be cleaned on exit
    }
  }

  process.exit(0);
}
