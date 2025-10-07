import type { ZodSchema } from "zod";

/**
 * Safely parse JSON string with Zod schema validation
 * @param json - JSON string to parse
 * @param schema - Zod schema to validate against
 * @returns Validated and typed object
 * @throws Will throw if JSON is invalid or fails schema validation
 */
export function parseJSON<T>(json: string, schema: ZodSchema<T>): T {
  const parsed = JSON.parse(json);
  return schema.parse(parsed);
}

/**
 * Safely parse JSON string with Zod schema validation, returns null on error
 * @param json - JSON string to parse
 * @param schema - Zod schema to validate against
 * @returns Validated and typed object or null if parsing/validation fails
 */
export function safeParseJSON<T>(json: string, schema: ZodSchema<T>): T | null {
  try {
    const parsed = JSON.parse(json);
    const result = schema.safeParse(parsed);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

/**
 * Safely stringify a value to JSON
 * @param value - Value to stringify
 * @param defaultValue - Default value to return if stringification fails
 * @returns JSON string or default value
 */
export function safeStringify(value: unknown, defaultValue = "{}"): string {
  try {
    return JSON.stringify(value);
  } catch {
    return defaultValue;
  }
}
