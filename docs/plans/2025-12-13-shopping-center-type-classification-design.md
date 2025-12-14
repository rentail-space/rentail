# Shopping Center Type Classification Design

**Date:** 2025-12-13
**Status:** Approved

## Overview

Add classification field to identify shopping center types (Regional Mall, Community Center, Strip Center, Outlet Center, Lifestyle Center) using a hybrid approach that combines size metrics, tenant characteristics, and LLM knowledge.

## Requirements

1. Add database field to store shopping center type
2. Update scraping/enrichment to classify centers automatically
3. Support 5 standard retail industry categories
4. Handle uncertain classifications with intelligent defaults

## Database Schema Changes

### New Enum Type

```prisma
enum CenterType {
  RegionalMall      // 400k+ sqft, 50+ stores, enclosed, anchors
  CommunityCenter   // 150k-400k sqft, 20-50 stores, open-air
  StripCenter       // <150k sqft, <20 stores, linear layout
  OutletCenter      // Brand outlets, variable size
  LifestyleCenter   // Open-air, upscale, dining/entertainment
}
```

### Property Model Update

Add required field to Property model:

```prisma
model Property {
  // ... existing fields ...
  centerType     CenterType      @map("center_type")
  // ... rest of fields ...
}
```

**Rationale for enum:**
- Type safety: Can't accidentally save invalid values
- Database constraint: Invalid values rejected at DB level
- Better for filtering/analytics queries
- Matches existing pattern (SpaceType enum)

## Classification Logic

### Hybrid Approach (Three-Tier)

**Tier 1 - Explicit Indicators (highest confidence):**
- Website explicitly mentions type ("outlet center", "lifestyle center")
- Multiple outlet brand stores present (Nike Outlet, Coach Outlet, etc.)
- Clear upscale open-air dining/entertainment focus

**Tier 2 - Size-Based Classification:**
- 400k+ sqft + enclosed → RegionalMall
- 150k-400k sqft → CommunityCenter
- <150k sqft → StripCenter

**Tier 3 - Name Pattern Heuristics:**
- "Westfield", "Simon", "Brookfield" → likely RegionalMall
- "Plaza", "Shopping Center" → likely StripCenter or CommunityCenter
- No conclusive data → StripCenter (most common, conservative default)

### Classification Criteria

**RegionalMall:**
- 400k+ square feet
- 50+ stores
- Enclosed climate-controlled environment
- Department store anchors (Macy's, Nordstrom, etc.)
- Multiple levels common

**CommunityCenter:**
- 150k-400k square feet
- 20-50 stores
- Open-air layout
- Grocery store anchor common
- Serves neighborhood/community needs

**StripCenter:**
- <150k square feet
- <20 stores
- Linear open-air layout
- Street-facing parking
- Convenience-focused tenants

**OutletCenter:**
- Brand outlet stores (manufacturer direct)
- Variable size
- Often grouped by outlet mall operators (Tanger, Premium Outlets)
- Typically 20-40% below retail pricing

**LifestyleCenter:**
- Open-air design
- Upscale tenant mix
- Strong dining and entertainment component
- Pedestrian-friendly layout
- Often includes residential/office components

### Edge Cases

**Mixed-use developments:** Classify by dominant retail component

**Dead/dying malls:** Still classified by physical characteristics (RegionalMall with low occupancy is still RegionalMall)

**Hybrid formats:** Choose based on primary shopping experience (enclosed vs open-air)

**Insufficient data:** LLM defaults to type that best matches available data, or StripCenter if no size data available

## Implementation Changes

### 1. Prisma Schema (`prisma/schema.prisma`)

Add CenterType enum and centerType field to Property model.

### 2. Enrichment Logic (`app/lib/scrape/enrichCenter.ts`)

**Update Zod schema:**
```typescript
const centerSchema = z.object({
  // ... existing fields ...
  centerType: z.enum([
    "RegionalMall",
    "CommunityCenter",
    "StripCenter",
    "OutletCenter",
    "LifestyleCenter"
  ]),
  // ... rest of fields ...
});
```

**Add to enrichment prompt (new step 8):**
```
8. Classify the shopping center type using this hybrid approach:
   - Primary signals: Square footage + store count + whether enclosed/open-air
   - Secondary: Explicit type mentions in website content
   - Tertiary: Name patterns (e.g., "Westfield" = typically RegionalMall)

   Types and criteria:
   - RegionalMall: 400k+ sqft, 50+ stores, enclosed, department store anchors
   - CommunityCenter: 150k-400k sqft, 20-50 stores, open-air, grocery anchor common
   - StripCenter: <150k sqft, <20 stores, linear open-air layout
   - OutletCenter: Brand outlet stores (Nike Outlet, etc), variable size
   - LifestyleCenter: Open-air, upscale tenants, strong dining/entertainment

   If uncertain, choose the type that best matches square footage, or StripCenter if no size data.
```

### 3. Seed Validation (`prisma/seed/seedCenters.ts`)

Add centerType to schema validation:
```typescript
const schema = z.object({
  // ... existing fields ...
  centerType: z.enum([
    "RegionalMall",
    "CommunityCenter",
    "StripCenter",
    "OutletCenter",
    "LifestyleCenter"
  ]),
  // ... rest of fields ...
});
```

## Testing Strategy

### Unit Tests

Update `test/enrichCenter.test.ts` to verify:
- Schema includes centerType field
- Valid enum values accepted
- Invalid values rejected by Zod

### Manual Validation

Test with known examples:
- Westfield Culver City (1M sqft, 172 stores, enclosed) → RegionalMall
- Small neighborhood plaza (<100k sqft, <15 stores) → StripCenter
- Tanger Outlets → OutletCenter

### Database Verification

After running seed, check type distribution:
```bash
psql $DATABASE_URL -c "SELECT center_type, COUNT(*) FROM properties GROUP BY center_type;"
```

## Implementation Order

1. Add CenterType enum to `prisma/schema.prisma`
2. Add centerType field to Property model
3. Run `pnpm prisma generate`
4. Update `app/lib/scrape/enrichCenter.ts` schema and prompt
5. Update `prisma/seed/seedCenters.ts` schema
6. Test with sample center
7. Verify typecheck passes
8. Commit changes

## Migration Strategy

No data migration needed. The seed script regenerates all center data from JSON files, which will be re-enriched with centerType values when the enrichment logic runs next.

## Success Criteria

- ✅ CenterType enum exists with 5 values
- ✅ Property model has required centerType field
- ✅ Enrichment prompt includes classification instructions
- ✅ Seed validation enforces centerType presence
- ✅ TypeScript compilation passes
- ✅ Manual testing shows reasonable classifications
