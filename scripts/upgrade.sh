#!/usr/bin/env bash
set -eo pipefail

function error_and_exit {
  echo -e "\033[31m  $1\033[0m"
  terminal-notifier -sound default  -title "$0" -message "$1"
  exit 1
}

echo -e "\033[32m  Upgrading dependencies …\033[0m"
npm prune --force
npm outdated  || echo
npm-check-updates --configFileName .npm-check-update.json --errorLevel 2 && error_and_exit "No updates"
npx playwright install
npm dedupe --force
npm prune

echo -e "\033[32m  Checking code …\033[0m"
npm run test || error_and_exit "Tests failed"

echo -e "\033[32m  Commiting changes …\033[0m"
git diff --unified=0 --color --word-diff package.json | cat
git add package.json
git add package-lock.json
git commit -m "Upgrade dependencies"

echo -e "\033[32m  Cleaning up …\033[0m"
git gc --aggressive --prune=now

terminal-notifier -sound default  -title "$0" -message "Done!"
exit 0
