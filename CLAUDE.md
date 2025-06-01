# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands

- Dev: `npm run dev` (starts development server with HMR)
- Build: `npm run build` (react-router build for production)
- Start: `npm run start` (starts production server)
- Type check: `npm run typecheck` (includes react-router typegen)
- Test: `npm run test` (vitest with verbose reporter)

## Architecture

This is a **React Router v7** application serving as a specialty lease marketplace called "rentail.space". The app helps businesses find short-term retail spaces in shopping centers with server-side rendering enabled by default.

**Tech Stack:**
- React Router v7 with SSR (migrated from Vite + React Router DOM)
- React 19 with TypeScript
- Vite 6 for build tooling (integrated with React Router v7)
- Tailwind CSS 4 for styling
- Vitest for unit testing with jsdom environment

**File-Based Routing:**
Routes are configured in `/app/routes.ts` using React Router v7's declarative routing:
- `/` - Home route (`routes/home.tsx`) with marketing content
- `/chat` - Chat interface (`routes/chat.tsx`) for space discovery
- Root layout in `/app/root.tsx` with HTML shell and global components

**SSR Configuration:**
- Server-side rendering enabled by default via `react-router.config.ts`
- Builds separate client/server bundles to `/build` directory
- Production server runs with `@react-router/serve`

## Code Style

- Use TypeScript for type safety
- Component naming: PascalCase for components, camelCase for utilities
- Path alias: `~/*` maps to `./app/*`
- Use descriptive variable names
- Organize imports: React first, then external libs, then local files

## Tests

- Test files should end with ".test.ts" or ".test.tsx"
- Place test files in `/app` directory alongside source code
- Use Vitest framework with jsdom environment
- Tests run from `/app/**/*.test.{ts,tsx}` with setup in `/test/setup.ts`

## Project Structure

- `/app`: Main application directory (React Router v7 convention)
  - `/app/routes.ts`: Route configuration
  - `/app/root.tsx`: Root layout with HTML shell
  - `/app/routes/`: Individual route components
  - `/app/app.css`: Global Tailwind CSS imports
- `/public`: Static assets (favicon, logos)
- `/test`: Test setup and shared utilities
- `react-router.config.ts`: React Router v7 configuration
