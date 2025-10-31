import { captureException } from "@sentry/react-router";
import type { UIMessage } from "ai";
import debug from "debug";
import { invariant } from "es-toolkit";
import zod from "zod";

const logger = debug("profile");

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
        latitude: zod.number().describe("The user's latitude"),
        longitude: zod.number().describe("The user's longitude"),
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

const matchWorkingMemoryTags =
  /<working_memory[^>]*>[\s\S]*?(<\/working_memory\s*>|<\/work[\s_]*memory\s*>)/gim;

/**
 * Parse and extract working memory updates from assistant's response.
 * Matches Mastra's approach of using `<working_memory>` tags.
 *
 * @param responseText - The assistant's response text
 * @returns Parsed working memory object or null
 */
function extractWorkingMemory(
  responseText: string,
): Record<string, unknown> | null {
  const match = matchWorkingMemoryTags.exec(responseText);
  try {
    const json = match?.[1]?.trim();
    invariant(json, "No working memory found in response");
    return JSON.parse(json);
  } catch (error) {
    captureException(error, { extra: { responseText } });
    return null;
  }
}

/**
 * Mask (remove) working memory tags from the response text so they're not
 * shown to the user. Matches Mastra's `maskStreamTags` utility.
 *
 * @param text - The text to mask
 * @returns Text with working memory tags removed
 */
export function maskWorkingMemoryTags(text: string): string {
  return text.replace(matchWorkingMemoryTags, "");
}

/**
 * Parse the working memory into a valid user profile. If the working memory is
 * invalid, return an empty object.
 *
 * @param workingMemory - The working memory to parse.
 * @returns The user profile.
 */
export function cleanParse(workingMemory: unknown) {
  try {
    return userProfile.parse(JSON.parse((workingMemory as string) || "{}"));
  } catch (error) {
    captureException(error, { extra: { workingMemory } });
    return {};
  }
}

/**
 * Update the user's profile based on working memory tags in the assistant's
 * response. This matches Mastra's approach where the agent emits
 * `<working_memory>` tags that get parsed and saved.
 *
 * @param messages - The messages to update the profile from
 * @param workingMemory - The working memory to update
 * @returns The updated working memory
 */
export default async function updateUserProfile({
  messages,
  workingMemory,
}: {
  messages: UIMessage[];
  workingMemory: string;
}): Promise<string> {
  const relevant = messages
    .slice(-5)
    .flatMap((message) =>
      message.parts
        .filter((part) => part.type === "text")
        .map((part) => part.text),
    )
    .join("\n");

  try {
    const updates = extractWorkingMemory(relevant);
    if (!updates) return workingMemory;

    logger("Working memory updates: %o", updates);

    const current = cleanParse(workingMemory);
    // Validate the updates against our schema
    const { data: validated, error, success } = userProfile.safeParse(updates);
    if (!success) {
      captureException(error, { extra: { workingMemory, relevant } });
      return workingMemory;
    }

    // Deep merge with current profile (new values override old ones)
    const merged = {
      ...current,
      ...validated,
      location: { ...current.location, ...validated.location },
      preferences: { ...current.preferences, ...validated.preferences },
      selling: { ...current.selling, ...validated.selling },
      sessionState: { ...current.sessionState, ...validated.sessionState },
    };

    return JSON.stringify(merged);
  } catch (error) {
    captureException(error, { extra: { workingMemory, relevant } });
    return workingMemory;
  }
}
