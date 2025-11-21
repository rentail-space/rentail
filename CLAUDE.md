# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands Reference

**Package Management:** Uses pnpm (v10.21.0+)

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

**Resumable Streams Pattern:**
The core innovation that prevents message duplication on network interruptions:
- Stream ID generation: Each new response gets a unique ID stored in `Chat.activeStreamId`
- Storage: Active stream ID persisted in database (identifies which message is currently streaming)
- Resumption: When network reconnects, client requests `/api/chat/message.$messageId.stream.tsx` with the message ID
- Redis coordination: `resumable-stream` context created via Redis pub/sub to track already-sent chunks
- Completion: `activeStreamId` cleared in `onFinish` callback when stream completes (signals ready for next message)
- Safety: If a new message request arrives while `activeStreamId` is set, the old stream is aborted (prevents accidental dual streams)

**Working Memory (User Profiles):**
- Stores persistent user context as JSON in `User.workingMemory` field
- Profile schema validated via Zod in `app/lib/userProfile.ts`
- Profile fields: name, location (city, state, country, lat/lon as numbers, timezone), selling details, preferences
- Example working memory object:
  ```json
  {
    "name": "Sarah Chen",
    "location": {
      "city": "Los Angeles",
      "state": "CA",
      "country": "USA",
      "latitude": 34.0522,
      "longitude": -118.2437,
      "timeZone": "America/Los_Angeles"
    },
    "selling": {
      "productType": "Artisan Coffee",
      "pricePoint": "Premium",
      "targetAudience": "Young professionals"
    },
    "preferences": {
      "communicationStyle": "Formal",
      "keyDeadlines": ["Q2 2024 expansion"]
    }
  }
  ```

**Emission & Update Pattern:**
- System prompt (in `app/prompts/systemPrompt.md`) explicitly instructs Claude to emit `<working_memory>{JSON}</working_memory>` tags when extracting user information
- Tags automatically parsed and merged into profile via `updateUserProfile()` in `onFinish` callback
- `maskWorkingMemoryTags()` removes tags from user-visible output (users never see the XML markers)
- Deep merge strategy: new values override existing profile fields (partial updates supported)
- Async geocoding: When location updates, reverse geocoding via OpenStreetMap API populates city/state/country
- System prompts: `app/prompts/systemPrompt.md` (main agent instructions with working memory tags), `welcome.md` (first-time user greeting)

### Database & Observability

**Database:**
- PostgreSQL with Prisma ORM + PgAdapter for connection pooling
- Models: User, Chat, Message, Waitlist, Property, PropertySpace, Session, Account, Verification
- Session-based chat with automatic user creation from IP geolocation
- Bot detection via `isBot` flag (user-agent based)
- Geographic queries: simple latitude/longitude bounding box calculations (see `app/lib/findNearbyProperties.ts`)
- Schema updates: `prisma generate && prisma db push`

**Key Database Tables:**
- `User`: id, name, email, emailVerified, isAnonymous, isBot, geocode (JSON), workingMemory (Text), metadata, createdAt
- `Chat`: id, userId (FK), title, metadata (JSON), activeStreamId, createdAt, updatedAt
- `Message`: id, chatId (FK), role (assistant|user), content (JSON), type, createdAt
- `Property`: id, name, address, city, state, country, latitude, longitude, website, phone, imageURLs, squareFootage
- `PropertySpace`: id, propertyId (FK), number, type (Cart|Inline|Storage|Other), size, floor, available, imageURLs
- `Session`: id, userId (FK), token (unique), expiresAt, ipAddress, userAgent
- `Waitlist`: email (PK), createdAt

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

## Key Architectural Patterns

**Location Retrieval (Priority Chain):**
The app determines user location in this order:
1. `User.workingMemory.location` - Most recent location from conversation (highest priority)
2. Vercel IP geolocation headers (`x-vercel-ip-latitude`, `x-vercel-ip-longitude`) - Automatic via platform
3. Fallback: LA Midcity (`34.04592, -118.34574`) - Used if no other source available
- Implemented in `app/lib/findNearbyCenters.ts`

**Geographic Search (Non-PostGIS):**
- Uses simple latitude/longitude bounding box calculations (no PostGIS required)
- Formula: `lat ± (miles / 69.172)` and `lon ± (miles / 57.393)`
- Default radius: 30 miles for search, 20 miles for display
- Centers returned sorted by distance for relevance

**Geocoding (Location Name Resolution):**
- When user provides location in chat (e.g., "I'm in Denver"), Claude extracts it via working memory tags
- Async reverse geocoding via OpenStreetMap Nominatim API enriches coordinates with city/state/country
- Populates `workingMemory.location.{city, state, country}` for future use without geocoding API
- Implemented in `app/lib/userProfile.ts` via `geocodeLocation()`

