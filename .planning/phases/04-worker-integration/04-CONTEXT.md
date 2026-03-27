# Phase 4: Worker 层集成 - Context

**Gathered:** 2026-03-27
**Status:** Ready for planning

<domain>
## Phase Boundary

将 6 个 Worker handler 文件中的 `getArtStylePrompt()` 替换为 `resolveStylePrompt()`。同时清理已废弃的 import 语句。Worker handler 通过 `job.data.userId` 传递用户上下文，替换时需添加 userId 参数。此阶段仅做替换，不修改任何业务逻辑或添加测试（向后兼容在 Phase 3 已验证）。

</domain>

<decisions>
## Implementation Decisions

### 替换函数名
- **D-24:** `getArtStylePrompt()` → `resolveStylePrompt(artStyle, userId, locale)`
  - 注意：ROADMAP Success Criteria 写的是 `getStylePrompt()`，这是文档错误；实际 Phase 2 创建的函数名是 `resolveStylePrompt`

### userId 来源
- **D-25:** 所有 Worker handler 可通过 `job.data.userId` 获取当前用户 ID
  - 6 个 handler 均接受 `job.data.userId`（已在代码中验证）

### 替换模式
- **D-26:** 统一替换模式：
  ```typescript
  // 旧（同步）：
  const artStylePrompt = getArtStylePrompt(artStyle, job.data.locale)

  // 新（异步）：
  const artStylePrompt = await resolveStylePrompt(artStyle, job.data.userId, job.data.locale) ?? ''
  ```
  - `?? ''` 保证向后兼容（resolveStylePrompt 返回 null 时转为空字符串）

### 废弃 import 清理
- **D-27:** 替换后，删除 `@/lib/constants` 中的 `getArtStylePrompt` import（如果该文件不再使用）
  - 如果文件同时使用 `ART_STYLES` 或其他常量，保留 import 仅移除 `getArtStylePrompt`

### 需替换的文件（共 6 个 handler）
1. `panel-image-task-handler.ts` — 1 处调用
2. `character-image-task-handler.ts` — 1 处调用
3. `location-image-task-handler.ts` — 1 处调用
4. `panel-variant-task-handler.ts` — 1 处调用
5. `asset-hub-image-task-handler.ts` — 1 处调用
6. `reference-to-character.ts` — 1 处调用（第 196 行，已有废弃注释）
7. `analyze-novel.ts` — 仅 import 无调用（删除 import 即可）

### 废弃 import 清理（单独处理）
- **D-28:** `analyze-novel.ts` 保留 `getArtStylePrompt` import 但无调用 — 删除此 import

### 编译验证
- **D-29:** 所有替换后运行 `npx tsc --noEmit` 确保无类型错误

### Claude's Discretion
- 是否需要为每个 handler 创建单元测试验证替换正确性（当前 Phase 3 向后兼容测试已覆盖核心路径）
- 现有测试套件是否有回归测试能捕获替换错误

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 解析器
- `src/lib/styles/style-resolver.ts` — Phase 2 创建的 `resolveStylePrompt(artStyle, userId, locale)` 函数

### Worker 调用点
- `src/lib/workers/handlers/panel-image-task-handler.ts` — 第 197 行
- `src/lib/workers/handlers/character-image-task-handler.ts` — 第 110 行
- `src/lib/workers/handlers/location-image-task-handler.ts` — 第 67 行
- `src/lib/workers/handlers/panel-variant-task-handler.ts` — 第 214 行
- `src/lib/workers/handlers/asset-hub-image-task-handler.ts` — 第 63 行
- `src/lib/workers/handlers/reference-to-character.ts` — 第 196 行

### Phase 上下文
- `.planning/phases/02-style-resolver/02-CONTEXT.md` — D-10~D-15 解析器决策
- `.planning/phases/03-backward-compat/03-CONTEXT.md` — 向后兼容验证已完成

</canonical_refs>

<code_context>
## Existing Code Insights

### Established Patterns
- 所有 Worker handler 通过 Bull queue 接收 job，job.data 包含 userId、locale、projectId 等
- `resolveStylePrompt` 返回 `Promise<string | null>`，需 await
- 原 `getArtStylePrompt` 返回 `string`，替换时需 `?? ''`

### Integration Points
- Phase 5 CRUD API 会调用 `resolveStylePrompt`（通过 style-resolver.ts）
- Phase 3 向后兼容测试已验证 resolveStylePrompt 等价于 getArtStylePrompt

</code_context>

<specifics>
## Specific Ideas

No new user-facing requirements — Phase 4 is pure mechanical replacement.

</specifics>

<deferred>
## Deferred Ideas

None — Phase 4 scope is well-defined.

</deferred>

---

*Phase: 04-worker-integration*
*Context gathered: 2026-03-27*
