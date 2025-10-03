import { PrismaPg } from "@prisma/adapter-pg";
import debug from "debug";
import { PrismaClient } from "prisma/generated/client";
import env from "~/lib/env";

export default new PrismaClient({
  adapter: new PrismaPg({ connectionString: env.DATABASE_URL }),
  errorFormat: "pretty",
  log: debug("prisma").enabled ? ["error", "warn", "query", "info"] : ["error"],
});
