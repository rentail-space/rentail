# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands

- Dev: `npm run dev` (starts development server with HMR)
- Build: `npm run build` (prisma generate + react-router build for production)
- Start: `npm run start` (starts production server)
- Type check: `npm run typecheck` (includes react-router typegen)
- Test: `npm run test` (lint + db push + prisma generate + typecheck + vitest with verbose reporter)
- Lint: `npm run lint` (secretlint + Biome linter)
- Format: `npm run format --write` (Biome formatter)
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
- Vitest for unit testing with jsdom environment
- Biome for linting and formatting
- Playwright for E2E testing with visual regression

**AI Integration:**
- Claude 4 via Anthropic AI SDK with streaming responses
- Chat API endpoint: `app/routes/api.chat.tsx` (streaming chat interface)
- AI library configuration: `app/lib/env.ts` (environment-based settings)
- System prompts in `app/lib/`: `general.md`, `prelude.md`, `spaces.md`, `welcome.md`
- Use Context7 MCP server for library documentation and code examples

**Database:**
- PostgreSQL with Prisma ORM client and schema generation
- Database schema: `prisma/schema.prisma` with User, Conversation, and Message models
- Prisma features: TypedSQL, Query Compiler, Driver Adapters
- Test environment uses local PostgreSQL instance
- Database operations: `prisma generate && prisma db push` for schema updates

**Monitoring & Observability:**
- Sentry for error tracking and performance monitoring (`app/lib/instrument.server.ts`)
- BetterStack integration with Logtail for structured logging and Push Gateway for metrics
- Comprehensive metrics collection: memory, CPU, heap, event loop lag, HTTP requests
- Process metrics collected every 5 seconds in production
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

## Tests

- Test files should end with ".test.ts" or ".test.tsx"
- Place test files in `/test` directory (NOT in `/app` directory alongside source code)
- Use Vitest framework with browser provider for visual testing and forks pool for performance
- Tests run from `/**/*.test.{ts,tsx}` with setup in `/test/setup.ts`
- Visual regression testing with Playwright and custom `toMatchScreenshot` matcher
- Screenshots stored in `__screenshots__` directory
- Checkly monitoring tests in `__checks__` directory
- Requires Node.js 22.0.0 or higher (enforced in package.json)
- Tests use setup file in `/test/helpers/setup.ts` with MSW mock server configuration (`/test/mocks/handlers.ts`)
- Visual regression tests use custom `toMatchScreenshot` matcher with Playwright browser provider
- Test configuration in `vitest.config.ts` with 30-second timeout for E2E tests
- Mock server setup prevents external API calls during testing (`/test/mocks/handlers.ts`)
- Write unit tests with Vitest for all utilities and components
- Consider snapshot testing for UI consistency
- Run individual tests: `npm run test -- <test-pattern>`
- E2E tests use Checkly for production monitoring (`__checks__/` directory)

## Environment Variables

Required environment variables (set in `.env.local`):
- `ANTHROPIC_API_KEY`: Claude AI API key for chat functionality
- `DATABASE_URL`: PostgreSQL connection string for production
- `SESSION_SECRET`: Secret key for session management
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
  - `/app/lib/`: Shared utilities (AI model, logging, system prompt)
  - `/app/data/`: External data files (user data, blog posts in markdown)
  - `/app/entry.server.tsx`: Server-side rendering entry point with request logging
  - `/app/app.css`: Global Tailwind CSS imports
  - `/app/components/`: Reusable UI components organized by feature
- `/prisma`: Database schema and migrations
  - `schema.prisma`: Database models and configuration
  - `generated/`: Prisma client generation output
- `/build`: Production build output (client/server bundles)
- `/public`: Static assets (favicon, logos)
- `/test`: Test setup and shared utilities
- `/__screenshots__`: Visual regression test screenshots
- `/__checks__`: Checkly monitoring test files
- `.react-router`: Cache directory (can be cleaned with npm run clean)
- `react-router.config.ts`: React Router v7 configuration with prerendering
- `checkly.config.ts`: Synthetic monitoring configuration
- `biome.json`: Linting and formatting rules with import organization and strict style rules
- `tailwind.config.ts`: Tailwind CSS 4 configuration with DaisyUI plugin
- `vitest.config.ts`: Test configuration with browser provider and custom matchers
- `mcp.json`: MCP server configuration for Claude Code integration

# important-instruction-reminders  
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.
