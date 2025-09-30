import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../prisma/generated/client";
import env from "./env";

export default new PrismaClient({
  adapter: new PrismaPg({ connectionString: env.DATABASE_URL }),
  errorFormat: "pretty",
  log: env.isDebug ? ["error", "warn", "query", "info"] : ["error"],
});
