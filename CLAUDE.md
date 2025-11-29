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
- **Auth**: React Router session cookies + bcrypt password hashing
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

**Working Memory:**
- Stores persistent user context as JSON in `User.workingMemory` field
- Schema validated via Zod in `app/lib/workingMemory.ts`
- Fields: merchant (business info), selling (product/pricing/audience), location (city/state/country/lat/lon/timezone), projections (goals/timeline)
- Example working memory object:
  ```json
  {
    "merchant": {
      "name": "Sarah Chen",
      "businessName": "Chen's Artisan Coffee"
    },
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
    "projections": {
      "timeline": "Q2 2024 expansion"
    }
  }
  ```

**Emission & Update Pattern:**
- System prompts instruct Claude to emit `<working_memory>{JSON}</working_memory>` tags when extracting user information
- Tags automatically parsed and merged via `updateWorkingMemory()` in `onFinish` callback
- `maskWorkingMemoryTags()` removes tags from user-visible output (users never see the XML markers)
- Deep merge strategy: new values override existing fields (partial updates supported)
- Async geocoding: When location updates, reverse geocoding via OpenStreetMap API populates city/state/country

**Prompt System:**
- Prompts use placeholder syntax: `$[placeholder]` (e.g., `$[date]`, `$[workingMemory]`, `$[nearbyCenters]`)
- `preparePrompt()` in `app/lib/preparePrompt.ts` replaces placeholders with actual values
- Chat prompt: `app/prompts/chatPrompt.md` - Main conversational agent instructions
- Daily alert prompt: `app/prompts/dailyAlertPrompt.md` - Automated merchant notifications
- General directives: `app/prompts/generalDirectives.md` - Shared behavioral guidelines (inserted via `$[generalDirectives]`)
- Placeholder validation: throws error if any `$[tag]` remains unexpanded

### Database & Observability

**Database:**
- PostgreSQL with Prisma ORM + PgAdapter for connection pooling
- Models: User, Chat, Messages, Waitlist, Property, PropertySpace, Session, Verification
- Session-based chat with automatic user creation from IP geolocation
- Bot detection via `isBot` flag (user-agent based)
- Mobile detection via `isMobile` flag (device detection)
- Geographic queries: simple latitude/longitude bounding box calculations (see `app/lib/findNearbyProperties.ts`)
- Schema updates: `prisma generate && prisma db push`

**Key Database Tables:**
- `User`: id, name, email, emailVerified, isAnonymous, isBot, isMobile, geocode (JSON), workingMemory (Text), metadata, cityStateCountry, note, image, ip, userAgent, referrer, utm (JSON), viewport (JSON), passwordHash, lastAlertAt, createdAt, updatedAt
- `Chat`: id, userId (FK), title, metadata (JSON), activeStreamId, createdAt, updatedAt
- `Messages`: id, chatId (FK), role (assistant|user), content (JSON), type, createdAt
- `Property`: id, name, address, city, state, country, latitude, longitude, website, phone, imageURLs, squareFootage, numberOfStores, demographics, description, logoURL, createdAt, updatedAt
- `PropertySpace`: id, propertyId (FK), number, type (Cart|Inline|Storage|Other), size, floor, available, imageURLs, updatedAt
- `Session`: id, userId (FK), token (unique), expiresAt, ipAddress, userAgent, createdAt, updatedAt
- `Verification`: id, identifier, value, expiresAt, createdAt, updatedAt
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

**Error Handling:**
- Handle errors at the beginning of functions with early returns
- Avoid deeply nested if statements and unnecessary else clauses
- Implement error boundaries to catch unexpected errors
- Use Zod for runtime validation and type safety

**Security:**
- Sanitize user inputs to prevent XSS attacks
- Never use `dangerouslySetInnerHTML` (use markdown renderers with sanitization)
- Ensure secure communication with APIs using HTTPS
- Use bcrypt for password hashing (already configured)

**Formatting (Biome-enforced):**
- Double quotes, 2-space indent, 80 character line width
- Import organization via Biome assist
- `pnpm format --write` before committing

**Biome-Enforced Rules:**
- Avoid barrel files (re-exporting multiple modules from index files)
- Prefer `for...of` or `map()` over `forEach()` (forEach triggers warning)
- Console usage limited to: `console.assert`, `console.error`, `console.info`, `console.warn`
- Minimize use of `any` type (triggers warning)
- Use self-closing elements for components without children
- Use `as const` assertions for literal types

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
- **Persistent state:** React Router session cookies + localStorage (implicitly via useChat)
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
- Config: `vitest.config.ts` (15s test timeout locally / 30s on CI, 30s hook timeout, 3s teardown timeout)
- Setup: `/test/helpers/testSuiteSetup.ts` (test suite setup) + `/test/helpers/globalSetup.ts`
- Node.js: 22.0.0 or higher required
- **Test isolation**: `isolate: true` is required for test safety (prevents state leakage)

