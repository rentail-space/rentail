import debug from "debug";
import seedCenters from "~/lib/scrape/seedCenters";
import seedStatesAndRelatedData from "~/lib/scrape/seedStates";

debug.enable("seed");
const logger = debug("seed");

await seedStatesAndRelatedData();
await seedCenters();

logger("✅ Done");
process.exit(0);
