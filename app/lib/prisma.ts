import { PrismaPg } from "@prisma/adapter-pg";
import debug from "debug";
import { PrismaClient } from "prisma/generated/client";

export default new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  errorFormat: "pretty",
  log: debug.enabled("prisma") ? ["error", "warn", "query", "info"] : ["error"],
});
