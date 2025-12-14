# Shopping Center Data Collection Algorithm

## Overview

Automated system to collect comprehensive shopping center data for US counties using LLM-powered discovery, website scraping, and data enrichment.

## Architecture

### Three-Stage Pipeline

```
County Input → [Discovery] → [Scraping] → [Enrichment] → JSON Files
```

#### Stage 1: Discovery (Claude API)
- Prompt Claude with county name
- Get structured list of shopping centers with basic info (name, approximate address, website URL)
- Claude provides initial seed data using its training knowledge

#### Stage 2: Website Scraping (Playwright)
- For each center from Stage 1, launch browser and scrape website
- Extract: images, detailed descriptions, phone numbers, hours, store directory
- Handle dynamic JavaScript-rendered content
- Timeout after 30s per site, continue on failure

#### Stage 3: Enrichment (Claude API)
- Pass scraped HTML/text + Stage 1 data to Claude
- Claude structures the data, fills gaps, normalizes format
- Validates against existing Zod schema from `newCenters.ts`
- Outputs final JSON matching Property + PropertySpace schema

### CLI Interface

```bash
tsx scripts/collectCenters.ts "Los Angeles County, CA"
```

Outputs to: `prisma/seed/ca/los-angeles/ca-*.json`

---

## Stage 1: Center Discovery

### Prompting Strategy

Use Claude's structured output (tool calling) to ensure consistent format:

```typescript
const discoveryPrompt = `List all shopping centers and malls in ${countyName}.
For each center provide:
- Official name
- Full street address
- City, state
- Official website URL (if known)
- Approximate coordinates (latitude/longitude)

Focus on retail shopping centers, strip malls, and enclosed malls.
Exclude individual stores or single-building retail.`;
```

### Structured Output Schema

```typescript
{
  centers: [
    {
      name: "Westfield Century City",
      address: "10250 Santa Monica Blvd",
      city: "Los Angeles",
      state: "CA",
      website: "https://www.westfield.com/centurycity",
      latitude: 34.0575,
      longitude: -118.4148
    }
  ]
}
```

### Handling Uncertainty

- Claude may return approximate coordinates or missing websites
- Mark confidence level for each field (high/medium/low)
- Stage 3 will verify and correct with scraped data
- Some centers might be hallucinated - website scraping will catch 404s

### API Call

Use existing `@ai-sdk/anthropic` with `generateObject()` for type-safe structured output.

---

## Stage 2: Website Scraping

### Playwright Setup

Follow existing pattern from `scrapeStonewood.ts`:

```typescript
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.goto(websiteUrl, { timeout: 30000 });
```

### Data Extraction Strategy

Instead of site-specific selectors, use general content extraction:

```typescript
const scrapedData = {
  // Get all text content
  bodyText: await page.textContent('body'),

  // Find all images (filter for reasonable sizes)
  images: await page.$$eval('img', imgs =>
    imgs.map(img => img.src)
      .filter(src => src.startsWith('http'))
  ),

  // Extract metadata
  title: await page.title(),
  description: await page.$eval('meta[name="description"]',
    el => el.getAttribute('content')),

  // Find phone numbers via regex
  phones: bodyText.match(/\d{3}[-.]?\d{3}[-.]?\d{4}/g),

  // Get all links (for finding leasing/contact pages)
  links: await page.$$eval('a', links =>
    links.map(a => ({ text: a.textContent, href: a.href }))
  )
};
```

### Error Handling

- Timeout → save what you have, mark as partial
- 404/DNS failure → skip scraping, use LLM-only in Stage 3
- JavaScript errors → continue anyway

---

## Stage 3: Data Enrichment & Structuring

### Enrichment Prompt

Pass both discovery data and scraped content to Claude:

```typescript
const enrichmentPrompt = `Given this shopping center data:

Discovery Info: ${JSON.stringify(discoveryData)}
Scraped Website: ${scrapedData.bodyText.slice(0, 10000)}
Images Found: ${scrapedData.images.length} images

Extract and structure the following into valid JSON matching this schema:
${JSON.stringify(centerSchema)}

Tasks:
1. Verify/correct the address and coordinates
2. Write a compelling 2-3 sentence description
3. Extract: phone, hours (openUntil as HHMM), square footage, store count
4. Select best 3-5 images (prioritize exterior/interior shots)
5. Note any demographic info mentioned
6. If you find individual retail spaces listed, include them

Use scraped data as primary source. Fill gaps with your knowledge.
Mark uncertain fields as null.`;
```

### Structured Output

Use `generateObject()` with existing `centerSchema` from `newCenters.ts`

