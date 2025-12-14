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
  openFrom: z.number().optional(),
  openUntil: z.number().optional(),
  rating: z.number().min(10).max(50).optional(),
  reviewCount: z.number().int().positive().optional(),
  centerType: z.enum([
    "RegionalMall",
    "CommunityCenter",
    "StripCenter",
    "OutletCenter",
    "LifestyleCenter",
  ]),
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
3. Create a one-sentence summary that captures the essence of the shopping center
4. Extract: phone (format as E.164: +1XXXXXXXXXX for US numbers), hours (openFrom as HHMM like 930, openUntil as HHMM like 2100), square footage, store count
5. Select best 3-5 images (prioritize exterior/interior shots)
6. Note any demographic info mentioned
7. If you find individual retail spaces listed, include them
8. Set country to "USA"
9. Classify centerType using this hybrid approach:
   - Primary: Square footage + store count + enclosed/open-air
   - Secondary: Explicit type mentions in website ("outlet center", "lifestyle center")
   - Tertiary: Name patterns ("Westfield" = typically RegionalMall)

   Types:
   - RegionalMall: 400k+ sqft, 50+ stores, enclosed, department store anchors
   - CommunityCenter: 150k-400k sqft, 20-50 stores, open-air, grocery anchor
   - StripCenter: <150k sqft, <20 stores, linear open-air layout
   - OutletCenter: Brand outlet stores (Nike Outlet, etc), variable size
   - LifestyleCenter: Open-air, upscale tenants, strong dining/entertainment

   If uncertain, choose type matching square footage, or StripCenter if no size data.

10. Collect rating and review data using hybrid approach:
   - Primary: Extract ratings displayed on website (Google/Yelp badges, testimonials)
   - Secondary: Use your knowledge of typical ratings for this center
   - Aggregate from all sources into single rating and total review count

   Rating format: 1-5 scale multiplied by 10 (4.3 stars = 43, 4.7 = 47)
   Review count: Sum of all reviews across sources

   Examples:
   - "4.5 stars (1,200 Google reviews)" → rating: 45, reviewCount: 1200
   - "4.3 on Google, 4.1 on Yelp (800 + 400)" → rating: 42, reviewCount: 1200

   If no reliable data found, set both to null.

Use scraped data as primary source. Fill gaps with your knowledge.
Mark uncertain fields as null.`;

  const { object } = await generateObject({
    model: conversational.model,
    schema: centerSchema,
    prompt: enrichmentPrompt,
  });

  return object;
}
