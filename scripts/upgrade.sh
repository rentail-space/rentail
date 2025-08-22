#!/usr/bin/env bash
set -eo pipefail

echo -e "\033[32m  Upgrading dependencies …\033[0m"
npm outdated  || echo
npm-check-updates --configFileName .npm-check-update.json --errorLevel 2
npx playwright install
npm dedupe --force
npm prune --force

echo -e "\033[32m  Checking code …\033[0m"
npm run test

echo -e "\033[32m  Commiting changes …\033[0m"
git diff --unified=0 --color --word-diff package.json | cat
git add package.json
git add package-lock.json
git commit -m "Upgrade dependencies"

echo -e "\033[32m  Cleaning up …\033[0m"
git gc --aggressive --prune=now

terminal-notifier -sound default  -title "$0" -message "Done!"
exit 0
