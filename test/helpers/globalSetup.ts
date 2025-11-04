/**
 * NOTE: This file contains setup code that will run before all tests
 */

import seedProperties from "prisma/seed/seedProperties";
import { launchServer } from "./launchServer";

export default async function setup() {
  await seedProperties();
  await launchServer(9222);
}
