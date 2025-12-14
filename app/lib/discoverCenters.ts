import { generateObject } from "ai";
import { z } from "zod";
import { conversational } from "~/lib/model";

const discoverySchema = z.object({
  centers: z.array(
    z.object({
      name: z.string(),
      address: z.string(),
      city: z.string(),
      state: z.string(),
      website: z.string().url(),
      latitude: z.number(),
      longitude: z.number(),
    }),
  ),
});

export async function discoverCenters(countyName: string) {
  const prompt = `List all shopping centers and malls in ${countyName}.
For each center provide:
- Official name
- Full street address
- City, state
- Official website URL (if known)
- Approximate coordinates (latitude/longitude)

Focus on retail shopping centers, strip malls, and enclosed malls.
Exclude individual stores or single-building retail.`;

  const { object } = await generateObject({
    model: conversational.model,
    schema: discoverySchema,
    prompt,
  });

  return object.centers;
}
