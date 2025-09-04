import { PrismaClient } from "prisma/generated/client";
import serverConfig from "./config";

const prisma = new PrismaClient({
  log: serverConfig.isDebug ? ["error", "warn", "query", "info"] : ["error"],
  datasourceUrl: serverConfig.DATABASE_URL,
  errorFormat: "pretty",
});

export default prisma;
