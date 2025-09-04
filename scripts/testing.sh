#!/usr/bin/env bash
set -eo pipefail

# secretlint-disable-next-line
export DIRECT_URL=postgresql://postgres:postgres@localhost:5432/postgres
npx prisma db push