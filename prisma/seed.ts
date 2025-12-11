import debug from "debug";
import prisma from "~/lib/prisma";
import seedCenters from "./seed/seedCenters";

debug.enable("seed");
await seedCenters();
await prisma.$disconnect();
