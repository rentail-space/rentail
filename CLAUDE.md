# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands

**Package Management:** Uses pnpm as the package manager (configured in .ncurc.json for dependency updates)

- Dev: `npm run dev` (starts development server with HMR)
- Build: `npm run build` (prisma generate + react-router build for production)
- Start: `npm run start` (starts production server)
- Type check: `npm run typecheck` (includes react-router typegen)
- Test: `npm run test` (lint + db push + prisma generate + typecheck + vitest with verbose reporter)
- Lint: `npm run lint` (secretlint + Biome linter)
- Format: `pnpm run format --write` (Biome formatter)
- Check: `npm run check` (runs both lint and typecheck)
- Clean: `npm run clean` (removes .react-router cache and build directory)
- Monitoring: `npm run checkly` (runs Checkly monitoring tests)

## Architecture

This is a **React Router v7** application serving as a specialty lease marketplace called "rentail.space". The app helps businesses find short-term retail spaces in shopping centers with server-side rendering enabled by default.

**Tech Stack:**
- React Router v7 with SSR (migrated from Vite + React Router DOM)
- React 19 with TypeScript
- Vite 7 for build tooling (integrated with React Router v7)
- Tailwind CSS 4 for styling with DaisyUI plugin
- Better Auth for authentication with anonymous user support and account linking
- Redis for stream coordination and cross-server communication
- Session management with automatic user creation and IP-based geolocation
- Vitest for unit testing with jsdom environment
- Biome for linting and formatting
- Playwright for E2E testing with visual regression

**Authentication Architecture:**
- Better Auth library provides anonymous sessions and email/password authentication
- Anonymous users automatically created on first visit with IP-based geolocation
- Account linking: when anonymous user signs up, their chat history and working memory are migrated to the new account
- User model includes custom fields: `geocode`, `ip`, `metadata`, `workingMemory`
- Email verification with Resend, auto sign-in after verification
- Session cookies with 365-day expiration, 5-minute cache for performance
- Migration logic in `app/lib/auth.server.ts` handles copying data from anonymous to authenticated users

**AI Integration:**
- Claude 4 via Anthropic AI SDK with streaming responses and thinking tokens
- Mastra framework for agent orchestration and memory management (PostgreSQL-backed)
- Chat API endpoint: `app/routes/api.chat.tsx` (streaming chat interface with Redis coordination)
- Redis-based stream management: `app/lib/redis-stop-monitor.ts` (cross-server stop signals)
- Stop endpoints: `app/routes/api.chat.$id.stop.tsx` for manual chat termination
- AI library configuration: `app/lib/env.ts` (environment-based settings)
- System prompts in `app/lib/`: `general.md`, `prelude.md`, `spaces.md`, `welcome.md`
- Geolocation filtering: Built-in Haversine distance calculation for shopping centers
- Use Context7 MCP server for library documentation and code examples

**Working Memory & User Profiles:**
- Mastra memory stores user profiles as JSON in User.workingMemory field
- Profile includes: name, location (city, state, country, lat/lon, timezone), preferences
- Working memory updated automatically by AI during conversations
- Location initialized from IP geolocation on first visit (via ipgeolocation.io with Redis cache)
- Custom Mastra storage adapter (`PrismaStorage`) stores threads/messages in existing Chat/Message tables
- Profile persists across sessions and survives anonymous→authenticated user migration
- Access via `getWorkingMemory(chat)` and `updateWorkingMemory(chat, fn)`

**Email Integration:**
- React Email templates in `/app/emails/` directory using `@react-email/components`
- Resend API for email delivery (configured via `RESEND_API_KEY`)
- Unified `sendEmail()` function in `app/lib/resend.ts` for all email sending
- Email components accept `subject` prop for consistent rendering
- Test helper `renderLastEmailSent()` for visual regression testing of emails
- Transactional emails: waitlist confirmations, welcome emails, email verification

**Database:**
- PostgreSQL with Prisma ORM client and schema generation
- Database models: User (with location/IP tracking), Chat (with stream management), Message (with AI SDK integration), Waitlist
- Active stream tracking: Chat.activeStreamId for coordinating streaming responses across server instances
- Message model includes reasoning field for AI thinking tokens and abort status
- Session-based chat management with automatic user creation from IP geolocation
- Prisma features: TypedSQL, Query Compiler, Driver Adapters
- Test environment uses local PostgreSQL instance
- Database operations: `prisma generate && prisma db push` for schema updates

