# Coding Conventions

**Analysis Date:** 2026-03-27

## Naming Patterns

**Files:**
- TypeScript files use `camelCase` or `kebab-case`: `async-poll.ts`, `api-config.ts`
- React components use `PascalCase`: `ProviderCard.tsx`, `AssetToolbar.tsx`
- Test files use `.test.ts` suffix: `cost.test.ts`, `ledger.integration.test.ts`
- Directories use `kebab-case`: `tests/helpers`, `src/lib/billing`

**Functions:**
- Functions use `camelCase`: `freezeBalance`, `calcText`, `resolveModelPriceStrict`
- Async functions return `Promise<T>` and are prefixed with action verbs
- Helper functions are named descriptively with verb prefixes: `parseModelKeyStrict`, `normalizeCapabilitySelections`

**Variables:**
- Variables use `camelCase`: `normalizedAmount`, `freezeId`, `userId`
- Constants use `UPPER_SNAKE_CASE`: `MONEY_SCALE`, `DEFAULT_VOICE_MODEL_ID`
- Type aliases use `PascalCase`: `ApiType`, `UsageUnit`, `BalanceSnapshot`

**Types & Interfaces:**
- Interfaces preferred for object shapes that may be extended
- Types for unions, intersections, and utility types
- Naming: `ModelCustomPricing`, `LedgerRecordParams`, `FreezeSnapshot`

## Code Style

**Formatting:**
- Tool: ESLint with `next/core-web-vitals` and `next/typescript`
- Configuration: `eslint.config.mjs`
- Path alias: `@/` maps to `src/`

**Linting Rules:**
- No `lucide-react` direct imports - use `@/components/ui/icons` only
- No inline `<svg>` elements - use `AppIcon` or icons module
- Strict TypeScript mode enabled

**TypeScript:**
- Explicit parameter and return types on exported functions
- Avoid `any` - use `unknown` with type narrowing
- Use generics when type depends on caller

## Import Organization

**Order:**
1. External packages: `import { describe, expect, it } from 'vitest'`
2. Internal aliases: `import { prisma } from '@/lib/prisma'`
3. Relative imports: `import { resetBillingState } from '../../helpers/db-reset'`

**Path Aliases:**
- `@/` - src directory (e.g., `@/lib/billing/cost`)
- Relative imports for sibling files

## Error Handling

**Custom Error Classes:**
- `BillingOperationError` for billing-specific errors
- Error codes as string constants: `'BILLING_INVALID_FREEZE'`, `'BILLING_UNKNOWN_MODEL'`
- Error structure: `{ code, message, metadata?, cause? }`

**Patterns:**
```typescript
// Error throwing with code and metadata
throw new BillingOperationError('BILLING_INVALID_FREEZE', 'Invalid freeze record', { freezeId })

// Try-catch with error re-throwing
try {
  await prisma.$transaction(async (tx) => { ... })
} catch (error) {
  if (error instanceof BillingOperationError) {
    throw error
  }
  if (error instanceof Error) {
    throw new BillingOperationError('BILLING_CONFIRM_FAILED', error.message, { freezeId }, error)
  }
}

// Null returns for recoverable errors
if (!balance) return null
```

**Error Display:**
- Use `resolveErrorDisplay()` for user-facing error messages
- Extract provider details from raw API responses
- Normalize errors before display

## Logging

**Framework:** Custom logging via `@/lib/logging/core`
- `logInfo` for operational events
- `logError` for failures with context

**Patterns:**
```typescript
import { logInfo as _ulogInfo, logError as _ulogError } from '@/lib/logging/core'

_ulogInfo(`[Balance] add balance success: userId=${userId}, amount=¥${amount}`)
_ulogError('[Billing] freeze failed:', error)
```

**No `console.log`:** Production code must not use `console.log` (enforced by linting)

## Comments

**When to Comment:**
- Complex business logic requires explanation
- Non-obvious type conversions
- Important decisions or constraints

**Style:**
- Chinese comments for Chinese project context
- JSDoc for public APIs:
```typescript
/**
 * Billing cost center.
 *
 * Pricing is resolved from unified pricing catalog only.
 * No implicit fallback to hardcoded model tables is allowed.
 */
```

## Function Design

**Size:** Keep functions focused - single responsibility
**Parameters:** Use options objects for functions with many parameters:
```typescript
export async function freezeBalance(
  userId: string,
  amount: number,
  options?: {
    source?: string
    taskId?: string
    requestId?: string
    idempotencyKey?: string
    metadata?: Record<string, unknown>
  },
): Promise<string | null>
```

**Return Values:**
- Return `null` for "not found" or "insufficient" instead of throwing
- Throw errors for "invalid" or "impossible" states
- Use `Promise<boolean>` for operations with no return data

## Immutability

**Patterns:**
- Use spread operator for updates: `{ ...obj, field: newValue }`
- Avoid mutation of function parameters
- Create new objects rather than modifying existing ones

## Module Design

**Exports:**
- Named exports preferred
- Barrel files (index.ts) for public interfaces
- Clear separation between internal and external APIs

**File Organization:**
- Related code co-located
- Feature-based directories under `src/lib/features/`
- Utilities in shared `src/lib/` directories

## React Component Conventions

**Props:**
- Define props with `interface` or `type`
- Use `PascalCase` for component names
- Destructure props in function signature

**Hooks:**
- Custom hooks in `src/hooks/` or co-located with features
- Follow `use` prefix naming

---

*Convention analysis: 2026-03-27*
