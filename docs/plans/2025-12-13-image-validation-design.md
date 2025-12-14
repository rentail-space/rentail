# Image Validation Design

**Date:** 2025-12-13
**Status:** Approved

## Overview

Improve image collection algorithm to validate accessibility, format, and dimensions before enrichment. Select one representative image per shopping center instead of multiple images.

## Requirements

1. Only use accessible images (can download successfully)
2. Only PNG or JPEG formats
3. Minimum dimensions: 500px wide × 400px high
4. Select one representative image per center (not 3-5)
5. Store empty array if no valid images found

## Architecture

### New Validation Function

Create `validateImages()` function between scraping and enrichment steps:

```typescript
// app/lib/scrape/validateImages.ts
interface ValidatedImage {
  url: string;
  width: number;
  height: number;
  format: 'png' | 'jpeg';
}

export default async function validateImages(
  imageURLs: string[]
): Promise<string[]> {
  // 1. Pre-filter URLs using heuristics
  const filtered = preFilterImages(imageURLs);

  // 2. Validate filtered images (download + check)
  const validated = await validateImageSet(filtered);

  // 3. Return valid URLs (or empty array)
  return validated.map(img => img.url);
}
```

### Integration Point

Called in `collectCenters.ts` between scrape and enrich:

```typescript
// Stage 3: Scrape website
const scrapedData = await scrapeCenter(center.website);

// Stage 3.5: Validate images (NEW)
const validImages = await validateImages(scrapedData.images || []);

// Stage 4: Enrich with LLM
const enrichedData = await enrichCenter(
  discoveryData,
  { ...scrapedData, images: validImages }
);
```

## Pre-filtering Heuristics

### Combined Filtering Strategy

Filter scraped URLs before downloading using multiple heuristics:

**Exclusion rules (remove these):**
- Small icon sizes: `_(16|32|64|96|128)x\1\.` or `-(16|32|64|96|128)\.`
- Non-representative paths: `/icon/`, `/logo/`, `/social/`, `/avatar/`, `/ui/`, `favicon`, `sprite`
- Social media images: `facebook`, `twitter`, `instagram`, `linkedin`, `og-image`, `share`

**Inclusion rules (prioritize these):**
- Size hints: `/large/`, `/hero/`, `/banner/`, `_xl`, `_xxl`, `_1200`, `_1920`, `hero`, `banner`, `main`
- Semantic paths: `/gallery/`, `/images/property/`, `/center/`, `/mall/`, `/shopping`

**Default behavior:**
Include URLs that don't match any exclusion rules.

### Fallback Strategy

If pre-filtering returns empty array or < 3 images:
- Use top 10 from original scraped list
- Ensures validation attempt even if heuristics are too aggressive

### Implementation

```typescript
function preFilterImages(imageURLs: string[]): string[] {
  const filtered = imageURLs.filter(url => {
    const lower = url.toLowerCase();

    // Exclude small icon sizes
    if (/_(16|32|64|96|128)x\1\.|-(16|32|64|96|128)\./.test(lower)) {
      return false;
    }

    // Exclude non-representative paths
    if (/(\/icon\/|\/logo\/|\/social\/|\/avatar\/|\/ui\/|favicon|sprite)/.test(lower)) {
      return false;
    }

    // Exclude social media images
    if (/(facebook|twitter|instagram|linkedin|og-image|share)/.test(lower)) {
      return false;
    }

    // Include size hints
    if (/(\/large\/|\/hero\/|\/banner\/|_xl\.|_xxl\.|_1200|_1920|hero|banner|main)/.test(lower)) {
      return true;
    }

    // Include semantic paths
    if (/(\/gallery\/|\/images\/property\/|\/center\/|\/mall\/|\/shopping)/.test(lower)) {
      return true;
    }

    return true; // Default: include
  });

  // Fallback if too few results
  return filtered.length >= 3 ? filtered : imageURLs.slice(0, 10);
}
```

## Validation Logic

### Download and Check

Sequentially download and validate filtered images:

```typescript
async function validateImageSet(imageURLs: string[]): Promise<ValidatedImage[]> {
  const results: ValidatedImage[] = [];

  for (const url of imageURLs) {
    try {
      // Download with 10s timeout
      const response = await fetch(url, {
        signal: AbortSignal.timeout(10_000)
      });

      if (!response.ok) continue;

      // Check Content-Type
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.match(/image\/(png|jpeg|jpg)/i)) continue;

      // Get image buffer
      const buffer = await response.arrayBuffer();

      // Get dimensions using image-size library
      const { width, height, type } = await getImageDimensions(buffer);

      // Validate minimum dimensions
      if (width >= 500 && height >= 400) {
        results.push({
          url,
          width,
          height,
          format: type === 'png' ? 'png' : 'jpeg'
        });
      }
    } catch (error) {
      continue; // Skip failed images
    }
  }

  return results;
}
```

