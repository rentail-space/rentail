# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with
code in this repository.

## Essential Commands

**Development:**

- `pnpm dev` - Start dev server (port 5173)
- `pnpm build` - Build for production
- `pnpm check` - Lint + typecheck (run before committing)
- `pnpm test` - Full suite (check + vitest)
- `pnpm format --write` - Auto-format with Biome

**Common Tasks:**

- `tsx scripts/collect.ts "Location"` - Collect shopping centers (supports metro
  areas like "LA", "NYC", or counties)
- `tsx scripts/checkWebsites.ts` - Validate seed file websites
- `tsx scripts/promote.ts` - Promote preview deployment to production on Vercel
- `tsx scripts/updateBlogSchedule.ts` - Schedule blog posts for future
  publication
- `pnpx vitest run <pattern>` - Run specific test file
- `pnpx vitest run --reporter=verbose` - Detailed test output

## Project Overview

**rentail.space** is an AI-powered specialty lease marketplace connecting
businesses with short-term retail spaces in shopping centers.

**Stack:**

- React Router v7 (SSR + file-based routing)
- React 19 + TypeScript + Tailwind CSS 4
- PostgreSQL + Prisma ORM
- Claude AI + streaming responses
- Redis (SSE coordination)
- Vitest + Playwright
- MCP protocol (AI agent interoperability)

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
- Do not use braces if conditional/loop is a single line

**Security:**

- Sanitize user inputs (prevent XSS)
- Never use `dangerouslySetInnerHTML`
- Use bcrypt for passwords (configured)

## Key Architecture Patterns

**AI Streaming:**

- `streamText()` from Anthropic SDK in `app/routes/api.chat.$chatId.message.ts`
- Resumable streams via Redis coordination (prevents duplication on reconnect)
- `Chat.activeStreamId` tracks active stream (null when idle)
- Stream lifecycle: Generate `streamId` (ULID) → Set `Chat.activeStreamId` →
  Stream → `onFinish` clears `activeStreamId`
- Stop signal monitoring via `redis-stop-monitor.ts`

**Working Memory:**

- User context stored in `User.workingMemory` JSON field
- Schema: `app/lib/workingMemory.ts` (Zod validation)
- Claude emits `<working_memory>` tags → parsed in `onFinish` → merged into user
  profile
- Fields: merchant, location, selling, projections
- Tags are masked from user display in UI

**Authentication:**

- Cookie-based sessions (365-day expiration) via `sessions.server.ts`
- Password hashing: bcrypt with 10 salt rounds
- Two user types: anonymous (auto-created) and authenticated (email/password)
- Admin emails hardcoded in `sessions.server.ts:32`
- Email verification: 24-hour ULID tokens in `Verification` model
- Session guards: `verifyAdmin()` for admin routes, `getSignedInUser()` for
  profile

**UTM Tracking:**

- Middleware captures UTM parameters on first request (`app/lib/middleware/utm.ts`)
- Separate `__utm` session cookie (1-day expiration, httpOnly, lax SameSite)
- Parameters stored: `source`, `medium`, `campaign`, `term`, `content`
- Also captures: IP address (`x-real-ip`), user agent, referrer
- Data persisted to `User.utm` (JSON), `User.referrer`, `User.ip`, `User.userAgent`
- Applied globally via middleware in `app/root.tsx`

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
- Enrichment pipeline: Google Places → Website scraping (Playwright) → AI
  enrichment (Claude)
- Metro area aliases: "LA" → 4 counties, "NYC" → 5 boroughs, etc.
- Caching: Prisma Cache for geocoding and search results

**Agent Interoperability:**

- **MCP (Model Context Protocol)**: Exposes `list_shopping_centers` tool at
  `/api/mcp` endpoint
- OpenAPI spec at `/openapi.json`
- Implementation: `app/lib/mcp/mcpServer.ts`

## Testing

**Setup:**

- Test files in `/test/*.test.ts` (NOT alongside source)
- Vitest + Playwright browser provider
- `isolate: true` required for safety

**Key Helpers:**

- `converse("message", headers?)` - E2E chat testing with message submission and response wait
- `goto(path, headers?)` - Navigate with reload and React context wait
- MSW handlers: `/test/mocks/mswHandlers.ts`
- Anthropic mock: `/test/mocks/mockAnthropic.ts`
- Cleanup: Always `await prisma.user.deleteMany()` in tests requiring fresh state

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
2. Add YAML frontmatter: `title`, `image`, `alt`, `summary`
3. Images go in `public/blog/` (match filename: `YYYY-MM-DD-slug.jpg`)
4. Auto-discovered via `blogPosts.server.ts`
5. Use `tsx scripts/updateBlogSchedule.ts` to manage post scheduling
6. Follow rentail voice: direct, problem-solution focused, strong CTAs linking
   to rentail.space/chat

