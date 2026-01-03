# CLAUDE.md

Guidance for Claude Code when working with this repository.

## Essential Commands

**Development:**
- `pnpm dev` - Start dev server (port 5173)
- `pnpm build` - Build for production
- `pnpm check` - Lint + typecheck (run before committing)
- `pnpm test` - Full test suite

**Common Tasks:**
- `tsx scripts/collect.ts "County, ST"` - Scrape shopping centers
- `tsx scripts/checkWebsites.ts` - Validate seed file websites

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

**Working Memory:**
- User context stored in `User.workingMemory` JSON field
- Schema: `app/lib/workingMemory.ts` (Zod validation)
- Claude emits `<working_memory>` tags → parsed in `onFinish` → merged into user profile
- Fields: merchant, location, selling, projections

**Location Detection:**
1. `User.workingMemory.location` (highest priority)
2. Vercel IP geolocation headers
3. Fallback: LA Midcity (34.04592, -118.34574)

**Geographic Search:**
- Simple lat/lon bounding box (no PostGIS)
- Formula: `lat ± (miles / 69.172)`, `lon ± (miles / 57.393)`
- Default: 30-mile search, 20-mile display

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
- `pnpm test` - Full suite
- `pnpx vitest run <pattern>` - Specific test
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
1. Create markdown in `app/data/blog/my-post.md`
2. Add YAML frontmatter (title, description, date, author, tags)
3. Images go in `public/blog/`
4. Auto-discovered via `blogPosts.server.ts`

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

## Important Reminders

- See [AGENTS.md](./AGENTS.md) for workflow and issue tracking
- Run `pnpm check` before committing
- Database updates: `prisma generate && prisma db push`
- All pages need `<main>` with `aria-label`
- Center seed files MUST have valid `website` property
- Debug logging: `DEBUG=server,browser pnpm dev`
