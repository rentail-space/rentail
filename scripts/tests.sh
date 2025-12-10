#!/usr/bin/env bash
set -eo pipefail

for test_file in $(find test -maxdepth 1 -name "*.test.ts" | sort); do
  echo -e "\033[0;32m  Running test: $(basename $test_file)\033[0m"
  pnpm vitest run "$test_file"
  if [ $? -ne 0 ]; then
    echo -e "\033[0;31m  \xE2\x9C\x96 Test failed for $(basename $test_file)\033[0m"
    exit 1
  fi
  echo -e "\033[0;32m  \xE2\x9C\x94 Test passed for $(basename $test_file)\033[0m"
  echo ""
done