### Validation Flow

```
Claude Response → Zod validation → Pass ✓ or Retry once with errors
```

### Merge Strategy

- Scraped data takes precedence over discovery data
- Claude fills gaps using its knowledge base
- Final pass ensures all required fields present

---

## File Generation & Storage

### Slug Generation Algorithm

```typescript
function generateSlug(name: string, state: string): string {
  const normalized = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-')          // Spaces to hyphens
    .replace(/-+/g, '-')           // Collapse multiple hyphens
    .replace(/^-|-$/g, '');        // Trim hyphens

  return `${state.toLowerCase()}-${normalized}`;
}

// "Westfield Century City" + "CA" → "ca-westfield-century-city"
```

### Handling Duplicates

- Check if file exists before writing
- Append `-2`, `-3` etc. if duplicate slug detected
- Log warning about potential duplicate center

### Directory Creation

```typescript
const outputPath = `prisma/seed/${state.toLowerCase()}/${countySlug}/${slug}.json`;
await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, JSON.stringify(centerData, null, 2));
```

### County Slug

- "Los Angeles County" → "los-angeles"
- Strip "County" suffix, normalize like center names

### Overwrite Policy

- Default: skip existing files (idempotent runs)
- Optional `--force` flag to overwrite

---

## Rate Limiting & Performance

### Anthropic API Limits

- Free tier: 5 requests/min
- Paid tier: 50 requests/min (Tier 1)
- Each county needs: 1 discovery call + N enrichment calls (N = centers found)

### Rate Limiting Implementation

```typescript
class RateLimiter {
  private lastCall = 0;
  private minDelay = 1200; // 1.2s between calls (~50/min)

  async throttle() {
    const now = Date.now();
    const elapsed = now - this.lastCall;
    if (elapsed < this.minDelay) {
      await sleep(this.minDelay - elapsed);
    }
    this.lastCall = Date.now();
  }
}
```

### Website Scraping Delays

- 2-3 second delay between sites (respectful crawling)
- Randomize delay slightly to appear human-like
- Respect robots.txt (check before scraping)

### Performance Estimates

For a county with 20 shopping centers:
- Discovery: 5-10 seconds
- Scraping: 40-60 seconds (20 sites × 2-3s each)
- Enrichment: 60-80 seconds (20 calls × 3-4s each)
- **Total: ~2-3 minutes per county**

### Parallel Processing

- Scraping can be parallelized (3-5 concurrent browsers)
- API calls must be sequential (rate limits)

---

## Error Handling & Logging

### Error Categories & Responses

#### 1. Website Scraping Failures

```typescript
try {
  scrapedData = await scrapeWebsite(url);
} catch (error) {
  logger.warn(`Scraping failed for ${name}: ${error.message}`);
  scrapedData = { error: 'scraping_failed' };
  // Continue to enrichment with discovery data only
}
```

#### 2. LLM Validation Failures

```typescript
const result = centerSchema.safeParse(claudeResponse);
if (!result.success) {
  logger.error(`Validation failed: ${result.error.message}`);
  // Retry once with validation errors in prompt
  // If still fails, save partial data with validation errors logged
}
```

#### 3. API Rate Limit Exceeded

- Exponential backoff: wait 60s, retry
- After 3 failures, abort with clear error message

### Progress Tracking

```typescript
console.log(`
County: ${countyName}
Progress: [${current}/${total}] ${centerName}
Status: Discovering → Scraping → Enriching → Saved ✓
Errors: ${errorCount} failed, ${partialCount} partial
`);
```

### Final Summary

```
✓ Processed: Los Angeles County, CA
✓ Centers saved: 18/20
⚠ Failed: 2 (websites unreachable)
📁 Output: prisma/seed/ca/los-angeles/*.json
```

### Logging

- Use `debug` package with namespace `collect:centers`
- Write detailed log file per county run

---

## Design Decisions

### Why Website-First Approach?

- Websites have most current, accurate data
- LLM knowledge may be outdated (training cutoff)
- LLM serves as intelligent parser/structurer rather than data source

### Why Three Stages Instead of Two?

- Separation of concerns: discovery, extraction, structuring
- Can retry/improve individual stages independently
- Easier debugging and monitoring

### Why Sequential API Calls?

- Rate limits make parallelization risky
- Small overhead (1.2s/call) acceptable for batch processing
- Predictable, reliable execution

### Why County-Level Processing?

- Manageable scope (10-50 centers per county typically)
- Easy to parallelize at county level via job queue
- Natural organizational unit for real estate data
