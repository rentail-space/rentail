import dotenv from "dotenv";
import { definePrismaConfig } from "prisma/config";
import {
  defineConfig as definePostgresConfig,
  prisma7Schema,
} from "@prisma/orm-postgres/config";

dotenv.configDotenv({ quiet: true });

// Prisma ORM 8 reads the Prisma ORM 7 schema as its contract while both CLIs
// run side by side. Prisma 7 keeps owning migrations until phase 4 of
// https://www.prisma.io/docs/guides/upgrade-prisma-orm/postgresql
export default definePrismaConfig({
  orm: definePostgresConfig({
    contract: prisma7Schema("prisma/schema.prisma"),
    output: "generated/prisma8",
    db: {
      connection: process.env.DATABASE_URL,
    },
  }),
});
