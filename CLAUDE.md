# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Language

**All user-facing communication must be in Korean (한글).** Code, commit messages, and internal comments remain in English.

## Project Overview

QuickUUID is a Next.js 15 application for generating UUIDs with extensive customization options. Built with React 19, TypeScript, and Tailwind CSS v4, it emphasizes performance, accessibility, and clean architecture through contract-based design patterns.

## Development Commands

### Essential Commands
```bash
npm run dev          # Start development server with Turbopack
npm run build        # Production build with Turbopack
npm run typecheck    # TypeScript compilation check (no output)
npm run lint         # ESLint check
npm run format       # Format code with Prettier
```

### Testing
```bash
npm test             # Run Jest unit/integration tests
npm run test:watch   # Jest in watch mode
npm run test:e2e     # Run Playwright E2E tests (starts dev server automatically)
npm run test:e2e-ui  # Playwright with UI for debugging
npm run perf:test    # Run performance benchmarks
```

**Important Testing Notes:**
- E2E tests run on `http://localhost:3001` (configured in playwright.config.ts)
- E2E tests automatically start the dev server if not running
- Contract tests validate API contracts defined in `src/types/contracts.ts`

## Architecture Overview

### Contract-Based Design Pattern
The codebase follows a strict contract-based architecture where all utilities implement well-defined interfaces from `src/types/contracts.ts`:

- **UUIDGeneratorAPI**: UUID generation with crypto API support
- **FormatUtilsAPI**: UUID formatting and validation
- **StorageAPI**: LocalStorage persistence with error handling
- **ClipboardAPI**: Clipboard operations with fallback support

All implementations in `src/lib/` must adhere to these contracts. Contract tests in `tests/contract/` validate compliance.

### Core Architecture Layers

**1. Page Layer** (`src/app/page.tsx`)
- Main application entry point
- Integrates all components with error boundaries
- Handles keyboard navigation and focus management
- Uses code splitting with React.lazy for performance

**2. Hook Layer** (`src/hooks/`)
- `use-uuid-generator.ts`: Master hook integrating all utilities
- Custom hooks for clipboard, debounce, focus management, keyboard nav, storage, theme
- Hooks orchestrate utilities from the lib layer and manage React state

**3. Utility Layer** (`src/lib/`)
Each utility is a factory function returning an object implementing its contract:
- `uuid-generator.ts`: Core UUID generation with batch optimization (>100 UUIDs)
- `format-utils.ts`: UUID formatting with multiple options
- `storage-utils.ts`: LocalStorage with error handling and schema versioning
- `clipboard-utils.ts`: Clipboard API with fallback to document.execCommand
- `performance-utils.ts`: Performance monitoring and health tracking
- `validation-utils.ts`: Input validation and sanitization
- `logger.ts`: Centralized logging (use instead of console)

**4. Component Layer** (`src/components/`)
- `control-panel.tsx`: Configuration UI
- `result-display.tsx`: UUID output with virtualized list
- `virtualized-uuid-list.tsx`: High-performance rendering for large UUID lists
- UI components from `src/components/ui/` (Radix UI + shadcn/ui)

### Type System (`src/types/`)
- `index.ts`: Core type definitions (Config, Result, State)
- `contracts.ts`: API interfaces that utilities must implement

### Path Aliases
Use `@/` for all imports: `@/hooks`, `@/lib`, `@/components`, `@/types`

## Key Technical Patterns

### Performance Optimization
- **Batch Generation**: >100 UUIDs use optimized `generateUUIDBatch()` method
- **Code Splitting**: Components lazy-loaded with Suspense
- **Virtualization**: Large UUID lists use virtualized rendering
- **Debouncing**: Config changes debounced to prevent excessive regeneration
- **Performance Monitoring**: `PerformanceManager` tracks generation health

### Error Handling
- All async operations wrapped in try-catch
- Error boundaries at page level
- Fallback mechanisms for clipboard and crypto APIs
- Validation at boundaries (user input, storage, API calls)

### Accessibility
- Focus management with `use-focus-management.ts`
- Keyboard navigation with `use-keyboard-navigation.ts`
- Screen reader announcements with `use-screen-reader.ts`
- Skip links and proper ARIA attributes
- Focus visible styles in `src/styles/focus.css`

### State Management
- No external state library (React hooks only)
- `use-uuid-generator.ts` is the single source of truth
- LocalStorage for config persistence with schema versioning
- Debounced config updates to prevent thrashing

## Testing Strategy

### Test Organization
```
tests/
├── contract/      # API contract validation tests
├── integration/   # Cross-utility integration tests
├── regression/    # Bug regression tests
└── e2e/          # Playwright end-to-end tests
```

### Contract Testing
Every utility in `src/lib/` must have a corresponding contract test in `tests/contract/` that validates it implements its API interface correctly. This ensures architectural consistency.

### Running Single Tests
```bash
# Jest (unit/integration)
npm test -- uuid-generator          # Run specific test file
npm test -- --testNamePattern="v4"  # Run specific test case

# Playwright (E2E)
npm run test:e2e -- uuid-generation.spec.ts  # Specific spec
npm run test:e2e -- --project=chromium       # Single browser
```

## Code Quality Standards

### Logging
**Never use `console.*` directly**. Use the logger from `src/lib/logger.ts`:
```typescript
import { logger, storageLogger, clipboardLogger } from '@/lib/logger';
logger.info('message', { data });  // Structured logging
```

ESLint enforces this rule (warns on console usage except in logger.ts and tools/).

### TypeScript
- Strict mode enabled
- Run `npm run typecheck` before commits
- No `any` types (ESLint warns)
- Use contract interfaces from `src/types/contracts.ts`

### Import Patterns
- Use `@/` path alias exclusively
- Import types from `@/types` or `@/types/contracts`
- Use named exports (no default exports for utilities)

## Next.js Specifics

### App Router
- Using Next.js 15 App Router (`src/app/`)
- Client components marked with `"use client"`
- Server components by default

### Turbopack
Development and production builds use Turbopack (`--turbopack` flag). This is significantly faster than Webpack.

### Build Output
Console removal happens automatically in production builds (next.config.ts).

## Common Gotchas

1. **Performance Tests**: Run `npm run perf:test` to validate UUID generation stays under 50ms for 1000 UUIDs
2. **E2E Port**: Playwright expects dev server on port 3001, not 3000
3. **Batch Threshold**: UUID generation switches to batch mode at 100+ UUIDs
4. **Storage Schema**: LocalStorage has versioned schema in `StoredPreferences` type
5. **Contract Compliance**: When modifying utilities, update contract tests to validate interface adherence

## Development Workflow

1. Make changes to utilities/components
2. Run `npm run typecheck` to catch TypeScript errors
3. Run `npm test` for unit/integration tests
4. Run `npm run test:e2e` for full E2E validation
5. Run `npm run perf:test` if touching generation code
6. Format with `npm run format` before commit
