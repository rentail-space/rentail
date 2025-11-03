# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands

**Package Management:** Uses pnpm as the package manager

- Dev: `pnpm dev` (starts development server with HMR on port 5173)
- Build: `pnpm build` (prisma generate + react-router build for production)
- Start: `pnpm start` (starts production server with instrumentation)
- Type check: `pnpm typecheck` (includes react-router typegen)
- Test: `pnpm test` (clears Vite cache + lint + db push + typecheck + vitest with verbose reporter)
- Lint: `pnpm lint` (secretlint + Biome linter)
- Format: `pnpm format --write` (Biome formatter)
- Check: `pnpm check` (runs both lint and typecheck)
- Clean: `pnpm clean` (removes Vite cache, .react-router cache, and build directory)
- Monitoring: `pnpm checkly` (runs Checkly monitoring tests with snapshot updates)
- Single test: `pnpx vitest run <test-pattern>` (e.g., `pnpx vitest run chat.test`)

## Architecture

This is a **React Router v7** application serving as a specialty lease marketplace called "rentail.space". The app helps businesses find short-term retail spaces in shopping centers with AI-powered assistance.

**Tech Stack:**
- React Router v7 with SSR (file-based routing)
- React 19 with TypeScript
- Vite 7 for build tooling
- Tailwind CSS 4 for styling with DaisyUI plugin
- Better Auth for authentication with anonymous user support
- Redis for stream coordination and resumable streams
- Vitest + Playwright for E2E testing with visual regression
- Biome for linting and formatting

**AI Integration:**
- Claude 4 via Anthropic AI SDK with streaming responses
- **Streaming Architecture:**
  - Chat API: `app/routes/api.chat.message.tsx` uses `streamText()` from AI SDK
  - Client uses AI SDK's `useChat` hook with `resume: true` for automatic reconnection
  - **Resumable Streams:** Uses `resumable-stream` package with Redis for reliable message delivery
    - Store active stream ID in `Chat.activeStreamId` field
    - Create resumable context in `consumeSseStream` callback with Redis pub/sub
    - Resume endpoint: `app/routes/api.chat.message.$messageId.stream.tsx` resumes interrupted streams
    - Clear `activeStreamId` in `onFinish` callback when stream completes
- System prompts in `app/prompts/`: `systemPrompt.md` (includes working memory instructions), `welcome.md`
- Use Context7 MCP server for library documentation and code examples

**Working Memory & User Profiles:**
- Inspired by Mastra's working memory pattern and MemGPT whitepaper
- User profiles stored as JSON in `User.workingMemory` field
- Profile schema defined in `app/lib/userProfile.ts` with Zod validation
- Profile includes: name, location (city, state, country, lat/lon as numbers, timezone), selling details, preferences, session state
- **Working Memory Pattern:**
  - Agent receives instructions in system prompt (`app/prompts/systemPrompt.md`) to emit `<working_memory>` tags
  - Agent outputs `<working_memory>{JSON}</working_memory>` when learning new user information
  - Tags automatically parsed and saved to database via `updateUserProfile()` in `onFinish` callback
  - Tags masked from user display using `maskWorkingMemoryTags()` function
  - Deep merge strategy: new values override existing profile fields
  - Agent instructed to be proactive - store any potentially useful information

**Database:**
- PostgreSQL with Prisma ORM client and schema generation
- Database models: User, Chat (with activeStreamId for stream resumption), Message, Waitlist, Property, PropertySpace
- Chat.activeStreamId tracks active streaming responses for resumption
- Geographic queries use simple latitude/longitude bounding box calculations
- Session-based chat management with automatic user creation from IP geolocation
- Bot detection: isBot flag set based on user-agent
- Prisma operations: `prisma generate && prisma db push` for schema updates

**Monitoring & Observability:**
- Sentry for error tracking and performance monitoring (`app/lib/instrument.server.ts`)
- BetterStack integration with Logtail for structured logging and Push Gateway for metrics
- Checkly for synthetic monitoring configured in `checkly.config.ts`
- Debug logging: Use `debug` package with namespaces (server, browser, agent, prisma, msw)
  - Enable with: `DEBUG=server,browser pnpm test` or `DEBUG=* pnpm test`

## Code Style

- Use TypeScript for type safety with strict mode enabled
- Prefer interfaces over types, avoid enums (use maps instead)
- Component naming: PascalCase for components, camelCase for utilities
- Directory naming: lowercase with dashes (e.g., `components/auth-wizard`)
- Path alias: `~/*` maps to `./app/*`
- Use descriptive variable names with auxiliary verbs (e.g., `isLoading`, `hasError`)
- Organize imports: React first, then external libs, then local files
- Use functional and declarative programming patterns; avoid classes
- Use the "function" keyword for pure functions
- Biome enforces double quotes, space indentation, line width 80, and import organization
- Favor default exports for components
- Write concise, technical TypeScript code with accurate examples
- Prefer iteration and modularization over code duplication

## Development Practices

**Performance:**
- Minimize `useState` and `useEffect`; prefer context and reducers for state management
- Implement code splitting and lazy loading with React's Suspense and dynamic imports
- Use `useMemo` and `useCallback` appropriately to avoid unnecessary re-renders

**Error Handling:**
- Handle errors at the beginning of functions with early returns
- Avoid unnecessary else statements; use if-return pattern
- Implement global error boundaries for unexpected errors
- Use Zod for runtime validation and error handling

