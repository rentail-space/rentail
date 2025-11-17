/**
 * NOTE: Setup code to run only once before all tests
 *
 * - Seeds database with known centers
 * - Launches Web server once per test suite
 * - Starts MSW server (used by Web server)
 */

import seedCenters from "prisma/seed/seedCenters";
import prisma from "~/lib/prisma";
import msw from "../mocks/mswHandlers";
import { port } from "./launchBrowser";
import { closeServer, launchServer } from "./launchServer";
import { removeDiffImages } from "./toMatchScreenshot";

export default async function setup() {
  // Clean up database and seed it again
  await prisma.user.deleteMany();
  await prisma.property.deleteMany();
  await seedCenters();

  // Remove regression testing diff images
  await removeDiffImages();

  // Launch server and start test env MSW handlers
  await launchServer(port);
  msw.listen({ onUnhandledRequest: "error" });
}

export async function teardown() {
  await closeServer();
  msw.close();
  await prisma.$disconnect();
}
