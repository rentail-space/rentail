/**
 * NOTE: Setup code to run only once before all tests
 *
 * - Seeds database with known centers
 * - Launches Web server once per test suite
 * - Starts MSW server (used by Web server)
 */

import { exec, execFile } from "node:child_process";
import { resolve } from "node:path";
import { promisify } from "node:util";
import prisma from "~/lib/prisma";
import seedCenters from "~/lib/scrape/seedCenter";
import seedStates from "~/lib/scrape/seedStates";
import { port } from "./launchBrowser";
import { closeServer, launchServer } from "./launchServer";
import { removeNewHTML } from "./toMatchInnerHTML";
import { removeDiffImages } from "./toMatchScreenshot";

/**
 * These are the only centers that are available in testing.
 */
const centers = [
  "ca/ca-beverly-center.json",
  "ca/ca-del-amo-fashion-center.json",
  "ca/ca-glendale-galleria.json",
  "ca/ca-los-cerritos-center.json",
  "ca/ca-south-bay-galleria.json",
  "ca/ca-the-americana-at-brand.json",
  "ca/ca-the-grove.json",
  "ca/ca-westfield-century-city.json",
  "ca/ca-westfield-culver-city.json",
];

const execFileAsync = promisify(execFile);
const execAsync = promisify(exec);

export default async function setup() {
  await killServerOnPort(port);

  // Clean up database and seed it again
  await prisma.user.deleteMany();
  await prisma.property.deleteMany();

  await seedStates();
  for (const center of centers)
    await seedCenters(resolve("prisma/seed", center));

  // Remove regression testing diff images
  await removeDiffImages();
  await removeNewHTML();

  // Launch server and start test env MSW handlers
  await launchServer(port);
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
}
