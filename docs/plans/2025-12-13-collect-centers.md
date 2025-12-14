# Shopping Center Collection Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build CLI tool to collect shopping center data by county using LLM discovery, website scraping, and data enrichment.

**Architecture:** Three-stage pipeline: (1) Claude discovers centers and websites in a county, (2) Playwright scrapes each website for raw data, (3) Claude structures and validates the data. Output saved as JSON files in state/county hierarchy.

**Tech Stack:** Anthropic SDK, Playwright, Zod validation, existing Prisma schema

---

## Task 1: Rate Limiter Utility

**Files:**
- Create: `app/lib/rateLimiter.ts`
- Test: `test/rateLimiter.test.ts`

**Step 1: Write the failing test**

```typescript
import { describe, expect, it } from "vitest";
import { RateLimiter } from "~/lib/rateLimiter";

describe("RateLimiter", () => {
  it("enforces minimum delay between calls", async () => {
    const limiter = new RateLimiter(100); // 100ms delay
    const start = Date.now();

    await limiter.throttle();
    await limiter.throttle();

    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(100);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
pnpx vitest run rateLimiter.test
```

Expected: FAIL with "Cannot find module '~/lib/rateLimiter'"

**Step 3: Write minimal implementation**

Create `app/lib/rateLimiter.ts`:

```typescript
export class RateLimiter {
  private lastCall = 0;
  private minDelay: number;

  constructor(minDelayMs: number) {
    this.minDelay = minDelayMs;
  }

  async throttle() {
    const now = Date.now();
    const elapsed = now - this.lastCall;
    if (elapsed < this.minDelay) {
      await new Promise((resolve) =>
        setTimeout(resolve, this.minDelay - elapsed),
      );
    }
    this.lastCall = Date.now();
  }
}
```

**Step 4: Run test to verify it passes**

```bash
pnpx vitest run rateLimiter.test
```

Expected: PASS (1 test)

**Step 5: Commit**

```bash
git add app/lib/rateLimiter.ts test/rateLimiter.test.ts
git commit -m "feat(lib): add rate limiter utility"
```

---

## Task 2: Slug Generation Utility

**Files:**
- Create: `app/lib/generateSlug.ts`
- Test: `test/generateSlug.test.ts`

**Step 1: Write the failing test**

Create `test/generateSlug.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import { generateSlug } from "~/lib/generateSlug";

describe("generateSlug", () => {
  it("generates slug from name and state", () => {
    expect(generateSlug("Westfield Century City", "CA")).toBe(
      "ca-westfield-century-city",
    );
  });

  it("removes special characters", () => {
    expect(generateSlug("Mall's & Shopping", "NY")).toBe(
      "ny-malls-shopping",
    );
  });

  it("collapses multiple hyphens", () => {
    expect(generateSlug("The   Great  Mall", "TX")).toBe(
      "tx-the-great-mall",
    );
  });

  it("trims leading/trailing hyphens", () => {
    expect(generateSlug("---Mall---", "CA")).toBe("ca-mall");
  });
});
```

**Step 2: Run test to verify it fails**

```bash
pnpx vitest run generateSlug.test
```

Expected: FAIL with "Cannot find module '~/lib/generateSlug'"

**Step 3: Write minimal implementation**

Create `app/lib/generateSlug.ts`:

```typescript
export function generateSlug(name: string, state: string): string {
  const normalized = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // Remove special chars
    .replace(/\s+/g, "-") // Spaces to hyphens
    .replace(/-+/g, "-") // Collapse multiple hyphens
    .replace(/^-|-$/g, ""); // Trim hyphens

  return `${state.toLowerCase()}-${normalized}`;
}
```

**Step 4: Run test to verify it passes**

```bash
pnpx vitest run generateSlug.test
```

Expected: PASS (4 tests)

**Step 5: Commit**

```bash
git add app/lib/generateSlug.ts test/generateSlug.test.ts
git commit -m "feat(lib): add slug generation utility"
```

---

## Task 3: Stage 1 - Center Discovery Function

**Files:**
- Create: `app/lib/discoverCenters.ts`
- Test: `test/discoverCenters.test.ts`

**Step 1: Write the failing test**

Create `test/discoverCenters.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import { discoverCenters } from "~/lib/discoverCenters";

describe("discoverCenters", () => {
  it("returns structured center data for a county", async () => {
    const centers = await discoverCenters("Los Angeles County, CA");

    expect(Array.isArray(centers)).toBe(true);
    expect(centers.length).toBeGreaterThan(0);

    const first = centers[0];
    expect(first).toHaveProperty("name");
    expect(first).toHaveProperty("address");
    expect(first).toHaveProperty("city");
    expect(first).toHaveProperty("state");
    expect(first).toHaveProperty("website");
    expect(first).toHaveProperty("latitude");
    expect(first).toHaveProperty("longitude");
  });
});
```

