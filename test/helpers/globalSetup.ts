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
  await seedCenters();
  await launchServer(port);
  // Start MSW server before all tests
  msw.listen({ onUnhandledRequest: "error" });
  await removeDiffImages();
}

export async function teardown() {
  msw.close();
  await prisma.$disconnect();
  await closeServer();
}
