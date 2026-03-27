---
phase: 04-worker-integration
plan: "04-01"
subsystem: worker
tags: [bullmq, style-resolver, async-await, worker-handlers]

# Dependency graph
requires:
  - phase: 02-style-resolver
    provides: resolveStylePrompt() 异步解析器，支持 user:uuid 自定义风格
provides:
  - 7 个 Worker handler 已集成 resolveStylePrompt
  - 图片生成流程支持 user:uuid 格式的自定义风格标识符
affects:
  - phase: 05-style-limits
  - phase: 07-ai-extraction

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "async/await 替换同步调用（Worker handler 中 getArtStylePrompt -> resolveStylePrompt）"
    - "resolveStylePrompt(userId, locale) 三参数签名，userId 参与 DB 查询安全性"

key-files:
  created: []
  modified:
    - src/lib/workers/handlers/panel-image-task-handler.ts
    - src/lib/workers/handlers/character-image-task-handler.ts
    - src/lib/workers/handlers/location-image-task-handler.ts
    - src/lib/workers/handlers/panel-variant-task-handler.ts
    - src/lib/workers/handlers/asset-hub-image-task-handler.ts
    - src/lib/workers/handlers/reference-to-character.ts
    - src/lib/workers/handlers/analyze-novel.ts

key-decisions:
  - "D-26: resolveStylePrompt 替换模式 — await resolveStylePrompt(artStyle, userId, locale) ?? ''"
  - "D-24: userId 参数必须传递 — resolveStylePrompt 在 DB 查询中用 userId 防止跨用户访问"
  - "TypeScript string|null 类型处理 — modelConfig.artStyle 为 string|null，使用 ?? '' 满足 resolveStylePrompt(string) 签名"

patterns-established:
  - "Worker handler 异步风格解析模式：resolveStylePrompt(artStyle ?? '', job.data.userId, job.data.locale) ?? ''"

requirements-completed: [INTEG-05]

# Metrics
duration: 3min
completed: 2026-03-27
---

# Phase 04-01 Plan Summary

**Worker handler 集成 resolveStylePrompt，图片生成流程支持 user:uuid 自定义风格标识符**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-27T03:33:46Z
- **Completed:** 2026-03-27T03:36:37Z
- **Tasks:** 1 (批量替换 7 个 handler)
- **Files modified:** 7

## Accomplishments

- 6 个 Worker handler 的 `getArtStylePrompt` 同步调用全部替换为 `await resolveStylePrompt` 异步调用
- `analyze-novel.ts` 中废弃的 `getArtStylePrompt` import 已删除
- 所有 handler 中 `resolveStylePrompt` 调用均包含 `userId` 参数（安全性要求）
- TypeScript 编译通过（`npx tsc --noEmit` 无错误）

## Task Commits

Each task was committed atomically:

1. **Task 1: 批量替换 7 个 worker handler 中的 getArtStylePrompt 为 resolveStylePrompt** - `7d746c5` (feat)

**Plan metadata:** (checkpoint — summary only)

## Files Created/Modified

- `src/lib/workers/handlers/panel-image-task-handler.ts` - import 改为 resolveStylePrompt，第 197 行调用替换
- `src/lib/workers/handlers/character-image-task-handler.ts` - import 移除 getArtStylePrompt，第 111 行调用替换
- `src/lib/workers/handlers/location-image-task-handler.ts` - import 移除 getArtStylePrompt，第 68 行调用替换
- `src/lib/workers/handlers/panel-variant-task-handler.ts` - import 改为 resolveStylePrompt，第 214 行调用替换
- `src/lib/workers/handlers/asset-hub-image-task-handler.ts` - import 移除 getArtStylePrompt，第 63-67 行调用替换
- `src/lib/workers/handlers/reference-to-character.ts` - import 移除 getArtStylePrompt，废弃注释删除，第 194 行调用替换
- `src/lib/workers/handlers/analyze-novel.ts` - import 移除 getArtStylePrompt（仅有 import，无调用）

## Decisions Made

- **D-26 替换模式**：`await resolveStylePrompt(artStyle ?? '', job.data.userId, job.data.locale) ?? ''`，用 `?? ''` 处理 resolveStylePrompt 返回 null 的情况
- **D-24 userId 安全性**：所有 resolveStylePrompt 调用必须传递 job.data.userId，确保用户自定义风格查询时防止跨用户访问
- **TypeScript 类型处理**：modelConfig.artStyle 类型为 string|null，而 resolveStylePrompt 签名要求 string，使用 `artStyle ?? ''` 确保类型安全

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] TypeScript string|null 类型不匹配**
- **Found during:** Task 1 (批量替换)
- **Issue:** modelConfig.artStyle 为 string|null，resolveStylePrompt(artStyle: string, ...) 签名不接受 null
- **Fix:** 在调用 resolveStylePrompt 时对 artStyle 参数使用 `?? ''` 兜底：resolveStylePrompt(modelConfig.artStyle ?? '', ...)
- **Files modified:** panel-image-task-handler.ts, character-image-task-handler.ts, location-image-task-handler.ts, panel-variant-task-handler.ts
- **Verification:** npx tsc --noEmit 无错误
- **Committed in:** 7d746c5 (part of task commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** 类型不匹配修复是编译通过的前提必要条件，无此修复 TypeScript 编译失败，plan 无法完成。

## Issues Encountered

- **plan 中 line number 不准确**：plan 描述中某些文件的 import 行号（如 panel-variant-task-handler.ts 描述为"第 3 行"，实际为第 14 行；reference-to-character.ts 描述为"第 13 行"，实际为第 10-14 行）与实际不符。按实际文件内容执行，功能不变。

## Verification Results

| 检查项 | 命令 | 结果 |
|--------|------|------|
| getArtStylePrompt 已从 7 个 handler 移除 | `grep -rn "getArtStylePrompt" src/lib/workers/handlers/` | 0 结果 |
| resolveStylePrompt 已正确引入 | `grep -rn "resolveStylePrompt" src/lib/workers/handlers/` | 7 个文件，6 个调用点 |
| TypeScript 编译 | `npx tsc --noEmit` | 无 error 输出 |

## Next Phase Readiness

- Worker handler 集成完成，resolveStylePrompt 已在所有图片生成路径中生效
- 自定义风格（user:uuid 格式）现在可以在图片生成时正确注入提示词
- 等待人类验证者确认修改符合预期

---
*Phase: 04-worker-integration 04-01*
*Completed: 2026-03-27*
