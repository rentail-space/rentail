import type { MastraMessageV2 } from "@mastra/core";
import { Memory } from "@mastra/memory";
import { TokenLimiter, ToolCallFilter } from "@mastra/memory/processors";
import { captureException } from "@sentry/react-router";
import { invariant } from "es-toolkit";
import type { Chat, User } from "prisma/generated/client";
import { ulid } from "ulid";
import type zod from "zod";
import welcome from "~/prompts/welcome.md?raw";
import { PrismaStorage } from "./PrismaStorage";
import { userProfile } from "./userProfile";

export const memory = new Memory({
  options: {
    lastMessages: 10,
    threads: {
      generateTitle: true,
    },
    workingMemory: {
      enabled: true,
      schema: userProfile,
      scope: "resource",
    },
  },
  processors: [new ToolCallFilter(), new TokenLimiter(127_000)],
  storage: new PrismaStorage(),
});

/**
 * Get the messages for a chat. If no messages are found, create an initial
 * message and save it to the database.
 *
 * @param chat The chat to get messages for.
 * @returns The messages for the chat.
 */
export async function getRecentMessages(chat: Chat) {
  const messages = await memory.rememberMessages({ threadId: chat.id });
  if (messages.messagesV2.length > 0) return messages.messagesV2;

  const savedMessages = await memory.saveMessages({
    messages: [
      {
        content: { format: 2, parts: [{ text: welcome, type: "text" }] },
        createdAt: new Date(),
        id: ulid(),
        resourceId: chat.userId,
        role: "assistant",
        threadId: chat.id,
      },
    ],
    format: "v2",
  });
  return savedMessages;
}

/**
 * Save messages to the chat on behalf of the user. Can be used to copy messages
 * from one chat to another. Note: when we create the first conversation
 * (cloning a user), messages will not have threadID or resourceID so we need to
 * provide these separately.
 *
 * @param messages The messages to save.
 * @returns The saved messages.
 */
export async function saveMessages({
  chat,
  messages,
}: {
  chat: Chat;
  messages: MastraMessageV2[];
}): Promise<MastraMessageV2[]> {
  invariant(chat.id, "Chat ID is required");
  return await memory.saveMessages({
    messages: messages.map((message) => ({
      ...message,
      threadId: chat.id,
      resourceId: chat.userId,
    })),
    format: "v2",
  });
}

/**
 * Read from working memory and return the user's profile. If no profile is
 * found, return the fallback profile.
 *
 * @param chat The chat to read from working memory.
 * @param user The user to read from working memory.
 * @returns The user's profile.
 */
export async function getWorkingMemory({
  chat,
  user,
}: {
  chat: Chat;
  user: User;
}): Promise<zod.infer<typeof userProfile>> {
  await memory.createThread({
    resourceId: chat.userId,
    threadId: chat.id,
    saveThread: true,
  });
  const json =
    (await memory.getWorkingMemory({
      resourceId: chat.userId,
      threadId: chat.id,
    })) ?? null;

  const parsed = JSON.parse(json ?? "{}") as Partial<
    zod.infer<typeof userProfile>
  >;
  const { success, data, error } = userProfile.safeParse({
    location: user.geocode,
    ...parsed,
  });
  if (success) return data;
  else {
    captureException(error, { extra: { chat, json } });
    return userProfile.parse({ name: "Unknown" });
  }
}

/**
 * Update the working memory for a user and chat. The update function is called
 * with the current working memory and should return the new working memory.
 *
 * @param chat The chat to update working memory for.
 * @param user The user to update working memory for.
 * @param update The update function to apply to the working memory.
 * @returns The updated working memory.
 */
export async function updateWorkingMemory(
  { chat, user }: { chat: Chat; user: User },
  update: (
    current: zod.infer<typeof userProfile>,
  ) => Promise<Record<string, unknown>> | Record<string, unknown>,
): Promise<zod.infer<typeof userProfile>> {
  const currentValue = await getWorkingMemory({ chat, user });
  const { success, error, data } = userProfile.safeParse(
    await update(currentValue),
  );
  if (success) {
    await memory.updateWorkingMemory({
      resourceId: user.id,
      threadId: chat.id,
      workingMemory: JSON.stringify(data),
    });
    return data;
  } else {
    captureException(error, { extra: { chat } });
    return userProfile.parse({ location: user.geocode });
  }
}
