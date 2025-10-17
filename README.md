# Rentail Space - Specialty Lease Marketplace

A React Router v7 application serving as a specialty lease marketplace that helps businesses find short-term retail spaces in shopping centers with AI-powered assistance.

## 🚀 Quick Start

### Prerequisites

- Node.js ≥ 22.0.0
- PostgreSQL database
- Redis server
- pnpm package manager

### Installation & Development

```bash
# Install dependencies
pnpm install

# Setup database
prisma generate
prisma db push

# Start development server
pnpm dev

# Open http://localhost:5173
```

## 🏗️ Architecture Overview

### Tech Stack

- **Frontend**: React 19 + TypeScript + React Router v7
- **Styling**: Tailwind CSS 4 + DaisyUI
- **Backend**: React Router v7 SSR
- **Database**: PostgreSQL + Prisma ORM
- **AI**: Claude 4 via Anthropic SDK
- **Caching**: Redis
- **Testing**: Vitest + Playwright
- **Monitoring**: Sentry + BetterStack + Checkly

### Key Features

- **AI-Powered Chat Interface**: Interactive space discovery with Claude 4
- **Server-Side Rendering**: Optimized for SEO and performance
- **Real-time Streaming**: Server-sent events for chat responses
- **Geographic Intelligence**: Location-based space recommendations
- **Email Integration**: Waitlist management with React Email
- **Comprehensive Monitoring**: Error tracking, metrics, and synthetic monitoring

## 📁 Project Structure

```
rentail/
├── app/                          # Main application directory
│   ├── routes/                   # File-based routing
│   │   ├── home/                # Home page components
│   │   ├── chat/                # AI chat interface
│   │   └── api.chat.tsx         # Streaming AI endpoint
│   ├── lib/                     # Shared utilities
│   │   ├── env.ts              # Environment configuration
│   │   ├── prisma.ts           # Database client
│   │   ├── logger.server.ts    # Logging infrastructure
│   │   └── instrument.server.ts # Metrics collection
│   ├── components/              # Reusable UI components
│   ├── data/                    # Static data files
│   └── emails/                  # Email templates
├── prisma/                      # Database schema & migrations
├── test/                        # Test setup and utilities
├── __checks__/                  # Checkly monitoring tests
└── __screenshots__/             # Visual regression tests
```

## 🔧 Development Commands

```bash
# Development
pnpm dev                    # Start dev server with HMR
pnpm build                  # Build for production
pnpm start                  # Start production server

# Code Quality
pnpm typecheck             # TypeScript type checking
pnpm lint                  # Run linters (secretlint + Biome)
pnpm format --write        # Format code with Biome
pnpm check                 # Run both lint and typecheck

# Testing
pnpm test                  # Full test suite (lint + db + typecheck + vitest)
pnpm checkly               # Run synthetic monitoring tests

# Utilities
pnpm clean                 # Remove build cache and artifacts
```

### Monitoring Setup
1. Configure Sentry for error tracking
2. Setup BetterStack for logging and metrics
3. Enable Checkly for synthetic monitoring
4. Configure alert thresholds and notifications

## 🤝 Contributing

### Code Style
- **Formatter**: Biome with 80 character line width
- **Linting**: Strict TypeScript + Biome rules
- **Imports**: Organized (React → external → local)
- **Naming**: PascalCase components, camelCase utilities

### Development Guidelines
1. **Single Responsibility**: Each function should have one clear purpose
2. **Type Safety**: Prefer interfaces over types, avoid enums
3. **Error Handling**: Handle errors early with explicit returns
4. **Performance**: Minimize useState/useEffect, use context/reducers
5. **Testing**: Write tests for all new functionality

### Pull Request Process
1. Run `pnpm check` to ensure code quality
2. Add tests for new functionality
3. Update documentation as needed
4. Ensure all CI checks pass

## 📚 Additional Resources

- [React Router v7 Documentation](https://reactrouter.com)
- [Anthropic AI SDK Documentation](https://sdk.vercel.ai/docs)
- [Prisma Documentation](https://prisma.io/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Biome Documentation](https://biomejs.dev)