**Git Commits:**
- Use conventional commit format with descriptive emojis:
  - ✨ feat: New features
  - 🐛 fix: Bug fixes
  - 📝 docs: Documentation changes
  - ♻️ refactor: Code restructuring
  - 🎨 style: Code formatting
  - ⚡️ perf: Performance improvements
  - ✅ test: Adding or correcting tests
  - 🔧 chore: Tooling, configuration, maintenance
  - ⬆️ upgrade: Dependency updates
- Write in imperative mood ("Add feature" not "Added feature")
- Keep commits atomic and focused on single concerns

## Tests

- Test files should end with ".test.ts" or ".test.tsx"
- Place test files in `/test` directory (NOT in `/app` directory alongside source code)
- Use Vitest framework with browser provider for visual testing and forks pool for performance
- Tests run from `/**/*.test.{ts,tsx}` with setup in `/test/helpers/setup.ts`
- Visual regression testing with Playwright and custom `toMatchScreenshot` matcher
- Screenshots stored in `__screenshots__` directory
- Requires Node.js 22.0.0 or higher

**Test Organization:**
- Use nested `describe` blocks to organize related tests
- Use `beforeAll`/`afterAll` for test setup/cleanup when sharing state across tests
- Share state across tests within a describe block using `let` variables
- Sequential tests: each test validates one aspect, state flows through the suite

**Testing Infrastructure:**
- Mock server setup with MSW prevents external API calls (`/test/mocks/mswHandlers.ts`)
- Anthropic API mocked with pattern matching (`/test/mocks/mockAnthropic.ts`)
- Database reset in beforeAll or beforeEach: `await prisma.user.deleteMany()`
- Visual regression: `await expect(page).toMatchScreenshot()`
- **Test Helper: `converse(page, message)`**
  - Located in `/test/helpers/converse.ts`
  - Fills textbox, clicks Send, waits for stream to complete
  - Polls `Chat.activeStreamId` until null (stream finished)
  - Use in tests: `await converse(page, "Hello, how are you?")`
  - Replaces manual textbox filling + button clicking + waiting patterns
- **Unit Testing Pattern:** For testing business logic without browser overhead:
  - Create test users directly with `prisma.user.create()` including required fields (geocode, metadata, workingMemory)
  - Call functions directly instead of through HTTP/browser layer
  - Clean up test data in `beforeAll` or after each test
  - Example: `findNearbyProperties.test.ts` tests proximity search by creating users with location data
- Run individual tests: `pnpx vitest run <test-pattern>`
- Debug logging: Use `DEBUG=* pnpm test` to see all debug output

## Environment Variables

Required environment variables (set in `.env.local`):
- `ANTHROPIC_API_KEY`: Claude AI API key for chat functionality
- `DATABASE_URL`: PostgreSQL connection string for production
- `REDIS_URL`: Redis connection string for stream coordination (default: redis://localhost:6379)
- `SESSION_SECRET`: Secret key for session management
- `RESEND_API_KEY`: Resend API key for email functionality
- `LOGTAIL_TOKEN`: BetterStack Logtail token for logging
- `LOGTAIL_ENDPOINT`: BetterStack Logtail endpoint URL
- `PUSHGATEWAY_URL`: BetterStack Push Gateway URL for metrics
- `PUSHGATEWAY_TOKEN`: BetterStack Push Gateway token
- `CHECKLY_ACCOUNT_ID`: Checkly monitoring account ID
- `CHECKLY_API_KEY`: Checkly monitoring API key

Optional environment variables:
- `SENTRY_DSN`: Sentry project DSN for error tracking
- `SENTRY_AUTH_TOKEN`: Sentry auth token for build-time integration
- `NODE_ENV`: Environment (development/production/test)
- `DEBUG`: Enable debug logging (e.g., `DEBUG=server,browser` or `DEBUG=*`)

## Project Structure

- `/app`: Main application directory (React Router v7 convention)
  - `/app/routes.ts`: Route configuration with file-based routing
  - `/app/root.tsx`: Root exports (App, ErrorBoundary, HydrateFallback, loader, headers, links)
  - `/app/routes/`: Individual route components
    - `api.chat.message.tsx`: Send new chat message (creates resumable stream)
    - `api.chat.message.$messageId.stream.tsx`: Resume interrupted stream
    - `api.chat.$chatId.stop.tsx`: Stop active stream manually
    - `api.chat.$chatId.properties.ts`: Get nearby properties for a chat
    - `api.chat.$chatId.export.csv.ts`: Export chat as CSV
    - `chat/route.tsx`: Chat UI with `useChat` hook and `resume: true`
  - `/app/lib/`: Shared utilities
    - `env.ts`: Environment variable configuration with runtime validation
    - `auth.server.ts`: Better Auth configuration with anonymous user support
    - `prisma.ts`: Database client with connection pooling
    - `userProfile.ts`: Working memory schema and update logic
    - `systemPrompt.ts`: System prompt generation with user profile and properties
    - `findNearbyProperties.ts`: Geographic proximity search logic
    - `redis-stop-monitor.ts`: Cross-server stream coordination
  - `/app/components/`: Reusable UI components organized by feature
  - `/app/prompts/`: AI system prompts (systemPrompt.md, welcome.md)
- `/prisma`: Database schema and migrations
  - `schema.prisma`: Database models (includes Chat.activeStreamId field)
- `/test`: Test setup and shared utilities
  - `/helpers/`: Test utilities
    - `converse.ts`: Helper for sending messages and waiting for stream completion
    - `launchBrowser.ts`: Playwright browser/server management
    - `setup.ts`: Global test setup (MSW, Sentry, database cleanup)
  - `/mocks/`: MSW handlers for API mocking
- `/__screenshots__`: Visual regression test screenshots (git-ignored)
- `vitest.config.ts`: Test configuration with forks pool and 30s timeouts