**Step 2: Run test to verify it fails**

```bash
pnpx vitest run discoverCenters.test
```

Expected: FAIL with "Cannot find module '~/lib/discoverCenters'"

**Step 3: Write minimal implementation**

Create `app/lib/discoverCenters.ts`:

```typescript
import { generateObject } from "ai";
import { z } from "zod";
import anthropic from "~/lib/model";

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
    model: anthropic,
    schema: discoverySchema,
    prompt,
  });

  return object.centers;
}
```

**Step 4: Run test to verify it passes**

```bash
pnpx vitest run discoverCenters.test
```

Expected: PASS (1 test) - Note: This will make real API call. Mock in future if needed.

**Step 5: Commit**

```bash
git add app/lib/discoverCenters.ts test/discoverCenters.test.ts
git commit -m "feat(lib): add center discovery via Claude API"
```

---

## Task 4: Stage 2 - Website Scraping Function

**Files:**
- Create: `app/lib/scrapeCenter.ts`
- Test: `test/scrapeCenter.test.ts`

**Step 1: Write the failing test**

Create `test/scrapeCenter.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import { scrapeCenter } from "~/lib/scrapeCenter";

describe("scrapeCenter", () => {
  it("extracts content from a shopping center website", async () => {
    const url = "https://www.westfield.com/centurycity";
    const result = await scrapeCenter(url);

    expect(result).toHaveProperty("bodyText");
    expect(result).toHaveProperty("images");
    expect(result).toHaveProperty("title");
    expect(result.bodyText).toBeTruthy();
    expect(Array.isArray(result.images)).toBe(true);
  });

  it("handles scraping failures gracefully", async () => {
    const url = "https://invalid-url-that-does-not-exist-12345.com";
    const result = await scrapeCenter(url);

    expect(result.error).toBe("scraping_failed");
  });
});
```

**Step 2: Run test to verify it fails**

```bash
pnpx vitest run scrapeCenter.test
```

Expected: FAIL with "Cannot find module '~/lib/scrapeCenter'"

**Step 3: Write minimal implementation**

Create `app/lib/scrapeCenter.ts`:

```typescript
import { chromium } from "playwright";

interface ScrapedData {
  bodyText?: string;
  images?: string[];
  title?: string;
  description?: string | null;
  error?: string;
}

export async function scrapeCenter(url: string): Promise<ScrapedData> {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto(url, { timeout: 30000 });

    const bodyText = (await page.textContent("body")) || "";
    const images = await page.$$eval("img", (imgs) =>
      imgs.map((img) => img.src).filter((src) => src.startsWith("http")),
    );
    const title = await page.title();
    const description = await page
      .$eval('meta[name="description"]', (el) =>
        el.getAttribute("content"),
      )
      .catch(() => null);

    await browser.close();

    return {
      bodyText,
      images,
      title,
      description,
    };
  } catch (error) {
    await browser.close();
    return { error: "scraping_failed" };
  }
}
```

**Step 4: Run test to verify it passes**

```bash
pnpx vitest run scrapeCenter.test
```

Expected: PASS (2 tests) - Note: Makes real network requests

**Step 5: Commit**

```bash
git add app/lib/scrapeCenter.ts test/scrapeCenter.test.ts
git commit -m "feat(lib): add website scraping with Playwright"
```

---

## Task 5: Stage 3 - Data Enrichment Function

**Files:**
- Create: `app/lib/enrichCenter.ts`
- Test: `test/enrichCenter.test.ts`

**Step 1: Write the failing test**

Create `test/enrichCenter.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import { enrichCenter } from "~/lib/enrichCenter";

describe("enrichCenter", () => {
  it("structures and validates center data", async () => {
    const discoveryData = {
      name: "Westfield Century City",
      address: "10250 Santa Monica Blvd",
      city: "Los Angeles",
      state: "CA",
      website: "https://www.westfield.com/centurycity",
      latitude: 34.0575,
      longitude: -118.4148,
    };

    const scrapedData = {
      bodyText: "Welcome to Westfield Century City. Phone: 310-277-3898",
      images: [
        "https://example.com/image1.jpg",
        "https://example.com/image2.jpg",
      ],
      title: "Westfield Century City",
      description: "Premier shopping destination",
    };

    const result = await enrichCenter(discoveryData, scrapedData);

    expect(result).toHaveProperty("name");
    expect(result).toHaveProperty("address");
    expect(result).toHaveProperty("description");
    expect(result).toHaveProperty("imageURLs");
    expect(Array.isArray(result.imageURLs)).toBe(true);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
pnpx vitest run enrichCenter.test
```

