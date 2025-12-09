import debug from "debug";
import seedCenters from "./seed/seedCenters";

debug.enable("seed");
await seedCenters();
process.exit(0);
