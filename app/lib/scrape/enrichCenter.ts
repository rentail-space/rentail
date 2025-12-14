import { generateObject } from "ai";
import ora from "ora";
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
  website: z.string().optional(),
  phone: z.string().optional(),
  imageURLs: z.array(z.string().url()),
  logoURL: z.string().url().optional(),
  description: z.string(),
  demographics: z.string().optional(),
  summary: z.string().optional(),
  openFrom: z.number().optional(),
  openUntil: z.number().optional(),
  rating: z.number().min(1.0).max(5.0).optional(),
  reviewCount: z.number().int().positive().optional(),
  centerType: z.enum([
    "RegionalMall",
    "CommunityCenter",
    "StripCenter",
    "OutletCenter",
    "LifestyleCenter",
  ]),
  tier: z.number().int().min(1).max(3),
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
  website?: string;
  latitude: number;
  longitude: number;
}

interface ScrapedData {
  bodyText?: string;
  images?: string[];
  title?: string;
  description?: string | null;
  spaces?: Array<{
    number: string;
    type: "Cart" | "Inline" | "Storage" | "Other";
    size: number;
    floor: number;
    available: boolean;
    imageURLs?: string[];
  }>;
  error?: string;
}

export default async function enrichCenter(
  discoveryData: DiscoveryData,
  scrapedData: ScrapedData,
) {
  const spinner = ora(`Enriching ${discoveryData.name}...`).start();
  const enrichmentPrompt = `Given this shopping center data:

Discovery Info: ${JSON.stringify(discoveryData)}
Scraped Website: ${scrapedData.bodyText?.slice(0, 10000) || "No data"}
Images Found: ${scrapedData.images?.length || 0} images

Extract and structure the following into valid JSON matching this schema:
${JSON.stringify(centerSchema.shape, null, 2)}

Tasks:
1. Verify/correct the address and coordinates
2. Write a compelling 2-3 sentence description based on scraped website data
3. Create a one-sentence summary that captures the essence of the shopping center
4. Extract: phone (format as E.164: +1XXXXXXXXXX for US numbers), hours (openFrom as HHMM like 930, openUntil as HHMM like 2100), square footage, and store/building count from website data
5. Select the single best image that represents this shopping center
   - Prioritize: exterior shot showing building/signage
   - Fallback: interior shot showing main concourse/atrium
   - The image should be immediately recognizable as this specific center
   - If no images available, set imageURLs to empty array
6. Research and write a comprehensive demographic summary for this shopping center
   - Include visitor demographics (age groups, income levels, household composition)
   - Describe the trade area characteristics and primary market segments
   - Note shopping patterns and preferences of typical visitors
   - Reference any demographic data from the website or your knowledge of the area
   - Format as a 3-5 sentence narrative summary (not bullet points)
   - If no reliable demographic information is available, omit this field
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

10. Assign a tier classification from 1 to 3 based on desirability and price point:
   - Tier 3: Upscale, high-end shopping centers with luxury brands and premium retailers
     Examples: Westfield Century City, The Grove, South Coast Plaza, Fashion Island
     Indicators: Luxury tenants (Gucci, Louis Vuitton, Tesla), high-end dining, valet parking

   - Tier 2: Average, mid-market shopping centers with mainstream retailers
     Examples: Beverly Center, Glendale Galleria, standard regional malls
     Indicators: Chain stores (H&M, Gap, Macy's), food courts, typical mall amenities

   - Tier 1: Value-oriented, budget shopping centers or older facilities
     Examples: Los Cerritos Center, discount/outlet centers, aging strip malls
     Indicators: Discount stores, fewer amenities, older facilities, lower price points

   Consider: tenant mix, location prestige, facility condition, and target market.

11. Collect rating and review data using hybrid approach:
   - Primary: Extract ratings displayed on website (Google/Yelp badges, testimonials)
   - Secondary: Use your knowledge of typical ratings for this center
   - Aggregate from all sources into single rating and total review count

   Rating format: 1.0-5.0 scale with one decimal place (4.3 stars, 4.7 stars)
   Review count: Sum of all reviews across sources

   Examples:
   - "4.5 stars (1,200 Google reviews)" → rating: 4.5, reviewCount: 1200
   - "4.3 on Google, 4.1 on Yelp (800 + 400)" → rating: 4.2, reviewCount: 1200

   If no reliable data found, omit both fields.

Use scraped data as primary source. Fill gaps with your knowledge.
For optional fields without reliable data, omit them entirely (do not set to null).`;

  const { object } = await generateObject({
    abortSignal: AbortSignal.timeout(90_000),
    model: conversational.model,
    prompt: enrichmentPrompt,
    schema: centerSchema,
    temperature: 1,
  });

  spinner.succeed();

  // If spaces were provided in scraped data and enrichment didn't find any,
  // use the scraped spaces
  if (scrapedData.spaces && scrapedData.spaces.length > 0) {
    return {
      ...object,
      spaces: object.spaces.length > 0 ? object.spaces : scrapedData.spaces,
    };
  }

  return object;
}
