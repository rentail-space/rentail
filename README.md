# 🏪 Rentail.space

A modern AI-powered marketplace for short-term retail space leasing built with React Router v7 and Claude AI.

## 🚀 Quick Start


## 🏗️ Architecture

### Tech Stack
- **Frontend:** React 19 with TypeScript
- **Framework:** React Router v7 with Server-Side Rendering
- **Styling:** Tailwind CSS 4
- **Build Tool:** Vite 7
- **AI Integration:** Claude 4 via Anthropic SDK
- **Testing:** Vitest + Playwright
- **Monitoring:** Sentry + Logtail + Checkly
- **Code Quality:** Biome (linting & formatting)

### Project Structure
```
rentail/
├── app/                      # Main application (React Router v7)
│   ├── components/           # Reusable UI components
│   ├── lib/                  # Shared utilities & AI integration
│   ├── routes/               # Route handlers & pages
│   ├── root.tsx             # Root layout with HTML shell
│   └── entry.server.tsx     # Server-side rendering entry
├── test/                     # Test files and utilities
├── __checks__/              # Checkly monitoring tests
├── __screenshots__/         # Visual regression test screenshots
├── public/                  # Static assets
└── Configuration files      # Various config files
```

## 🛠️ Development

### Available Scripts
```bash
pnpm run dev         # Start development server with HMR
pnpm run build       # Build for production
pnpm run start       # Start production server
pnpm run test        # Run all tests (lint + typecheck + unit tests)
pnpm run typecheck   # TypeScript type checking
pnpm run lint        # Lint code with Biome
pnpm run format      # Format code with Biome
pnpm run clean       # Clean build artifacts
pnpm run checkly     # Run monitoring tests
```

### Development Workflow
1. **Start Development:** `npm run dev`
2. **Code Quality:** `npm run lint && npm run typecheck`
3. **Testing:** `npm run test`
4. **Build:** `npm run build`

## 🔧 Configuration

### Key Features
- **AI-Powered Chat:** Interactive space discovery with Claude AI
- **Server-Side Rendering:** Fast initial page loads
- **Real-time Monitoring:** Comprehensive observability stack
- **Visual Testing:** Automated screenshot comparisons
- **Type Safety:** Full TypeScript coverage

## 🧪 Testing

### Unit Tests
```bash
npm run test              # Run all tests
npm run test -- --watch  # Watch mode
```

### E2E Tests
```bash
npx playwright test       # Run Playwright tests
npx playwright test --ui  # Interactive UI mode
```

### Visual Regression Tests
Screenshots are automatically captured and compared in `__screenshots__/` directory.

## 📊 Monitoring

### Error Tracking
- **Sentry:** Real-time error monitoring and performance tracking
- **Logtail:** Structured logging with colored console output

### Synthetic Monitoring
- **Checkly:** Automated monitoring tests every 30 minutes
- Run: `npm run checkly`

### Performance Metrics
- Process metrics collected every 5 seconds
- Memory usage, CPU usage, uptime tracking
- Request logging with duration and status codes

## 🚀 Deployment

### Production Build
```bash
npm run build
npm run start
```

### Environment Setup
1. Set all required environment variables
2. Configure Sentry DSN for error tracking
3. Set up Logtail for log aggregation
4. Configure Checkly for monitoring

## 🔒 Security

### Best Practices
- Environment variables for all secrets
- Session management with secure secrets
- Input validation and sanitization
- Regular dependency updates

### Security Checklist
- [ ] Update SESSION_SECRET from default
- [ ] Secure API keys in environment variables
- [ ] Regular `npm audit` checks
- [ ] Keep dependencies updated

## 🤝 Contributing

### Code Style
- Use TypeScript for type safety
- Follow existing patterns and conventions
- Run `npm run lint` before committing
- Maintain test coverage

### Development Guidelines
1. Create feature branches from `main`
2. Write tests for new functionality
3. Ensure linting and type checking pass
4. Update documentation as needed

## 📝 License

Proprietary!

---

Built with ❤️ using React Router v7 and Claude AI
