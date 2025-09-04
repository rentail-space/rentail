import { PrismaClient } from "prisma/generated/client";
import serverConfig from "./config";

const prisma = new PrismaClient({
  log: serverConfig.isDebug ? ["error", "warn", "query", "info"] : ["error"],
  datasourceUrl: serverConfig.isTest
    ? // secretlint-disable-next-line
      "postgresql://postgres:postgres@localhost:5432/postgres"
    : serverConfig.DATABASE_URL,
  errorFormat: "pretty",
});

export default prisma;