### Format Validation

**Content-Type header check:**
- Must match: `image/png`, `image/jpeg`, or `image/jpg`
- Case-insensitive matching

**Binary format verification:**
- Use `image-size` npm package
- Reads image header to determine format
- No full image decoding needed (efficient)

### Dimension Validation

**Minimum requirements:**
- Width: ≥ 500 pixels
- Height: ≥ 400 pixels

**Library:**
Use `image-size` package to extract dimensions from buffer without full decode.

### Performance Considerations

**Sequential processing:**
- Process one image at a time (not parallel)
- Prevents overwhelming target servers
- Natural rate limiting

**Timeout handling:**
- 10 second timeout per image using `AbortSignal.timeout()`
- Prevents hanging on slow/broken URLs

**Early exit optimization:**
- Stop after finding 5 valid images
- Reduces unnecessary downloads
- Most centers need only 1 image

## Enrichment Prompt Update

### Task 5 Modification

**Current:**
```
5. Select best 3-5 images (prioritize exterior/interior shots)
```

**New:**
```
5. Select the single best image that represents this shopping center
   - Prioritize: exterior shot showing building/signage
   - Fallback: interior shot showing main concourse/atrium
   - The image should be immediately recognizable as this specific center
   - If no images available, set imageURLs to empty array
```

### Schema (Unchanged)

```typescript
imageURLs: z.array(z.string().url())
```

Still accepts array format for schema compatibility, but LLM selects only 1 image.

### Example Outputs

**With valid image:**
```json
{
  "imageURLs": ["https://example.com/westfield-exterior.jpg"]
}
```

**No valid images:**
```json
{
  "imageURLs": []
}
```

## Error Handling

### Validation Failures

**No images pass validation:**
- Store `imageURLs: []` (empty array)
- Center saved without images
- UI displays without image (honest representation)

**Download failures:**
- Individual failures: skip image, continue with next
- All failures: return empty array
- No retry logic (keep simple)

### Integration Error Handling

**In collectCenters.ts:**
```typescript
let validImages: string[] = [];
try {
  console.info("  Validating images...");
  validImages = await validateImages(scrapedData.images || []);
  console.info(`  Found ${validImages.length} valid images`);
} catch (error) {
  console.error("  Image validation failed:", error);
  validImages = []; // Continue with empty array
}

const enrichedData = await enrichCenter(
  discoveryData,
  { ...scrapedData, images: validImages }
);
```

### Logging

**Validation stats:**
- Log: `X images scraped → Y passed filter → Z validated`
- Helps debug filtering effectiveness
- Shows validation success rate

## Dependencies

### New Package

**image-size:**
- Install: `pnpm add image-size`
- Purpose: Extract dimensions from image buffer
- Efficient: Reads header only, no full decode
- Supports: PNG, JPEG, and many other formats

### Existing Dependencies

**Native fetch:**
- Built-in Node.js fetch API
- AbortSignal.timeout() for request timeout

**Playwright:**
- Already used in scrapeCenter
- No changes needed

## Implementation Order

1. Install `image-size` package
2. Create `app/lib/scrape/validateImages.ts` with:
   - `preFilterImages()` helper
   - `validateImageSet()` helper
   - `validateImages()` main function
3. Update `app/lib/scrape/collectCenters.ts`:
   - Add validation step between scrape and enrich
   - Add error handling and logging
4. Update `app/lib/scrape/enrichCenter.ts`:
   - Modify task 5 prompt to select 1 image
5. Update sample data:
   - `westfield-culver-city.json` to single image
6. Test with real center
7. Verify typecheck passes

## Testing Strategy

### Manual Validation

Test with known shopping centers:
- Large mall with many images → should find hero image
- Small center with few images → should validate available images
- Center with broken images → should handle gracefully (empty array)

### Validation Stats

After running collection:
- Check console logs for validation stats
- Review success rate: `Z validated / X scraped`
- Adjust heuristics if success rate < 50%

### Sample Data

Verify sample data has single representative image:
- Westfield Culver City should have 1 exterior or interior shot
- Image should be ≥500×400 pixels
- Format should be PNG or JPEG

## Success Criteria

- ✅ validateImages() function created and exported
- ✅ Pre-filtering heuristics implemented
- ✅ Format validation (PNG/JPEG only)
- ✅ Dimension validation (≥500×400)
- ✅ Accessibility check (successful download)
- ✅ Integration with collectCenters pipeline
- ✅ Enrichment prompt selects 1 image
- ✅ Empty array handling for failed validation
- ✅ TypeScript compilation passes
- ✅ Sample data updated with single image
