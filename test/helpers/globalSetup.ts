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
import { closeServer, launchServer } from "./launchServer";
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
  await execAsync(
    'terminal-notifier -sound default -title "Test Suite" -message "Done!"',
  );
  await closeServer();
  msw.close();
}