**Test Organization:**
- Use nested `describe` blocks for logical grouping
- `beforeAll`/`afterAll` for setup/cleanup when sharing state across tests
- Share state via `let` variables within describe block (tests run sequentially)
- Each test validates one aspect; state flows through the suite
- Always clean up database state in `beforeAll` or `beforeEach` to prevent test pollution

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
1. Edit schema in `app/lib/workingMemory.ts` - Add new Zod field definitions
2. Update `workingMemoryExample` export with new example structure
3. System prompts (`app/prompts/chatPrompt.md`, `dailyAlertPrompt.md`) may need updating to instruct Claude to populate new fields
4. Migration: Update `updateWorkingMemory()` to handle old → new schema upgrades if needed
5. Test: Create test user and verify working memory extraction works with mock Anthropic responses

**Adding a New Chat Feature (e.g., new data access):**
1. Update system prompt (`app/prompts/chatPrompt.md`) with new instructions
2. If accessing new data: Create helper function in `app/lib/` (e.g., `findNearbyCenters.ts` pattern)
3. Add placeholder to prompt template (e.g., `$[myNewData]`)
4. Update `preparePrompt()` in `app/lib/preparePrompt.ts` to replace placeholder with actual data
5. Test with `converse()` helper from `~/test/helpers/converse`

**Adding a New Email Template:**
1. Create component file in `app/emails/` (e.g., `MyEmail.tsx`)
2. Export async `sendMyEmail()` function that calls `sendEmail()` from `./sendEmails`
3. Create internal component function (not exported) for the email template
4. Use `EmailLayout` wrapper and import styles from `~/emails/styles`
5. Call the send function from routes/actions where needed
6. Test email rendering with `renderEmail()` helper from `~/test/helpers/renderEmail`

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

**React Router v7 on Vercel**
- Deployment configured with `@vercel/react-router` preset in `react-router.config.ts`
- SSR enabled with `ssr: true`
- Sentry integration via `sentryOnBuildEnd` hook (when `SENTRY_AUTH_TOKEN` is set)
- No prerendering configured (`prerender: async () => []`)
- Current config uses Vercel preset for optimal serverless deployment

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
  - API Routes:
    - `api.chat.$chatId.message.ts` - Create chat message (streaming)
    - `api.chat.$chatId.message.$messageId.stream.ts` - Resume interrupted stream
    - `api.chat.$chatId.stop.ts` - Stop active stream
    - `api.chat.$chatId.centers.ts` - Fetch nearby shopping centers
    - `api.waitlist.ts` - Waitlist signup
  - Page Routes:
    - `chat/route.tsx` - Chat UI component
    - `home/route.tsx` - Landing page
    - `about/route.tsx` - About page
    - `pricing/route.tsx` - Pricing page
    - `faq/route.tsx` - FAQ page
    - `blog._index.tsx` - Blog listing
    - `blog.$slug.tsx` - Individual blog post
    - `center.$id/route.tsx` - Property center detail page
    - `profile/route.tsx` - User profile management
    - `auth.tsx` - Authentication (sign-in/sign-up)
  - Admin Routes (protected):
    - `admin.tsx` - Admin dashboard layout
    - `admin.users.tsx` - User management
    - `admin.user.$userId.tsx` - Individual user detail
    - `admin.centers.tsx` - Property center management
  - Utility Routes:
    - `cron.daily.ts` - Daily scheduled tasks (alerts, notifications)
    - `email.verify.$verificationId.ts` - Email verification
    - `auth.sign-out.ts` - Sign out
    - `robots[.]txt.ts` - Robots.txt generation
    - `sitemap[.]xml.ts` - Sitemap generation
    - `blog.feed.ts` - RSS feed
- `lib/` - Shared utilities
  - `env.ts` - Env vars + runtime validation
  - `prisma.ts` - Prisma client
  - `workingMemory.ts` - Working memory schema/validation/updates
  - `preparePrompt.ts` - Prompt composition with placeholder replacement
  - `findNearbyCenters.ts` - Geographic search for shopping centers
  - `redis-stop-monitor.ts` - Stream coordination
  - `blogPosts.server.ts` - Blog post management
  - `deviceDetection.server.ts` - Device/bot detection
  - `model.ts` - AI model configuration
  - `middleware/` - Request middleware (logging, UTM tracking)
- `components/` - Reusable UI components
- `prompts/` - AI prompt templates
  - `chatPrompt.md` - Main conversational agent prompt
  - `dailyAlertPrompt.md` - Automated daily alert prompt
  - `generalDirectives.md` - Shared behavioral directives
- `emails/` - Email templates with co-located send functions
  - `sendEmails.tsx` - Core `sendEmail()` function and Resend integration
  - `EmailLayout.tsx` - Shared email wrapper component
  - `WelcomeEmail.tsx`, `WaitlistEmail.tsx`, etc. - Individual email templates

`/prisma` - Database
- `schema.prisma` - Models + migrations

`/test` - Test infrastructure
- `helpers/` - Utilities (converse, launchBrowser, setup)
- `mocks/` - MSW + Anthropic mocks

`/__screenshots__` - Visual regression tests (git-ignored)
`vitest.config.ts` - Test configuration
