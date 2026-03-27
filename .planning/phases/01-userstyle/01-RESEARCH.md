# Phase 1: UserStyle 数据模型 - Research

**Researched:** 2026-03-27
**Domain:** Prisma Schema 扩展 + MySQL 数据库迁移 + 风格命名空间约定
**Confidence:** HIGH（基于实际代码库分析 + Prisma 官方文档）

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** UserStyle 模型包含字段：id (uuid), userId (关联 User), name (风格名称), promptZh (中文提示词, Text), promptEn (英文提示词, Text), tags (JSON 数组存储标签), referenceImageUrl (参考图 S3 路径, 可空), isSystem (布尔, 默认 false), createdAt, updatedAt
- **D-02:** tags 字段使用 JSON 类型存储字符串数组（如 `["写实", "电影感"]`），不建单独标签表 — 风格数量有限，JSON 查询足够
- **D-03:** 添加 userId + name 联合唯一索引，防止同一用户创建重名风格
- **D-04:** 添加 userId 索引，优化按用户查询风格列表
- **D-05:** 自定义风格标识符格式为 `"user:{uuid}"`，其中 uuid 是 UserStyle 记录的 id
- **D-06:** 系统预设标识符保持原有裸字符串格式（如 `"american-comic"`），不入库
- **D-07:** 判断逻辑：`artStyle.startsWith("user:")` 为自定义风格，否则为系统预设
- **D-08:** UserStyle 与 User 为多对一关系（一个用户有多个风格），通过 userId 外键关联
- **D-09:** 现有 artStyle 字段（NovelPromotionProject、UserPreference 等）保持 String 类型不变，存储标识符字符串，不建外键

### Claude's Discretion

- Prisma migration 文件命名
- 具体的 `@@map` 表名选择
- 是否需要 soft delete（deletedAt）字段

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.

</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DATA-01 | 新增 UserStyle 数据库模型，关联用户，存储风格信息 | Prisma schema 扩展模式已确认，User 模型关系字段添加方式清晰 |
| DATA-02 | 使用前缀命名空间方案（如 "user:uuid"）区分预设和自定义风格标识符 | 现有 artStyle 字段保持 String 不变，命名空间逻辑在应用层实现 |

</phase_requirements>

---

## Summary

Phase 1 是整个自定义风格系统的数据基础，工作范围精确且边界清晰：向 `prisma/schema.prisma` 新增 `UserStyle` 模型，更新 `User` 模型添加反向关系字段，执行数据库迁移，重新生成 Prisma Client。

现有项目使用 Prisma 6.19.2 + MySQL + Next.js，schema 中所有模型遵循一致的约定（uuid 主键、`@@map` snake_case 表名、`@default(now()) @updatedAt` 时间戳、`@db.Text` 长文本、`@db.Json` JSON 字段）。这些约定已在代码库中多处体现（Account、CharacterAppearance、UserPreference 等），UserStyle 模型需严格照搬。

命名空间约定（`"user:{uuid}"` vs 裸字符串）是纯应用层约定，不涉及数据库结构变更——现有 4 处 `artStyle String` 字段保持原样，仅在值的语义上扩展支持新格式。这保证了零数据迁移风险。

**主要建议：** 严格遵循现有模型约定添加 UserStyle 模型，`tags` 字段使用 `String? @db.Text` 存储 JSON 字符串（MySQL 兼容方式），迁移文件名使用时间戳前缀。

---

## Standard Stack

### Core

| 库 | 版本 | 用途 | 说明 |
|----|------|------|------|
| prisma | 6.19.2 | Schema 定义、迁移、Client 生成 | 项目已安装，直接使用 |
| @prisma/client | 6.19.2 | TypeScript 类型、DB 查询 | 迁移后需重新 generate |
| MySQL | — | 数据库（datasource provider） | 项目现有数据库 |

### 操作命令

```bash
# 添加模型后执行迁移（开发环境）
npx prisma migrate dev --name add_user_style

# 重新生成 Prisma Client（迁移后自动执行，也可手动）
npx prisma generate

# 验证 schema 语法
npx prisma validate

# 查看数据库当前状态
npx prisma db pull --print
```

---

## Architecture Patterns

### 现有 Schema 约定（HIGH 置信度，直接来自代码分析）

项目 schema 中所有模型遵循以下一致约定：

