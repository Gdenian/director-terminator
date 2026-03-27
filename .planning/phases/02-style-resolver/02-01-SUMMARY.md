---
phase: "02"
plan: "01"
subsystem: style-resolver
tags:
  - phase-2
  - style-system
  - tdd
dependency_graph:
  requires: []
  provides:
    - src/lib/styles/style-resolver.ts
  affects:
    - src/lib/workers/handlers/analyze-novel.ts
    - tests/unit/style-resolver.test.ts
tech_stack:
  added:
    - resolveStylePrompt (async function)
  patterns:
    - TDD (RED-GREEN-REFACTOR)
    - vi.hoisted for Vitest mocks
    - Repository pattern for style lookup
key_files:
  created:
    - src/lib/styles/style-resolver.ts
    - tests/unit/style-resolver.test.ts
  modified:
    - src/lib/workers/handlers/analyze-novel.ts
    - tests/unit/worker/analyze-novel.test.ts
decisions:
  - |
    resolveStylePrompt 返回 Promise<string | null> 而非 UserStylePrompt 类型
  - |
    userId 必须在 DB 查询 where 条件中，防止跨用户访问
  - |
    预设风格路径不查库，直接从 ART_STYLES 常量查找
  - |
    artStylePrompt 写入路径移除，但 getArtStylePrompt import 保留（Phase 4 才替换）
metrics:
  duration: 320 seconds
  tasks_completed: 3
  files_created: 2
  files_modified: 2
  tests_passed: 683
  tests_new: 14
---

# Phase 02 Plan 01: Style Resolver Implementation Summary

## One-liner

实现异步 `resolveStylePrompt()` 风格解析器，支持预设风格（ART_STYLES 常量）和用户自定义风格（UserStyle DB 查询），同时移除 `analyze-novel.ts` 中 `artStylePrompt` 缓存字段的写入路径。

## Completed Tasks

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 0 | RED: 写 resolveStylePrompt() 单元测试 | a6c643f | tests/unit/style-resolver.test.ts |
| 1 | GREEN: 实现 resolveStylePrompt() 函数 | 57051a3 | src/lib/styles/style-resolver.ts |
| 2 | 移除 analyze-novel.ts 中的 artStylePrompt 写入路径 | 196af9b | src/lib/workers/handlers/analyze-novel.ts |
| 2b | 更新 analyze-novel 测试 | 78c7312 | tests/unit/worker/analyze-novel.test.ts |

## What Was Built

### resolveStylePrompt() 异步函数

```typescript
export async function resolveStylePrompt(
  artStyle: string,
  userId: string,
  locale: 'zh' | 'en',
): Promise<string | null>
```

**行为：**
- 预设风格（如 `american-comic`）：直接从 `ART_STYLES` 常量查找，不查库
- 用户风格（如 `user:uuid`）：查询 `UserStyle` 表，`userId` 参与 where 条件（安全性）
- 找不到时返回 `null`
- 空字符串直接返回 `null`

### artStylePrompt 写入路径移除

从 `analyze-novel.ts` 第 364-369 行移除了唯一写入 `artStylePrompt` 字段的代码：
```typescript
// 已移除
await prisma.novelPromotionProject.update({
  where: { id: novelData.id },
  data: {
    artStylePrompt: getArtStylePrompt(novelData.artStyle, job.data.locale) || '',
  },
})
```

**保留说明：** `getArtStylePrompt` 的 import 保留，Phase 4 才替换为 `resolveStylePrompt`。

## Test Coverage

### style-resolver.test.ts (14 tests)
- 预设风格 4 种 x 2 locales (zh/en) = 8 tests
- 用户自定义风格 DB 查询 = 3 tests
- 安全性验证（userId 不匹配返回 null）= 1 test
- 无效输入（未知标识符、空字符串）= 2 tests

### analyze-novel.test.ts (更新)
- 更新测试期望：`novelPromotionProject.update` 不再被调用

## Deviations from Plan

### Rule 1 - Auto-fixed: 测试 mock 结构问题
- **Found during:** Task 0 RED phase
- **Issue:** `vi.mock` hoisting 导致 `Cannot access 'mockPrisma' before initialization`
- **Fix:** 使用 `vi.hoisted()` 在 hoisting 之前定义 mock
- **Files modified:** tests/unit/style-resolver.test.ts
- **Commit:** 57051a3

### Rule 1 - Auto-fixed: analyze-novel 测试断言失败
- **Found during:** Task 2 verification
- **Issue:** 测试期望 `artStylePrompt` update 被调用，但该路径已移除
- **Fix:** 更新测试期望 `update` 不再被调用
- **Files modified:** tests/unit/worker/analyze-novel.test.ts
- **Commit:** 78c7312

## Verification Results

| Check | Result |
|-------|--------|
| 单元测试 (style-resolver.test.ts) | 14 passed |
| 单元测试 (all) | 683 passed |
| TypeScript 类型检查 | Passed |
| artStylePrompt grep (analyze-novel.ts) | 无结果（已移除） |
| resolveStylePrompt export | 存在 |

## Phase 2 Context

**本计划完成标准达成：**
- [x] `src/lib/styles/style-resolver.ts` 存在，`resolveStylePrompt` 为 async 函数
- [x] 预设风格标识符返回正确提示词（zh/en）
- [x] "user:uuid" 格式查询 DB 返回提示词（mock）
- [x] userId 不匹配时返回 null（安全性）
- [x] 未知标识符返回 null
- [x] `analyze-novel.ts` 不再写入 `artStylePrompt`
- [x] TypeScript 编译无错误

**Next（Phase 3/4）：**
- Worker handler 中对 `artStylePrompt` 字段的读取路径移除
- `getArtStylePrompt` 替换为 `resolveStylePrompt`
- Prisma schema 中 `artStylePrompt` 字段删除

---

## Self-Check: PASSED

- [x] Created files exist
- [x] Commits exist and are valid
- [x] All tests pass
- [x] TypeScript compiles without errors
