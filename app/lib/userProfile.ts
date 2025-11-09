import { captureException } from "@sentry/react-router";
import type { UIMessage } from "ai";
import debug from "debug";
import { invariant, last } from "es-toolkit";
import zod, { type ZodType } from "zod";

const logger = debug("profile");

/**
 * This is the schema that will be used to store the user's profile in the
 * database and update it from the user's messages.
 */
export const userProfile = zod
  .object({
    merchant: zod
      .object({
        name: zod.string().describe("The merchant's name"),
        phoneNumber: zod.string().describe("Merchant's phone number"),
        retailExperience: zod
          .boolean()
          .describe(
            "Whether merchant has past experience as retailer at shopping centers",
          ),
      })
      .partial()
      .describe("The merchant's information"),

    location: zod
      .object({
        latitude: zod.number().describe("The merchant's latitude"),
        longitude: zod.number().describe("The merchant's longitude"),
        city: zod.string().describe("The merchant's city"),
        state: zod.string().describe("The merchant's state"),
        country: zod.string().describe("The merchant's country"),
        timeZone: zod.string().describe("The merchant's timezone"),
      })
      .partial()
      .describe("The merchant's location information"),

    selling: zod
      .object({
        productType: zod.string().describe("The merchant's product type"),
        pricePoint: zod
          .string()
          .describe("The merchant's price point (can be a range)"),
        targetAudience: zod.string().describe("The merchant's target audience"),
      })
      .partial()
      .describe("What the merchant is selling and their price point"),

    entity: zod
      .object({
        entityName: zod.string().describe("Legal entity name (corporate name)"),
        entityDba: zod
          .string()
          .describe("DBA (Doing Business As) if applicable"),
        entityAddress: zod
          .string()
          .describe("Physical street address of the legal entity"),
        entityWebsite: zod.string().describe("Website address"),
        entityType: zod
          .enum([
            "individual",
            "c-corporation",
            "s-corporation",
            "llc",
            "lp",
            "llp",
          ])
          .describe("The type of legal entity the merchant is acting as"),
        socialMedia: zod
          .array(
            zod.object({
              platform: zod.enum([
                "twitter",
                "instagram",
                "facebook",
                "linkedin",
                "youtube",
                "tiktok",
                "pinterest",
                "snapchat",
                "reddit",
                "other",
              ]),
              handle: zod
                .string()
                .describe("The merchant's social media handle"),
            }),
          )
          .describe("Any social media handles the merchant wants to share"),
      })
      .describe("The merchant's entity information")
      .partial(),

    projections: zod
      .object({
        monthlySales: zod.number().describe("Projected monthly sales"),
        annualSales: zod.number().describe("Projected annual sales"),
        employeeCount: zod
          .number()
          .describe("Number of employees the merchant anticipates hiring"),
      })
      .describe("The merchant's projections")
      .partial(),

    preferences: zod
      .object({
        communicationStyle: zod
          .string()
          .default("Casual")
          .describe("The merchant's communication style e.g. Formal, Casual"),
        keyDeadlines: zod
          .array(zod.string())
          .describe("The merchant's key deadlines"),
      })
      .partial()
      .describe("The merchant's preferences"),
  })
  .partial();

const matchWorkingMemoryTags = /<working_memory>(.*?)<\/working_memory>/ims;

/**
 * Parse and extract working memory updates from assistant's response.
 * Matches Mastra's approach of using `<working_memory>` tags.
 *
 * @param responseText - The assistant's response text
 * @returns Parsed working memory object or null
 */
function extractWorkingMemory(
  responseText: string,
): Record<string, unknown> | undefined {
  const match = responseText.match(matchWorkingMemoryTags)?.[1].trim();
  if (match) {
    const { data, error } = userProfile.safeParse(safeParseJSON(match));
    if (data) return data;
    else console.error("Error parsing working memory: %s", error);
  }
  return undefined;
}

/**
 * Parse a JSON string safely. This is a workaround to handle improperly
 * formatted JSON strings, for example, strings like `{location: {city:
 * "Boston"}}` (missing quotes around property names).
 *
 * @param str - The JSON string to parse
 * @returns The parsed JSON object or null if the string is invalid
 */
