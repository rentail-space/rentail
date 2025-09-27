import { Memory } from "@mastra/memory";
import { TokenLimiter, ToolCallFilter } from "@mastra/memory/processors";
import { PostgresStore } from "@mastra/pg";
import { captureException } from "@sentry/react-router";
import { isEqual } from "es-toolkit";
import type { Chat, User } from "prisma/generated/client";
import { ulid } from "ulid";
import zod from "zod";
import env from "~/lib/env";
import welcome from "~/prompts/welcome.md?raw";

/**
 * Store state in our Postgres database
 */
const store = new PostgresStore({
  connectionString: env.DATABASE_URL,
});

/**
 * This is the schema that will be used to store the user's profile in the
 * database and update it from the user's messages.
 */
export const userProfile = zod
  .object({
    name: zod
      .string()
      .optional()
      .default("Unknown")
      .describe("The user's name"),
    location: zod
      .object({
        latitude: zod.string().describe("The user's latitude"),
        longitude: zod.string().describe("The user's longitude"),
        city: zod.string().describe("The user's city"),
        state: zod.string().describe("The user's state"),
        country: zod.string().describe("The user's country"),
        timeZone: zod.string().describe("The user's timezone"),
      })
      .partial(),
    selling: zod
      .object({
        productType: zod.string().describe("The user's product type"),
        pricePoint: zod.string().describe("The user's price point"),
        targetAudience: zod.string().describe("The user's target audience"),
      })
      .partial(),
    preferences: zod
      .object({
        communicationStyle: zod
          .string()
          .default("Casual")
          .describe("The user's communication style e.g. Formal, Casual"),
        keyDeadlines: zod
          .array(zod.string())
          .describe("The user's key deadlines"),
      })
      .partial(),
    sessionState: zod
      .object({
        lastTaskDiscussed: zod
          .string()
          .default("")
          .describe("The user's last task discussed"),
        openQuestions: zod
          .array(zod.string())
          .describe("The user's open questions"),
      })
      .partial(),
  })
  .partial();

export const memory = new Memory({
  options: {
    lastMessages: 100,
    threads: {
      generateTitle: true,
    },
    workingMemory: {
      enabled: true,
      schema: userProfile,
      scope: "resource",
    },
  },
  processors: [
    new ToolCallFilter(),
    new TokenLimiter(127000), // Ensure the total tokens from memory don't exceed ~127k
  ],
  storage: store,
});

/**
 * Get the messages for a chat. If no messages are found, create an initial
 * message and save it to the database.
 *
 * @param user The user to get messages for.
 * @param chat The chat to get messages for.
 * @returns The messages for the chat.
 */
export async function getRecentMessages(user: User, chat: Chat) {
  await updateWorkingMemory(user, chat);

  const messages = await memory.rememberMessages({ threadId: chat.id });
  if (messages.messagesV2.length > 0) return messages.messagesV2;

  const savedMessages = await memory.saveMessages({
    messages: [
      {
        content: { format: 2, parts: [{ text: welcome, type: "text" }] },
        createdAt: new Date(),
        id: ulid(),
        resourceId: user.id,
        role: "assistant",
        threadId: chat.id,
      },
    ],
    format: "v2",
  });
  return savedMessages;
}

/**
 * Read from working memory and return the user's profile. If no profile is
 * found, return the fallback profile.
 *
 * @param user The user to read from working memory.
 * @param chat The chat to read from working memory.
 * @returns The user's profile.
 */
export async function getWorkingMemory(
  user: User,
  chat: Chat,
): Promise<zod.infer<typeof userProfile>> {
  try {
    await memory.createThread({
      resourceId: user.id,
      threadId: chat.id,
      saveThread: true,
    });
    const json = await memory.getWorkingMemory({
      resourceId: user.id,
      threadId: chat.id,
    });
    if (json) return userProfile.parse(JSON.parse(json));

    const { success, data } = userProfile.safeParse({
      location: user.location,
    });
    return success ? data : userProfile.parse(undefined);
  } catch (error) {
    captureException(error);
    return userProfile.safeParse(undefined).data ?? {};
  }
}

/**
 * Update the working memory for a user and chat. The update function is called
 * with the current working memory and should return the new working memory.
 *
 * @param user The user to update working memory for.
 * @param chat The chat to update working memory for.
 * @param update The update function to apply to the working memory (if missing,
 * returns the current working memory)
 * @returns The updated working memory.
 */
export async function updateWorkingMemory(
  user: User,
  chat: Chat,
  update?: <T = zod.infer<typeof userProfile>>(current: T) => Promise<T> | T,
): Promise<zod.infer<typeof userProfile>> {
  const currentValue = await getWorkingMemory(user, chat);
  try {
    const validateValue = userProfile.parse(
      update ? await update(currentValue) : currentValue,
    );
    if (!isEqual(currentValue, validateValue))
      await memory.updateWorkingMemory({
        resourceId: user.id,
        threadId: chat.id,
        workingMemory: JSON.stringify(validateValue),
      });
    return validateValue;
  } catch (error) {
    captureException(error);
    return currentValue;
  }
}
