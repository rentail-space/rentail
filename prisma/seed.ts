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
  email: "assaf@labnotes.org",
};
const conversation = {
  id: "mv3syosnkkawsqkwdpmeeuyk",
  userId: user.id,
};

await prisma.user.upsert({
  create: { email: user.email, id: user.id },
  update: {},
  where: { email: user.email },
});

await prisma.conversation.createMany({
  data: [{ id: conversation.id, userId: user.id }],
  skipDuplicates: true,
});

await prisma.message.createMany({
  data: [
    {
      id: "01K469V6Y6CQPFTK3D2MK9NMYY",
      content:
        "Hello, I'm **Rentail** — how can I help you find a pop-up retail space for your business?",
      role: "ASSISTANT",
      conversationId: conversation.id,
    },
  ],
  skipDuplicates: true,
});
