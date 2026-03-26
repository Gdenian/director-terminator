# Testing Patterns

**Analysis Date:** 2026-03-27

## Test Framework

**Runner:**
- `vitest` v2.1.8 - Configured in `vitest.config.ts`
- Environment: `node` (not jsdom for most tests)
- Test file pattern: `**/*.test.ts`
- Coverage provider: `v8`

**Assertion Library:**
- Built-in `vitest` matchers via `expect`
- Custom assertions in `tests/helpers/assertions.ts`

**Run Commands:**
```bash
# All tests (guards + unit + integration + system)
npm run test:all

# Unit tests only
npm run test:unit:all

# Integration tests (API)
npm run test:integration:api

# Billing tests with coverage
npm run test:billing:coverage

# System tests
npm run test:system

# Run specific test file
npx vitest run tests/unit/billing/cost.test.ts
```

## Test File Organization

**Location:**
- Co-located with source: `src/lib/contracts/image-urls-contract.test.ts`
- Or in `tests/` directory structure mirroring source

**Directory Structure:**
```
tests/
├── unit/                    # Unit tests
│   ├── billing/
│   ├── api-config/
│   ├── components/
│   └── helpers/
├── integration/             # Integration tests
│   ├── api/
│   │   ├── contract/
│   │   └── specific/
│   ├── billing/
│   ├── chain/
│   └── provider/
├── system/                  # End-to-end system tests
├── regression/              # Regression test cases
├── concurrency/             # Concurrency tests
├── contracts/                # Contract/requirement tests
├── fixtures/                 # Shared test fixtures
├── helpers/                 # Test utilities
│   └── fakes/               # Fake implementations
└── setup/                   # Test setup files
```

**Naming:**
- `*.test.ts` - Test files
- `*.integration.test.ts` - Integration tests
- `*.test.ts` - Unit tests

## Test Structure

**Suite Organization:**
```typescript
import { describe, expect, it } from 'vitest'

describe('billing/cost', () => {
  it('calculates text cost by known model price table', () => {
    const cost = calcText('anthropic/claude-sonnet-4', 1_000_000, 1_000_000)
    expect(cost).toBeCloseTo((3 + 15) * USD_TO_CNY, 8)
  })

  it('throws when text model pricing is unknown', () => {
    expect(() => calcText('unknown-model', 500_000, 250_000))
      .toThrow('Unknown text model pricing')
  })
})
```

**Integration Test Structure:**
```typescript
import { beforeEach, describe, expect, it } from 'vitest'
import { prisma } from '../../helpers/prisma'
import { resetBillingState } from '../../helpers/db-reset'
import { createTestUser, createTestProject, seedBalance } from '../../helpers/billing-fixtures'

describe('billing/ledger integration', () => {
  beforeEach(async () => {
    await resetBillingState()
    process.env.BILLING_MODE = 'ENFORCE'
  })

  it('freezes balance when enough funds exist', async () => {
    const user = await createTestUser()
    await seedBalance(user.id, 10)
    const freezeId = await freezeBalance(user.id, 3, { idempotencyKey: 'freeze_ok' })
    expect(freezeId).toBeTruthy()
  })
})
```

## Mocking

**Framework:** `vi` from vitest

**Module Mocking:**
```typescript
import { vi } from 'vitest'

const getProviderConfigMock = vi.hoisted(() => vi.fn(async () => ({
  id: 'openai-compatible:oa-1',
  apiKey: 'sk-test',
  baseUrl: 'https://compat.example.com/v1',
})))

vi.mock('@/lib/api-config', () => ({
  getProviderConfig: getProviderConfigMock,
  getUserModels: getUserModelsMock,
}))
```

**Fetch Mocking:**
```typescript
globalThis.fetch = vi.fn() as unknown as typeof fetch

const fetchMock = vi.fn(async () => new Response(JSON.stringify({
  status: 'succeeded',
  video_url: 'https://cdn.test/video.mp4',
}), { status: 200 }))
globalThis.fetch = fetchMock as unknown as typeof fetch
```

**Mock Cleanup:**
```typescript
beforeEach(() => {
  vi.clearAllMocks()
})
```

## Fixtures and Factories

**Test Data Helpers:**
Location: `tests/helpers/`

