/**
 * NOTE: Setup code to run only once before all tests
 *
 * - Loads test secrets from .env.test / .env into process.env
 * - Seeds database with known centers
 * - Launches Web server once per test suite
 */

import { exec } from "node:child_process";
import { promisify } from "node:util";
import dotenv from "dotenv";

// Load test env (overrides .env values), then shared .env as a fallback.
// Worker processes get the same env via the test env hook in vite.config.ts.
dotenv.config({ path: ".env.test", quiet: true });
dotenv.config({ quiet: true });

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

const execAsync = promisify(exec);

export default async function setup() {
  const [
    { default: prisma },
    { default: seedCenters },
    { default: seedStatesAndRelatedData },
    { launchServer },
    { removeNewHTML },
    { removeDiffImages },
  ] = await Promise.all([
    import("~/lib/prisma.server"),
    import("~/lib/scrape/seedCenters.server"),
    import("~/lib/scrape/seedStates.server"),
    import("./launchServer"),
    import("./toMatchInnerHTML"),
    import("./toMatchScreenshot"),
  ]);

  // Clean up database and seed it again
  await prisma.user.deleteMany();
  await prisma.property.deleteMany();

  await seedStatesAndRelatedData();
  await seedCenters(centers);

  // Remove regression testing diff images
  await removeDiffImages();
  await removeNewHTML();

  // Launch server and start test env MSW handlers
  await launchServer();

  return teardown;
}

export async function teardown() {
  await execAsync(
    'terminal-notifier -sound default -title "Test Suite" -message "Done!"',
  );
  // Dynamically import closeServer inside teardown since it was imported dynamically in setup
  const { closeServer } = await import("./launchServer");
  await closeServer();
}