```prisma
model ExampleModel {
  id        String   @id @default(uuid())          // 1. UUID 主键
  userId    String                                  // 2. 外键字段（纯 String）
  name      String                                  // 3. 普通字段无注解
  content   String?  @db.Text                       // 4. 长文本用 @db.Text
  jsonField String?  @db.Text                       // 5. JSON 也用 @db.Text（MySQL 兼容）
  boolFlag  Boolean  @default(false)                // 6. 布尔有默认值
  createdAt DateTime @default(now())                // 7. 标准时间戳
  updatedAt DateTime @default(now()) @updatedAt     // 8. 更新时间戳

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, name])   // 联合唯一索引
  @@index([userId])          // 单字段索引
  @@map("snake_case_name")   // 表名映射
}
```

**关键细节：** 项目使用 MySQL，`@db.Json` 与 `String @db.Text` 均可存 JSON。查看现有代码（`NovelPromotionPanel.actingNotes`、`VideoEditorProject.projectData` 等），**JSON 数据统一使用 `String? @db.Text`** 而非 `@db.Json` — 这是项目既有选择，UserStyle.tags 应沿用此约定。

### UserStyle 模型（完整定义）

```prisma
model UserStyle {
  id                String   @id @default(uuid())
  userId            String
  name              String
  promptZh          String   @db.Text
  promptEn          String   @db.Text
  tags              String?  @db.Text       // JSON 数组，如 ["写实", "动漫"]，与项目其他 JSON 字段一致
  referenceImageUrl String?  @db.Text       // S3 路径，可空
  isSystem          Boolean  @default(false)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @default(now()) @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, name])    // D-03: 防止同一用户重名
  @@index([userId])           // D-04: 优化按用户查询
  @@map("user_styles")
}
```

### User 模型需要添加反向关系字段

在 `model User` 的关系字段区块末尾添加：

```prisma
// 在 User 模型中（现有 graphEvents GraphEvent[] 行之后添加）
styles UserStyle[]
```

### 命名空间约定（应用层，非 DB 层）

```typescript
// 判断是否为自定义风格（Phase 2 使用，Phase 1 确立约定）
const isUserStyle = (artStyle: string) => artStyle.startsWith('user:')

// 自定义风格标识符格式
const toUserStyleId = (styleId: string) => `user:${styleId}`

// 从标识符提取 UserStyle ID
const extractStyleId = (artStyle: string) => artStyle.slice('user:'.length)
```

### 推荐 `@@map` 表名

`user_styles` — 与项目现有约定（user_preferences、novel_promotion_projects）保持一致。

### Soft Delete 建议（Claude's Discretion）

**不建议添加 `deletedAt` 字段。** 理由：
- 风格数量有上限（用户级别），已删除风格不影响历史记录（artStyle 存的是标识符，已选风格的项目不会因风格删除而受影响）
- 增加软删除会让 Phase 2 的 API 逻辑复杂化（每次查询需过滤）
- 项目其他模型均无软删除（使用 `onDelete: Cascade`）
- 若风格被删除，Worker 层 `getStylePrompt("user:uuid")` 查不到时返回空字符串，行为已有定义

### 迁移文件命名（Claude's Discretion）

使用 `--name add_user_style`，Prisma 自动添加时间戳前缀，生成类似：

```
prisma/migrations/20260327000000_add_user_style/migration.sql
```

---

## Don't Hand-Roll

| 问题 | 不要自己做 | 用什么 | 原因 |
|------|-----------|--------|------|
| UUID 生成 | 自写 uuid() 函数 | Prisma `@default(uuid())` | Schema 层原生支持 |
| 迁移版本管理 | 手写 SQL | `prisma migrate dev` | 自动追踪迁移历史、回滚支持 |
| TypeScript 类型 | 手写 UserStyle 接口 | `prisma generate` 后的 `PrismaClient` 类型 | 自动生成，始终与 schema 同步 |
| 关系完整性 | 应用层检查孤立记录 | `onDelete: Cascade` | 数据库级别保证 |

---

## Common Pitfalls

### Pitfall 1: `tags` 字段类型选择错误

**什么问题：** 使用 `@db.Json` 而非 `String? @db.Text`。

**为什么发生：** 直觉上 JSON 数组该用 Json 类型，但项目所有 JSON 字段（actingNotes、projectData、speakerVoices 等）均使用 `String @db.Text`，这是既有约定。

**如何避免：** 对照现有模型：`VideoEditorProject.projectData String @db.Text`、`NovelPromotionPanel.actingNotes String? @db.Text`。tags 使用同样方式。

**警告信号：** 若写成 `@db.Json`，schema validate 通过但与项目其他 JSON 字段处理方式不一致，可能在应用层造成类型不一致。

