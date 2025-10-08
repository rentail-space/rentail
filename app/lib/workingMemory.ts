import type { MastraMessageV2 } from "@mastra/core";
import { Memory } from "@mastra/memory";
import { TokenLimiter, ToolCallFilter } from "@mastra/memory/processors";
import { captureException } from "@sentry/react-router";
import type { ChatGetPayload } from "prisma/generated/models";
import { ulid } from "ulid";
import type zod from "zod";
import welcome from "~/prompts/welcome.md?raw";
import { DEFAULTS } from "./constants";
import { PrismaStorage } from "./PrismaStorage";
import { userProfile } from "./userProfile";

export const memory = new Memory({
  options: {
    lastMessages: DEFAULTS.MEMORY.LAST_MESSAGES,
    threads: {
      generateTitle: true,
    },
    workingMemory: {
      enabled: true,
      schema: userProfile,
      scope: "resource",
    },
  },
  processors: [new ToolCallFilter(), new TokenLimiter(DEFAULTS.AI.TOKEN_LIMIT)],
  storage: new PrismaStorage(),
});

/**
 * Get the messages for a chat. If no messages are found, create an initial
 * message and save it to the database.
 *
 * @param chat The chat to get messages for.
 * @returns The messages for the chat.
 */
export async function getRecentMessages(
  chat: ChatGetPayload<{ include: { user: true } }>,
) {
  const messages = await memory.rememberMessages({ threadId: chat.id });
  if (messages.messagesV2.length > 0) return messages.messagesV2;

  const savedMessages = await memory.saveMessages({
    messages: [
      {
        content: { format: 2, parts: [{ text: welcome, type: "text" }] },
        createdAt: new Date(),
        id: ulid(),
        resourceId: chat.user.id,
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
 * from one chat to another.
 *
 * @param chat The chat to save messages to.
 * @param messages The messages to save.
 * @returns The saved messages.
 */
export async function saveMessages(
  chat: ChatGetPayload<{ include: { user: true } }>,
  messages: MastraMessageV2[],
): Promise<MastraMessageV2[]> {
  return await memory.saveMessages({
    messages: messages.map((message) => ({
      ...message,
      id: ulid(),
      resourceId: chat.user.id,
      threadId: chat.id,
    })),
    format: "v2",
  });
}

/**
 * Read from working memory and return the user's profile. If no profile is
 * found, return the fallback profile.
 *
 * @param chat The chat to read from working memory.
 * @returns The user's profile.
 */
export async function getWorkingMemory(
  chat: ChatGetPayload<{ include: { user: true } }>,
): Promise<zod.infer<typeof userProfile>> {
  await memory.createThread({
    resourceId: chat.user.id,
    threadId: chat.id,
    saveThread: true,
  });
  const json =
    (await memory.getWorkingMemory({
      resourceId: chat.user.id,
      threadId: chat.id,
    })) ?? null;

  const parsed = JSON.parse(json ?? "{}") as Partial<
    zod.infer<typeof userProfile>
  >;
  const { success, data, error } = userProfile.safeParse({
    location: chat.user.geocode,
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
 * @param update The update function to apply to the working memory
 * @returns The updated working memory.
 */
export async function updateWorkingMemory(
  chat: ChatGetPayload<{ include: { user: true } }>,
  update: (
    current: zod.infer<typeof userProfile>,
  ) => Promise<Record<string, unknown>> | Record<string, unknown>,
): Promise<zod.infer<typeof userProfile>> {
  const currentValue = await getWorkingMemory(chat);
  const { success, error, data } = userProfile.safeParse(
    await update(currentValue),
  );
  if (success) {
    await memory.updateWorkingMemory({
      resourceId: chat.user.id,
      threadId: chat.id,
      workingMemory: JSON.stringify(data),
    });
    return data;
  } else {
    captureException(error, { extra: { chat } });
    return userProfile.parse({ location: chat.user.geocode });
  }
}
