import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "prisma/generated/client";
import serverConfig from "./config";

const adapter = new PrismaPg({ connectionString: serverConfig.DATABASE_URL });
const prisma = new PrismaClient({
  adapter,
  errorFormat: "pretty",
  log: serverConfig.isDebug ? ["error", "warn", "query", "info"] : ["error"],
});

export default prisma;