**Billing Fixtures** (`tests/helpers/billing-fixtures.ts`):
```typescript
export async function createTestUser() {
  const suffix = randomUUID().slice(0, 8)
  return await prisma.user.create({
    data: {
      name: `billing_user_${suffix}`,
      email: `billing_${suffix}@example.com`,
    },
  })
}

export async function createTestProject(userId: string) { ... }
export async function seedBalance(userId: string, balance: number) { ... }
export async function createQueuedTask(params: { ... }) { ... }
```

**Database Reset** (`tests/helpers/db-reset.ts`):
```typescript
export async function resetBillingState() {
  await prisma.balanceTransaction.deleteMany()
  await prisma.balanceFreeze.deleteMany()
  // ... cascade delete related tables
  await prisma.user.deleteMany()
}
```

**Custom Assertions** (`tests/helpers/assertions.ts`):
```typescript
export async function expectBalance(userId: string, params: {
  balance: number
  frozenAmount: number
  totalSpent: number
}) {
  const row = await prisma.userBalance.findUnique({ where: { userId } })
  expect(toMoneyNumber(row!.balance)).toBeCloseTo(params.balance, 8)
}
```

**Fake LLM** (`tests/helpers/fakes/llm.ts`):
```typescript
export function configureFakeLLM(result: CompletionResult) {
  state.nextText = result.text
  state.nextReasoning = result.reasoning || ''
}

export async function fakeChatCompletion() {
  return { output_text: state.nextText, reasoning: state.nextReasoning }
}
```

## Test Setup

**Environment Setup** (`tests/setup/env.ts`):
- Loads `.env.test` file
- Sets defaults: `NODE_ENV=test`, `BILLING_MODE=OFF`
- Configures database/Redis URLs
- Intercepts `fetch` to block external network calls

**Global Setup** (`tests/setup/global-setup.ts`):
- Starts Docker containers (MySQL, Redis) for integration tests
- Runs `prisma db push` to sync schema
- Returns teardown function

## Coverage

**Configuration:**
- Coverage enabled via `--coverage` flag
- Configured in `vitest.config.ts`
- Threshold: 80% for branches, functions, lines, statements

**Run Coverage:**
```bash
# Billing coverage only
npm run test:billing:coverage

# Core baseline coverage
npm run test:coverage:core-baseline
```

## Test Types

**Unit Tests:**
- Pure functions, utilities, business logic
- No external dependencies (databases, APIs)
- Fast execution, no setup required
- Location: `tests/unit/`

**Integration Tests:**
- Database operations, API routes
- Real or containerized dependencies
- Uses `prisma` directly with test database
- Location: `tests/integration/`

**System Tests:**
- Full workflow from user perspective
- Uses `BILLING_TEST_BOOTSTRAP=1` or `SYSTEM_TEST_BOOTSTRAP=1`
- Tests complete chains: image, video, text, voice
- Location: `tests/system/`

**Concurrency Tests:**
- Race conditions, parallel operations
- Location: `tests/concurrency/`

## Common Patterns

**Async Testing:**
```typescript
it('returns completed with output url', async () => {
  const result = await pollAsyncTask(token, 'user-1')
  expect(result).toEqual({
    status: 'completed',
    resultUrl: 'https://cdn.test/video.mp4',
  })
})
```

**Error Testing:**
```typescript
it('throws when text model pricing is unknown', () => {
  expect(() => calcText('unknown-model', 500_000, 250_000))
    .toThrow('Unknown text model pricing')
})
```

**Idempotency Testing:**
```typescript
it('reuses same freeze record with the same idempotency key', async () => {
  const first = await freezeBalance(user.id, 2, { idempotencyKey: 'idem_key' })
  const second = await freezeBalance(user.id, 2, { idempotencyKey: 'idem_key' })
  expect(first).toBe(second)
  expect(await prisma.balanceFreeze.count()).toBe(1)
})
```

## Test Guards and Scripts

**Guard Scripts** (in `scripts/guards/`):
- `api-route-contract-guard.mjs` - Ensures API routes match contracts
- `changed-file-test-impact-guard.mjs` - Checks test coverage for changed files
- `test-behavior-quality-guard.mjs` - Validates test behavior quality

**Check Scripts:**
```bash
# Run all guards
npm run test:guards

# Individual checks
npm run check:test-coverage-guards
npm run check:requirements-matrix
```

---

*Testing analysis: 2026-03-27*
