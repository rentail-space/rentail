import { captureException } from "@sentry/react-router";
import zod from "zod";

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
