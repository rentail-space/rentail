import type { TextUIPart } from "ai";

/**
 * Safely narrow an unknown value (e.g. Prisma JSON field) to TextUIPart[].
 * Returns an empty array if the value is not a valid array of text parts.
 */
export function safeTextParts(content: unknown): TextUIPart[] {
  if (!Array.isArray(content)) return [];
  return content.filter(
    (part): part is TextUIPart =>
      typeof part === "object" &&
      part !== null &&
      "type" in part &&
      part.type === "text",
  );
}