**Monitoring & Observability:**
- Sentry for error tracking and performance monitoring (`app/lib/instrument.server.ts`)
- BetterStack integration with Logtail for structured logging and Push Gateway for metrics
- Comprehensive metrics collection: memory, CPU, heap, event loop lag, HTTP requests
- Process metrics collected every 5 minutes in production (configurable via METRICS_COLLECTION_INTERVAL_MS)
- HTTP request logging with method, URL, status code, and duration (`app/lib/logger.server.ts`)
- Checkly for synthetic monitoring (every 30 minutes) configured in `checkly.config.ts`

**File-Based Routing:**
Routes are configured in `/app/routes.ts` using React Router v7's declarative routing with `flatRoutes`:
- `/` - Home route (`routes/home/route.tsx`) with marketing content and hero sections
- `/chat` - Interactive chat interface (`routes/chat/route.tsx`) for space discovery with AI
- `/blog/$post` - Dynamic blog posts (`routes/blog.$post.tsx`) with markdown content
- `/blog/$post[.jpg]` - Blog post image serving (`routes/blog.$post[.jpg].ts`)
- `/api/chat` - Streaming AI chat endpoint (`routes/api.chat.tsx`) with Claude integration
- `/robots.txt` and `/sitemap.xml` - SEO utilities (`routes/robots[.]txt.ts`, `routes/sitemap[.]xml.ts`)
- Root layout in `/app/root.tsx` with HTML shell, Sentry integration, and global components
- Route configuration ignores test files and home directory from flat routes

**SSR Configuration:**
- Server-side rendering enabled by default via `react-router.config.ts`
- Prerendering disabled (set to false) for dynamic content
- Builds separate client/server bundles to `/build` directory
- Production server runs with `@react-router/serve`
- Configurable SSR request timeout (default: 5000ms)
- Development server runs on port 3000

**Layout Control:**
- Root layout in `app/root.tsx` provides Header and Footer by default
- Routes can hide layout by exporting `handle = { hideLayout: true }`
- Root uses `useMatches()` to check route handles and conditionally render layout
- Currently used by: `/auth`, `/chat`, `/` (home page has custom layout)
- This pattern allows full-page experiences without navigation chrome

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
- Structure files: exported component, subcomponents, helpers, static content, types
- Biome enforces double quotes, space indentation, line width 80, and import organization
- Favor default exports for components
- File structure conventions: `/app/components/<name>/index.tsx` for reusable components

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

**Security:**
- Sanitize user inputs to prevent XSS attacks
- Use HTTPS and proper authentication for API communication
- Never commit secrets or API keys to the repository

**AI Integration:**
- Use Context7 MCP server for library documentation and code examples
- AI configuration managed via `app/lib/env.ts` with env-var validation
- Multiple system prompt files for different contexts (general, prelude, spaces, welcome)
- Chat interface uses Server-Sent Events for streaming responses

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
  - 🔥 remove: Removing code or files
  - 🚑 hotfix: Critical fixes
  - 🔒 security: Security improvements
- Write in imperative mood ("Add feature" not "Added feature")
- Include scope when applicable: `type(scope): description`
- Keep commits atomic and focused on single concerns

## Tests

- Test files should end with ".test.ts" or ".test.tsx"
- Place test files in `/test` directory (NOT in `/app` directory alongside source code)
- Use Vitest framework with browser provider for visual testing and forks pool for performance
- Tests run from `/**/*.test.{ts,tsx}` with setup in `/test/helpers/setup.ts`
- Visual regression testing with Playwright and custom `toMatchScreenshot` matcher
- Screenshots stored in `__screenshots__` directory
- Checkly monitoring tests in `__checks__` directory
- Requires Node.js 22.0.0 or higher (enforced in package.json)