### Pitfall 2: 忘记在 User 模型添加反向关系字段

**什么问题：** 只在 UserStyle 添加 `user User @relation(...)` 但未在 User 模型添加 `styles UserStyle[]`。

**为什么发生：** Prisma 要求双向声明关系，单侧关系会导致 `prisma validate` 报错。

**如何避免：** 同时修改两个模型。参考现有模式：`User.preferences UserPreference?` 与 `UserPreference.user User @relation(...)` 成对出现。

**警告信号：** `npx prisma validate` 报 "The relation field ... is missing an opposite relation field"。

### Pitfall 3: 迁移后忘记重新生成 Client

**什么问题：** `prisma migrate dev` 执行成功，但 TypeScript 代码仍使用旧 Client，`prisma.userStyle` 未定义。

**为什么发生：** `migrate dev` 在交互式终端会自动触发 generate，但在 CI 或某些环境下可能不会。

**如何避免：** 迁移后显式执行 `npx prisma generate`，验证 `.prisma/client` 中包含 `UserStyle` 类型。

**警告信号：** TypeScript 报 `Property 'userStyle' does not exist on type 'PrismaClient'`。

### Pitfall 4: userId + name 联合唯一约束理解偏差

**什么问题：** 误以为 `name` 字段全局唯一，实际上约束是"同一用户不能有同名风格"。

**如何避免：** 使用 `@@unique([userId, name])` 而非 `name String @unique`。

### Pitfall 5: onDelete 策略选择

**什么问题：** 若选择 `onDelete: Restrict`，删除用户时会因 UserStyle 存在而报错。

**如何避免：** 使用 `onDelete: Cascade`，与项目其他用户关联模型（Account、Project、UserPreference）保持一致。

---

## Code Examples

### 完整 schema 改动示例

```prisma
// 来源：基于现有 prisma/schema.prisma 约定
// 在 schema.prisma 末尾（或字母序合适位置）添加：

model UserStyle {
  id                String   @id @default(uuid())
  userId            String
  name              String
  promptZh          String   @db.Text
  promptEn          String   @db.Text
  tags              String?  @db.Text
  referenceImageUrl String?  @db.Text
  isSystem          Boolean  @default(false)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @default(now()) @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, name])
  @@index([userId])
  @@map("user_styles")
}
```

```prisma
// 在 model User 中，graphEvents GraphEvent[] 行之后添加：
styles UserStyle[]
```

### 迁移验证（迁移后执行）

```bash
# 验证迁移成功
npx prisma migrate status

# 验证 UserStyle 表存在（MySQL）
npx prisma db pull --print | grep -A 20 "user_styles"

# 验证 TypeScript 类型可用
npx tsc --noEmit
```

### 命名空间工具函数（Phase 1 确立，供后续 Phase 使用）

```typescript
// 位置：src/lib/styles/style-namespace.ts
// 这是 Phase 1 确立的约定，后续 Phase 的解析器基于此构建

/**
 * 判断风格标识符是否为用户自定义风格
 */
export function isUserStyle(artStyle: string): boolean {
  return artStyle.startsWith('user:')
}

/**
 * 从用户风格标识符中提取 UserStyle ID
 * 仅在 isUserStyle() 返回 true 时调用
 */
export function extractUserStyleId(artStyle: string): string {
  return artStyle.slice('user:'.length)
}

/**
 * 将 UserStyle ID 转换为风格标识符
 */
export function toUserStyleIdentifier(styleId: string): string {
  return `user:${styleId}`
}
```

---

## State of the Art

| 旧方式 | 当前方式 | 说明 |
|--------|----------|------|
| `getArtStylePrompt()` 同步常量查找 | Phase 2 将改为异步 `resolveStylePrompt()` | Phase 1 不动此函数，仅建立数据基础 |
| `artStyle` 只接受预设值 | 扩展支持 `"user:uuid"` 格式 | 应用层约定，DB 字段类型不变 |

---

## Open Questions

1. **`isSystem` 字段的使用场景**
   - 当前决策（D-01）包含 `isSystem Boolean @default(false)` 字段
   - 由于系统预设不入库（D-06），`isSystem = true` 的记录理论上不会存在
   - 建议：保留字段（为未来预留），Phase 1 不需要使用它
   - 该字段不影响迁移和 Phase 2 的 API 逻辑

---

## Environment Availability

