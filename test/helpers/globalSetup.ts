/**
 * NOTE: This file contains setup code that will run before all tests
 */

import seedCenters from "prisma/seed/seedCenters";
import { port } from "./launchBrowser";
import { launchServer } from "./launchServer";

export default async function setup() {
  await seedCenters();
  await launchServer(port);
}
