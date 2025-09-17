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

const user = {
  id: "wxxx3cwnw9o4g6zehqg0dswy",
};
const chat = {
  id: "mv3syosnkkawsqkwdpmeeuyk",
};

await prisma.user.upsert({
  create: { id: user.id },
  update: {},
  where: { id: user.id },
});

await prisma.chat.upsert({
  create: { id: chat.id, userId: user.id },
  update: {},
  where: { id: chat.id },
});

await prisma.message.createMany({
  data: [
    {
      id: "01K469V6Y6CQPFTK3D2MK9NMYY",
      content:
        "Hello, I'm **Rentail** — how can I help you find a pop-up retail space for your business?",
      role: "ASSISTANT",
      chatId: chat.id,
    },
  ],
  skipDuplicates: true,
});
