import { PrismaClient } from "./generated/client";

const prisma = new PrismaClient();
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
