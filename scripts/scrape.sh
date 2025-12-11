#!/usr/bin/env bash
set -eo pipefail

echo -e "\033[32m  Scraping Los Cerritos …\033[0m"
pnpm tsx scripts/scrapeLosCerritos.ts

echo -e "\033[32m  Scraping Santa Monica …\033[0m"
pnpm tsx scripts/scrapeSantaMonica.ts

echo -e "\033[32m  Scraping Stonewood …\033[0m"
pnpm tsx scripts/scrapeStonewood.ts