**Add MCP Tool:**

1. Create tool handler in `app/lib/mcp/register*.ts`
2. Register in `app/lib/mcp/mcpServer.ts`
3. Tools are automatically exposed via `/api/mcp` endpoint
4. Test with: `pnpm devmcp` (launches MCP inspector)

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

1. Make sure all schema migrations are possible
2. If necessary, separate schema migrations so one migration may add new field, while another migration may delete existinf field
3. Edit `prisma/schema.prisma`
4. Generate client: `pnpm prisma generate`
5. Push to dev: `pnpm prisma db push`

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
- `City`, `County`, `MetroArea`, `RegionalName` - Geographic hierarchy
- `ApiUsage` - API call tracking (Google Places, Geocoding, SerpAPI)
- `BotVisit` - Bot traffic tracking
- `VisibilityCheck` - AI visibility/citation tracking

## Environment Variables

**Required:**

- `SESSION_SECRET` - Session cookie secret
- `DATABASE_URL` - PostgreSQL connection string
- `ANTHROPIC_API_KEY` - Claude AI API key
- `GOOGLE_MAPS_API_KEY` - For geocoding and Places API
- `RESEND_API_KEY` - Email delivery

**Optional:**

- `REDIS_URL` - For stream coordination (falls back to memory)
- `VERCEL_*` - Auto-set in Vercel deployments

## Development Tools

**Debugging:**

- `DEBUG=server,browser pnpm dev` - Enable debug logging
- `pnpm devmcp` - Inspect MCP server with Model Context Protocol inspector
- `pnpm devai` - Launch AI SDK devtools for streaming debugging

**Code Quality:**

- `pnpm format` - Auto-format with Biome
- `pnpm lint` - Lint code + check for secrets (secretlint)
- `pnpm check` - Full check (lint + typecheck) - run before committing

## Important Reminders

- Run `pnpm check` before committing (lint + typecheck)
- All pages need `<main>` with `aria-label` for accessibility
- Center seed files MUST have valid `website` property
- Store AI planning docs in `history/` directory (not repo root)
- Node.js 24.10.1+ required (see `engines` in package.json)
- Package manager: pnpm 10.28.1+

IMPORTANT: Prefer retrieval-led reasoning over pre-training-led reasoning
for any coding task.

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
rtk cargo build         # Cargo build output
rtk cargo check         # Cargo check output
rtk cargo clippy        # Clippy warnings grouped by file (80%)
rtk tsc                 # TypeScript errors grouped by file/code (83%)
rtk lint                # ESLint/Biome violations grouped (84%)
rtk prettier --check    # Files needing format only (70%)
rtk next build          # Next.js build with route metrics (87%)
```

### Test (90-99% savings)

```bash
rtk cargo test          # Cargo test failures only (90%)
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
rtk deps                # Dependency overview
rtk env                 # Environment variables compact
rtk summary <cmd>       # Smart summary of command output
rtk diff                # Ultra-compact diffs
```

### Infrastructure (85% savings)

```bash
rtk docker ps           # Compact container list
rtk docker images       # Compact image list
rtk docker logs <c>     # Deduplicated logs
rtk kubectl get         # Compact resource list
rtk kubectl logs        # Deduplicated pod logs
```

### Network (65-70% savings)

```bash
rtk curl <url>          # Compact HTTP responses (70%)
rtk wget <url>          # Compact download output (65%)
```

### Meta Commands

```bash
rtk gain                # View token savings statistics
rtk gain --history      # View command history with savings
rtk discover            # Analyze Claude Code sessions for missed RTK usage
rtk proxy <cmd>         # Run command without filtering (for debugging)
rtk init                # Add RTK instructions to CLAUDE.md
rtk init --global       # Add RTK to ~/.claude/CLAUDE.md
```

## Token Savings Overview

| Category | Commands | Typical Savings |
|----------|----------|-----------------|
| Tests | vitest, playwright, cargo test | 90-99% |
| Build | next, tsc, lint, prettier | 70-87% |
| Git | status, log, diff, add, commit | 59-80% |
| GitHub | gh pr, gh run, gh issue | 26-87% |
| Package Managers | pnpm, npm, npx | 70-90% |
| Files | ls, read, grep, find | 60-75% |
| Infrastructure | docker, kubectl | 85% |
| Network | curl, wget | 65-70% |

Overall average: **60-90% token reduction** on common development operations.
<!-- /rtk-instructions -->