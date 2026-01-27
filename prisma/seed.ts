import debug from "debug";
import seedCenters from "~/lib/scrape/seedCenters.server";
import seedStatesAndRelatedData from "~/lib/scrape/seedStates.server";

debug.enable("seed");
const logger = debug("seed");

await seedStatesAndRelatedData();
await seedCenters();

logger("✅ Done");
process.exit(0);