Expected: FAIL with "Cannot find module '~/lib/enrichCenter'"

**Step 3: Write minimal implementation**

Create `app/lib/enrichCenter.ts`:

```typescript
import { generateObject } from "ai";
import { z } from "zod";
import anthropic from "~/lib/model";

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

export async function enrichCenter(
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
    model: anthropic,
    schema: centerSchema,
    prompt: enrichmentPrompt,
  });

  return object;
}
```

**Step 4: Run test to verify it passes**

```bash
pnpx vitest run enrichCenter.test
```

Expected: PASS (1 test) - Note: Makes real API call

**Step 5: Commit**

```bash
git add app/lib/enrichCenter.ts test/enrichCenter.test.ts
git commit -m "feat(lib): add data enrichment via Claude API"
```

---

## Task 6: File Writing Utility

**Files:**
- Create: `app/lib/writeCenterFile.ts`
- Test: `test/writeCenterFile.test.ts`

**Step 1: Write the failing test**

Create `test/writeCenterFile.test.ts`:

```typescript
import { existsSync } from "node:fs";
import { readFile, rm } from "node:fs/promises";
import { describe, expect, it, afterEach } from "vitest";
import { writeCenterFile } from "~/lib/writeCenterFile";

describe("writeCenterFile", () => {
  afterEach(async () => {
    await rm("prisma/seed/ca", { recursive: true, force: true });
  });

  it("writes center data to correct file path", async () => {
    const centerData = {
      name: "Test Center",
      state: "CA",
      city: "Los Angeles",
      country: "USA",
      address: "123 Test St",
      latitude: 34.05,
      longitude: -118.25,
      squareFootage: 100000,
      numberOfStores: 50,
      website: "https://test.com",
      imageURLs: [],
      description: "Test description",
      spaces: [],
    };

    const path = await writeCenterFile(
      centerData,
      "Los Angeles County",
    );

    expect(existsSync(path)).toBe(true);
    expect(path).toContain("prisma/seed/ca/los-angeles");
    expect(path).toContain("ca-test-center.json");

    const content = await readFile(path, "utf-8");
    const parsed = JSON.parse(content);
    expect(parsed.name).toBe("Test Center");
  });
});
```

**Step 2: Run test to verify it fails**

```bash
pnpx vitest run writeCenterFile.test
```

Expected: FAIL with "Cannot find module '~/lib/writeCenterFile'"

**Step 3: Write minimal implementation**

Create `app/lib/writeCenterFile.ts`:

```typescript
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { generateSlug } from "~/lib/generateSlug";

interface CenterData {
  name: string;
  state: string;
  [key: string]: unknown;
}

export async function writeCenterFile(
  centerData: CenterData,
  countyName: string,
): Promise<string> {
  const slug = generateSlug(centerData.name, centerData.state);
  const countySlug = countyName
    .toLowerCase()
    .replace(/\s+county\s*/i, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");

  const outputPath = resolve(
    `prisma/seed/${centerData.state.toLowerCase()}/${countySlug}/${slug}.json`,
  );

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, JSON.stringify(centerData, null, 2));

  return outputPath;
}
```

**Step 4: Run test to verify it passes**

```bash
pnpx vitest run writeCenterFile.test
```

Expected: PASS (1 test)

**Step 5: Commit**

```bash
git add app/lib/writeCenterFile.ts test/writeCenterFile.test.ts
git commit -m "feat(lib): add center file writing utility"
```

---

## Task 7: Main CLI Script

**Files:**
- Create: `scripts/collectCenters.ts`

**Step 1: Write the implementation**

Create `scripts/collectCenters.ts`:

