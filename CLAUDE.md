# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

**Development:**

- `pnpm dev` - Start dev server (port 5173)
- `pnpm build` - Build for production
- `pnpm check` - Lint + typecheck (run before committing)
- `pnpm test` - Full test suite

**Common Tasks:**

- `tsx scripts/collect.ts "Location"` - Collect shopping centers (supports metro areas like "LA", "NYC", or counties)
- `tsx scripts/checkWebsites.ts` - Validate seed file websites
- `pnpx vitest run <pattern>` - Run specific test file
- `pnpx vitest run --reporter=verbose` - Detailed test output

## Project Overview

**rentail.space** is an AI-powered specialty lease marketplace connecting businesses with short-term retail spaces in shopping centers.

**Stack:**

- React Router v7 (SSR + file-based routing)
- React 19 + TypeScript + Tailwind CSS 4
- PostgreSQL + Prisma ORM
- Claude AI + streaming responses
- Redis (SSE coordination)
- Vitest + Playwright

## Output Style

**CLEARFRAME mode** (`.claude/rules/output-style.md`):

- Execute immediately without explanation
- No preamble/postamble phrases
- Present only essential results
- Zero conversational overhead

## Code Conventions

**TypeScript:**

- Strict mode; interfaces over types
- Avoid enums (use discriminated unions)
- Descriptive names with auxiliary verbs (`isLoading`, `hasError`)

**Components:**

- PascalCase + default exports
- Path alias: `~/*` = `./app/*`
- Functional patterns (no classes)
- Early returns, no unnecessary else

**Formatting (Biome):**

- Double quotes, 2-space indent, 80 char width
- `pnpm format --write` before committing
- Avoid `forEach()` (use `for...of` or `map()`)
- Limit `console` to: `.assert`, `.error`, `.info`, `.warn`

**Security:**

- Sanitize user inputs (prevent XSS)
- Never use `dangerouslySetInnerHTML`
- Use bcrypt for passwords (configured)

## Key Architecture Patterns

**AI Streaming:**

- `streamText()` from Anthropic SDK in `app/routes/api.chat.$chatId.message.ts`
- Resumable streams via Redis coordination (prevents duplication on reconnect)
- `Chat.activeStreamId` tracks active stream (null when idle)
- Stream lifecycle: Generate `streamId` (ULID) → Set `Chat.activeStreamId` → Stream → `onFinish` clears `activeStreamId`
- Stop signal monitoring via `redis-stop-monitor.ts`

**Working Memory:**

- User context stored in `User.workingMemory` JSON field
- Schema: `app/lib/workingMemory.ts` (Zod validation)
- Claude emits `<working_memory>` tags → parsed in `onFinish` → merged into user profile
- Fields: merchant, location, selling, projections
- Tags are masked from user display in UI

**Authentication:**

- Cookie-based sessions (365-day expiration) via `sessions.server.ts`
- Password hashing: bcrypt with 10 salt rounds
- Two user types: anonymous (auto-created) and authenticated (email/password)
- Admin emails hardcoded in `sessions.server.ts:32`
- Email verification: 24-hour ULID tokens in `Verification` model
- Session guards: `verifyAdmin()` for admin routes, `getSignedInUser()` for profile

**Location Detection:**

1. `User.workingMemory.location` (highest priority)
2. Vercel IP geolocation headers
3. Fallback: LA Midcity (34.04592, -118.34574)

**Geographic Search:**

- Simple lat/lon bounding box (no PostGIS)
- Formula: `lat ± (miles / 69.172)`, `lon ± (miles / 57.393)`
- Default: 30-mile search, 20-mile display
- Implementation: `findNearbyCenters()` in `app/lib/findNearbyCenters.ts`
- Ordered by: available spaces count (desc) → ranking (desc) → name (asc)
- Only includes properties with rating ≥ 4

**Data Collection:**

