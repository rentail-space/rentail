import prisma from "app/lib/prisma";
import seedProperties from "./seed/seedProperties";
import "app/lib/logger.server";

// NOTE don't use lib/config here, we don't plan to set all the environment
// variables just to seed the database.

// NOTE We're using postgis to find nearby shopping centers.
await prisma.$executeRaw`CREATE EXTENSION IF NOT EXISTS postgis;`;
await seedProperties();
