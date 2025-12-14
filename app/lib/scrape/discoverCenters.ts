import { generateObject } from "ai";
import { z } from "zod";
import { conversational } from "~/lib/models";

const discoverySchema = z.object({
  centers: z.array(
    z.object({
      name: z.string().min(1, "Name must not be empty"),
      address: z.string().min(1, "Address must not be empty"),
      city: z.string().min(1, "City must not be empty"),
      state: z
        .string()
        .min(2, "State must be at least 2 characters")
        .max(2, "State must be 2-letter code"),
      website: z.string().url("Must be a valid URL"),
      latitude: z
        .number()
        .min(-90, "Latitude must be >= -90")
        .max(90, "Latitude must be <= 90"),
      longitude: z
        .number()
        .min(-180, "Longitude must be >= -180")
        .max(180, "Longitude must be <= 180"),
    }),
  ),
});

export default async function discoverCenters(
  countyName: string,
  options: { timeout?: number } = {},
) {
  if (!countyName || countyName.trim().length === 0)
    throw new Error("County name is required");

  const { timeout = 30000 } = options;

  const prompt = `List all shopping centers and malls in ${countyName}.
For each center provide:
- Official name
- Full street address
- City, state
- Official website URL (if known)
- Approximate coordinates (latitude/longitude)

Focus on retail shopping centers, strip malls, and enclosed malls.
Exclude individual stores or single-building retail.`;

  try {
    const abortSignal = AbortSignal.timeout(timeout);
    const { object } = await generateObject({
      abortSignal,
      model: conversational.model,
      prompt,
      schema: discoverySchema,
    });
    return object.centers;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "AbortError")
        throw new Error(
          `Discovery request timed out after ${timeout}ms for ${countyName}`,
        );
      // Preserve the original error for debugging
      const wrappedError = new Error(
        `Failed to discover centers for ${countyName}: ${error.message}`,
      );
      wrappedError.cause = error;
      throw wrappedError;
    }
    throw new Error(
      `Failed to discover centers for ${countyName}: Unknown error`,
    );
  }
}
