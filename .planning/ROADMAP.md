# Roadmap: 导演终结者 — 自定义风格系统

## Overview

本次迭代将硬编码的预设风格系统升级为通用自定义风格系统。构建顺序严格遵循依赖关系：先建立数据基础和解析器（消除两个 CRITICAL 陷阱），再做后端 API，最后交付 AI 提取和 UI 层。数据层和解析器必须最先完成，否则后续所有测试都会给出错误信号。

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: UserStyle 数据模型** - 新增 UserStyle Prisma 模型和数据库迁移，建立风格命名空间约定
- [x] **Phase 2: 风格解析器重构** - 用异步 getStylePrompt() 替换同步 getArtStylePrompt()，废弃缓存字段 (completed 2026-03-27)
- [ ] **Phase 3: 向后兼容与系统预设保护** - 确保现有项目 artStyle 数据不损坏，系统预设服务端写保护
- [ ] **Phase 4: Worker 层集成** - 所有 Worker handler 调用点切换到新解析器
- [ ] **Phase 5: 风格 CRUD API** - 创建/编辑/删除风格的后端端点，含数量限制事务保护
- [ ] **Phase 6: 风格标签 API** - 标签数据结构和查询支持
- [ ] **Phase 7: AI 参考图提取** - 上传参考图并通过 LLM Vision 提取风格描述草稿
- [ ] **Phase 8: StyleSelector 扩展** - 混合展示系统预设和用户自定义风格
- [ ] **Phase 9: 风格管理 UI** - StyleManager 风格库、StyleCreateModal 创建/编辑、StyleTagSelector 标签选择

## Phase Details

### Phase 1: UserStyle 数据模型
**Goal**: 数据库中存在 UserStyle 表，风格命名空间约定确立，后续所有工作有了数据基础
**Depends on**: Nothing (first phase)
**Requirements**: DATA-01, DATA-02
**Success Criteria** (what must be TRUE):
  1. `prisma migrate dev` 成功运行，UserStyle 表在数据库中存在
  2. UserStyle 记录可以关联到 User，包含 name、promptZh、promptEn、tags、referenceImageUrl 字段
  3. 系统预设风格标识符（如 `"american-comic"`）与自定义风格标识符（如 `"user:uuid"`）格式可通过前缀区分
  4. Prisma Client 已重新生成，TypeScript 类型完整可用
**Plans**: 2 plans
Plans:
- [ ] 01-userstyle-01-PLAN.md — Prisma schema 新增 UserStyle 模型，执行数据库迁移，重新生成 Prisma Client
- [ ] 01-userstyle-02-PLAN.md — TDD 实现命名空间工具函数（isUserStyle / extractUserStyleId / toUserStyleIdentifier）

### Phase 2: 风格解析器重构
**Goal**: 风格提示词查询路径统一且正确，消除静默失效和缓存脏数据两个 CRITICAL 风险
**Depends on**: Phase 1
**Requirements**: DATA-03, DATA-04, INTEG-04
**Success Criteria** (what must be TRUE):
  1. `lib/styles/style-resolver.ts` 中 `getStylePrompt()` 为异步函数，能正确解析系统预设和用户自定义两类标识符
  2. 传入 `"american-comic"` 等旧标识符时返回正确的提示词（向后兼容验证）
  3. 传入 `"user:uuid"` 格式标识符时查询数据库返回对应风格的提示词
  4. `artStylePrompt` 缓存字段已废弃，不再向该字段写入任何数据（读取路径的移除属于 Phase 3 范围）
  5. 风格创建操作使用 Prisma `$transaction` 包裹数量检查和插入，防止竞态条件
**Plans**: 1 plan
Plans:
- [x] 02-01-PLAN.md — TDD 创建异步 resolveStylePrompt() 解析器 + 移除 analyze-novel.ts 中 artStylePrompt 写入路径

### Phase 3: 向后兼容与系统预设保护
**Goal**: 现有所有项目数据完全不受影响，系统预设在 API 层有服务端写保护
**Depends on**: Phase 2
**Requirements**: INTEG-01, INTEG-02
**Success Criteria** (what must be TRUE):
  1. 数据库中所有现有项目的 `artStyle` 字段值（`"american-comic"` 等）经新解析器解析后与原来结果一致
  2. 4 个系统预设风格在 StyleSelector 中始终可见且不可删除（UI 层禁用删除按钮）
  3. DELETE `/api/user-styles/:id` 对系统预设 ID 调用时返回 403，服务端拒绝操作
  4. PUT `/api/user-styles/:id` 对系统预设 ID 调用时返回 403，服务端拒绝编辑
**Plans**: 1 plan
Plans:
- [x] 03-01-PLAN.md — TDD 实现向后兼容集成测试（8 断言）+ assertUserStyleNotSystem 保护函数 + artStylePrompt 废弃标记

