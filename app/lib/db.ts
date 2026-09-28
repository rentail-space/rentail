import postgres from "@prisma/orm-postgres/runtime";
import type { Contract } from "../../generated/prisma8/contract";
import contractJson from "../../generated/prisma8/contract.json" with { type: "json" };
import envVars from "~/lib/env";

/**
 * Prisma ORM 8 client (db), running alongside the Prisma ORM 7 client
 * (~/lib/prisma.server) against the same database.
 *
 * Routes port from `prisma.<model>.<op>({ ... })` to `db.orm.public.<Model>`
 * one module at a time, per
 * https://www.prisma.io/docs/guides/upgrade-prisma-orm/postgresql
 */
export const db = postgres<Contract>({
  contractJson,
  url: envVars.DATABASE_URL,
});
