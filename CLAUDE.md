# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands Reference

**Package Management:** Uses pnpm (v10.20.0+)

### Development & Building
- `pnpm dev` - Start dev server with HMR on port 5173
- `pnpm build` - Build for production (prisma generate + react-router build)
- `pnpm start` - Start production server with instrumentation
- `pnpm clean` - Remove Vite cache, .react-router cache, and build directory

### Code Quality
- `pnpm lint` - Run secretlint + Biome linter
- `pnpm typecheck` - Type check with TypeScript + react-router typegen (auto-generates route types)
- `pnpm format --write` - Format code with Biome (80 char line width, double quotes, 2-space indent)
- `pnpm check` - Run both lint and typecheck

### Testing
- `pnpm test` - Full test suite: lint + db push + typecheck + vitest (verbose reporter)
- `pnpx vitest run <pattern>` - Run specific test (e.g., `pnpx vitest run chat.test`)
- `pnpm checkly` - Synthetic monitoring tests with snapshot updates

### Slash Commands (in `.claude/commands/`)
- `/cmd:audit` - Review code for maintainability, flexibility, readability
- `/cmd:security` - Security audit and vulnerability assessment
- `/cmd:performance` - Performance optimization analysis
- `/cmd:conversion-hooks` - Find conversion tracking hooks

## Architecture

**rentail.space** is a specialty lease marketplace web application that helps businesses discover short-term retail spaces in shopping centers. It combines server-side rendering, real-time AI-powered chat, and geographic intelligence for space discovery.

**Tech Stack:**
- **Framework**: React Router v7 (SSR with file-based routing)
- **Frontend**: React 19 + TypeScript + Tailwind CSS 4 + DaisyUI
- **Build**: Vite 7
- **Database**: PostgreSQL + Prisma ORM (with PgAdapter)
- **Auth**: Better Auth (anonymous user support)
- **Streaming**: Redis + resumable-stream package for reliable SSE delivery
- **AI**: Claude 4 via Anthropic SDK with streaming responses
- **Testing**: Vitest + Playwright (browser pool, visual regression)
- **Linting**: Biome (formatter + linter) + secretlint
- **Monitoring**: Sentry + BetterStack (Logtail + Push Gateway) + Checkly

### AI Integration & Streaming

**Chat Architecture:**
- API endpoint: `app/routes/api.chat.message.tsx` implements `streamText()` from Anthropic SDK
- Client hook: `useChat` from AI SDK with `resume: true` for auto-reconnection on network loss
- **Resumable Streams Pattern:**
  - Active stream ID stored in `Chat.activeStreamId` database field
  - Resumable context created in `consumeSseStream` callback using Redis pub/sub
  - Resume endpoint: `app/routes/api.chat.message.$messageId.stream.tsx` restores interrupted streams
  - `activeStreamId` cleared in `onFinish` callback when stream completes
  - Prevents message duplication on reconnect

**Working Memory (User Profiles):**
- Stores persistent user context as JSON in `User.workingMemory` field
- Profile schema validated via Zod in `app/lib/userProfile.ts`
- Profile fields: name, location (city, state, country, lat/lon as numbers, timezone), selling details, preferences
- **Emission Pattern:**
  - System prompt instructs agent to emit `<working_memory>{JSON}</working_memory>` tags
  - Tags automatically parsed and merged into profile via `updateUserProfile()` in `onFinish` callback
  - `maskWorkingMemoryTags()` removes tags from user-visible output
  - Deep merge: new values override existing profile fields
- System prompts: `app/prompts/systemPrompt.md` (with working memory instructions), `welcome.md`

### Database & Observability

**Database:**
- PostgreSQL with Prisma ORM + PgAdapter for connection pooling
- Models: User, Chat, Message, Waitlist, Property, PropertySpace
- Session-based chat with automatic user creation from IP geolocation
- Bot detection via `isBot` flag (user-agent based)
- Geographic queries: simple latitude/longitude bounding box calculations (see `app/lib/findNearbyProperties.ts`)
- Schema updates: `prisma generate && prisma db push`

**Monitoring & Logging:**
- **Error tracking**: Sentry (configured in `app/lib/instrument.server.ts`)
- **Structured logging**: BetterStack Logtail + Push Gateway for metrics
- **Synthetic monitoring**: Checkly (see `checkly.config.ts`)
- **Debug logging**: `debug` package with namespaces (server, browser, agent, prisma, msw)
  - Enable: `DEBUG=server,browser pnpm test` or `DEBUG=* pnpm test`

## Code Conventions

**TypeScript & Types:**
- Strict mode enabled; use interfaces over types
- Avoid enums (use discriminated unions or const maps instead)
- Descriptive variable names with auxiliary verbs (`isLoading`, `hasError`, `didUpdate`)

**Components & Files:**
- Components: PascalCase + default exports
- Utilities & functions: camelCase + named/default exports
- Directories: lowercase with dashes (e.g., `components/auth-wizard`)
- Path alias: `~/*` = `./app/*`, `~/test/*` = `./test/*`

**Code Organization:**
- Imports: React → external packages → local files
- Functional and declarative patterns (no classes)
- Pure functions use `function` keyword
- Early returns, no unnecessary else statements
- Minimize `useState`/`useEffect`; prefer context or reducers for state
- Use `useMemo` and `useCallback` to prevent unnecessary re-renders

**Formatting (Biome-enforced):**
- Double quotes, 2-space indent, 80 character line width
- Import organization via Biome assist
- `pnpm format --write` before committing