function safeParseJSON(str: string): Record<string, unknown> | null {
  try {
    return JSON.parse(str);
  } catch {
    try {
      // Use JSON5 or a more sophisticated parser
      const fixed = str
        // Add quotes around unquoted property names
        .replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":')
        // Fix unquoted string values (preserve numbers, booleans, null)
        .replace(
          /:\s*([a-zA-Z_/][a-zA-Z0-9_/\s]*?)(\s*[,}\n])/g,
          (_, value, after) => {
            const trimmed = value.trim();
            if (["true", "false", "null"].includes(trimmed))
              return `: ${trimmed}${after}`;
            if (/^-?\d+\.?\d*$/.test(trimmed)) return `: ${trimmed}${after}`;
            return `: "${trimmed}"${after}`;
          },
        );

      return JSON.parse(fixed);
    } catch {
      return null;
    }
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
  return text.replace(/<(\w+)>[^<]*(<\/\w+>)?/g, "").trim();
}

/**
 * Parse the working memory into a valid user profile. If the working memory is
 * invalid, return an empty object.
 *
 * @param workingMemory - The working memory to parse.
 * @returns The user profile.
 */
export function cleanParseProfile(workingMemory: unknown) {
  try {
    return userProfile.parse(JSON.parse((workingMemory as string) || "{}"));
  } catch (error) {
    captureException(error, { extra: { workingMemory } });
    console.error("Error parsing working memory: %s", error);
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
}): Promise<Promise<string>> {
  try {
    const lastMessage = last(messages);
    invariant(
      lastMessage?.role === "assistant",
      "Last message must be from assistant",
    );

    const lastResponse = lastMessage?.parts
      .filter((part) => part.type === "text")
      .map((part) => part.text)
      .join("\n");

    const updates = extractWorkingMemory(lastResponse);
    if (!updates) return workingMemory;

    const current = cleanParseProfile(workingMemory);
    // Validate the updates against our schema
    const { data: validated, error } = userProfile.safeParse(updates);
    if (error) throw error;

    // Deep merge with current profile (new values override old ones)
    const geocoded =
      validated?.location && (await geocodeLocation(validated?.location));
    const merged = {
      ...current,
      ...validated,
      location: validated.location
        ? { ...validated.location, ...geocoded }
        : current.location,
      entity: { ...current.entity, ...validated.entity },
      merchant: { ...current.merchant, ...validated.merchant },
      preferences: { ...current.preferences, ...validated.preferences },
      projections: { ...current.projections, ...validated.projections },
      selling: { ...current.selling, ...validated.selling },
    };
    logger("Updating user profile: %o", merged);

    return JSON.stringify(merged);
  } catch (error) {
    captureException(error, { extra: { workingMemory } });
    console.error("Error updating user profile: %s", error);
    return workingMemory;
  }
}

async function geocodeLocation(location: {
  city?: string;
  state?: string;
  country?: string;
}) {
  const { city, state, country } = location;
  if (!city || !state || !country) return null;

  const query = encodeURIComponent(`${city}, ${state}, ${country}`);
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`,
    { headers: { "User-Agent": "your-app-name/1.0 (your@email.com)" } },
  );
  const results = await response.json();
  return results && results.length > 0
    ? {
        latitude: Number.parseFloat(results[0].lat),
        longitude: Number.parseFloat(results[0].lon),
      }
    : {};
}

/**
 * Convert a Zod schema to a human-readable example object showing the structure
 * and descriptions from the schema.
 *
 * @param schema - The Zod schema to convert
 * @returns A JSON-serializable example object
 */
export function zodToExample(schema: ZodType): unknown {
  // Use the public API to get the description
  const description = schema.description;

  if (schema instanceof zod.ZodObject) {
    const shape = schema.shape;
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(shape))
      result[key] = zodToExample(value as ZodType);
    return result;
  } else if (schema instanceof zod.ZodArray) return schema.description;
  else if (schema instanceof zod.ZodString) return description || "string";
  else if (schema instanceof zod.ZodNumber) return description || 0.0;
  else if (schema instanceof zod.ZodBoolean) return description || true;
  else if (
    schema instanceof zod.ZodOptional ||
    schema instanceof zod.ZodNullable
  )
    return zodToExample(schema.unwrap() as ZodType);
  else if (schema instanceof zod.ZodEnum) {
    const values = schema.options;
    return values[0] || "enum";
  } else if (schema instanceof zod.ZodLiteral) return schema.value;
  else if (schema instanceof zod.ZodDate) return description || "2024-01-01";
  return description || "any";
}
