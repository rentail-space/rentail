#!/usr/bin/env bash
set -eo pipefail

echo -e "\033[32m  Upgrading dependencies …\033[0m"
npm-check-updates --configFileName .ncurc.json --errorLevel 2 || echo "Dependencies to update"

echo -e "\033[32m  Installing Playwright browsers …\033[0m"
pnpm dlx playwright install --with-deps chromium

echo -e "\033[32m  Deduping dependencies …\033[0m"
pnpm dedupe

echo -e "\033[32m  Removing unused dependencies …\033[0m"
pnpm prune

echo -e "\033[32m  Security audit …\033[0m"
pnpm audit --fix
git add package.json pnpm-lock.yaml

echo -e "\033[32m  Running tests …\033[0m"
pnpm run test

echo -e "\033[32m  Commiting changes …\033[0m"
git diff --unified=0 --color --word-diff HEAD~1 package.json
git commit -m "Upgrade dependencies"

echo -e "\033[32m  Cleaning up …\033[0m"
git gc --aggressive --prune=now

terminal-notifier -sound default  -title "$0" -message "Done!"
exit 0
