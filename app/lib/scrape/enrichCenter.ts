import { generateObject } from "ai";
import ora from "ora";
import type zod from "zod";
import { z } from "zod";
import { conversational } from "~/lib/models";
import type discoverCenters from "~/lib/scrape/discoverCenters";

const centerSchema = z.object({
  squareFootage: z.number(),
  numberOfStores: z.number(),
  description: z.string(),
  demographics: z.string().optional(),
  centerType: z.enum([
    "RegionalMall",
    "CommunityCenter",
    "StripCenter",
    "OutletCenter",
    "LifestyleCenter",
  ]),
  tier: z.number().int().min(1).max(3),
});

/**
 * Enrich a center with additional data based on the scraped website data.
 * - Square footage
 * - Store count
 * - Demographic summary
 * - Center type (RegionalMall, CommunityCenter, etc)
 * - Tier (1-3)
 * - Description (based on scraped website data)
 *
 * @param center - The center to enrich
 * @param description - The description from the website metadata (optional)
 * @param bodyText - The body text from the website
 * @returns The enriched center
 */
export default async function enrichCenter({
  center,
  description,
  bodyText,
}: {
  center: Awaited<ReturnType<typeof discoverCenters>>[number];
  description?: string | null;
  bodyText?: string;
}): Promise<zod.infer<typeof centerSchema>> {
  const spinner = ora(`Enriching ${center.name}...`).start();

  const enrichmentPrompt = `Given this shopping center data:

<discovery>
${JSON.stringify(center)}
</discovery>

<website>
${bodyText?.slice(0, 10000) || "No data"}
</website>

Extract and structure the following into valid JSON matching this schema:
${JSON.stringify(centerSchema.shape, null, 2)}

Tasks:
1. Write a compelling 2-3 sentence description based on scraped website data (this is DIFFERENT from summary)
2. Find square footage and store/building count from website data (Google doesn't have this)
3. Research and write a comprehensive demographic summary for this shopping center (Google doesn't have this)
   - Include visitor demographics (age groups, income levels, household composition)
   - Describe the trade area characteristics and primary market segments
   - Note shopping patterns and preferences of typical visitors
   - Reference any demographic data from the website or your knowledge of the area
   - Format as a 3-5 sentence narrative summary (not bullet points)
   - If no reliable demographic information is available, omit this field
4. Classify centerType using this hybrid approach:
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

5. Assign a tier classification from 1 to 3 based on desirability and price point:
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
  // If the description is provided in page metadata, use it instead of the
  // generated description.
  if (description) object.description = description;
  return object;
}
