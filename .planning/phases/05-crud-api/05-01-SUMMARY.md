---
phase: "05-crud-api"
plan: "01"
subsystem: "user-styles"
tags:
  - "crud-api"
  - "user-styles"
  - "api"
dependency_graph:
  requires: []
  provides:
    - "src/lib/styles/style-service.ts"
    - "src/lib/styles/style-schema.ts"
    - "src/app/api/user-styles/route.ts"
    - "src/app/api/user-styles/[id]/route.ts"
    - "tests/unit/style-service.test.ts"
  affects:
    - "Phase 06 (style-ui)"
    - "Phase 07 (style-ai-extraction)"
tech_stack:
  added:
    - "Zod schema validation"
    - "Prisma $transaction"
    - "Next.js API Routes"
key_files:
  created:
    - "src/lib/styles/style-schema.ts"
    - "src/app/api/user-styles/route.ts"
    - "src/app/api/user-styles/[id]/route.ts"
  modified:
    - "src/lib/styles/style-service.ts"
    - "tests/unit/style-service.test.ts"
decisions:
  - id: "D-30"
    description: "REST API: POST/GET /api/user-styles, PUT/DELETE /api/user-styles/:id"
  - id: "D-31"
    description: "所有端点需要认证（requireUserAuth），未登录返回 401"
  - id: "D-32"
    description: "createUserStyle 使用 $transaction 包裹计数检查和插入操作，防止竞态条件"
  - id: "D-33"
    description: "updateUserStyle 和 deleteUserStyle 调用 assertUserStyleNotSystem 保护系统预设"
  - id: "D-34"
    description: "createUserStyle 创建后调用 resolveStylePrompt 验证提示词可解析"
  - id: "D-35"
    description: "P2002 唯一索引冲突返回 409 Conflict"
  - id: "D-36"
    description: "API 响应使用 select 明确字段，排除 isSystem"
  - id: "D-37"
    description: "使用 Zod safeParse 进行请求体验证"
metrics:
  duration: "~8 minutes"
  completed: "2026-03-27T04:05:44Z"
  tasks: 3
  files: 5
---

# Phase 05 Plan 01: User Styles CRUD API Summary

## One-liner

实现 `/api/user-styles` CRUD API 端点，包含风格创建、列表查询、更新、删除，数量上限 20 个受 $transaction 保护。

## Completed Tasks

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Task 1: 扩展 style-service.ts 添加 CRUD 函数 | 2e153e8 | src/lib/styles/style-service.ts |
| 2 | Task 2: 创建 Zod Schema 和 API 路由 | 4cba6c9 | src/lib/styles/style-schema.ts, src/app/api/user-styles/route.ts, src/app/api/user-styles/[id]/route.ts |
| 3 | Task 3: 添加 CRUD 函数单元测试 | f8f67d9 | tests/unit/style-service.test.ts |

## Key Implementation Details

### Service Layer (style-service.ts)

**MAX_STYLE_LIMIT = 20**

**createUserStyle(userId, data)**:
- 使用 `prisma.$transaction` 原子操作
- 先计数检查（count >= 20 时抛出 `ApiError('QUOTA_EXCEEDED', 429)`）
- 创建后调用 `resolveStylePrompt` 验证可解析性

**getUserStyles(userId)**:
- 返回 `findMany` 结果，按 `createdAt` 倒序
- 使用 `select` 明确字段，不返回 `isSystem`

**updateUserStyle(id, userId, data)**:
- 先调用 `assertUserStyleNotSystem` 保护系统预设
- 支持部分更新（只更新提供的字段）

**deleteUserStyle(id, userId)**:
- 先调用 `assertUserStyleNotSystem` 保护系统预设
- 删除记录

### API Routes

**POST /api/user-styles** (201 Created):
- 认证: `requireUserAuth()`
- 验证: `createUserStyleSchema.safeParse()`
- 冲突: P2002 -> 409 Conflict

**GET /api/user-styles** (200 OK):
- 认证: `requireUserAuth()`
- 返回: `{ styles: [...] }`

**PUT /api/user-styles/:id** (200 OK):
- 认证: `requireUserAuth()`
- 存在检查 + 所有权检查
- 验证: `updateUserStyleSchema.safeParse()`

**DELETE /api/user-styles/:id** (200 OK):
- 认证: `requireUserAuth()`
- 存在检查 + 所有权检查

### Zod Schemas

**createUserStyleSchema**:
- name: string (1-50 chars)
- promptZh: string (1-2000 chars)
- promptEn: string (1-2000 chars)
- tags?: string[]
- referenceImageUrl?: string (url)

**updateUserStyleSchema** (all optional):
- name?: string (1-50 chars)
- promptZh?: string (1-2000 chars)
- promptEn?: string (1-2000 chars)
- tags?: string[]
- referenceImageUrl?: string | null

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Test] 修正 QUOTA_EXCEEDED 状态码**
- **Found during:** Task 3
- **Issue:** 测试期望 422，但 QUOTA_EXCEEDED 在 error catalog 中定义为 429
- **Fix:** 更新测试期望为 429
- **Files modified:** tests/unit/style-service.test.ts
- **Commit:** f8f67d9

**2. [Rule 2 - Test] 修正 isSystem 字段测试 mock**
- **Found during:** Task 3
- **Issue:** mock 返回完整对象包含 isSystem，但 select 会排除该字段
- **Fix:** 修改 mock 返回不包含 isSystem 的对象
- **Files modified:** tests/unit/style-service.test.ts
- **Commit:** f8f67d9

## Test Results

```
✓ tests/unit/style-service.test.ts (18 tests) 5ms
  Test Files  1 passed (1)
  Tests  18 passed (18)
```

覆盖:
- MAX_STYLE_LIMIT = 20
- createUserStyle: 成功/达到上限/临界值
- getUserStyles: 返回列表/空数组/排除 isSystem
- updateUserStyle: 成功/系统风格 403/部分更新
- deleteUserStyle: 成功/系统风格 403/不存在记录

## Verification

- [x] TypeScript 编译通过 (`npx tsc --noEmit`)
- [x] 单元测试全部通过 (18/18)
- [x] 4 个 REST 端点实现完整
- [x] 认证保护: 所有端点 requireUserAuth
- [x] 数量上限: createUserStyle 在 $transaction 内检查
- [x] 系统保护: update/delete 调用 assertUserStyleNotSystem

## Self-Check: PASSED

- [x] src/lib/styles/style-service.ts - 包含 CRUD 函数
- [x] src/lib/styles/style-schema.ts - 包含 Zod schemas
- [x] src/app/api/user-styles/route.ts - POST/GET 实现
- [x] src/app/api/user-styles/[id]/route.ts - PUT/DELETE 实现
- [x] tests/unit/style-service.test.ts - 18 个测试用例
- [x] Git commits: 2e153e8, 4cba6c9, f8f67d9
