# CLAUDE.md

## Commands

- `pnpm dev` - Dev server (port 5173) | `pnpm build` - Production build
- `pnpm check` - Lint + typecheck (run before committing) | `pnpm test` - Full suite
- `pnpm format` - Auto-format | `pnpm devmcp` - MCP inspector
- `pnpx vitest run <pattern>` - Specific test | `--reporter=verbose` for detail
- `tsx scripts/collect.ts "Location"` - Collect shopping centers
- `tsx scripts/promote.ts` - Promote to production | `tsx scripts/updateBlogSchedule.ts` - Schedule posts

## Project

**rentail.space** - AI-powered specialty lease marketplace for short-term retail spaces in shopping centers.

**Stack:** React Router v7 (SSR), React 19, TypeScript, Tailwind CSS 4, PostgreSQL + Prisma, Claude AI + streaming, Redis, Vitest + Playwright, MCP

## Code Conventions

**TypeScript:** Strict mode, interfaces over types, no enums (discriminated unions), auxiliary verb names (`isLoading`)

**Components:** PascalCase + default exports, `~/*` = `./app/*`, functional, early returns

**Oxc (Oxlint/Oxfmt):** Double quotes, 2-space indent, 80 chars. No `forEach()`. `console`: `.assert/.error/.info/.warn` only. No braces on single-line conditionals.

**Security:** Sanitize inputs, never `dangerouslySetInnerHTML`, bcrypt for passwords.

## Architecture

**AI Streaming:** `streamText()` in `api.chat.$chatId.message.ts`. Resumable via Redis. `Chat.activeStreamId` (ULID) tracks active stream. Stop signals via `redis-stop-monitor.ts`.

**Working Memory:** `User.workingMemory` JSON, schema in `app/lib/workingMemory.ts`. Claude emits `<working_memory>` tags → parsed `onFinish` → merged into profile (merchant, location, selling, projections). Tags masked from UI.

**Auth:** Cookie sessions (365-day), bcrypt (10 rounds), anonymous + authenticated. Admin emails hardcoded in `sessions.server.ts:32`. Email verification: 24-hour ULID tokens.

**Location priority:** workingMemory.location → Vercel IP geolocation → fallback LA Midcity

**Geographic Search:** Lat/lon bounding box (`findNearbyCenters.ts`). 30-mile search, 20-mile display. Rating ≥ 4, ordered: spaces → ranking → name.

**MCP:** `list_shopping_centers` at `/api/mcp`. OpenAPI at `/openapi.json`. `app/lib/mcp/mcpServer.ts`.

## Testing

Files in `/test/*.test.ts`. Vitest + Playwright. `isolate: true` required.

- `converse("message", headers?)` - E2E chat | `goto(path, headers?)` - Navigate
- MSW: `/test/mocks/mswHandlers.ts` | Anthropic mock: `/test/mocks/mockAnthropic.ts`
- Cleanup: `await prisma.user.deleteMany()` before tests needing fresh state

## Common Tasks

**Add API route:** `app/routes/api.feature.ts` → export `action()`/`loader()`. Streaming: `streamText()` + `text/event-stream`.

**Add blog post:** `app/data/blog/YYYY-MM-DD-slug.md` + frontmatter (`title`, `image`, `alt`, `summary`). Images in `public/blog/`. Voice: direct, problem-solution, CTAs to rentail.space/chat.

**Add MCP tool:** Handler in `app/lib/mcp/register*.ts` → register in `mcpServer.ts`.

**Data collection:** `tsx scripts/collect.ts "Location"` → `app/data/seeds/` → `tsx scripts/seedCenter.ts path/to/seed.json`.

## Git

`emoji type(scope): description` — ✨ feat 🐛 fix 📝 docs ♻️ refactor ✅ test 🔧 chore

## Database

`prisma/schema.prisma` → `pnpm prisma generate` → `pnpm prisma db push`. Separate migrations for add vs delete.

**Models:** User, Chat, Messages, Property, PropertySpace, Session, Verification, Cache, State, City/County/MetroArea/RegionalName, ApiUsage, BotVisit, VisibilityCheck

## Reminders

- `pnpm check` before committing | All pages: `<main aria-label="...">`
- Seed files must have valid `website` | AI planning docs → `history/`
- Node.js 24.10.1+, pnpm 10.28.1+
- Prefer retrieval-led over pre-training-led reasoning

<!-- rtk-instructions v2 -->

# RTK - Token-Optimized Commands

**Always prefix with `rtk`** — applies optimized filtering when available, passthrough otherwise. Safe in all `&&` chains.

```bash
# Build/lint:  rtk tsc | rtk lint | rtk next build
# Test:        rtk vitest run | rtk playwright test | rtk test <cmd>
# Git:         rtk git <any-subcmd>
# GitHub:      rtk gh pr view/checks | rtk gh run list | rtk gh issue list
# Node:        rtk pnpm install/list/outdated | rtk prisma | rtk npx <cmd>
# Files:       rtk ls | rtk grep | rtk find
# Debug:       rtk err <cmd> | rtk summary <cmd> | rtk gain | rtk gain --history
```

<!-- /rtk-instructions -->
