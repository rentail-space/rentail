# CLAUDE.md

## Commands

- `pnpm dev` - Dev server (port 5173)
- `pnpm build` - Production build
- `pnpm check` - Lint + typecheck (run before committing)
- `pnpm test` - Full suite (check + vitest)
- `pnpm format --write` - Auto-format
- `pnpx vitest run <pattern>` - Specific test / `--reporter=verbose` for detail
- `DEBUG=server,browser pnpm dev` - Debug logging
- `pnpm devmcp` - MCP inspector | `pnpm devai` - AI SDK devtools
- `tsx scripts/collect.ts "Location"` - Collect shopping centers
- `tsx scripts/promote.ts` - Promote to production
- `tsx scripts/updateBlogSchedule.ts` - Schedule blog posts

## Project

**rentail.space** - AI-powered specialty lease marketplace for short-term retail spaces in shopping centers.

**Stack:** React Router v7 (SSR), React 19, TypeScript, Tailwind CSS 4, PostgreSQL + Prisma, Claude AI + streaming, Redis, Vitest + Playwright, MCP

## Code Conventions

**TypeScript:** Strict mode, interfaces over types, no enums (discriminated unions), auxiliary verb names (`isLoading`, `hasError`)

**Components:** PascalCase + default exports, `~/*` = `./app/*`, functional (no classes), early returns

**Formatting (Biome):** Double quotes, 2-space indent, 80 char width. No `forEach()`. `console` limited to `.assert`, `.error`, `.info`, `.warn`. No braces for single-line conditionals.

**Security:** Sanitize inputs, never `dangerouslySetInnerHTML`, bcrypt for passwords.

## Architecture

**AI Streaming:** `streamText()` in `api.chat.$chatId.message.ts`. Resumable via Redis. `Chat.activeStreamId` tracks stream (ULID). Stop signals via `redis-stop-monitor.ts`.

**Working Memory:** `User.workingMemory` JSON. Schema: `app/lib/workingMemory.ts`. Claude emits `<working_memory>` tags → parsed `onFinish` → merged into profile. Fields: merchant, location, selling, projections. Tags masked from UI.

**Auth:** Cookie sessions (365-day), bcrypt (10 rounds), anonymous + authenticated users. Admin emails in `sessions.server.ts:32`. Email verification via 24-hour ULID tokens. Guards: `verifyAdmin()`, `getSignedInUser()`.

**UTM:** Middleware `app/lib/middleware/utm.ts`. `__utm` cookie (1-day). Persisted to `User.utm`, `.referrer`, `.ip`, `.userAgent`.

**Location:** workingMemory.location → Vercel IP geolocation → fallback LA Midcity (34.04592, -118.34574)

**Geographic Search:** Lat/lon bounding box in `findNearbyCenters.ts`. `lat ± (miles/69.172)`, `lon ± (miles/57.393)`. 30-mile search, 20-mile display. Rating ≥ 4, ordered by spaces → ranking → name.

**Data Collection:** Hexagonal 50km grid, Google Places API via `app/lib/scrape/metroAreas.ts`. Pipeline: Places → Playwright → Claude enrichment. Metro aliases: "LA" → 4 counties, "NYC" → 5 boroughs.

**MCP:** `list_shopping_centers` at `/api/mcp`. OpenAPI at `/openapi.json`. Implementation: `app/lib/mcp/mcpServer.ts`.

## Testing

Files in `/test/*.test.ts`. Vitest + Playwright. `isolate: true` required.

- `converse("message", headers?)` - E2E chat testing
- `goto(path, headers?)` - Navigate with React context wait
- MSW: `/test/mocks/mswHandlers.ts` | Anthropic mock: `/test/mocks/mockAnthropic.ts`
- Cleanup: `await prisma.user.deleteMany()` in tests needing fresh state

## Common Tasks

**Add API route:** `app/routes/api.feature.ts` → export `action()`/`loader()`. Streaming: `streamText()` + `text/event-stream`.

**Modify Working Memory:** Edit `app/lib/workingMemory.ts` → update `app/prompts/*.md`.

**Add blog post:** `app/data/blog/YYYY-MM-DD-slug.md` with frontmatter (`title`, `image`, `alt`, `summary`). Images in `public/blog/`. Schedule with `updateBlogSchedule.ts`. Voice: direct, problem-solution, CTAs to rentail.space/chat.

**Add MCP tool:** Handler in `app/lib/mcp/register*.ts` → register in `mcpServer.ts`.

