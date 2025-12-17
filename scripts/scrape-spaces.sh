#!/usr/bin/env bash
set -eo pipefail

# Find available spaces for these centers:
# - Los Cerritos
# - Santa Monica
# - Stonewood

echo -e "\033[32m  Scraping Los Cerritos …\033[0m"
pnpm tsx app/lib/scrape/scrapeLosCerritos.ts

echo -e "\033[32m  Scraping Santa Monica …\033[0m"
pnpm tsx app/lib/scrape/scrapeSantaMonica.ts

echo -e "\033[32m  Scraping Stonewood …\033[0m"
pnpm tsx app/lib/scrape/scrapeStonewood.ts