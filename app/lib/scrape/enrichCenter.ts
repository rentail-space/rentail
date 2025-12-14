import { generateObject } from "ai";
import { z } from "zod";
import { conversational } from "~/lib/models";

const centerSchema = z.object({
  name: z.string(),
  city: z.string(),
  state: z.string(),
  country: z.string(),
  address: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  squareFootage: z.number(),
  numberOfStores: z.number(),
  website: z.string(),
  phone: z.string().optional(),
  imageURLs: z.array(z.string().url()),
  logoURL: z.string().url().optional(),
  description: z.string(),
  demographics: z.string().optional(),
  summary: z.string().optional(),
  openUntil: z.number().optional(),
  rating: z.number().optional(),
  spaces: z
    .array(
      z.object({
        number: z.string(),
        type: z.enum(["Cart", "Inline", "Storage", "Other"]),
        size: z.number(),
        floor: z.number(),
        imageURLs: z.array(z.string().url()).optional(),
        available: z.boolean().default(false),
      }),
    )
    .default([]),
});

interface DiscoveryData {
  name: string;
  address: string;
  city: string;
  state: string;
  website: string;
  latitude: number;
  longitude: number;
}

interface ScrapedData {
  bodyText?: string;
  images?: string[];
  title?: string;
  description?: string | null;
  error?: string;
}

export default async function enrichCenter(
  discoveryData: DiscoveryData,
  scrapedData: ScrapedData,
) {
  const enrichmentPrompt = `Given this shopping center data:

Discovery Info: ${JSON.stringify(discoveryData)}
Scraped Website: ${scrapedData.bodyText?.slice(0, 10000) || "No data"}
Images Found: ${scrapedData.images?.length || 0} images

Extract and structure the following into valid JSON matching this schema:
${JSON.stringify(centerSchema.shape, null, 2)}

Tasks:
1. Verify/correct the address and coordinates
2. Write a compelling 2-3 sentence description
3. Extract: phone, hours (openUntil as HHMM), square footage, store count
4. Select best 3-5 images (prioritize exterior/interior shots)
5. Note any demographic info mentioned
6. If you find individual retail spaces listed, include them
7. Set country to "USA"

Use scraped data as primary source. Fill gaps with your knowledge.
Mark uncertain fields as null.`;

  const { object } = await generateObject({
    model: conversational.model,
    schema: centerSchema,
    prompt: enrichmentPrompt,
  });

  return object;
}
