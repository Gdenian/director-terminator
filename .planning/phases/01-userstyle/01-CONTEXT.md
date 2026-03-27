# Phase 1: UserStyle 数据模型 - Context

**Gathered:** 2026-03-27
**Status:** Ready for planning

<domain>
## Phase Boundary

新增 UserStyle Prisma 模型和数据库迁移，建立风格命名空间约定。这是所有后续工作的数据基础 — 后续 Phase 的 API、解析器、UI 都依赖此模型。

</domain>

<decisions>
## Implementation Decisions

### Schema 设计
- **D-01:** UserStyle 模型包含字段：id (uuid), userId (关联 User), name (风格名称), promptZh (中文提示词, Text), promptEn (英文提示词, Text), tags (JSON 数组存储标签), referenceImageUrl (参考图 S3 路径, 可空), isSystem (布尔, 默认 false), createdAt, updatedAt
- **D-02:** tags 字段使用 JSON 类型存储字符串数组（如 `["写实", "电影感"]`），不建单独标签表 — 风格数量有限，JSON 查询足够
- **D-03:** 添加 userId + name 联合唯一索引，防止同一用户创建重名风格
- **D-04:** 添加 userId 索引，优化按用户查询风格列表

### 命名空间约定
- **D-05:** 自定义风格标识符格式为 `"user:{uuid}"`，其中 uuid 是 UserStyle 记录的 id
- **D-06:** 系统预设标识符保持原有裸字符串格式（如 `"american-comic"`），不入库
- **D-07:** 判断逻辑：`artStyle.startsWith("user:")` 为自定义风格，否则为系统预设

### 关系建模
- **D-08:** UserStyle 与 User 为多对一关系（一个用户有多个风格），通过 userId 外键关联
- **D-09:** 现有 artStyle 字段（NovelPromotionProject、UserPreference 等）保持 String 类型不变，存储标识符字符串，不建外键 — 因为标识符可能是预设值也可能是 `"user:uuid"`

### Claude's Discretion
- Prisma migration 文件命名
- 具体的 `@@map` 表名选择
- 是否需要 soft delete（deletedAt）字段

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 数据模型
- `prisma/schema.prisma` — 现有数据模型定义，参考 User、UserPreference、NovelPromotionProject 模型的字段命名和关系建模模式
- `.planning/research/ARCHITECTURE.md` — 架构研究，包含 UserStyle 数据模型设计建议和前缀命名空间方案

### 风格系统
- `src/lib/constants.ts` — 现有 ART_STYLES 常量定义和 getArtStylePrompt() 函数，理解现有风格数据结构

### 研究发现
- `.planning/research/PITFALLS.md` — Pitfall 1 和 2 是 CRITICAL 风险，Phase 1 的数据模型需为 Phase 2 的解析器重构做好准备

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `prisma/schema.prisma` 中现有模型遵循一致的命名模式：uuid id、createdAt/updatedAt 时间戳、@@map 映射表名
- `User` 模型已有关系定义模式（如 UserPreference、UserBalance），UserStyle 关系可照搬

### Established Patterns
- 所有模型使用 `@id @default(uuid())` 生成主键
- 时间戳使用 `@default(now())` 和 `@updatedAt`
- 表名通过 `@@map("snake_case")` 映射
- JSON 字段使用 `@db.Json` 类型

### Integration Points
- `User` 模型需要添加 `styles UserStyle[]` 关系字段
- 现有 `artStyle String` 字段（4处）保持不变，仅在值层面支持新的 `"user:uuid"` 格式

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches following existing Prisma patterns.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-userstyle*
*Context gathered: 2026-03-27*
