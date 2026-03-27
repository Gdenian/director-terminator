# Phase 7: AI 参考图提取 - Context

**Gathered:** 2026-03-27
**Status:** Ready for planning

<domain>
## Phase Boundary

实现用户上传参考图后 AI 自动提取风格描述草稿的功能。上传图片到 S3 → 异步调用 LLM Vision → 返回风格特征描述（而非内容描述）→ 用户可编辑草稿后保存为正式风格。涉及新增 API 端点、Worker 异步处理、状态追踪。

</domain>

<decisions>
## Implementation Decisions

### 状态追踪机制
- **D-43:** 提取状态通过 `extractionStatus` 字段追踪（添加到 UserStyle 表）
  - `pending`：提取中
  - `completed`：草稿就绪
  - `failed`：提取失败
  - Phase 9 UI 层根据此字段显示不同状态

### 上传流程
- **D-44:** 图片上传到 S3 路径 `user-styles/{userId}/{styleId}/ref.jpg`
  - 使用现有的 `uploadObject()` from `@/lib/storage`
  - 用户上传前先生成 placeholder style（带 pending 状态），获得 styleId 后上传图片

### 异步提取处理
- **D-45:** 提取作为 Bull Worker 异步任务处理
  - 新增 `style-extract.worker.ts` 处理 `style-extract` 队列
  - 任务接收 `styleId`、`userId`、图片 S3 URL
  - 完成后更新 `extractionStatus = 'completed'` 和 `promptZh`/`promptEn`

### 草稿工作流
- **D-46:** 先创建草稿风格记录（状态 pending）→ 用户上传图片 → 触发异步提取 → 草稿就绪后用户编辑保存
  - 流程：POST 创建 pending 记录 → 用户上传图片 → PUT 更新 referenceImageUrl 触发提取 → Worker 更新 prompt
  - 或者：POST 创建 pending + referenceImageUrl → 自动触发提取

### Prompt 设计
- **D-47:** 风格特征提取 Prompt
  - 指示 LLM 描述画风特征（线条、色调、光影、构图）而非画面内容
  - 分别输出中文（promptZh）和英文（promptEn）描述
  - 使用 `chatCompletionWithVision()` from `@/lib/llm/vision.ts`

### 错误处理
- **D-48:** 提取失败时 `extractionStatus = 'failed'`，记录错误信息
  - Worker 中捕获异常，更新状态为 failed 并记录 message
  - 前端显示错误提示和重试按钮

### LLM 模型选择
- **D-49:** 使用用户配置的分析模型（`analysisModel`）
  - `chatCompletionWithVision(userId, analysisModel, prompt, [imageUrl])`
  - 支持 Google/Ark/OpenAI 等多 provider

### Schema 变更
- **D-50:** UserStyle 表新增字段
  ```prisma
  extractionStatus String @default("pending") // pending | completed | failed
  extractionMessage String? // 失败时的错误信息
  ```
  - 现有 `referenceImageUrl` 字段已存在（Phase 1）

### Claude's Discretion
- 草稿风格是否需要独立表还是同一 UserStyle 表加状态字段
- 重试机制：失败后用户点击重试是否用相同图片重新提取
- 草稿是否有过期时间（7 天后自动删除）

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 存储
- `src/lib/storage/index.ts` — `uploadObject()` 函数，MinIO S3 上传

### LLM Vision
- `src/lib/llm/vision.ts` — `chatCompletionWithVision()` 函数，支持多 provider

### 现有 Schema
- `prisma/schema.prisma` — `UserStyle` 模型，`referenceImageUrl` 字段已存在

### API 模式
- `src/app/api/user-styles/route.ts` — Phase 5 CRUD API 模式参考
- `src/lib/api-errors.ts` — 错误处理模式
- `src/lib/api-auth.ts` — `requireUserAuth()` 认证模式

### Worker 模式
- `src/lib/workers/index.ts` — Bull queue worker 注册模式
- `src/lib/workers/handlers/*.ts` — 现有 worker handler 参考

### Phase 上下文
- `.planning/phases/01-userstyle/01-CONTEXT.md` — D-01~D-09 数据模型决策
- `.planning/phases/05-crud-api/05-CONTEXT.md` — D-30~D-38 CRUD API 决策

</canonical_refs>

<codebase_context>
## Existing Code Insights

### Reusable Assets
- `chatCompletionWithVision(userId, model, textPrompt, imageUrls)` — 已有 LLM Vision 支持
- `uploadObject(body, key, contentType)` — 已有 S3 上传函数
- `requireUserAuth()` — 已有认证模式
- Bull Worker 模式 — 现有 worker handlers 供参考

### Integration Points
- Phase 9 UI（StyleCreateModal）会调用提取 API 并展示状态
- Worker 更新 DB 后，前端通过轮询或 SWR 刷新状态

</codebase_context>

<specifics>
## Specific Ideas

- **S3 路径**：`user-styles/{userId}/{styleId}/ref.jpg`
- **Prompt 示例**：「请描述这张图片的视觉风格特征，如线条类型、上色方式、光影处理、构图风格等（不要描述图片内容）」
- **重试**：用户可重新上传同一图片或新图片，触发重新提取

</specifics>

<deferred>
## Deferred Ideas

- 草稿过期自动删除 — 7 天后清理未保存的 pending 风格
- 预定义风格标签列表 `ART_TAGS` — Phase 9 范围

</deferred>

---

*Phase: 07-ai*
*Context gathered: 2026-03-27*
