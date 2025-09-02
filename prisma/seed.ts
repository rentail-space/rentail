import { PrismaClient } from "./generated/client";

const prisma = new PrismaClient();

const user = {
  id: "wxxx3cwnw9o4g6zehqg0dswy",
  email: "assaf@labnotes.org",
};

try {
  await prisma.user.upsert({
    create: { email: user.email, id: user.id },
    update: {},
    where: { email: user.email },
  });
} catch (error) {
  console.error(error);
  process.exit(1);
}
