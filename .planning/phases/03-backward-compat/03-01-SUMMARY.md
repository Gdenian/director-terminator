---
phase: "03"
plan: "01"
name: "03-backward-compat-01"
type: "tdd"
wave: "1"
dependency_graph:
  requires: []
  provides:
    - "INTEG-01: assertUserStyleNotSystem 保护函数（style-service.ts）"
    - "INTEG-02: 向后兼容集成测试（backward-compat.test.ts）"
  affects:
    - "src/lib/styles/style-service.ts"
    - "tests/unit/style-service.test.ts"
    - "tests/integration/backward-compat.test.ts"
    - "src/types/project.ts"
    - "prisma/schema.prisma"
    - "src/lib/workers/handlers/reference-to-character.ts"
tags:
  - "backward-compat"
  - "INTEG-01"
  - "INTEG-02"
  - "tdd"
key_decisions:
  - id: "D-16"
    decision: "isSystem === true 时才抛出 403，null/undefined/false 均不抛出"
    rationale: "确保 isSystem 字段明确为 true 时才保护，避免误伤"
  - id: "D-18"
    decision: "assertUserStyleNotSystem(userStyleId, userId) 函数签名"
    rationale: "userId 必须在 where 条件中防止跨用户访问"
  - id: "D-19"
    decision: "使用 ApiError('FORBIDDEN') 而非 'STYLE_SYSTEM_NOT_MODIFIABLE'"
    rationale: "'STYLE_SYSTEM_NOT_MODIFIABLE' 不在 ERROR_CATALOG 中会导致运行时 TypeError"
metrics:
  duration: "~5 minutes"
  completed_date: "2026-03-27"
  tasks_completed: 3
  files_created: 4
  files_modified: 3
tech_stack:
  added:
    - "src/lib/styles/style-service.ts"
    - "tests/unit/style-service.test.ts"
    - "tests/integration/backward-compat.test.ts"
  patterns:
    - "TDD: RED->GREEN 测试驱动开发"
    - "Prisma mock: vi.mock"
    - "deprecation comment: 🔥 废弃 (Phase 3)"
---

# Phase 03 Plan 01 Summary: 向后兼容验证和系统预设保护

## One-Liner

向后兼容测试验证 resolveStylePrompt 与 getArtStylePrompt 一致，assertUserStyleNotSystem 保护函数防止修改/删除系统预设。

## Completed Tasks

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 0 | Task 0 (TDD RED): 向后兼容集成测试 | 73a8314 | tests/integration/backward-compat.test.ts |
| 1 | Task 1 (TDD GREEN): assertUserStyleNotSystem 保护函数 | 0f0f6d9 | src/lib/styles/style-service.ts, tests/unit/style-service.test.ts |
| 2 | Task 2: artStylePrompt 废弃标记 | 878c711 | src/types/project.ts, prisma/schema.prisma, src/lib/workers/handlers/reference-to-character.ts |

## Deliverables

### 1. 向后兼容集成测试 (INTEG-02)
- **文件**: `tests/integration/backward-compat.test.ts`
- **内容**: 8 个测试用例验证 4 个预设风格 x 2 个 locale
- **结果**: 全部通过（resolveStylePrompt 已在 Phase 2 正确实现）

### 2. assertUserStyleNotSystem 保护函数 (INTEG-01)
- **文件**: `src/lib/styles/style-service.ts`
- **导出**: `assertUserStyleNotSystem(userStyleId: string, userId: string): Promise<void>`
- **行为**:
  - isSystem === true 时抛出 `ApiError('FORBIDDEN', { message: '系统预设不可修改或删除', styleId })`
  - 记录不存在时 resolve（404 由调用方处理）
- **测试**: `tests/unit/style-service.test.ts` - 5 个测试全部通过

### 3. artStylePrompt 废弃标记
- `src/types/project.ts:263` - 字段定义处添加废弃注释
- `prisma/schema.prisma:256` - schema 字段添加废弃注释
- `src/lib/workers/handlers/reference-to-character.ts:194` - getArtStylePrompt 调用处添加废弃注释

## Deviations from Plan

### TDD RED Phase Not Achieved
- **Issue**: Task 0 的 8 个测试在 RED phase 即通过（而非失败）
- **Reason**: resolveStylePrompt 已在 Phase 2 正确实现，测试作为验证测试而非驱动开发测试
- **Fix**: 无需修复 - 测试仍然有效验证了 INTEG-02 的需求
- **Impact**: 无 - 测试仍然满足 INTEG-02 验证目标

## Verification Results

| Step | Command | Result |
|------|---------|--------|
| 向后兼容测试 | `npx vitest run tests/integration/backward-compat.test.ts` | ✓ 8 passed |
| style-service 测试 | `npx vitest run tests/unit/style-service.test.ts` | ✓ 5 passed |
| TypeScript 类型检查 | `npx tsc --noEmit` | ✓ PASSED |
| 废弃注释检查 | `grep "🔥 废弃"` | ✓ 3 files |

## Key Decisions Made

| Decision ID | Decision | Rationale |
|-------------|----------|-----------|
| D-16 | isSystem === true 时才抛出 | 确保仅对明确标记的系统预设保护 |
| D-18 | userId 必须在 where 条件中 | 防止跨用户访问风格记录 |
| D-19 | 使用 ApiError('FORBIDDEN') | 'STYLE_SYSTEM_NOT_MODIFIABLE' 不在 ERROR_CATALOG 中 |

## Known Stubs

None.

## Requirements Coverage

| Requirement ID | Status | Verification |
|----------------|--------|--------------|
| INTEG-01 | ✓ Complete | assertUserStyleNotSystem 抛出 403，测试通过 |
| INTEG-02 | ✓ Complete | 8 个向后兼容测试全部通过 |

## Next Steps

- Phase 5 将实现 DELETE/PUT /api/user-styles/:id API 并调用 assertUserStyleNotSystem
- Phase 8 将实现 UI 层禁用系统预设删除按钮