### Phase 4: Worker 层集成
**Goal**: 图片生成流程使用新解析器，自定义风格的提示词能正确注入到 AI 生成请求中
**Depends on**: Phase 2, Phase 3
**Requirements**: INTEG-05
**Success Criteria** (what must be TRUE):
  1. `panel-image-task-handler.ts` 中全部 7 处 `getArtStylePrompt()` 调用已替换为异步 `getStylePrompt()`
  2. 使用系统预设风格生成图片时，提示词注入结果与重构前完全一致
  3. 使用自定义风格（`"user:uuid"` 标识符）时，图片生成请求中包含该风格的提示词内容
  4. Worker handler 编译无 TypeScript 错误，现有测试通过
**Plans**: TBD

### Phase 5: 风格 CRUD API
**Goal**: 用户可以通过 API 完整管理自定义风格的生命周期，数量上限得到可靠保护
**Depends on**: Phase 1, Phase 2
**Requirements**: STYLE-01, STYLE-02, STYLE-03, STYLE-04, STYLE-06
**Success Criteria** (what must be TRUE):
  1. POST `/api/user-styles` 成功创建风格并返回新风格记录（含 id）
  2. GET `/api/user-styles` 返回当前用户的所有自定义风格列表
  3. PUT `/api/user-styles/:id` 成功更新名称和提示词
  4. DELETE `/api/user-styles/:id` 成功删除风格，后续 GET 不再返回该条目
  5. 当用户风格数量达到上限时，POST 返回 422 并包含明确错误信息（不创建新记录）
  6. 所有端点需要认证，未登录用户收到 401
**Plans**: TBD

### Phase 6: 风格标签 API
**Goal**: 用户可以给风格打标签，标签数据可存储和查询
**Depends on**: Phase 5
**Requirements**: STYLE-05
**Success Criteria** (what must be TRUE):
  1. 创建或编辑风格时可以传入标签数组，标签正确持久化
  2. GET `/api/user-styles` 返回的每条风格记录包含 tags 字段
  3. 标签值支持中文和英文（如"写实"、"动漫"、"抽象"）
**Plans**: TBD

### Phase 7: AI 参考图提取
**Goal**: 用户上传参考图后 AI 自动产出风格描述草稿，用户可编辑后保存
**Depends on**: Phase 5
**Requirements**: EXTRACT-01, EXTRACT-02, EXTRACT-03, EXTRACT-04
**Success Criteria** (what must be TRUE):
  1. 用户可以上传图片文件，图片存储到 S3 路径 `user-styles/{userId}/{styleId}/ref.jpg`
  2. 上传后系统调用 LLM Vision，返回的提示词描述的是风格特征（如"赛璐璐上色，硬边线条"）而非图片内容（如"一个女孩"）
  3. AI 提取状态在前端有三态追踪：pending（提取中）、completed（草稿就绪）、failed（提取失败）
  4. 用户可以在 completed 状态下编辑 AI 生成的草稿后保存为正式风格
  5. 提取失败时用户看到明确错误提示，可重试
**UI hint**: yes
**Plans**: TBD

### Phase 8: StyleSelector 扩展
**Goal**: 用户在选择风格时能在同一个选择器中看到系统预设和自己创建的自定义风格
**Depends on**: Phase 5, Phase 3
**Requirements**: INTEG-03
**Success Criteria** (what must be TRUE):
  1. StyleSelector 组件展示 4 个系统预设风格（始终位于列表顶部）
  2. StyleSelector 组件在系统预设之后展示当前用户的自定义风格
  3. 选中自定义风格后，项目的 `artStyle` 字段保存 `"user:uuid"` 格式标识符
  4. 当用户没有自定义风格时，StyleSelector 仅展示系统预设，不显示空分组
**UI hint**: yes
**Plans**: TBD

### Phase 9: 风格管理 UI
**Goal**: 用户有完整的 UI 界面来创建、编辑、删除自定义风格，包含参考图上传和标签选择
**Depends on**: Phase 6, Phase 7, Phase 8
**Requirements**: (所有 STYLE 和 EXTRACT 需求通过本阶段 UI 对用户可见地完成交付)
**Success Criteria** (what must be TRUE):
  1. 用户可以打开风格管理页面，看到自己所有自定义风格的列表（含标签和参考图缩略图）
  2. 用户可以点击"新建风格"，填写名称、提示词和标签后保存
  3. 用户可以在创建/编辑弹窗中上传参考图，等待 AI 提取草稿，编辑草稿后保存
  4. 用户可以编辑已有风格（名称、提示词、标签）
  5. 用户可以删除自定义风格，删除后风格列表立即更新
  6. 用户风格数量达到上限时，"新建风格"按钮禁用并显示上限提示文案
**UI hint**: yes
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. UserStyle 数据模型 | 0/TBD | Not started | - |
| 2. 风格解析器重构 | 1/1 | Complete    | 2026-03-27 |
| 3. 向后兼容与系统预设保护 | 0/1 | Not started | - |
| 4. Worker 层集成 | 0/TBD | Not started | - |
| 5. 风格 CRUD API | 0/TBD | Not started | - |
| 6. 风格标签 API | 0/TBD | Not started | - |
| 7. AI 参考图提取 | 0/TBD | Not started | - |
| 8. StyleSelector 扩展 | 0/TBD | Not started | - |
| 9. 风格管理 UI | 0/TBD | Not started | - |
