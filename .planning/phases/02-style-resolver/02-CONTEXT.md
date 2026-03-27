# Phase 2: 风格解析器重构 - Context

**Gathered:** 2026-03-27
**Status:** Ready for planning

<domain>
## Phase Boundary

将 `getArtStylePrompt()` 同步函数重构为异步 `resolveStylePrompt()` 解析器，支持系统预设和用户自定义两类风格标识符。同时废弃 `artStylePrompt` 缓存字段，统一走实时查询。此阶段仅完成解析器重构本身，不含 CRUD API（Phase 5）或 Worker 集成（Phase 4）。

</domain>

<decisions>
## Implementation Decisions

### 解析器函数签名
- **D-10:** `resolveStylePrompt(artStyle: string, userId: string, locale: 'zh' | 'en'): Promise<string | null>`
  - 系统预设（`"american-comic"` 等）：从 `ART_STYLES` 常量实时查找，userId 不参与查询
  - 用户自定义（`"user:uuid"` 格式）：通过 userId + uuid 查 `UserStyle` 表，取 `promptZh` 或 `promptEn`
  - 找不到时返回 `null`（非空字符串），调用方通过 `?? ''` 或 `|| ''` 保持向后兼容
  - userId 作为必填参数 — Phase 5 CRUD API 调用时已携带 userId

### 缓存字段废弃
- **D-11:** `NovelPromotionProject.artStylePrompt` 字段保留 schema 定义，但：
  - 所有 Worker handler 和 route handler 不再读取此字段
  - 不再写入此字段
  - Phase 3 确认无任何读取路径后，可在后续迁移中删除该字段

### 错误处理策略
- **D-12:** 解析器对未知标识符（既不是已知预设也不是 `user:` 格式）返回 `null`
  - 调用方保持与原 `getArtStylePrompt()` 相同行为：`?? ''` 转为空字符串
  - 自定义风格 UUID 格式但数据库查不到记录时同样返回 `null`

### 事务边界
- **D-13:** 风格数量限制的 `$transaction` 保护落在 Phase 5（CRUD API）
  - Phase 2 解析器本身不做数量检查，仅返回提示词
  - Phase 5 在调用 `prisma.userStyle.create()` 前用 `$transaction` 包裹计数检查

### 函数命名
- **D-14:** 函数名 `resolveStylePrompt`（来自 ROADMAP.md Success Criteria 表述）
  - 位于 `src/lib/styles/style-resolver.ts`
  - 不改变原 `src/lib/constants.ts` 中的 `getArtStylePrompt()` — Phase 4 Worker 集成时统一替换

### TypeScript 类型
- **D-15:** 新增 `UserStylePrompt` type alias：
  ```typescript
  export type UserStylePrompt = {
    promptZh: string
    promptEn: string
  } | null
  ```
  - 解析器返回 `Promise<UserStylePrompt>`，调用方按 locale 取对应字段

### Claude's Discretion
- 具体的 `$transaction` API 形式（`$transaction` vs `$transaction(async tx => ...)`）
- 解析器内部错误日志策略（查不到时 logWarning vs silent）
- 是否需要缓存层（如 in-memory LRU cache）—— Phase 2 不做，按需在 Phase 4 评估

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 风格系统
- `src/lib/constants.ts` — 现有 `ART_STYLES` 常量数组和 `getArtStylePrompt()` 函数，是重构的起点
- `src/lib/styles/style-namespace.ts` — Phase 1 创建的 `isUserStyle` / `extractUserStyleId` / `toUserStyleIdentifier` 工具函数，解析器复用这些
- `src/types/project.ts` — `artStylePrompt` 字段定义位置

### Worker 调用点（Phase 4 前需了解）
- `src/lib/workers/handlers/panel-image-task-handler.ts` — 7 处调用点之一
- `src/lib/workers/handlers/character-image-task-handler.ts` — 调用点
- `src/lib/workers/handlers/location-image-task-handler.ts` — 调用点
- `src/lib/workers/handlers/analyze-novel.ts` — 写入 `artStylePrompt` 字段的调用点

### 研究发现
- `.planning/research/PITFALLS.md` — Pitfall 1（同步解析静默失效）和 Pitfall 2（缓存字段脏数据）是 Phase 2 必须解决的 CRITICAL 风险
- `.planning/phases/01-userstyle/01-CONTEXT.md` — Phase 1 的 D-05～D-07 命名空间约定，Phase 2 解析器直接使用

### Schema
- `prisma/schema.prisma` — `NovelPromotionProject.artStylePrompt` 缓存字段（即将废弃），`UserStyle` 模型

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `isUserStyle(artStyle)` / `extractUserStyleId(artStyle)` / `toUserStyleIdentifier(id)` — Phase 1 工具函数，解析器直接复用
- `ART_STYLES` 常量 — 已有 `find` 查找模式，解析器用于系统预设分支
- `prisma` client instance — 通过 `@/lib/prisma` 导入

### Established Patterns
- Worker handler 中调用 `getArtStylePrompt(modelConfig.artStyle, job.data.locale)` 传入 artStyle 字符串和 locale
- 原函数签名：`getArtStylePrompt(artStyle: string | null | undefined, locale: 'zh' | 'en'): string`
- 找不到时返回空字符串 `''`

### Integration Points
- Phase 4（Worker 集成）会将 7 处 worker handler 调用从 `getArtStylePrompt` 替换为 `resolveStylePrompt`
- Phase 5（CRUD API）会在创建风格时调用解析器验证返回非空

</code_context>

<specifics>
## Specific Ideas

No specific user-facing requirements — Phase 2 is pure refactoring. Implementation choices guided by CRITICAL risk elimination and backward compatibility.

</specifics>

<deferred>
## Deferred Ideas

### Reviewed Todos (not folded)
- **风格数量上限具体数值（20-50）**：等待产品决策，Phase 5 实现前必须确定
- **解析器缓存层（LRU）**：Phase 2 不做，Phase 4 Worker 集成后按需评估性能决定

</deferred>

---

*Phase: 02-style-resolver*
*Context gathered: 2026-03-27*
