# CLAUDE.md - Coding Assistant Guidelines

## Build Commands

- Build: `npm run build`
- Check code: `npm run check`
- Lint: `npm run lint`
- Type check: `npm run typecheck`
- Test: `npm run test`
- Dev: `npm run dev`

## Code Style

- Frontend: React with TypeScript and Remix
- Use 2-space indentation with 80 character line width
- Prefer named exports over default exports
- Organize imports: React first, then external libs, then local files
- Use TypeScript for type safety, avoid non-null assertions
- Component naming: PascalCase for components, camelCase for utilities
- Error handling: Use try/catch blocks with proper user feedback
- CSS: Use app/css directory and component-specific styles
- Follow Biome linting rules (see biome.json)
- Always use descriptive variable names

## Tests

- Test file name ends with ".test.ts" instead of ".ts"
- Test file should be placed in the same directory as file getting tested
- Use the Vitest framework for writing tests
- Use Mock Service Workers (MSW) for mocking 3rd party APIs
- For 3rd party APIs, mock the actual endpoint and not the calling code
- Use Playwright for E2E testing of browser rendering
- Use fetch-mock to mock the fetch API
- Tests should be easy to read and understand
- Tests should be easy to change

# Summary instructions

When you are using compact, please focus on test output and code changes

## Project Structure

- `/app`: Core application code
- `/app/components`: Reusable UI components
- `/app/lib`: Server-side utilities and server functions (.server.ts)
- `/app/routes`: Route components and API endpoints
- `/app/css`: Global CSS and theme configuration
