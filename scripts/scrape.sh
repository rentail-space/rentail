#!/usr/bin/env bash
set -eo pipefail

echo -e "\033[32m  Scraping Los Cerritos …\033[0m"
pnpm tsx app/lib/scrape/scrapeLosCerritos.ts