```typescript
#!/usr/bin/env tsx
import debug from "debug";
import { discoverCenters } from "~/lib/discoverCenters";
import { enrichCenter } from "~/lib/enrichCenter";
import { RateLimiter } from "~/lib/rateLimiter";
import { scrapeCenter } from "~/lib/scrapeCenter";
import { writeCenterFile } from "~/lib/writeCenterFile";

const logger = debug("collect:centers");

async function main() {
  const countyName = process.argv[2];

  if (!countyName) {
    console.error("Usage: tsx scripts/collectCenters.ts \"County Name, ST\"");
    process.exit(1);
  }

  logger(`Starting collection for: ${countyName}`);

  // Rate limiter: 1.2s between API calls (~50/min)
  const rateLimiter = new RateLimiter(1200);

  // Stage 1: Discovery
  logger("Stage 1: Discovering centers...");
  await rateLimiter.throttle();
  const centers = await discoverCenters(countyName);
  logger(`Found ${centers.length} centers`);

  let successCount = 0;
  let failCount = 0;

  // Process each center
  for (let i = 0; i < centers.length; i++) {
    const center = centers[i];
    logger(
      `[${i + 1}/${centers.length}] Processing: ${center.name}`,
    );

    try {
      // Stage 2: Scraping
      logger(`  Scraping website: ${center.website}`);
      await new Promise((resolve) =>
        setTimeout(resolve, 2000 + Math.random() * 1000),
      );
      const scrapedData = await scrapeCenter(center.website);

      if (scrapedData.error) {
        logger(`  ⚠ Scraping failed, using LLM-only mode`);
      }

      // Stage 3: Enrichment
      logger(`  Enriching data...`);
      await rateLimiter.throttle();
      const enrichedData = await enrichCenter(center, scrapedData);

      // Stage 4: Write to file
      logger(`  Writing to file...`);
      const path = await writeCenterFile(enrichedData, countyName);
      logger(`  ✓ Saved: ${path}`);

      successCount++;
    } catch (error) {
      logger(`  ✗ Failed: ${error instanceof Error ? error.message : String(error)}`);
      failCount++;
    }
  }

  // Summary
  console.log(`
