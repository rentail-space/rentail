import { generateText } from "ai";
import ora from "ora";
import type zod from "zod";
import { z } from "zod";
import { conversational } from "~/lib/models";
import { timeToMs } from "../utils";

const enrichedSchema = z.object({
  centerType: z.enum([
    "RegionalMall",
    "CommunityCenter",
    "StripCenter",
    "OutletCenter",
    "LifestyleCenter",
  ]),
  demographics: z.string().optional(),
  description: z.string(),
  numberOfStores: z.int().positive().optional(),
  squareFootage: z.int().positive().optional(),
  summary: z.string().optional(),
  tier: z.int().int().min(1).max(3).optional(),
});

/**
 * Enrich a center with additional data based on the scraped website data.
 * - Square footage
 * - Store count
 * - Demographic summary
 * - Center type (RegionalMall, CommunityCenter, etc)
 * - Tier (1-3)
 * - Description (based on scraped website data)
 * - Summary (2-3 sentence summary of the center based on the scraped website data)
 *
 * @param center - The center to enrich
 * @param bodyText - The body text from the website
 * @returns The enriched center
 */
export default async function enrichCenter({
  center,
  bodyText,
}: {
  center: {
    name: string;
  };
  bodyText?: string;
}): Promise<zod.infer<typeof enrichedSchema>> {
  const spinner = ora(`Enriching ${center.name}...`).start();
  try {
    const enrichmentPrompt = `Given this shopping center data:

<discovery>
${JSON.stringify(center)}
</discovery>

<website>
${bodyText?.slice(0, 10_000) || "No data"}
</website>

Extract and structure the following into valid JSON matching this schema:
${JSON.stringify(enrichedSchema.shape, null, 2)}

Tasks:
1. Write a description based on scraped website data:
  - When showing the shopping center details page, we show the description
  - The description should be a compelling story about the center, its history, its tenants, its amenities, etc
  - The description should be at least 5 sentences long
  - The description should be written in a way that is easy to understand and engaging
  - The description should be written in a way that is SEO friendly

2. Write a summary based on scraped website data:
  - When showing a list of many shopping centers, we show the summary
  - The summary should be a 2-3 sentences long
  - The summary should be written in a way that is easy to understand and engaging

3. Find the current square footage from the website data. If no square footage
   is found, set to null.

4. Find the current store/building count from the website data. If no store/building count
   is found, set to null.

5. Research and write a comprehensive demographic summary for this shopping center (Google doesn't have this)
   - Include visitor demographics (age groups, income levels, household composition)
   - Describe the trade area characteristics and primary market segments
   - Note shopping patterns and preferences of typical visitors
   - Reference any demographic data from the website or your knowledge of the area
   - Format as a 3-5 sentence narrative summary (not bullet points)
   - If no reliable demographic information is available, omit this field

6. Classify centerType using this hybrid approach:
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

7. Assign a tier classification from 1 to 3 based on desirability and price point:
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

    const { text } = await generateText({
      abortSignal: AbortSignal.timeout(timeToMs("30s")),
      prompt: `${enrichmentPrompt}\n\nRespond with ONLY valid JSON, no other text.`,
      maxRetries: 3,
      ...conversational,
    });
    // NOTE: Anthropic's structured outputs don't support numerical constraints
    // like minimum, maximum, exclusiveMinimum in JSON Schema, so we can't use
    // Output.object({ schema: enrichedSchema }) directly. Instead, we parse the
    // JSON string and validate it using Zod.
    const cleaned = text
      .replace(/^```(?:json)?\s*\n?/g, "")
      .replace(/\n?```\s*$/g, "");
    const parsed = JSON.parse(cleaned);
    parsed.numberOfStores = parsed.numberOfStores || undefined;
    parsed.squareFootage = parsed.squareFootage || undefined;
    parsed.tier = parsed.tier || 1;

    const validated = enrichedSchema.parse(parsed, { reportInput: true });
    spinner.succeed();
    return validated;
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    spinner.fail(`Enrichment failed: ${reason}`);
    throw new Error(reason);
  }
}
