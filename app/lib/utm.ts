import { z } from "zod";

const utmSchema = z.object({
  source: z.string().optional(),
  medium: z.string().optional(),
  campaign: z.string().optional(),
  term: z.string().optional(),
  content: z.string().optional(),
  ip: z.string().optional(),
  userAgent: z.string().optional(),
  referer: z.string().optional(),
});

export type FirstRequest = z.infer<typeof utmSchema>;

/**
 * Safely parse a JSON-encoded UTM string from the database.
 * Returns the parsed UTM object or undefined if parsing fails.
 */
export function safeParseUtm(utm: unknown): FirstRequest | undefined {
  if (!utm) return undefined;
  try {
    const parsed = utmSchema.safeParse(
      typeof utm === "string" ? JSON.parse(utm) : utm,
    );
    return parsed.success ? parsed.data : undefined;
  } catch {
    return undefined;
  }
}
