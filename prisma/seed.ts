import { PrismaPg } from "@prisma/adapter-pg";
import env from "env-var";
import { PrismaClient } from "./generated/client";

// NOTE don't use lib/config here, we don't plan to set all the environment
// variables just to seed the database.

const connectionString =
  process.env.NODE_ENV === "test"
    ? // secretlint-disable-next-line
      "postgresql://postgres:postgres@localhost:5432/postgres"
    : env.get("DATABASE_URL").required().asUrlString();
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({
  adapter,
  errorFormat: "pretty",
  log: ["error", "warn", "query", "info"],
});

await prisma.user.findMany();
