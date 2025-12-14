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
