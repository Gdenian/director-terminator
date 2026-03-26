# Project Research Summary

**Project:** 自定义风格系统（导演终结者 AI 视频创作平台）
**Domain:** AI 视频创作平台 — 用户自定义艺术风格扩展
**Researched:** 2026-03-27
**Confidence:** HIGH

## Executive Summary

本项目是在现有 AI 视频创作平台上增加自定义风格系统，允许用户在系统预设之外创建、管理和使用个性化艺术风格。专家做法是：以前缀命名空间（`"user:uuid"` vs 裸字符串）区分自定义风格与系统预设，实现零数据迁移的向后兼容；同时将风格提取设计为"AI 草稿 + 用户确认"两阶段流程，而非直接持久化 AI 输出。整个功能完全基于现有技术栈（Next.js、Prisma、S3、LLM vision），零新依赖。

推荐构建顺序为：数据模型 → 后端 API（含 AI 提取）→ 风格解析器扩展 → UI 层。关键原则是阶段 1 必须先完成风格解析器（`getStylePrompt()`）重构，才能保证自定义风格在 Worker 层正确注入；阶段 3 的解析器扩展与阶段 4 的 UI 开发在 API 合约确定后可并行。

最大风险是 `getArtStylePrompt()` 同步函数未同步改为异步导致自定义风格静默失效（无报错、无 log），以及 `artStylePrompt` 缓存字段导致的脏数据问题。两者均需在阶段 1 优先解决，否则后续所有测试都会给出错误的"正常"信号。

## Key Findings

### Recommended Stack

现有代码库已完整覆盖所有需求，零新依赖。`src/lib/llm/vision.ts` 中的 `chatCompletionWithVision()` 直接支持参考图风格提取；`src/app/api/asset-hub/upload-image/route.ts` 是参考图上传的完整参考实现（formData + sharp 压缩 + S3 存储）。唯一需要新增的是 Prisma `UserStyle` 模型和对应迁移。

**核心技术：**
- **Prisma + PostgreSQL：** 新增 `UserStyle` 数据模型 — 与现有 schema 一致，直接运行 `prisma migrate dev`
- **Next.js App Router API Routes：** 风格 CRUD 端点 — 遵循现有 `api/asset-hub/` 模式，路由结构一致
- **LLM Vision（现有 `llm-client.ts`）：** AI 风格提取 — 复用 `chatCompletionWithVision()`，无需额外配置
- **S3/COS（现有 `uploadObject()`）：** 参考图存储 — 复用上传工具函数，路径约定 `user-styles/{userId}/{styleId}/ref.jpg`
- **StyleSelector（现有组件扩展）：** UI 展示层 — 接口不变，仅数据源扩展

### Expected Features

**必须有（Table Stakes）：**
- 创建/编辑/删除自定义风格（名称 + 描述提示词）— 无此功能则自定义风格毫无意义
- StyleSelector 扩展展示系统预设 + 用户自定义 — 用户选择风格的唯一入口
- 向后兼容：旧 artStyle 字段值（`"american-comic"` 等）正常解析 — 不兼容则现有项目全部受影响
- 风格数量上限与明确提示 — 防止存储膨胀和 UX 退化
- 参考图上传 + AI 风格描述提取 — 核心差异化入口

**应该有（竞争优势）：**
- AI 提取两步流程（AI 草稿 + 用户编辑确认）— 给用户对 AI 输出的控制权
- 双语提示词（zh/en）— 与现有 promptZh/promptEn 模式一致，保证多语言生成质量
- 标签/分类系统 — 便于用户管理多个风格

**推迟到 v2+：**
- 风格市场/社交分享 — 内容审核和知识产权风险，超出当前范围
- 多滑块参数调节器 — 复杂度高，与价值不成比例
- 保存时自动生成预览图 — AI 成本不可控

### Architecture Approach

