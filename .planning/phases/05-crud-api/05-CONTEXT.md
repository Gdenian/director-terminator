# Phase 5: 风格 CRUD API - Context

**Gathered:** 2026-03-27
**Status:** Ready for planning

<domain>
## Phase Boundary

实现 `/api/user-styles` CRUD API 端点（POST/GET/PUT/DELETE），用户可创建、读取、更新、删除自定义风格。认证保护、isSystem 系统预设检查、数量上限 `$transaction` 保护。Phase 5 不处理标签功能（Phase 6）、参考图上传（Phase 7）、StyleSelector 混合展示（Phase 8）。

</domain>

<decisions>
## Implementation Decisions

### API 路由结构
- **D-30:** 路由路径为 `/api/user-styles`
  - POST `/api/user-styles` — 创建新风格
  - GET `/api/user-styles` — 列出当前用户所有自定义风格
  - PUT `/api/user-styles/:id` — 更新指定风格
  - DELETE `/api/user-styles/:id` — 删除指定风格

### 认证与鉴权
- **D-31:** 所有端点需要认证，未登录返回 401
  - 使用 `requireUserAuth()` 模式（与 user-preference API 一致）
  - 用户 ID 从 `session.user.id` 获取

### 数量上限保护
- **D-32:** 风格数量上限使用 `$transaction` 保护
  - Phase 2 D-13 确立：`$transaction` 包裹计数检查和插入
  - 上限具体数值（TBD）：待产品决策（Phase 2 deferred: 20-50）
  - 超限时返回 422 Unprocessable Entity

### 系统预设保护
- **D-33:** DELETE/PUT 调用 `assertUserStyleNotSystem(id, userId)`（Phase 3 D-18 已实现）
  - 保护顺序：先查记录 → 验证属于当前用户 → 检查 isSystem → 执行
  - Phase 3 D-22/D-23 已确立此顺序
  - 403 Forbidden 响应码（Phase 3 D-19: 使用 `FORBIDDEN`，不用 `STYLE_SYSTEM_NOT_MODIFIABLE`）

### 创建时提示词验证
- **D-34:** 创建风格后调用 `resolveStylePrompt()` 验证提示词可解析
  - 自定义风格创建后应能通过 `resolveStylePrompt("user:uuid", userId, locale)` 返回非空
  - 返回空则视为创建失败（数据异常，应记录警告但不阻塞返回）

### 风格名称唯一性
- **D-35:** 风格名称重复时 Prisma 唯一索引抛出 `PrismaClientKnownRequestError`
  - Phase 1 D-03：userId + name 联合唯一索引已建立
  - API 层捕获 `P2002` 错误，返回 409 Conflict

### 响应字段过滤
- **D-36:** API 响应中不返回 `isSystem` 字段
  - isSystem 是内部保护字段，客户端不应感知
  - 查询时显式 `select` 所需字段

### Schema 验证
- **D-37:** 使用 Zod 进行请求体验证
  - 创建/更新时对请求体进行 Schema 验证
  - 遵循项目规范：使用 `zod` 而非手动验证

### UUID 格式
- **D-38:** 创建时使用 `uuid()` 生成风格 ID（Prisma `@default(uuid())`）
  - Phase 1 D-05：`"user:{uuid}"` 格式标识符通过 `toUserStyleIdentifier(id)` 生成

### Claude's Discretion
- `style-service.ts` 中是否需要独立的 count 函数，还是在 API 层直接用 Prisma count
- 参考图 URL 格式验证规则（是否为有效 S3 URL）
- 日志策略：创建/删除操作是否需要审计日志

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 风格系统
- `src/lib/styles/style-resolver.ts` — Phase 2 创建的 `resolveStylePrompt(artStyle, userId, locale)` 函数
- `src/lib/styles/style-service.ts` — Phase 3 创建的 `assertUserStyleNotSystem(id, userId)` 保护函数
- `src/lib/styles/style-namespace.ts` — Phase 1 创建的 `isUserStyle` / `extractUserStyleId` / `toUserStyleIdentifier` 工具函数

### Schema
- `prisma/schema.prisma` — `UserStyle` 模型（含 `isSystem`、`userId+name` 联合唯一索引）

### API 模式
- `src/lib/api-errors.ts` — `ApiError` 类和 `apiHandler` 包装器
- `src/lib/api-auth.ts` — `requireUserAuth()` 和 `isErrorResponse` helper
- `src/app/api/user-preference/route.ts` — API 路由模式和 Zod 验证参考（目前无 Zod 但项目有 zod 依赖）

### Phase 上下文
- `.planning/phases/01-userstyle/01-CONTEXT.md` — D-01~D-09 数据模型和命名空间决策
- `.planning/phases/02-style-resolver/02-CONTEXT.md` — D-10~D-15 解析器决策，D-13 事务边界
- `.planning/phases/03-backward-compat/03-CONTEXT.md` — D-16~D-23 系统保护和 API 契约

</canonical_refs>

<codebase_context>
## Existing Code Insights

### Reusable Assets
- `assertUserStyleNotSystem()` — Phase 3 保护函数，直接 import 使用
- `toUserStyleIdentifier(id)` — 生成 `"user:uuid"` 格式标识符
- `prisma` client — UserStyle CRUD 操作
- `requireUserAuth()` — 认证模式，API route 入口处调用

### Established Patterns
- `apiHandler` wrapper：统一错误处理，接收 async 函数返回 `NextResponse`
- `requireUserAuth()`：返回 `NextResponse` 或 `{ session }`，需先检查 `isErrorResponse`
- Prisma `select` 明确字段：避免返回不需要的字段（如 isSystem）
- `P2002` Prisma 错误码：唯一索引冲突检测

### Integration Points
- StyleSelector（Phase 8）调用 GET `/api/user-styles` 获取用户风格列表
- Worker handler（Phase 4）通过 `resolveStylePrompt` 消费风格数据

</codebase_context>

<specifics>
## Specific Ideas

- **数量上限默认值**：若产品未及时决策，上限建议默认值 20（Phase 2 deferred）
- **参考图路径**：`user-styles/{userId}/{styleId}/ref.jpg`（Phase 7 实际使用 S3 路径）

</specifics>

<deferred>
## Deferred Ideas

### 产品决策待定
- **风格数量上限具体数值（20-50）**：必须在 Phase 5 实现前确定，当前建议默认 20

### 其他 Phase 范围
- 风格标签功能 — Phase 6
- 参考图上传和 AI 提取 — Phase 7
- StyleSelector 混合展示 — Phase 8

</deferred>

---

*Phase: 05-crud-api*
*Context gathered: 2026-03-27*
