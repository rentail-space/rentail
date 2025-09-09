import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "prisma/generated/client";
import env from "./env";

const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });
const prisma = new PrismaClient({
  adapter,
  errorFormat: "pretty",
  log: env.isDebug ? ["error", "warn", "query", "info"] : ["error"],
});

export default prisma;
