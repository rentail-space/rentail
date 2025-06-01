# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands

- Build: `npm run build`
- Lint: `npm run lint`
- Type check: `npm run typecheck`
- Test: `npm run test`
- Dev: `npm run dev`
- Preview: `npm run preview`

## Architecture

This is a React TypeScript application built with Vite that serves as a specialty lease marketplace called "rentail.space". The app helps businesses find short-term retail spaces in shopping centers.

**Tech Stack:**
- React 19 with TypeScript
- React Router DOM for client-side routing
- Vite for build tooling
- Tailwind CSS 4 for styling
- Vitest for unit testing with jsdom environment
- Biome for linting

**Routing Structure:**
The app uses React Router with a nested layout pattern:
- Root layout (`App.tsx`) contains header, footer, and outlet
- Home page (`/`) displays the marketing landing page
- Chat page (`/chat`) shows a conversation interface for finding spaces

## Code Style

- Use 2-space indentation
- Prefer named exports over default exports
- Component naming: PascalCase for components, camelCase for utilities
- Follow Biome linting rules
- Use TypeScript for type safety, avoid non-null assertions unless necessary
- Organize imports: React first, then external libs, then local files

## Tests

- Test files should end with ".test.ts" or ".test.tsx"
- Place test files in the same directory as the code being tested
- Use Vitest framework with jsdom environment
- Tests run from `./src/**/*.test.{ts,tsx}` with setup in `./test/setup.ts`
- Include tests in `./test/` directory for integration or setup tests

## Project Structure

- `/src`: Application source code
- `/src/pages`: Page components (Home, Chat)
- `/src/main.tsx`: Application entry point with routing setup
- `/src/App.tsx`: Root layout component with header/footer
- `/public`: Static assets (favicon, logos)
- `/test`: Test setup and shared test utilities
