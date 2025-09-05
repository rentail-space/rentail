import type { Conversation, Message, User } from "prisma/generated/client";
import { createCookieSessionStorage, type Session } from "react-router";
import serverConfig from "./lib/config";
import prisma from "./lib/prisma";

type SessionData = {
  user_id?: string;
  conversation_id?: string;
};

type SessionFlashData = {
  error: string;
};

export type SessionType = Session<SessionData, SessionFlashData>;

const { getSession, commitSession, destroySession } =
  createCookieSessionStorage<SessionData, SessionFlashData>({
    // a Cookie from `createCookie` or the CookieOptions to create one
    cookie: {
      httpOnly: true,
      isSigned: true,
      maxAge: 60 * 60 * 24 * 365, // 365 days
      name: "__session",
      path: "/",
      secrets: [serverConfig.SESSION_SECRET],
    },
  });

export { getSession, commitSession, destroySession };

export async function getUserFromSession(session: SessionType): Promise<User> {
  const userId = session.get("user_id");
  if (userId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user) return user;
  }

  const newUser = await prisma.user.create({ data: {} });
  session.set("user_id", newUser.id);
  return newUser;
}

export async function getConversationFromSession(
  session: SessionType,
): Promise<{
  user: User;
  conversation: Conversation & { messages: Message[] };
}> {
  const user = await getUserFromSession(session);

  const conversationId = session.get("conversation_id");
  if (conversationId) {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId, userId: user.id },
      include: { messages: true },
    });
    if (conversation) return { user, conversation };
  }

  const newConversation = await prisma.conversation.create({
    data: {
      messages: {
        create: {
          content:
            "Hello, I'm **Rentail** — how can I help you find a pop-up retail space for your business?",
          role: "ASSISTANT",
        },
      },
      user: { connect: { id: user.id } },
    },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
  session.set("conversation_id", newConversation.id);
  return { user, conversation: newConversation };
}
