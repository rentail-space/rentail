# Review and Rating Collection Design

**Date:** 2025-12-13
**Status:** Approved

## Overview

Add review count field to aggregate ratings and review data from multiple online sources (Google Maps, Yelp, Facebook, etc.) using a hybrid collection approach.

## Requirements

1. Store aggregate rating (average across all sources)
2. Store total review count (sum across all sources)
3. Collect data from website first, fallback to LLM knowledge
4. No source tracking or confidence levels (keep simple)
5. Maintain existing rating precision (0.1 stars via 10x multiplier)

## Schema Changes

### Property Model Update

Add `reviewCount` field to Property model:

```prisma
model Property {
  // ... existing fields ...
  rating         Int?            @map("rating") // 1-5 as 10-50 (0.1 precision)
  reviewCount    Int?            @map("review_count") // Total reviews across all sources
  openFrom       Int?            @map("open_from")
  // ... rest of fields ...
}
```

**Field specifications:**
- `reviewCount`: Optional integer, sum of all reviews across sources
- `rating`: Existing field unchanged, stores 1-5 scale multiplied by 10
- Both fields optional since not all centers have public ratings

**Examples:**
- Westfield Century City: `rating: 43` (4.3 stars), `reviewCount: 1247`
- Small strip center: `rating: null`, `reviewCount: null`

## Data Collection Logic

### Hybrid Approach

**Primary source (highest priority):**
- Extract ratings displayed on shopping center website
- Look for Google/Yelp badges, testimonials, review widgets
- Example: "4.5 stars on Google (1,200 reviews)"

**Secondary source (fallback):**
- Use LLM's knowledge of typical ratings for the center
- Based on training data about major shopping centers
- Example: "Westfield Century City typically rated 4.3 stars"

**Aggregation logic:**
- When multiple sources found: average ratings, sum review counts
- Example: Google 4.3 (800 reviews) + Yelp 4.1 (400 reviews) = 4.2 rating, 1200 reviews
- Formula: `rating = round((google + yelp) / 2 * 10)`, `reviewCount = google + yelp`

**No data available:**
- Set both `rating` and `reviewCount` to null
- Acceptable for centers without public review presence

## Enrichment Prompt Update

Add task 9 to enrichment instructions:

```
9. Collect rating and review data using hybrid approach:
   - Primary: Extract ratings displayed on website (Google/Yelp badges, testimonials)
   - Secondary: Use your knowledge of typical ratings for this center
   - Aggregate from all sources into single rating and total review count

   Rating format: 1-5 scale multiplied by 10 (4.3 stars = 43, 4.7 = 47)
   Review count: Sum of all reviews across sources

   Examples:
   - "4.5 stars (1,200 Google reviews)" → rating: 45, reviewCount: 1200
   - "4.3 on Google, 4.1 on Yelp (800 + 400)" → rating: 42, reviewCount: 1200

   If no reliable data found, set both to null.
```

## Validation

### EnrichCenter Schema

```typescript
const centerSchema = z.object({
  // ... existing fields ...
  rating: z.number().min(10).max(50).optional(),
  reviewCount: z.number().int().positive().optional(),
  centerType: z.enum([...]),
  // ... rest
});
```

**Constraints:**
- Rating: 10-50 (1.0 to 5.0 stars), optional
- Review count: Positive integer, optional
- Both can be null if no data available

### Seed Validation

Update `prisma/seed/seedCenters.ts` with matching schema:

```typescript
const schema = z.object({
  // ... existing fields ...
  rating: z.number().min(10).max(50).optional(),
  reviewCount: z.number().int().positive().optional(),
  centerType: z.enum([...]),
  // ... rest
});
```

## Display Logic

### UI Update (Center.tsx)

Enhance existing rating display to show review count:

**Current code:**
```typescript
{center.rating && (
  <div className="flex flex-row items-center gap-2">
    <StarIcon className="h-5 w-5 text-yellow-500" fill="currentColor" />
    {clamp(center.rating / 10, 1, 5).toFixed(1)} • {center.summary}
  </div>
)}
```

**Updated code:**
```typescript
{center.rating && (
  <div className="flex flex-row items-center gap-2">
    <StarIcon className="h-5 w-5 text-yellow-500" fill="currentColor" />
    {clamp(center.rating / 10, 1, 5).toFixed(1)}
    {center.reviewCount && ` (${center.reviewCount.toLocaleString()} reviews)`}
    {center.summary && ` • ${center.summary}`}
  </div>
)}
```

**Display examples:**
- Full data: "4.3 (1,247 reviews) • A successful example of retail revitalization"
- No review count: "4.5 • Modern shopping destination"
- No rating at all: (section hidden)

**Formatting:**
- Rating: Divide by 10, show one decimal place (4.3)
- Review count: Locale-formatted with commas (1,247)
- Summary: Optional suffix after bullet

## Implementation Order

1. Add `reviewCount` field to `prisma/schema.prisma`
2. Run `pnpm prisma generate` to regenerate types
3. Update `app/lib/scrape/enrichCenter.ts` schema and prompt (add task 9)
4. Update `prisma/seed/seedCenters.ts` schema validation
5. Update `app/routes/center.$id/Center.tsx` display logic
6. Update sample data (`prisma/seed/westfield-culver-city.json`)
7. Run `pnpm prisma db push --force-reset` (requires user consent)
8. Verify `pnpm typecheck` passes
9. Manual test: Check display with sample data

## Sample Data Update

Update `westfield-culver-city.json`:

```json
{
  "name": "Westfield Culver City",
  "rating": 45,
  "reviewCount": 1247,
  "summary": "A successful example of retail revitalization",
  // ... rest of fields
}
```

## Testing Strategy

**Manual validation:**
- Large well-known mall → should have rating + review count
- Small local center → might have null values (acceptable)
- UI displays correctly with and without review count

**No automated tests:**
- enrichCenter.test.ts remains skipped (requires real API)
- Visual verification sufficient for display logic

## Success Criteria

- ✅ reviewCount field added to Property model
- ✅ EnrichCenter collects ratings from website + LLM knowledge
- ✅ Seed validation enforces valid rating/review count ranges
- ✅ UI displays review count alongside rating
- ✅ TypeScript compilation passes
- ✅ Sample data includes review count
- ✅ Graceful handling of missing data (null values)
