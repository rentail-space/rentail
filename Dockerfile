FROM node:26-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN npm install -g corepack && corepack enable pnpm

# --- BUILDER ---
FROM base AS builder
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

RUN --mount=type=secret,id=env,required=true \
  set -a; . /run/secrets/env; set +a && \
  pnpm --config.verify-deps-before-run=false run build:prisma && \
  pnpm --config.verify-deps-before-run=false run build

# --- RUNNER ---
FROM node:26-slim AS runner
ENV NODE_ENV=production

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ curl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

RUN npm install -g corepack && corepack enable pnpm

WORKDIR /app

ENV HOSTNAME="0.0.0.0"
ENV PORT=3000
EXPOSE 3000

COPY --from=builder /app/build ./build
COPY --from=builder /app/node_modules/.pnpm/node_modules/@prisma/engines ./build/node_modules/.pnpm/node_modules/@prisma/engines
COPY --from=builder /app/prisma/generated ./prisma/generated
COPY --from=builder /app/prisma/prod-ca-2021.crt ./prisma/prod-ca-2021.crt
COPY --from=builder /app/app/data ./app/data
COPY package.json pnpm-lock.yaml ./

RUN --mount=type=secret,id=env,required=true \
    cp /run/secrets/env .env && chmod 644 .env
RUN pnpm --config.verify-deps-before-run=false install --prod --frozen-lockfile --ignore-scripts

USER node

ENV pnpm_config_verify_deps_before_run=false
CMD ["pnpm", "start"]
