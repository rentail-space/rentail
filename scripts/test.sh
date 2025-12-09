#!/usr/bin/env bash
set -eo pipefail

for test_file in $(find test -maxdepth 1 -name "*.test.ts" | sort); do
  pnpm vitest run "$test_file"
  if [ $? -ne 0 ]; then
    echo "Test failed for $test_file"
    exit 1
  fi
done