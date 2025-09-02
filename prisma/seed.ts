import dayjs from "dayjs";
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

const when = dayjs().subtract(25, "minutes");
await prisma.message.createMany({
  data: [
    {
      id: "01K469V6Y6CQPFTK3D2MK9NMYY",
      content:
        "Hello, I'm Rentail — how can I help you find a pop-up retail space for your business?",
      role: "ASSISTANT",
      conversationId: conversation.id,
      createdAt: when.toDate(),
    },
    {
      id: "01K46AHYA3YYBZZR87AZ46EF0J",
      content:
        "I'm looking for a pop-up retail space for my clothing boutique. Do you have any locations available in downtown areas?",
      role: "USER",
      conversationId: conversation.id,
      createdAt: when.add(2, "minute").toDate(),
    },
    {
      id: "01K46AHZYYTYGKKKE91TGXMW8P",
      content: `Great! I'd be happy to help you find a pop-up retail space for your clothing boutique.
We have several exciting downtown locations available. Can you tell me more about your specific requirements?
For example, what's your preferred square footage, duration of lease, and budget range?`,
      role: "ASSISTANT",
      conversationId: conversation.id,
      createdAt: when.add(4, "minute").toDate(),
    },
    {
      id: "01K46AJRS63X5WRPQTPW1BWW1H",
      content:
        "I need a 1000 square foot space for 3 months. I'm looking for a budget of $10,000.",
      role: "USER",
      conversationId: conversation.id,
      createdAt: when.add(6, "minute").toDate(),
    },
    {
      id: "01K46AK07JVY081XMYTT8C9ZWC",
      content:
        "Of course! I'll check our database for available spaces that match your requirements.",
      role: "ASSISTANT",
      conversationId: conversation.id,
      createdAt: when.add(8, "minute").toDate(),
    },
  ],
  skipDuplicates: true,
});
