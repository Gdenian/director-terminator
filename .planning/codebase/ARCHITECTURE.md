# Architecture

**Analysis Date:** 2026-03-27

## Pattern Overview

**Overall:** Next.js App Router with Service-Oriented Architecture

**Key Characteristics:**
- Next.js 14 App Router with Turbopack for fast builds
- TypeScript throughout the entire codebase
- Server components for data fetching, client components for interactivity
- Bull-based worker queue for async task processing
- Repository pattern for data access abstraction
- API handler wrapper for consistent error handling and response format

## Layers

**UI Layer (Presentation):**
- Purpose: User interface and interactive components
- Location: `src/app/[locale]/*` and `src/components/*`
- Contains: Pages, layouts, React components
- Depends on: Service layer via API routes
- Pattern: Server components fetch data, client components handle interactivity

**API Layer:**
- Purpose: HTTP endpoint handlers, request validation, auth
- Location: `src/app/api/*`
- Contains: Next.js route handlers (route.ts)
- Depends on: Service layer (lib/*), Prisma
- Pattern: `apiHandler` wrapper provides consistent error handling

**Service Layer (Business Logic):**
- Purpose: Core business logic, external integrations, data processing
- Location: `src/lib/*`
- Contains: Task services, billing, asset management, AI runtime
- Depends on: Data layer (Prisma)
- Pattern: Functional services with typed interfaces

**Data Layer:**
- Purpose: Database access and persistence
- Location: `prisma/schema.prisma`, `src/lib/prisma.ts`
- Contains: Prisma client, migrations
- Pattern: Repository pattern via service modules

## Data Flow

**Web Request Flow:**

1. Request enters via `middleware.ts` (i18n routing)
2. Locale routing via `src/i18n/routing.ts`
3. Next.js App Router matches route
4. Server component fetches initial data
5. Client components use React Query for mutations
6. API routes handle mutations with auth check
7. API routes call service layer
8. Service layer uses Prisma for data persistence
9. Async tasks are submitted to Bull queue
10. Workers process tasks asynchronously

**Async Task Flow:**

1. API route submits task via `src/lib/async-submit.ts`
2. Task stored in database via `src/lib/task/service.ts`
3. Worker picks up job from Bull queue
4. Worker processes (AI generation, etc.)
5. Worker updates task status via `src/lib/task/publisher.ts`
6. SSE endpoint (`src/app/api/sse/route.ts`) streams updates
7. Client polls for task status via `src/lib/async-poll.ts`

## Key Abstractions

**API Handler (`src/lib/api-errors.ts`):**
- Purpose: Consistent error handling wrapper for API routes
- Pattern: `apiHandler(async (req) => { ... })`
- Provides: Unified error response format, request logging

**Task System (`src/lib/task/*`):**
- Purpose: Async task tracking and state management
- Key files: `src/lib/task/service.ts`, `src/lib/task/publisher.ts`, `src/lib/task/types.ts`
- Pattern: Task has status (pending, processing, completed, failed), type, target

**Worker System (`src/lib/workers/*`):**
- Purpose: Background job processing
- Types: image.worker, video.worker, voice.worker, text.worker
- Pattern: Bull queue with event handlers for ready/error/failed

**Asset Management (`src/lib/assets/*`):**
- Purpose: Unified asset handling (characters, locations, media)
- Key files: `src/lib/assets/services/asset-actions.ts`, `src/lib/assets/mappers.ts`
- Pattern: Service layer with contract definitions

**Billing (`src/lib/billing/*`):**
- Purpose: Cost tracking and usage metering
- Key files: `src/lib/billing/service.ts`, `src/lib/billing/ledger.ts`
- Pattern: Ledger entries for all billable operations

**AI Runtime (`src/lib/ai-runtime/*`):**
- Purpose: Abstraction over AI model providers
- Key files: `src/lib/generators/*` (fal, minimax, bailian, google, etc.)
- Pattern: Factory pattern for generator creation

## Entry Points

**Web Application:**
- Location: `src/app/[locale]/layout.tsx`
- Triggers: User navigates to locale-prefixed path
- Responsibilities: Root layout with providers (SessionProvider, QueryProvider, ToastProvider)

**API Routes:**
- Pattern: `src/app/api/{domain}/{resource}/route.ts`
- Examples:
  - `src/app/api/tasks/route.ts` - Task CRUD
  - `src/app/api/projects/[projectId]/route.ts` - Project operations
  - `src/app/api/asset-hub/characters/route.ts` - Character management

**Worker Entry:**
- Location: `src/lib/workers/index.ts`
- Triggers: `npm run dev:worker` or `npm run start:worker`
- Responsibilities: Initialize Bull queues, register workers, handle lifecycle

**Middleware:**
- Location: `middleware.ts`
- Triggers: Every HTTP request
- Responsibilities: i18n routing, locale detection

## Error Handling

**Strategy:** Centralized via `apiHandler` wrapper and unified error codes

**Patterns:**
- `src/lib/api-errors.ts` - API route error wrapper with unified response format
- `src/lib/errors/codes.ts` - Unified error code system
- `src/lib/errors/normalize.ts` - Error normalization
- Task-level errors via `src/lib/errors/normalize.ts` (normalizeTaskError)

**Error Flow:**
1. Service throws typed error
2. API handler catches and normalizes
3. Returns consistent JSON error response
4. Client displays via ToastContext

## Cross-Cutting Concerns

**Logging:** `src/lib/logging/*` - Scoped logger with context support

**Authentication:** `src/lib/api-auth.ts` - `requireUserAuth()` for API routes, next-auth for session

**Validation:** Schema-based validation at API boundaries (Zod where used)

**Internationalization:** `next-intl` with locale-prefixed routing (`zh`, `en`)

---

*Architecture analysis: 2026-03-27*
