import { PrismaClient } from "prisma/generated/client";
import serverConfig from "./config";

const prisma = new PrismaClient({
  log: ["query", "info", "warn", "error"],
  datasourceUrl: serverConfig.DATABASE_URL,
  errorFormat: "pretty",
});

export default prisma;