**Test Organization:**
- Use nested `describe` blocks to organize related tests
- Use `beforeAll`/`afterAll` for test setup/cleanup (not `beforeEach`/`afterEach`)
- Share state across tests within a describe block using `let` variables
- Sequential tests: each test validates one aspect, state flows through the suite
- Example pattern from `test/auth.test.ts`:
  ```typescript
  describe("user visits chat page", () => {
    beforeAll(async () => {
      await page.goto(`${URL}/chat`);
    });
    it("creates anonymous user", async () => { /* ... */ });

    describe("user updates location", () => {
      let workingMemory: UserProfile;
      beforeAll(async () => {
        // Perform action
        workingMemory = await getWorkingMemory();
      });
      it("should have user's new city", async () => {
        expect(workingMemory.location?.city).toEqual("Boston");
      });
    });
  });
  ```

**Testing Infrastructure:**
- Mock server setup with MSW prevents external API calls (`/test/mocks/handlers.ts`)
- Sentry initialized in test mode with console logging only
- Database reset in beforeAll: `await prisma.user.deleteMany()`
- Visual regression: `await expect(page).toMatchScreenshot()`
- Email testing: use `sendEmail()` then `renderLastEmailSent(page)` for visual testing
- Run individual tests: `npm run test -- <test-pattern>` or `pnpx vitest run <test-pattern>`
- E2E tests use Checkly for production monitoring (`__checks__/` directory)

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
- `IPGEOLOCATION_API_KEY`: API key for IP geolocation services
- `NODE_ENV`: Environment (development/production)
- `SSR_REQUEST_TIMEOUT_MS`: SSR timeout in milliseconds (default: 5000)
- `METRICS_COLLECTION_INTERVAL_MS`: Metrics collection interval (default: 300000ms / 5 minutes)
- `SESSION_MAX_AGE_SECONDS`: Session duration in seconds (default: 30 days)

## Project Structure

- `/app`: Main application directory (React Router v7 convention)
  - `/app/routes.ts`: Route configuration with file-based routing
  - `/app/root.tsx`: Root layout with HTML shell and Sentry
  - `/app/routes/`: Individual route components
  - `/app/lib/`: Shared utilities
    - `env.ts`: Environment variable configuration with runtime validation
    - `auth.server.ts`: Better Auth configuration with anonymous user support
    - `auth.client.ts`: Client-side auth hooks and utilities
    - `prisma.ts`: Database client with connection pooling
    - `resend.ts`: Email sending utilities with test helpers
    - `workingMemory.ts`: Mastra memory integration for user profiles
    - `logger.server.ts`: HTTP request logging
    - `instrument.server.ts`: Metrics collection and monitoring
    - `PrismaStorage .ts`: Mastra storage adapter for PostgreSQL
  - `/app/data/`: External data files (blog posts in markdown with front-matter)
  - `/app/entry.server.tsx`: Server-side rendering entry point with request logging
  - `/app/app.css`: Global Tailwind CSS imports
  - `/app/components/`: Reusable UI components organized by feature
    - `/layout/`: Header, Footer components
  - `/app/emails/`: React Email templates (all accept `subject` prop)
- `/prisma`: Database schema and migrations
  - `schema.prisma`: Database models and configuration
  - `generated/`: Prisma client generation output (imported as `prisma` in code)
- `/build`: Production build output (client/server bundles)
- `/public`: Static assets (favicon, logos, OG images)
- `/test`: Test setup and shared utilities
  - `/helpers/`: Test utilities (launchBrowser, renderEmail, setup)
  - `/mocks/`: MSW handlers for API mocking
- `/__screenshots__`: Visual regression test screenshots (git-ignored)
- `/__checks__`: Checkly monitoring test files
- `.react-router`: Cache directory (can be cleaned with npm run clean)
- `react-router.config.ts`: React Router v7 configuration with prerendering
- `checkly.config.ts`: Synthetic monitoring configuration
- `biome.json`: Linting and formatting rules with import organization and strict style rules
- `tailwind.config.ts`: Tailwind CSS 4 configuration with DaisyUI plugin
- `vitest.config.ts`: Test configuration with browser provider and custom matchers
- `mcp.json`: MCP server configuration for Claude Code integration
- `tsconfig.json`: TypeScript configuration with path aliases (`~/*` → `./app/*`)

# important-instruction-reminders  
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.