架构核心是"前缀命名空间标识符"模式：现有 `artStyle` 字段保持字符串类型不变，系统预设使用裸标识符（`"american-comic"`），自定义风格使用 `"user:{uuid}"` 前缀，`getStylePrompt()` 函数通过前缀路由到不同数据源（常量 vs 数据库）。API 层统一合并系统预设与用户风格返回，StyleSelector 无需感知两种来源的差异。

**主要组件：**
1. **`UserStyle` 数据模型** — 存储用户自定义风格（id、userId、name、promptZh、promptEn、tags、referenceImageUrl）
2. **`/api/user-styles` CRUD 端点** — 风格增删改查，含数量上限检查和 `isSystem` 保护
3. **`/api/user-styles/extract-from-image`** — 接收参考图，调用 LLM 视觉分析，返回草稿（不写库）
4. **`lib/styles/style-resolver.ts`** — `getStylePrompt()` 统一解析函数，替换现有 `getArtStylePrompt()`
5. **`StyleManager` + `StyleCreateModal` UI 组件** — 风格库管理和创建/编辑入口
6. **`StyleSelector`（扩展）** — 合并展示系统预设 + 用户风格，触发选择

### Critical Pitfalls

1. **`getArtStylePrompt()` 未同步改为异步** — 自定义风格传入 UUID 时静默返回空字符串，图片生成成功但无风格应用。必须在阶段 1 完成 `getStylePrompt()` 异步重构，并替换全部 7 处调用点。

2. **`artStylePrompt` 缓存字段脏数据** — Schema 中存在该缓存字段但注释自相矛盾。用户编辑风格后缓存字段不更新，Worker 使用旧提示词。必须在阶段 1 废弃该缓存字段，统一走实时查询。

3. **AI 提取结果描述内容而非风格** — LLM 倾向于描述图片内容（"一个穿红衣的女孩"）而非风格（"赛璐璐上色，动漫线条"）。需要精心设计提取 prompt，明确要求输出风格词汇，并设计三态状态机（pending/completed/failed）。

4. **系统预设保护仅在 UI 层** — DELETE API 必须在服务端校验 `isSystem` 标志，防止绕过 UI 直接删除系统预设。

5. **风格数量限制竞态条件** — `count() + create()` 模式需用 Prisma `$transaction` 包裹，防止并发请求绕过上限。

## Implications for Roadmap

基于研究，建议的阶段结构：

### Phase 1: 数据基础 + 解析器

**Rationale:** 所有其他工作依赖数据库表和正确的风格解析逻辑。两个 CRITICAL 级陷阱（静默失效 + 缓存脏数据）必须在此阶段消除，否则后续测试会给出错误信号。
**Delivers:** UserStyle Prisma 模型 + 迁移；`style-resolver.ts`（异步 `getStylePrompt()`）；废弃 `artStylePrompt` 缓存字段；风格标识符命名空间约定
**Addresses:** 向后兼容（现有 artStyle 值正常解析）
**Avoids:** Pitfall 1（静默失效）、Pitfall 2（缓存脏数据）

### Phase 2: 后端 CRUD API

**Rationale:** UI 开发依赖 API 合约。阶段 2 完成后，阶段 3（AI 提取）和阶段 4（UI）可并行开发。
**Delivers:** `/api/user-styles` GET/POST/PUT/DELETE；数量上限 Prisma 事务；服务端 `isSystem` 保护
**Uses:** Prisma（阶段 1 的 UserStyle 模型）、Next.js App Router
**Avoids:** Pitfall 4（服务端保护）、Pitfall 5（竞态条件）

### Phase 3: AI 参考图提取

**Rationale:** 依赖阶段 2 的 API 基础，但与阶段 4 UI 可并行（API 合约已定）。AI 提取是最高复杂度模块，需要独立阶段确保 prompt engineering 质量。
**Delivers:** `/api/user-styles/extract-from-image`；精准风格提取 LLM prompt；三态提取状态机；`lib/styles/style-extract-prompt.ts`
**Uses:** 现有 `llm-client.ts`、`chatCompletionWithVision()`
**Avoids:** Pitfall 3（内容描述而非风格描述）

