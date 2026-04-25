# Agent Development Guide

Comprehensive guide for AI coding agents working in the rentail.space codebase.

## Commands

### Build & Test

```bash
pnpm dev              # Start dev server (port 5173)
pnpm build            # Production build (Prisma generate + React Router build)
pnpm check            # Lint + typecheck (run before committing)
pnpm test             # Full test suite (check + vitest)
pnpm format           # Format with Oxfmt (via Vite+)
```

### Running Tests

```bash
pnpx vitest run                    # Run all tests
pnpx vitest run <pattern>          # Run specific test (e.g., "chat")
pnpx vitest run --reporter=verbose # Detailed test output
DEBUG=* pnpm test                  # Enable debug logging
```

### Database

```bash
pnpm prisma generate               # Generate Prisma client
pnpm prisma db push                # Push schema to dev DB
pnpm prisma migrate dev            # Create migration
```

## Code Style Guidelines

### TypeScript

- **Strict mode required** - All code must pass `vp check`
- **Prefer interfaces over types** for object shapes
- **Avoid enums** - Use discriminated unions or const objects instead
- **Avoid `any`** - Oxlint warns on explicit any (set to `warn`)
- **Descriptive names** - Use auxiliary verbs: `isLoading`, `hasError`, `canSubmit`
- **Functional patterns** - No classes, prefer pure functions
- **Early returns** - Handle errors at function start, avoid deep nesting

### Imports & Organization

- **Path alias**: `~/*` maps to `./app/*`
- **Import order**: Organized lexicographically
- **File structure**: Exported component → subcomponents → helpers → static content → types
- **Default exports** for components
- **No barrel files** - Oxlint warns on performance impact

### Formatting (Oxfmt)

- **Double quotes** for strings
- **2-space indentation**
- **80 character line width**
- **Self-closing elements** enforced
- **No inferrable types** - Remove redundant type annotations
- **Single var declarator** per statement

### React & Components

- **Functional components only** - No class components
- **File naming**: lowercase-with-dashes for directories (e.g., `components/auth-wizard`)
- **Component naming**: PascalCase, favor default export
- **Hooks at top level** - Never inside conditionals/loops
- **Exhaustive dependencies** - Oxlint warns on missing useEffect deps
- **Minimize useState/useEffect** - Prefer context, reducers, or derived state
- **Memoization** - Use `useMemo`/`useCallback` to prevent unnecessary re-renders
- **Accessibility** - All pages need `<main>` with `aria-label`

### Conditionals & Logic

- **No unnecessary curly braces** - Use concise syntax for simple statements
- **Prefer early returns** over deeply nested if/else
- **Avoid forEach** - Use `for...of`, `.map()`, or `.filter()` instead (Oxlint warns)

### Error Handling

- **Zod for validation** - Runtime type checking and error handling
- **Sentry for logging** - Use `captureException()` for errors
- **Handle errors first** - Early returns for error conditions
- **Avoid deeply nested ifs** - Use guard clauses

### Security

- **Sanitize inputs** - Prevent XSS attacks
- **Never use `dangerouslySetInnerHTML`** - Oxlint enforces this (error level)
- **bcrypt for passwords** - 10 salt rounds configured
- **No secrets in console** - Use secretlint to check

### Logging

- **debug module** - Use `debug("namespace:feature")` pattern
- **Allowed console methods**: `.assert`, `.error`, `.info`, `.warn` (Oxlint enforces)
- **No console.log** - Will fail lint check

### Performance

- **Flat maps** - Oxlint enforces `useFlatMap` over nested map/flatten
- **Code splitting** - Use React Suspense and dynamic imports for non-critical components

### Testing (Vitest + Playwright)

- **Test files**: `/test/*.test.ts` (NOT alongside source)
- **Browser tests** - Uses Playwright browser provider
- **Helpers**: `converse()` for E2E chat, `goto()` for navigation
- **Cleanup**: Use `prisma.user.deleteMany()` for fresh state
- **Isolation**: `isolate: true` required for safety
- **MSW mocks**: `/test/mocks/mswHandlers.ts` for API mocking

## React Router Conventions

### File-Based Routing

- **Routes**: Files in `app/routes/` become routes
- **Loaders**: Export `loader()` for data fetching (server-side)
- **Actions**: Export `action()` for form submissions/mutations
- **Layouts**: Use `app/routes/_layout.tsx` pattern
- **Special files**: `route.tsx` for index, `[param].tsx` for dynamic routes

### Data Loading

```typescript
import type { Route } from "./+types/route-name";

export async function loader({ request, params }: Route.LoaderArgs) {
  return { data: "value" };
}
```

### Type Safety

- **Generated types**: Import from `./+types/route-name`
- **Loader data**: Typed automatically via `Route.LoaderArgs` and `Route.ComponentProps`

## Git Commits

Use conventional commits with emoji prefixes:

- ✨ `feat:` New features
- 🐛 `fix:` Bug fixes
- 📝 `docs:` Documentation changes
- ♻️ `refactor:` Code restructuring without changing functionality
- 🎨 `style:` Code formatting (not styles/CSS)
- ⚡️ `perf:` Performance improvements
- ✅ `test:` Adding or correcting tests
- 🔧 `chore:` Tooling, configuration, maintenance
- 🔥 `remove:` Removing code or files
- 🚑 `hotfix:` Critical fixes
- 🔒 `security:` Security improvements

**Format**: `emoji type(scope): description`

**Best Practices**:

- Keep commits atomic and focused
- Write in imperative mood ("Add feature" not "Added feature")
- Explain why, not just what
- Reference issues/PRs when relevant (`#123`)
- Split unrelated changes into separate commits
- Run `pnpm check` before committing

## Output Style

Follow **CLEARFRAME mode** (from `.claude/rules/output-style.md`):

- Execute immediately without explanation
- No preamble phrases ("I'll help you", "Let me", "Here's what I found")
- No postamble or summaries unless requested
- Present only essential results
- Zero conversational overhead
- Function like a precise, efficient tool

## Key Architecture Notes

- **AI Streaming**: Uses Anthropic SDK `streamText()` with Redis coordination for resumable streams
- **Working Memory**: User context stored in `User.workingMemory` JSON field (Zod validated)
- **Auth**: Cookie-based sessions (365-day expiration), bcrypt hashing
- **Path Aliases**: `~/*` = `./app/*`, configured in `tsconfig.json`
- **Database**: PostgreSQL + Prisma ORM, use `prisma` import alias
- **Node Version**: 24.10.1+ required
- **Package Manager**: pnpm 10.28.2+
