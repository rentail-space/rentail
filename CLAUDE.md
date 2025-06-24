# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands

- Dev: `npm run dev` (starts development server with HMR)
- Build: `npm run build` (react-router build for production)
- Start: `npm run start` (starts production server)
- Type check: `npm run typecheck` (includes react-router typegen)
- Test: `npm run test` (vitest with verbose reporter)
- Lint: `npm run lint` (Biome linter)
- Format: `npm run format --write` (Biome formatter)
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
- Logtail for structured logging with colored console output
- HTTP request logging in server entry point
- Checkly for synthetic monitoring (every 30 minutes)

**File-Based Routing:**
Routes are configured in `/app/routes.ts` using React Router v7's declarative routing:
- `/` - Home route (`routes/home.tsx`) with marketing content
- `/chat` - Chat interface for space discovery
- `/api/chat` - Streaming AI chat endpoint
- Root layout in `/app/root.tsx` with HTML shell and global components

**SSR Configuration:**
- Server-side rendering enabled by default via `react-router.config.ts`
- Builds separate client/server bundles to `/build` directory
- Production server runs with `@react-router/serve`
- Request logging includes method, URL, status code, and duration

## Code Style

- Use TypeScript for type safety
- Component naming: PascalCase for components, camelCase for utilities
- Path alias: `~/*` maps to `./app/*`
- Use descriptive variable names
- Organize imports: React first, then external libs, then local files
- Biome enforces double quotes, space indentation, and import organization

## Tests

- Test files should end with ".test.ts" or ".test.tsx"
- Place test files in `/app` directory alongside source code
- Use Vitest framework with jsdom environment
- Tests run from `/app/**/*.test.{ts,tsx}` with setup in `/test/setup.ts`
- Visual regression testing with Playwright and custom screenshot matcher
- Screenshots stored in `__screenshots__` directory
- Checkly monitoring tests in `__checks__` directory

## Environment Variables

Required environment variables (set in `.env.local`):
- `ANTHROPIC_API_KEY`: API key for Claude AI integration
- `SENTRY_DSN`: Sentry project DSN for error tracking
- `SENTRY_AUTH_TOKEN`: Sentry auth token for build-time integration
- `NODE_ENV`: Environment (development/production)

## Project Structure

- `/app`: Main application directory (React Router v7 convention)
  - `/app/routes.ts`: Route configuration with file-based routing
  - `/app/root.tsx`: Root layout with HTML shell and Sentry
  - `/app/routes/`: Individual route components
  - `/app/lib/`: Shared utilities (AI model, logging, system prompt)
  - `/app/entry.server.tsx`: Server-side rendering entry point with request logging
  - `/app/app.css`: Global Tailwind CSS imports
- `/public`: Static assets (favicon, logos)
- `/test`: Test setup and shared utilities
- `/__screenshots__`: Visual regression test screenshots
- `/__checks__`: Checkly monitoring test files
- `react-router.config.ts`: React Router v7 configuration
- `checkly.config.ts`: Synthetic monitoring configuration
- `biome.json`: Linting and formatting rules
