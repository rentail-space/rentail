import { Memory } from "@mastra/memory";
import { PostgresStore } from "@mastra/pg";
import { captureException } from "@sentry/react-router";
import { invariant, isEqual } from "es-toolkit";
import type { Chat, User } from "prisma/generated/client";
import { ulid } from "ulid";
import zod from "zod";
import env from "~/lib/env";

// Store state in our Postgres database
const store = new PostgresStore({
  connectionString: env.DATABASE_URL,
});

const userProfile = zod.object({
  name: zod.string().default("Unknown").describe("The user's name"),
  location: zod
    .object({
      latitude: zod.string().describe("The user's latitude"),
      longitude: zod.string().describe("The user's longitude"),
      city: zod.string().describe("The user's city"),
      state: zod.string().describe("The user's state"),
      country: zod.string().describe("The user's country"),
      timezone: zod.string().describe("The user's timezone"),
    })
    .catch({
      latitude: "",
      longitude: "",
      city: "",
      state: "",
      country: "",
      timezone: "America/Los_Angeles",
    }),
  selling: zod
    .object({
      productType: zod.string().describe("The user's product type"),
      pricePoint: zod.string().describe("The user's price point"),
      targetAudience: zod.string().describe("The user's target audience"),
    })
    .catch({ productType: "", pricePoint: "", targetAudience: "" }),
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
    .catch({ communicationStyle: "Casual", keyDeadlines: [] }),
  sessionState: zod
    .object({
      lastTaskDiscussed: zod
        .string()
        .describe("The user's last task discussed"),
      openQuestions: zod
        .array(zod.string())
        .describe("The user's open questions"),
    })
    .catch({ lastTaskDiscussed: "", openQuestions: [] }),
});

type UserProfile = zod.infer<typeof userProfile>;

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
  storage: store,
});

const initialMessage =
  "Hello, I'm **Rentail** — how can I help you find a pop-up retail space for your business?";

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
        content: { format: 2, parts: [{ text: initialMessage, type: "text" }] },
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
async function getWorkingMemory(user: User, chat: Chat): Promise<UserProfile> {
  await memory.createThread({ resourceId: user.id, threadId: chat.id });
  const json = await memory.getWorkingMemory({
    resourceId: user.id,
    threadId: chat.id,
  });

  try {
    invariant(json, "Working memory is null");
    return userProfile.parse(JSON.parse(json));
  } catch (error) {
    captureException(error, { data: json });
    return {
      ...userProfile.parse(undefined),
      location: {
        latitude: user.location.latitude,
        longitude: user.location.longitude,
        city: user.location.city,
        state: user.location.state,
        country: user.location.country,
        timezone: user.location.timezone,
      },
    };
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
  update?: (current: UserProfile) => Promise<UserProfile> | UserProfile,
): Promise<UserProfile> {
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
