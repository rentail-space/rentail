import debug from "debug";
import seedCenters from "./seed/seedCenters";

debug.enable("seed");
console.log("Seeding database: %s", process.env.DATABASE_URL);
await seedCenters();
process.exit(0);