**State Management:**
- **Server-side (SSR):** React Router loaders/actions handle data fetching; Prisma queries return database state
- **Client-side:**
  - `useChat` hook from AI SDK manages message array, streaming status, and auto-resume on reconnect
  - URL parameters via `nuqs` for queryable state (search queries)
  - Component-level `useState` minimized; prefers loader data
- **Persistent state:** Better Auth session cookies (5min cache, 365 day expiry) + localStorage (implicitly via useChat)
- **No Redux/Zustand:** Codebase relies on React Router's data layer for state management

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

**Navigation & Page Loading:**
- `goto(path, headers?, { waitUntil?, timeout? })` - Navigate with flexible options
  - `waitUntil`: "load" | "domcontentloaded" | "networkidle" (default: "networkidle")
  - `timeout`: milliseconds (default: 25_000)
  - Use `waitUntil: "domcontentloaded"` for pages with background streaming (e.g., chat)
  - Example: `page = await goto("/chat?q=test", undefined, { waitUntil: "domcontentloaded" })`

**HTML Snapshot Testing:**
- `await expect(page).toMatchInnerHTML()` - Test HTML structure against baseline snapshots
- Uses regex-based Node.js formatter in `/test/helpers/formatHTML.ts` (no JSDOM required)
- Formats HTML into indented tree structure with 2-space indentation
- Compares against baseline HTML files; creates `.new.html` on mismatch
- Automatically removes `<script>` tags before comparison

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

## Common Development Tasks

**Adding a New API Route:**
1. Create file: `app/routes/api.newfeature.ts` (or `.tsx` for JSX)
2. Export `action()` or `loader()` from React Router
3. For streaming responses, use `streamText()` from `@ai-sdk/anthropic`
4. Return Response object: `new Response(stream, { headers: { "Content-Type": "text/event-stream" } })`
5. Test with E2E test in `/test/*.test.tsx`

**Modifying Working Memory Schema:**
1. Edit schema in `app/lib/userProfile.ts` - Add new Zod field definitions
2. System prompt (`app/prompts/systemPrompt.md`) will need updating to instruct Claude to populate new fields
3. Migration: Add `app/lib/updateUserProfile.ts` to handle old → new schema upgrades if needed
4. Test: Create test user and verify working memory extraction works with mock Anthropic responses

**Adding a New Chat Feature (e.g., new data access):**
1. Update system prompt (`app/prompts/systemPrompt.md`) with new instructions
2. If accessing new data: Create helper function in `app/lib/` (e.g., `findNearbyCenters.ts` pattern)
3. Pass data to Claude via system prompt injection (inject nearby data in XML format)
4. Test with `converse()` helper from `~/test/helpers/converse`

**Debugging Chat Issues:**
- Enable debug logging: `DEBUG=agent,server pnpm dev` (see `app/lib/logger.server.ts` for namespaces)
- Inspect active stream: Check `Chat.activeStreamId` in database (should be null when idle)
- Check working memory updates: Query `User.workingMemory` JSON directly
- Vitest browser debugging: `pnpx vitest --ui` opens browser inspector

**Adding a New Database Model:**
1. Update `prisma/schema.prisma` with new model definition
2. Run: `prisma generate && prisma db push` (auto-migrates)
3. Update types in TypeScript files importing from Prisma client
4. Run `pnpm typecheck` to catch type errors

**Testing AI Responses:**
- Use mock Anthropic: `test/mocks/mockAnthropic.ts` with pattern matching
- Mock responds to patterns like "tell me your name" with pre-set responses
- Update mocks before test if new Claude behavior is needed
- Example: `{"pattern": "test", "response": "This is a test response"}`

## Known Issues & Troubleshooting

**Vitest RPC Error: "rpc is closed, cannot call onCancel"**
- Occurs in watch mode, typically with coverage enabled or during test reruns
- Root causes: Missing dependencies, coverage temp directory race condition, or module resolution issues
- **Workarounds:**
  - Run `pnpm install` to ensure all transitive dependencies are installed
  - Disable coverage during development: use `pnpm test -- --run` instead of watch mode
  - Clear temp files manually if needed: `rm -rf /tmp/vitest-coverage-*.tmp`
  - Update Vitest/VSCode to latest compatible versions

**Test Navigation Timeouts**
- If `goto()` times out waiting for `"networkidle"`, change to `"domcontentloaded"`
- Common on pages with background requests (chat, streaming endpoints)
- Example: `await goto("/chat", undefined, { waitUntil: "domcontentloaded" })`

## Environment Variables

**Required (.env.local):**
- `ANTHROPIC_API_KEY` - Claude AI API key
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis for stream coordination (default: redis://localhost:6379)
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
