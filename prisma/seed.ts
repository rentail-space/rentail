import debug from "debug";
import { readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import seedCenter from "../app/lib/scrape/seedCenter";

debug.enable("seed");
const logger = debug("seed");

const basedir = resolve("prisma/seed");
const filenames = readdirSync(basedir, { withFileTypes: true })
  .filter((file) => file.isDirectory())
  .flatMap((dir) =>
    readdirSync(join(basedir, dir.name)).map((filename) =>
      join(dir.name, filename),
    ),
  );
logger("🔄 Seeding %s files", filenames.length);
for (const filename of filenames)
  await seedCenter(resolve("prisma/seed", filename));
logger("✅ Done");
