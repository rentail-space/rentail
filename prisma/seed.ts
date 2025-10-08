import prisma from "app/lib/prisma";
import "app/lib/logger.server";
import debug from "debug";
import seedProperties from "./seed/seedProperties";

// NOTE: don't use lib/config here, we don't plan to set all the environment
// variables just to seed the database.

// NOTE: We're using postgis to find nearby shopping centers.
await prisma.$executeRaw`CREATE EXTENSION IF NOT EXISTS postgis;`;

// NOTE: We need to import async if we want to use debug.enable
debug.enable("seed");
await seedProperties();