- Grid-based Google Places API search via `app/lib/scrape/metroAreas.ts`
- Hexagonal grid with 50km radius for comprehensive coverage
- Enrichment pipeline: Google Places → Website scraping (Playwright) → AI enrichment (Claude)
- Metro area aliases: "LA" → 4 counties, "NYC" → 5 boroughs, etc.
- Caching: Prisma Cache for geocoding and search results

## Testing

**Setup:**

- Test files in `/test/*.test.ts` (NOT alongside source)
- Vitest + Playwright browser provider
- `isolate: true` required for safety

**Key Helpers:**

- `converse(page, "message")` - E2E chat testing
- `goto(path, headers?, options?)` - Navigate with flexible wait options
- MSW handlers: `/test/mocks/mswHandlers.ts`
- Anthropic mock: `/test/mocks/mockAnthropic.ts`

**Commands:**

- `pnpm test` - Full suite (lint + typecheck + vitest)
- `pnpx vitest run <pattern>` - Specific test
- `pnpx vitest run --reporter=verbose` - Detailed output
- `DEBUG=* pnpm test` - Enable debug logging

## Common Tasks

**Add API Route:**

1. Create `app/routes/api.feature.ts`
2. Export `action()` or `loader()`
3. For streaming: use `streamText()` + `text/event-stream` header
4. Test in `/test/*.test.tsx`

**Modify Working Memory:**

1. Edit schema in `app/lib/workingMemory.ts`
2. Update prompts (`app/prompts/*.md`) to instruct Claude
3. Test with mock Anthropic responses

**Add Blog Post:**

1. Create markdown in `app/data/blog/YYYY-MM-DD-slug.md`
2. Add YAML frontmatter (title, description, date, author, tags)
3. Images go in `public/blog/`
4. Auto-discovered via `blogPosts.server.ts`

**Run Data Collection:**

1. Use `tsx scripts/collect.ts "Location"` (e.g., "Los Angeles, CA")
2. System resolves to metro area and generates search grid
3. Results saved as seed files in `app/data/seeds/`
4. Import: `tsx scripts/seedCenter.ts path/to/seed.json`

## Git Commits

Use conventional commits with emoji prefixes:

- ✨ `feat:` New features
- 🐛 `fix:` Bug fixes
- 📝 `docs:` Documentation
- ♻️ `refactor:` Code restructuring
- ✅ `test:` Tests
- 🔧 `chore:` Maintenance

Format: `emoji type(scope): description`

Imperative mood, atomic commits, reference files when helpful.

## Database Management

**Schema Updates:**

1. Edit `prisma/schema.prisma`
2. Generate client: `pnpm prisma generate`
3. Push to dev: `pnpm prisma db push`
4. Create migration: `pnpm prisma migrate dev --name migration_name`

**Models:**

- `User` - Authentication and working memory
- `Chat` - Conversation threads with `activeStreamId`
- `Messages` - Chat messages (JSON content, UIMessage format)
- `Property` - Shopping centers (lat/lon, demographics, tier, ranking)
- `PropertySpace` - Individual retail spaces
- `Session` - Auth sessions (token, expiration)
- `Verification` - Email verification tokens
- `Cache` - Generic key-value store (geocoding, API results)
- `State` - US state data (abbreviation, name, lede)

## Environment Variables

**Required:**

- `BETTER_AUTH_SECRET` - Session cookie secret
- `DATABASE_URL` - PostgreSQL connection string
- `ANTHROPIC_API_KEY` - Claude AI API key
- `GOOGLE_MAPS_API_KEY` - For geocoding and Places API
- `RESEND_API_KEY` - Email delivery

**Optional:**

- `REDIS_URL` - For stream coordination (falls back to memory)
- `SENTRY_DSN` - Error tracking
- `VERCEL_*` - Auto-set in Vercel deployments

## Important Reminders

- See [AGENTS.md](./AGENTS.md) for bd (beads) issue tracking workflow
- Run `pnpm check` before committing (lint + typecheck)
- All pages need `<main>` with `aria-label` for accessibility
- Center seed files MUST have valid `website` property
- Debug logging: `DEBUG=server,browser pnpm dev`
- Store AI planning docs in `history/` directory (not repo root)