### Phase 4: UI 层

**Rationale:** 依赖阶段 2 API，与阶段 3 可并行。UI 是用户可见交付物，完成后功能可端到端测试。
**Delivers:** `StyleCreateModal`（创建/编辑，含参考图上传）；`StyleSelector` 扩展（合并系统预设 + 用户风格）；`StyleManager`（风格库管理，可选独立路由）；`StyleTagSelector` 标签选择器
**Implements:** StyleSelector 扩展组件、StyleManager、StyleCreateModal

### Phase Ordering Rationale

- 阶段 1 必须最先：两个 CRITICAL 陷阱都在数据层，若不先修复，阶段 3、4 的测试全部会给出错误结果
- 阶段 2 在阶段 1 之后：CRUD API 依赖 UserStyle 表，且需要 `getStylePrompt()` 已完成才能端到端验证
- 阶段 3 和阶段 4 可并行：API 合约（阶段 2）确定后，AI 提取后端和 UI 前端没有相互依赖
- Worker 层调用点修改（将 `getArtStylePrompt()` 替换为 `getStylePrompt()`，约 7 处）放在阶段 1 末尾，或作为阶段 2 的第一步

### Research Flags

需要在规划阶段深入研究的阶段：
- **Phase 3（AI 提取）：** LLM prompt engineering 质量对用户体验影响极大，建议在实现前准备多组测试图片验证提取效果；提取延迟（3-10s）的 loading 状态设计需要 UX 决策

标准模式（可跳过 research-phase）：
- **Phase 1（数据层）：** Prisma 模型迁移是标准操作，有完整文档
- **Phase 2（CRUD API）：** 与现有 `api/asset-hub/` 模式完全一致，可直接参照
- **Phase 4（UI）：** 现有 StyleSelector 是直接扩展目标，模式清晰

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | 全部基于直接代码分析，现有文件逐一验证 |
| Features | HIGH | 基于代码库现有集成点分析，功能边界清晰 |
| Architecture | HIGH | 完整代码库分析，现有模式有直接参照 |
| Pitfalls | HIGH | 基于实际代码发现（非通用建议），调用点和字段逐一追踪 |

**Overall confidence:** HIGH

### Gaps to Address

- **LLM 提取 prompt 质量：** 已识别"内容 vs 风格"问题，但最优 prompt 需要实测迭代。建议阶段 3 开始时准备 5-10 张不同风格参考图进行 A/B 测试。
- **风格数量上限具体数值：** 研究确认需要上限，但未确定合理值（建议 20-50 个，需产品决策）。
- **`isArtStyleValue()` 类型守卫更新：** 现有类型守卫需扩展为支持常量值和 `"user:{uuid}"` 格式，影响范围需在实现阶段追踪。

## Sources

### Primary (HIGH confidence)
- 代码分析：`/src/lib/constants.ts` — 现有 ART_STYLES 结构与 `getArtStylePrompt()` 实现
- 代码分析：`/src/lib/config-service.ts` — ProjectModelConfig 优先级逻辑
- 代码分析：`/prisma/schema.prisma` — NovelPromotionProject、UserPreference、User 模型及 `artStylePrompt` 缓存字段
- 代码分析：`/src/lib/workers/handlers/panel-image-task-handler.ts` — artStyle 注入点（7 处调用）
- 代码分析：`/src/components/selectors/RatioStyleSelectors.tsx` — StyleSelector 现有接口
- 代码分析：`/src/app/api/asset-hub/upload-image/route.ts` — 现有 S3 上传模式
- 代码分析：`/src/lib/llm/vision.ts` — `chatCompletionWithVision()` 多 provider 支持

---
*Research completed: 2026-03-27*
*Ready for roadmap: yes*
