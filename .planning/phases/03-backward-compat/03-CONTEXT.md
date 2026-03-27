# Phase 3: 向后兼容与系统预设保护 - Context

**Gathered:** 2026-03-27
**Status:** Ready for planning

<domain>
## Phase Boundary

验证现有项目 artStyle 数据完全向后兼容（通过 `resolveStylePrompt()` 正确解析所有现有标识符），在服务层建立系统预设保护机制（`isSystem` 检查），确保 DELETE/PUT 操作对系统预设记录返回 403。此阶段不创建 CRUD API 端点（Phase 5 范围），不修改 StyleSelector 显示逻辑（Phase 8 范围）。

</domain>

<decisions>
## Implementation Decisions

### 系统预设保护模式
- **D-16:** 系统预设保护使用 `isSystem` 字段（Phase 1 已建立）
  - UserStyle 记录中 `isSystem = true` 表示系统预设
  - 服务层 `assertUserStyleNotSystem(id, userId)` 抛出 `403 Forbidden`
  - Phase 5 CRUD API 在删除/更新前调用此保护函数

### 向后兼容验证
- **D-17:** 验证现有项目的 `artStyle` 值（`"american-comic"`、`"chinese-comic"`、`"japanese-anime"`、`"realistic"`）经 `resolveStylePrompt()` 解析后与 `getArtStylePrompt()` 结果完全一致
  - 创建 `tests/integration/backward-compat.test.ts`
  - 测试用例：4 个预设风格 × 2 种 locale = 8 个断言

### 服务层位置
- **D-18:** 保护函数位于 `src/lib/styles/style-service.ts`
  - `assertUserStyleNotSystem(id: string, userId: string): Promise<void>`
  - 内部调用 `prisma.userStyle.findUnique` 查 `isSystem`
  - 是则抛出 `ApiError('FORBIDDEN', { message: '系统预设不可修改或删除', styleId })`

### 错误码规范
- **D-19:** 系统预设不可修改/删除错误码：`'FORBIDDEN'`
  - 注意：原 `'STYLE_SYSTEM_NOT_MODIFIABLE'` 不在 `ERROR_CATALOG` 中，调用 `ApiError` 会导致运行时 TypeError。改用 `'FORBIDDEN'`（httpStatus=403）以 `details.message` 覆盖默认消息为 `'系统预设不可修改或删除'`
  - Phase 5 API 层统一使用 `assertUserStyleNotSystem()` 服务层函数

### Schema 变更
- **D-20:** Phase 3 确认 `NovelPromotionProject.artStylePrompt` 字段无任何读取路径后，可将该字段标记为废弃注释（不在本阶段删除 schema 定义）

### UI 层（最小范围）
- **D-21:** StyleSelector 保持仅显示 `ART_STYLES` 常量，不显示用户自定义风格
  - 混合展示属于 Phase 8 范围
  - Phase 3 仅确保 4 个预设始终可见（在常量中定义即可）

### Phase 5 API 契约（提前确立）
- **D-22:** DELETE `/api/user-styles/:id` 调用 `assertUserStyleNotSystem` 前先验证记录属于当前用户
  - 顺序：先查记录 → 验证属于当前用户 → 检查 `isSystem` → 执行删除
- **D-23:** PUT `/api/user-styles/:id` 同上保护逻辑

### Claude's Discretion
- 系统预设是否需要 seed 到 UserStyle 表（还是仅依赖 `isUserStyle()` 常量判断）
- 具体 403 响应的 HTTP body 格式
- 是否需要审计日志记录删除/修改系统预设的尝试

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 风格系统
- `src/lib/constants.ts` — ART_STYLES 常量，4 个系统预设定义
- `src/lib/styles/style-namespace.ts` — `isUserStyle()` 等工具函数
- `src/lib/styles/style-resolver.ts` — Phase 2 创建的 `resolveStylePrompt()` 解析器
- `src/types/project.ts` — `artStylePrompt` 字段类型定义

### Schema
- `prisma/schema.prisma` — `UserStyle` 模型（`isSystem` 字段）和 `NovelPromotionProject` 模型

### Worker 调用点（确认读取路径）
- `src/lib/workers/handlers/analyze-novel.ts` — Phase 2 已移除写入，验证无读取

### 研究发现
- `.planning/research/PITFALLS.md` — Pitfall 4（系统预设保护仅在 UI 层）是 Phase 3 必须解决的风险

### Phase 上下文
- `.planning/phases/01-userstyle/01-CONTEXT.md` — D-05～D-09 命名空间和 schema 决策
- `.planning/phases/02-style-resolver/02-CONTEXT.md` — D-10～D-15 解析器决策

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets
- `resolveStylePrompt()` — Phase 2 创建的异步解析器，向后兼容验证依赖此函数
- `ART_STYLES` 常量 — 系统预设定义，无需数据库查询即可确定
- 现有 API 错误码模式 — 参考 `src/lib/errors/codes.ts`

### Established Patterns
- 抛出 `ApiError` 或自定义 `BillingOperationError` 模式 — 服务层用此模式返回 403
- Prisma 查询返回 `null` 表示记录不存在
- `ApiError` 构造函数在 code 不在 `ERROR_CATALOG` 时会抛出 TypeError（`spec` 为 `undefined`），必须使用已知 code

### Integration Points
- Phase 5 CRUD API 将 import `assertUserStyleNotSystem` 保护函数
- StyleSelector（Phase 8 扩展前）仅接收常量 `ART_STYLES` 作为 options

</code_context>

<specifics>
## Specific Ideas

No specific user-facing requirements beyond what's in the roadmap. Implementation is guided by backward compatibility and security patterns.

</specifics>

<deferred>
## Deferred Ideas

### 系统预设 seed 到数据库
是否需要将 4 个预设 seed 为 UserStyle 记录（isSystem=true）—— 等待 Phase 5 产品决策。当前 Phase 3 方案：预设不入库（per D-06），isSystem 仅用于保护用户自定义创建的系统级风格。

### ART_STYLES 迁移到数据库
长期看可能需要，但 Phase 3 不考虑。

</deferred>

---

*Phase: 03-backward-compat*
*Context gathered: 2026-03-27*