✓ Processed: ${countyName}
✓ Centers saved: ${successCount}/${centers.length}
${failCount > 0 ? `⚠ Failed: ${failCount}` : ""}
📁 Output: prisma/seed/${centers[0]?.state.toLowerCase()}/${countyName.toLowerCase().replace(/\s+county\s*/i, "").replace(/\s+/g, "-")}/*.json
  `);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
```

**Step 2: Make script executable**

```bash
chmod +x scripts/collectCenters.ts
```

**Step 3: Test manually with a real county**

```bash
DEBUG=collect:centers tsx scripts/collectCenters.ts "Orange County, CA"
```

Expected: Script runs, discovers centers, scrapes, enriches, writes files

**Step 4: Verify output files exist**

```bash
ls -la prisma/seed/ca/orange/*.json
```

Expected: Multiple JSON files created

**Step 5: Commit**

```bash
git add scripts/collectCenters.ts
git commit -m "feat(scripts): add collectCenters CLI tool"
```

---

## Task 8: Update seedCenters to Support Nested Directories

**Files:**
- Modify: `prisma/seed/seedCenters.ts`

**Step 1: Read current implementation**

```bash
cat prisma/seed/seedCenters.ts
```

**Step 2: Update to recursively find JSON files**

Modify `prisma/seed/seedCenters.ts` to use recursive file search:

```typescript
import debug from "debug";
import { readdirSync, statSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path, { basename, resolve } from "node:path";
import { z } from "zod";
import prisma from "~/lib/prisma";

const schema = z.object({
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
  imageURLs: z.array(z.url()),
  logoURL: z.url().optional(),
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
        imageURLs: z.array(z.url()).optional(),
        available: z.boolean().default(false),
      }),
    )
    .default([]),
});

const logger = debug("seed");

function findJSONFiles(dir: string): string[] {
  const results: string[] = [];
  const entries = readdirSync(dir);

  for (const entry of entries) {
    const fullPath = path.join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      results.push(...findJSONFiles(fullPath));
    } else if (entry.endsWith(".json")) {
      results.push(fullPath);
    }
  }

  return results;
}

export default async function seedCenters() {
  logger("Seeding centers");
  const dirname = resolve("prisma/seed");
  const filenames = findJSONFiles(dirname);

  for (const filename of filenames) {
    logger(`Processing ${filename}`);
    const content = await readFile(filename, "utf8");
    const data = JSON.parse(content);
    const center = schema.parse(data);

    await prisma.property.upsert({
      where: { name: center.name },
      update: center,
      create: {
        ...center,
        id: `property-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        spaces: {
          create: center.spaces.map((space) => ({
            ...space,
            id: `space-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            imageURLs: space.imageURLs || [],
          })),
        },
      },
    });
  }

  logger(`Seeded ${filenames.length} centers`);
}
```

**Step 3: Test the updated seed function**

```bash
tsx prisma/seed.ts
```

Expected: All JSON files (including nested ones) are processed

**Step 4: Commit**

```bash
git add prisma/seed/seedCenters.ts
git commit -m "feat(seed): support nested directory structure"
```

---

## Task 9: Documentation

**Files:**
- Create: `docs/collect-centers.md`

**Step 1: Write usage documentation**

Create `docs/collect-centers.md`:

```markdown
# Shopping Center Data Collection

## Overview

CLI tool to collect comprehensive shopping center data for US counties using AI-powered discovery, website scraping, and data enrichment.

## Usage

```bash
tsx scripts/collectCenters.ts "County Name, ST"
```

Examples:
```bash
tsx scripts/collectCenters.ts "Los Angeles County, CA"
tsx scripts/collectCenters.ts "Orange County, CA"
tsx scripts/collectCenters.ts "Cook County, IL"
```

## Output

Files are saved to:
```
prisma/seed/{state}/{county}/{slug}.json
```

Example:
```
prisma/seed/ca/los-angeles/ca-westfield-century-city.json
```

## Process

1. **Discovery**: Claude API lists all shopping centers in the county
2. **Scraping**: Playwright scrapes each center's website
3. **Enrichment**: Claude structures and validates the data
4. **Storage**: JSON files written with proper slugs

## Performance

For a county with 20 shopping centers:
- Discovery: 5-10 seconds
- Scraping: 40-60 seconds (20 sites × 2-3s each)
- Enrichment: 60-80 seconds (20 calls × 3-4s each)
- **Total: ~2-3 minutes per county**

## Rate Limits

- Anthropic API: 50 requests/min (paid tier)
- Website scraping: 2-3 second delay between sites

## Debugging

Enable debug logging:
```bash
DEBUG=collect:centers tsx scripts/collectCenters.ts "County, ST"
```

## Seeding Database

After collecting data, seed the database:
```bash
tsx prisma/seed.ts
```

This will recursively process all JSON files in `prisma/seed/`.
```

**Step 2: Commit**

```bash
git add docs/collect-centers.md
git commit -m "docs: add shopping center collection guide"
```

---

## Task 10: Integration Test

**Files:**
- Create: `test/collectCenters.test.ts`

**Step 1: Write integration test**

Create `test/collectCenters.test.ts`:

```typescript
import { exec } from "node:child_process";
import { existsSync } from "node:fs";
import { rm } from "node:fs/promises";
import { promisify } from "node:util";
import { describe, expect, it, afterAll } from "vitest";

const execAsync = promisify(exec);

describe("collectCenters integration", () => {
  afterAll(async () => {
    await rm("prisma/seed/ca/test-county", {
      recursive: true,
      force: true,
    });
  });

  it("collects centers for a small county end-to-end", async () => {
    // Use a small county to limit API calls
    const { stdout, stderr } = await execAsync(
      'tsx scripts/collectCenters.ts "Santa Barbara County, CA"',
      { timeout: 180000 }, // 3 minute timeout
    );

    expect(stderr).toBe("");
    expect(stdout).toContain("✓ Processed:");
    expect(stdout).toContain("Centers saved:");

    // Verify at least one file was created
    const hasCenters = existsSync("prisma/seed/ca/santa-barbara");
    expect(hasCenters).toBe(true);
  }, 180000);
});
```

**Step 2: Run integration test**

```bash
pnpx vitest run collectCenters.test
```

Expected: PASS (1 test) - Note: Makes real API calls, takes 2-3 minutes

**Step 3: Commit**

```bash
git add test/collectCenters.test.ts
git commit -m "test: add integration test for collectCenters"
```

---

## Final Verification

**Step 1: Run all tests**

```bash
pnpm test
```

Expected: All tests pass (lint + typecheck + vitest)

**Step 2: Manual test with real county**

```bash
DEBUG=collect:centers tsx scripts/collectCenters.ts "Ventura County, CA"
```

Expected: Successfully collects and saves center data

**Step 3: Verify database seeding**

```bash
tsx prisma/seed.ts
pnpm prisma studio
```

Expected: Centers appear in database with nested spaces

**Step 4: Final commit**

```bash
git add .
git commit -m "feat: complete shopping center collection system"
```

---

## Notes

- **API Costs**: Each county requires 1 discovery + N enrichment calls (N = number of centers)
- **Rate Limiting**: Built-in 1.2s delay between API calls respects Anthropic limits
- **Error Handling**: Scraping failures fall back to LLM-only mode
- **Extensibility**: Easy to add more scraping logic or validation rules

## Skills Referenced

- @superpowers:test-driven-development - Used for all test-first implementations
- @superpowers:verification-before-completion - Used for final verification step