| 依赖 | 需要 | 可用 | 版本 | 说明 |
|------|------|------|------|------|
| Node.js | prisma 命令 | ✓ | v25.5.0 | 满足要求 |
| Prisma CLI | 迁移执行 | ✓ | 6.19.2 | 已安装 |
| @prisma/client | Client 生成 | ✓ | 6.19.2 | 已安装 |
| MySQL | 数据库迁移 | 需运行时验证 | — | 依赖 DATABASE_URL 环境变量，本地开发环境需要 MySQL 运行 |

**注意：** `prisma migrate dev` 需要 `DATABASE_URL` 环境变量正确配置且 MySQL 服务运行中。执行前确认 `.env` 文件存在且 DB 可连接。

---

## Validation Architecture

### Test Framework

| 属性 | 值 |
|------|-----|
| Framework | Vitest 6.x（vitest.config.ts） |
| Config file | `/vitest.config.ts` (存在) |
| Quick run command | `npx vitest run tests/unit/` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map

| Req ID | 行为 | 测试类型 | 自动化命令 | 文件状态 |
|--------|------|---------|------------|---------|
| DATA-01 | UserStyle 表在 DB 中存在，可写入读取记录 | integration | `npx vitest run tests/integration/` | ❌ Wave 0 需创建 |
| DATA-01 | UserStyle 记录可关联 User，字段齐全 | integration | `npx vitest run tests/integration/user-style.test.ts` | ❌ Wave 0 需创建 |
| DATA-02 | `isUserStyle("user:uuid")` 返回 true | unit | `npx vitest run tests/unit/style-namespace.test.ts` | ❌ Wave 0 需创建 |
| DATA-02 | `isUserStyle("american-comic")` 返回 false | unit | `npx vitest run tests/unit/style-namespace.test.ts` | ❌ Wave 0 需创建 |
| DATA-02 | `extractUserStyleId("user:abc-123")` 返回 "abc-123" | unit | `npx vitest run tests/unit/style-namespace.test.ts` | ❌ Wave 0 需创建 |

### Sampling Rate

- **Per task commit:** `npx vitest run tests/unit/style-namespace.test.ts`
- **Per wave merge:** `npx vitest run tests/unit/ && npx vitest run tests/integration/user-style.test.ts`
- **Phase gate:** `npx tsc --noEmit && npx vitest run`

### Wave 0 Gaps

- [ ] `tests/unit/style-namespace.test.ts` — 覆盖 DATA-02 命名空间工具函数
- [ ] `tests/integration/user-style.test.ts` — 覆盖 DATA-01 UserStyle CRUD 基础操作

---

## Project Constraints (from CLAUDE.md)

| 指令 | 类型 | 对 Phase 1 的影响 |
|------|------|------------------|
| 所有注释使用中文 | 编码规范 | Prisma schema 注释、工具函数注释需用中文 |
| 错误提示使用中文 | 编码规范 | 本 Phase 无用户可见错误，不影响 |
| 避免不必要的对象复制 | 性能 | 本 Phase 是 schema 变更，不涉及运行时逻辑 |
| 避免多层嵌套，提前返回 | 编码规范 | 命名空间工具函数应简洁，提前返回 |
| 一个函数只做一件事 | 可读性 | `isUserStyle`、`extractUserStyleId`、`toUserStyleIdentifier` 各自单一职责 |

---

## Sources

### Primary (HIGH confidence)
- 直接代码分析：`/prisma/schema.prisma` — 所有现有模型的命名约定、字段类型选择
- 直接代码分析：`/src/lib/constants.ts` — ART_STYLES 结构、getArtStylePrompt 函数签名
- 直接代码分析：`/vitest.config.ts` — 测试框架配置
- 项目 `package.json` + `npx prisma --version` — Prisma 6.19.2 版本已验证

### Secondary (MEDIUM confidence)
- `.planning/research/ARCHITECTURE.md` — 前期架构研究，UserStyle 模型设计建议
- `.planning/research/PITFALLS.md` — 前期陷阱研究，CRITICAL 风险分析

### Tertiary (LOW confidence)
- 无

---

## Metadata

**Confidence breakdown:**
- Schema 设计: HIGH — 直接检查现有 schema，约定清晰一致
- 命名空间约定: HIGH — D-05/D-06/D-07 已锁定，逻辑简单
- 迁移流程: HIGH — Prisma 6.19.2 标准流程，项目已有迁移记录
- 测试策略: MEDIUM — 测试框架已确认，但 Phase 1 集成测试需要 DB 连接，环境依赖需执行时验证

**Research date:** 2026-03-27
**Valid until:** 2026-04-27（Prisma 版本稳定，30 天有效）
