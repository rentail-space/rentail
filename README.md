# Rentail Space - Specialty Lease Marketplace

A React Router v7 application serving as a specialty lease marketplace that helps businesses find short-term retail spaces in shopping centers with AI-powered assistance.

## 🚀 Quick Start

### Prerequisites

- Node.js ≥ 22.0.0
- PostgreSQL database
- Redis server
- pnpm package manager

### Environment Setup

Create a `.env.local` file with the following required variables:

```bash
# AI Integration
ANTHROPIC_API_KEY=your_anthropic_api_key

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/rentail
SESSION_SECRET=your_session_secret_key

# Email Service
RESEND_API_KEY=your_resend_api_key

# Redis
REDIS_URL=redis://localhost:6379

# Optional - Monitoring & Logging
LOGTAIL_TOKEN=your_logtail_token
LOGTAIL_ENDPOINT=your_logtail_endpoint
PUSHGATEWAY_URL=your_pushgateway_url
PUSHGATEWAY_TOKEN=your_pushgateway_token
SENTRY_DSN=your_sentry_dsn
CHECKLY_ACCOUNT_ID=your_checkly_account_id
CHECKLY_API_KEY=your_checkly_api_key
```

### Installation & Development

```bash
# Install dependencies
pnpm install

# Setup database
prisma generate
prisma db push

# Start development server
pnpm dev

# Open http://localhost:3000
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

## 🎯 Key Components

### AI Integration

- **Chat API** (`/api/chat`): Streaming responses with Claude 4
- **System Prompts**: Context-aware prompts for different scenarios
- **Resume Support**: Automatic stream resumption for reliability
- **Stop Mechanism**: Redis-based cross-request coordination

### Database Models

```typescript
// Core entities
User        // User profiles with location data
Chat        // Conversation sessions
Message     // Individual chat messages with roles and content
```

### Configuration Management

- **Centralized Config**: All environment variables in `app/lib/env.ts`
- **Type Safety**: Runtime validation with env-var library
- **Environment Aware**: Different defaults for test/dev/production

## 🔒 Security Considerations

- **Input Sanitization**: All user inputs validated and sanitized
- **Session Management**: Secure cookie-based sessions
- **API Key Protection**: Environment-based secret management
- **CSP Headers**: Content Security Policy implementation
- **Rate Limiting**: Built-in protection against abuse

## 📊 Monitoring & Observability

### Error Tracking
- **Sentry Integration**: Automatic error capture and reporting
- **Custom Error Boundaries**: React error boundary implementation
- **Performance Monitoring**: Request timing and resource usage

### Metrics Collection
- **Process Metrics**: CPU, memory, heap usage
- **HTTP Metrics**: Request counts, response times, status codes
- **Custom Metrics**: Business-specific measurements

### Synthetic Monitoring
- **Checkly Tests**: Automated E2E monitoring every 30 minutes
- **Visual Regression**: Screenshot comparison testing
- **API Health Checks**: Endpoint availability monitoring

## 🧪 Testing Strategy

### Unit Testing
- **Framework**: Vitest with jsdom environment
- **Coverage**: Components, utilities, and business logic
- **Mocking**: MSW for API mocking

### Visual Testing
- **Playwright Integration**: Browser-based visual testing
- **Screenshot Comparison**: Automated visual regression detection
- **Cross-browser Testing**: Multiple browser environments

### E2E Testing
- **Checkly Integration**: Production monitoring
- **User Journey Testing**: Critical path validation
- **Performance Testing**: Page load and interaction timing

## 🚀 Deployment

### Build Process
```bash
pnpm build  # Generates client/server bundles in /build
```

### Production Requirements
- Node.js ≥ 22.0.0
- PostgreSQL database
- Redis server
- All required environment variables

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

## 📄 License

[Add your license information here]

## 🆘 Support

For questions and support:
- Create an issue in this repository
- Check existing documentation and guides
- Review the troubleshooting section below

---

**Last Updated**: September 2025