# 🏪 Rentail.space

A modern AI-powered marketplace for short-term retail space leasing built with React Router v7 and Claude AI.

## 🚀 Quick Start

### Prerequisites
- Node.js 22.0.0 or higher
- npm or yarn package manager

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd rentail

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys and configuration

# Start development server
npm run dev
```

Visit `http://localhost:3000` to see the application running.

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
npm run dev         # Start development server with HMR
npm run build       # Build for production
npm run start       # Start production server
npm run test        # Run all tests (lint + typecheck + unit tests)
npm run typecheck   # TypeScript type checking
npm run lint        # Lint code with Biome
npm run format      # Format code with Biome
npm run clean       # Clean build artifacts
npm run checkly     # Run monitoring tests
```

### Development Workflow
1. **Start Development:** `npm run dev`
2. **Code Quality:** `npm run lint && npm run typecheck`
3. **Testing:** `npm run test`
4. **Build:** `npm run build`

## 🔧 Configuration

### Environment Variables
Create a `.env.local` file with the following required variables:

```bash
# Security (REQUIRED)
SESSION_SECRET=your-super-secret-session-key-here

# AI Configuration (REQUIRED)
ANTHROPIC_API_KEY=your-anthropic-api-key

# Monitoring (REQUIRED)  
SENTRY_DSN=your-sentry-dsn
LOGTAIL_TOKEN=your-logtail-token

# Optional Configuration
PORT=3000
NODE_ENV=development
AI_MODEL=claude-4-opus-20250514
```

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

[Add your license information here]

---

Built with ❤️ using React Router v7 and Claude AI