## Git & Commits

**Commit Format (Conventional Commits):**
- Use descriptive emoji prefixes:
  - ✨ `feat:` New features
  - 🐛 `fix:` Bug fixes
  - 📝 `docs:` Documentation
  - ♻️ `refactor:` Code restructuring
  - 🎨 `style:` Formatting (Biome)
  - ⚡️ `perf:` Performance improvements
  - ✅ `test:` Test additions/fixes
  - 🔧 `chore:` Config, tooling, maintenance
  - ⬆️ `upgrade:` Dependency updates
  - 🚑 `hotfix:` Critical fixes for production
  - 🔒 `security:` Security improvements
  - 🔥 `remove:` Removing code or files
  - 🚧 `wip:` Work in progress

**Commit Guidelines:**
- Imperative mood: "Add feature" not "Added feature"
- Single concern per commit (atomic)
- Reference relevant files in description when helpful
- Format: `emoji type(scope): description` (e.g., `✨ feat(chat): Add streaming message support`)
- Include body for complex changes explaining the "why"
- Suggest splitting commits across different concerns

## Testing

**Setup & Configuration:**
- Test files: `*.test.ts` or `*.test.tsx` in `/test` directory (NOT alongside source in `/app`)
- Framework: Vitest with browser provider (Playwright) + forks pool
- Config: `vitest.config.ts` (60s test timeout, 90s hook timeout, 10s teardown timeout)
- Setup: `/test/helpers/setup.ts` (global) + `/test/helpers/globalSetup.ts`
- Node.js: 22.0.0 or higher required

**Test Organization:**
- Use nested `describe` blocks for logical grouping
- `beforeAll`/`afterAll` for setup/cleanup when sharing state across tests
- Share state via `let` variables within describe block (tests run sequentially)
- Each test validates one aspect; state flows through the suite

**Infrastructure & Mocking:**
- **MSW Handlers**: `/test/mocks/mswHandlers.ts` prevents external API calls
- **Anthropic Mock**: `/test/mocks/mockAnthropic.ts` with pattern matching
- **Database**: Reset with `await prisma.user.deleteMany()` in beforeAll or beforeEach
- **Visual regression**: `await expect(page).toMatchScreenshot()` (screenshots in `__screenshots__/`)

**Common Patterns:**

*E2E Chat Testing:*
```typescript
import { converse } from "~/test/helpers/converse";
await converse(page, "Hello, how are you?");
// Automatically: fills input, clicks Send, polls Chat.activeStreamId until null
```

*Unit Testing (Database/Logic):*
```typescript
const user = await prisma.user.create({
  data: {
    geocode: { lat: 40.0, lon: -118.0 },
    metadata: { ip: "127.0.0.1" },
    workingMemory: {},
  },
});
// Call functions directly; clean up after test
```

**Commands:**
- Run all: `pnpm test` (includes lint + db push + typecheck)
- Run specific: `pnpx vitest run <pattern>` (e.g., `pnpx vitest run chat.test`)
- Debug: `DEBUG=* pnpm test` to enable all debug namespaces

## Environment Variables

**Required (.env.local):**
- `ANTHROPIC_API_KEY` - Claude AI API key
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis for stream coordination (default: redis://localhost:6379)
- `SESSION_SECRET` - Session management key
- `RESEND_API_KEY` - Email service (Resend)
- `LOGTAIL_TOKEN` / `LOGTAIL_ENDPOINT` - BetterStack logging
- `PUSHGATEWAY_URL` / `PUSHGATEWAY_TOKEN` - BetterStack metrics
- `CHECKLY_ACCOUNT_ID` / `CHECKLY_API_KEY` - Synthetic monitoring

**Optional:**
- `SENTRY_DSN` / `SENTRY_AUTH_TOKEN` - Error tracking
- `NODE_ENV` - Environment (development/production/test)
- `DEBUG` - Debug logging namespaces (e.g., `DEBUG=server,browser` or `DEBUG=*`)

## Project Structure

**Key Directories:**

`/app` - Main application (React Router v7 file-based routing)
- `routes.ts` - Route config
- `root.tsx` - App shell + error boundary
- `routes/` - Individual routes
  - `api.chat.message.tsx` - Create chat message (streaming)
  - `api.chat.message.$messageId.stream.tsx` - Resume interrupted stream
  - `api.chat.$chatId.stop.tsx` - Stop active stream
  - `api.chat.$chatId.properties.ts` - Fetch nearby properties
  - `api.chat.$chatId.export.csv.ts` - Export chat as CSV
  - `chat/route.tsx` - Chat UI component
- `lib/` - Shared utilities
  - `env.ts` - Env vars + runtime validation
  - `auth.server.ts` - Better Auth setup
  - `prisma.ts` - Prisma client
  - `userProfile.ts` - Working memory schema/validation
  - `systemPrompt.ts` - System prompt generation
  - `findNearbyProperties.ts` - Geographic search
  - `redis-stop-monitor.ts` - Stream coordination
- `components/` - Reusable UI components
- `prompts/` - AI system prompts

`/prisma` - Database
- `schema.prisma` - Models + migrations

`/test` - Test infrastructure
- `helpers/` - Utilities (converse, launchBrowser, setup)
- `mocks/` - MSW + Anthropic mocks

`/__screenshots__` - Visual regression tests (git-ignored)
`vitest.config.ts` - Test configuration