**Data collection:** `tsx scripts/collect.ts "Location"` → seeds in `app/data/seeds/` → `tsx scripts/seedCenter.ts path/to/seed.json`.

## Git

Format: `emoji type(scope): description` (imperative, atomic)

✨ feat  🐛 fix  📝 docs  ♻️ refactor  ✅ test  🔧 chore

## Database

Edit `prisma/schema.prisma` → `pnpm prisma generate` → `pnpm prisma db push`. Separate migrations for adding vs deleting fields.

**Models:** User, Chat, Messages, Property, PropertySpace, Session, Verification, Cache, State, City/County/MetroArea/RegionalName, ApiUsage, BotVisit, VisibilityCheck

## Environment

Required: `SESSION_SECRET`, `DATABASE_URL`, `ANTHROPIC_API_KEY`, `GOOGLE_MAPS_API_KEY`, `RESEND_API_KEY`
Optional: `REDIS_URL`, `VERCEL_*`

## Reminders

- `pnpm check` before committing
- All pages: `<main aria-label="...">`
- Seed files must have valid `website`
- AI planning docs → `history/`
- Node.js 24.10.1+, pnpm 10.28.1+
- Prefer retrieval-led over pre-training-led reasoning

<!-- rtk-instructions v2 -->
# RTK (Rust Token Killer) - Token-Optimized Commands

## Golden Rule

**Always prefix commands with `rtk`**. If RTK has a dedicated filter, it uses it. If not, it passes through unchanged. This means RTK is always safe to use.

**Important**: Even in command chains with `&&`, use `rtk`:

```bash
# ❌ Wrong
git add . && git commit -m "msg" && git push

# ✅ Correct
rtk git add . && rtk git commit -m "msg" && rtk git push
```

## RTK Commands by Workflow

### Build & Compile (80-90% savings)

```bash
rtk tsc                 # TypeScript errors grouped by file/code (83%)
rtk lint                # ESLint/Biome violations grouped (84%)
rtk prettier --check    # Files needing format only (70%)
rtk next build          # Next.js build with route metrics (87%)
```

### Test (90-99% savings)

```bash
rtk vitest run          # Vitest failures only (99.5%)
rtk playwright test     # Playwright failures only (94%)
rtk test <cmd>          # Generic test wrapper - failures only
```

### Git (59-80% savings)

```bash
rtk git status          # Compact status
rtk git log             # Compact log (works with all git flags)
rtk git diff            # Compact diff (80%)
rtk git show            # Compact show (80%)
rtk git add             # Ultra-compact confirmations (59%)
rtk git commit          # Ultra-compact confirmations (59%)
rtk git push            # Ultra-compact confirmations
rtk git pull            # Ultra-compact confirmations
rtk git branch          # Compact branch list
rtk git fetch           # Compact fetch
rtk git stash           # Compact stash
rtk git worktree        # Compact worktree
```

Note: Git passthrough works for ALL subcommands, even those not explicitly listed.

### GitHub (26-87% savings)

```bash
rtk gh pr view <num>    # Compact PR view (87%)
rtk gh pr checks        # Compact PR checks (79%)
rtk gh run list         # Compact workflow runs (82%)
rtk gh issue list       # Compact issue list (80%)
rtk gh api              # Compact API responses (26%)
```

### JavaScript/TypeScript Tooling (70-90% savings)

```bash
rtk pnpm list           # Compact dependency tree (70%)
rtk pnpm outdated       # Compact outdated packages (80%)
rtk pnpm install        # Compact install output (90%)
rtk npm run <script>    # Compact npm script output
rtk npx <cmd>           # Compact npx command output
rtk prisma              # Prisma without ASCII art (88%)
```

### Files & Search (60-75% savings)

```bash
rtk ls <path>           # Tree format, compact (65%)
rtk read <file>         # Code reading with filtering (60%)
rtk grep <pattern>      # Search grouped by file (75%)
rtk find <pattern>      # Find grouped by directory (70%)
```

### Analysis & Debug (70-90% savings)

```bash
rtk err <cmd>           # Filter errors only from any command
rtk log <file>          # Deduplicated logs with counts
rtk json <file>         # JSON structure without values
rtk summary <cmd>       # Smart summary of command output
rtk diff                # Ultra-compact diffs
```

### Meta Commands

```bash
rtk gain                # View token savings statistics
rtk gain --history      # View command history with savings
rtk discover            # Analyze Claude Code sessions for missed RTK usage
rtk proxy <cmd>         # Run command without filtering (for debugging)
```
<!-- /rtk-instructions -->
