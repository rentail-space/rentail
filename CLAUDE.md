# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands

- Dev: `npm run dev` (starts development server with HMR)
- Build: `npm run build` (react-router build for production)
- Start: `npm run start` (starts production server)
- Type check: `npm run typecheck` (includes react-router typegen)
- Test: `npm run test` (lint + typecheck + vitest with verbose reporter)
- Lint: `npm run lint` (Biome linter)
- Format: `npm run format --write` (Biome formatter)
- Check: `npm run check` (runs both lint and typecheck)
- Clean: `npm run clean` (removes .react-router cache)
- Monitoring: `npm run checkly` (runs Checkly monitoring tests)

## Architecture

This is a **React Router v7** application serving as a specialty lease marketplace called "rentail.space". The app helps businesses find short-term retail spaces in shopping centers with server-side rendering enabled by default.

**Tech Stack:**
- React Router v7 with SSR (migrated from Vite + React Router DOM)
- React 19 with TypeScript
- Vite 6 for build tooling (integrated with React Router v7)
- Tailwind CSS 4 for styling
- Vitest for unit testing with jsdom environment
- Biome for linting and formatting
- Playwright for E2E testing with visual regression

**AI Integration:**
- Claude 4 Opus via Anthropic AI SDK (`app/lib/llm.ts`)
- Streaming chat API endpoint (`app/routes/api.chat.tsx`)
- System prompt for rental space assistant (`app/lib/system.md`)

**Monitoring & Observability:**
- Sentry for error tracking and performance monitoring
- BetterStack integration with Logtail for structured logging and Push Gateway for metrics
- Comprehensive metrics collection: memory, CPU, heap, event loop lag, HTTP requests
- Process metrics collected every 5 seconds in production
- HTTP request logging with method, URL, status code, and duration
- Checkly for synthetic monitoring (every 30 minutes)

**File-Based Routing:**
Routes are configured in `/app/routes.ts` using React Router v7's declarative routing:
- `/` - Home route (`routes/home/route.tsx`) with marketing content
- `/chat` - Chat interface for space discovery (`routes/chat/route.tsx`)
- `/blog/$` - Dynamic blog post routes (`routes/blog.$.tsx`)
- `/api/chat` - Streaming AI chat endpoint (`routes/api.chat.tsx`)
- Root layout in `/app/root.tsx` with HTML shell and global components

**SSR Configuration:**
- Server-side rendering enabled by default via `react-router.config.ts`
- Prerendering enabled for better performance
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
- Reference the system prompt in `app/lib/system.md` for AI assistant behavior

## Tests

- Test files should end with ".test.ts" or ".test.tsx"
- Place test files in `/test` directory (NOT in `/app` directory alongside source code)
- Use Vitest framework with Node.js environment and Playwright browser provider
- Tests run from `/**/*.test.{ts,tsx}` with setup in `/test/setup.ts`
- Visual regression testing with Playwright and custom `toMatchScreenshot` matcher
- Screenshots stored in `__screenshots__` directory
- Checkly monitoring tests in `__checks__` directory
- Requires Node.js 22.0.0 or higher
- Tests use custom server launcher (`test/e2e.ts`) that starts dev server on port 9222
- Write unit tests with Vitest for all utilities and components
- Consider snapshot testing for UI consistency
- Run individual tests: `npm run test -- <test-pattern>`

## Environment Variables

Required environment variables (set in `.env.local`):
- `ANTHROPIC_API_KEY`: API key for Claude AI integration
- `LOGTAIL_TOKEN`: BetterStack Logtail token for logging
- `LOGTAIL_ENDPOINT`: BetterStack Logtail endpoint URL
- `PUSHGATEWAY_URL`: BetterStack Push Gateway URL for metrics
- `PUSHGATEWAY_TOKEN`: BetterStack Push Gateway token
- `SESSION_SECRET`: Secret key for session management
- `CHECKLY_ACCOUNT_ID`: Checkly monitoring account ID
- `CHECKLY_API_KEY`: Checkly monitoring API key

Optional environment variables:
- `SENTRY_DSN`: Sentry project DSN for error tracking
- `SENTRY_AUTH_TOKEN`: Sentry auth token for build-time integration
- `NODE_ENV`: Environment (development/production)
- `SSR_REQUEST_TIMEOUT_MS`: SSR timeout in milliseconds (default: 5000)
- `METRICS_COLLECTION_INTERVAL_MS`: Metrics collection interval (default: 5000)
- `SESSION_MAX_AGE_SECONDS`: Session duration in seconds (default: 30 days)

## Project Structure

- `/app`: Main application directory (React Router v7 convention)
  - `/app/routes.ts`: Route configuration with file-based routing
  - `/app/root.tsx`: Root layout with HTML shell and Sentry
  - `/app/routes/`: Individual route components
  - `/app/lib/`: Shared utilities (AI model, logging, system prompt)
  - `/app/data/`: External data files (user data, blog posts)
  - `/app/entry.server.tsx`: Server-side rendering entry point with request logging
  - `/app/app.css`: Global Tailwind CSS imports
- `/build`: Production build output (client/server bundles)
- `/public`: Static assets (favicon, logos)
- `/test`: Test setup and shared utilities
- `/__screenshots__`: Visual regression test screenshots
- `/__checks__`: Checkly monitoring test files
- `.react-router`: Cache directory (can be cleaned with npm run clean)
- `react-router.config.ts`: React Router v7 configuration with prerendering
- `checkly.config.ts`: Synthetic monitoring configuration
- `biome.json`: Linting and formatting rules with import organization
