FROM node:24-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable pnpm

# --- DEPS ---
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# --- BUILDER ---
FROM base AS builder
WORKDIR /app

# Install Doppler CLI for build-time secret injection
RUN apt-get update && apt-get install -y --no-install-recommends curl ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && curl -fSslL https://cli.doppler.com/install.sh -o /tmp/install.sh \
    && sh /tmp/install.sh --no-modify-path \
    && rm /tmp/install.sh \
    && doppler --version

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Doppler injects ALL secrets (SENTRY_*, DATABASE_URL, etc.) during build
# DOPPLER_TOKEN is passed via --build-arg by Coolify
ARG DOPPLER_TOKEN
ARG DOPPLER_PROJECT
ARG DOPPLER_CONFIG=prd

RUN doppler run --config "$DOPPLER_CONFIG" -- pnpm run build

# --- RUNNER ---
FROM node:24-slim AS runner
ENV NODE_ENV=production

# Native deps for sharp/bcryptjs
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ curl \
    && rm -rf /var/lib/apt/lists/*

# Install Doppler CLI for runtime secret injection
RUN apt-get update && apt-get install -y --no-install-recommends curl ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && curl -fSslL https://cli.doppler.com/install.sh -o /tmp/install.sh \
    && sh /tmp/install.sh --no-modify-path \
    && rm /tmp/install.sh \
    && doppler --version

RUN corepack enable pnpm

WORKDIR /app

ENV HOSTNAME="0.0.0.0"
ENV PORT=3000
EXPOSE 3000

COPY --from=builder /app/build ./build
COPY --from=builder /app/node_modules/.pnpm/node_modules/@prisma/engines ./build/node_modules/.pnpm/node_modules/@prisma/engines
COPY --from=builder /app/prisma/generated ./prisma/generated
COPY package.json pnpm-lock.yaml ./

RUN pnpm install --prod --frozen-lockfile 2>/dev/null || true

USER node

# Doppler injects ALL secrets at runtime too
CMD ["doppler", "run", "--config", "prd", "--", "pnpm", "start"]
