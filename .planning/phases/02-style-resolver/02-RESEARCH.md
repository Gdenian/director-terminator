# Phase 2: 风格解析器重构 - Research

**Researched:** 2026-03-27
**Domain:** 异步风格解析器实现 + artStylePrompt 缓存字段废弃
**Confidence:** HIGH（基于实际代码分析，所有决策已在 02-CONTEXT.md 锁定）

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-10:** `resolveStylePrompt(artStyle: string, userId: string, locale: 'zh' | 'en'): Promise<string | null>`
  - 系统预设（`"american-comic"` 等）：从 `ART_STYLES` 常量实时查找，userId 不参与查询
  - 用户自定义（`"user:uuid"` 格式）：通过 userId + uuid 查 `UserStyle` 表，取 `promptZh` 或 `promptEn`
  - 找不到时返回 `null`（非空字符串），调用方通过 `?? ''` 保持向后兼容
  - userId 作为必填参数 — Phase 5 CRUD API 调用时已携带 userId

- **D-11:** `NovelPromotionProject.artStylePrompt` 字段保留 schema 定义，但：
  - 所有 Worker handler 和 route handler 不再读取此字段
  - 不再写入此字段
  - Phase 3 确认无任何读取路径后，可在后续迁移中删除该字段

- **D-12:** 解析器对未知标识符（既不是已知预设也不是 `user:` 格式）返回 `null`
  - 调用方保持与原 `getArtStylePrompt()` 相同行为：`?? ''` 转为空字符串
  - 自定义风格 UUID 格式但数据库查不到记录时同样返回 `null`

- **D-13:** 风格数量限制的 `$transaction` 保护落在 Phase 5（CRUD API）
  - Phase 2 解析器本身不做数量检查，仅返回提示词
  - Phase 5 在调用 `prisma.userStyle.create()` 前用 `$transaction` 包裹计数检查

- **D-14:** 函数名 `resolveStylePrompt`（来自 ROADMAP.md Success Criteria 表述）
  - 位于 `src/lib/styles/style-resolver.ts`
  - 不改变原 `src/lib/constants.ts` 中的 `getArtStylePrompt()` — Phase 4 Worker 集成时统一替换

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

### Deferred Ideas (OUT OF SCOPE)

- 风格数量上限具体数值（20-50）—— Phase 5 实现前必须产品决策
- 解析器缓存层（LRU）—— Phase 2 不做，Phase 4 Worker 集成后按需评估

</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| INTEG-04 | 统一风格解析器 resolveStylePrompt 替代 getArtStylePrompt，支持预设和自定义风格 | 解析器同时支持 ART_STYLES 常量查询和 UserStyle DB 查询，命名空间工具函数已存在 |
| DATA-03 | 废弃 artStylePrompt 缓存字段，统一走实时查询 | analyze-novel.ts 写入路径已识别，Phase 2 仅移除写入，Schema 字段保留至 Phase 3 |
| DATA-04 | 风格创建使用事务保护数量限制，防止竞态条件 | D-13 明确此属于 Phase 5，Phase 2 解析器不做数量检查 |

</phase_requirements>

---

## Summary

Phase 2 的核心任务是创建异步 `resolveStylePrompt()` 函数，替换当前同步的 `getArtStylePrompt()`。新函数同时支持系统预设（常量查询）和用户自定义风格（DB 查询），解决 Pitfall 1（自定义风格静默失效）和 Pitfall 2（缓存字段脏数据）的 CRITICAL 风险。

**关键约束：** Phase 2 **仅创建解析器本身**，不修改任何 Worker handler 的调用点（那是 Phase 4 的工作）。唯一需要修改的现有文件是 `analyze-novel.ts`（移除 `artStylePrompt` 写入）。

**向后兼容策略：** `getArtStylePrompt()` 保留不动，Phase 4 才替换。Phase 2 验证解析器正确性后，Phase 3 确认无读取路径，Phase 4 完成 Worker 集成。

---

## Implementation Details

### 1. 新建 `src/lib/styles/style-resolver.ts`

**函数签名：**
```typescript
import { prisma } from '@/lib/prisma'
import { ART_STYLES } from '@/lib/constants'
import { isUserStyle, extractUserStyleId } from './style-namespace'

export type UserStylePrompt = {
  promptZh: string
  promptEn: string
} | null

/**
 * 异步解析风格提示词
 * - 系统预设：从 ART_STYLES 常量实时查找
 * - 用户自定义：从 UserStyle 表查询（需 userId）
 * - 找不到时返回 null，调用方通过 ?? '' 保持向后兼容
 */
export async function resolveStylePrompt(
  artStyle: string,
  userId: string,
  locale: 'zh' | 'en',
): Promise<string | null> {
  // 系统预设：从常量查找
  if (!isUserStyle(artStyle)) {
    const style = ART_STYLES.find(s => s.value === artStyle)
    if (!style) return null
    return locale === 'en' ? style.promptEn : style.promptZh
  }

  // 用户自定义：从数据库查询
  const styleId = extractUserStyleId(artStyle)
  const userStyle = await prisma.userStyle.findUnique({
    where: {
      id: styleId,
      userId, // D-10: 必须验证 userId，防止跨用户访问
    },
    select: {
      promptZh: true,
      promptEn: true,
    },
  })

  if (!userStyle) return null
  return locale === 'en' ? userStyle.promptEn : userStyle.promptZh
}
```

**关键实现点：**
- `isUserStyle()` 和 `extractUserStyleId()` 来自 Phase 1 的 `style-namespace.ts`，直接复用
- userId 参与查询（D-10 明确）—— 防止用户 A 访问用户 B 的风格
- 返回 `null` 而非空字符串 —— 调用方必须显式用 `?? ''` 处理
- 不使用缓存（Phase 2 范围外）

### 2. 废弃 `artStylePrompt` 写入路径

**需要修改的文件：**

`src/lib/workers/handlers/analyze-novel.ts`（第 364-369 行）

当前代码：
```typescript
await prisma.novelPromotionProject.update({
  where: { id: novelData.id },
  data: {
    artStylePrompt: getArtStylePrompt(novelData.artStyle, job.data.locale) || '',
  },
})
```

**修改方案：** 完全移除此 update 操作（D-11：不再写入 artStylePrompt）

注意：`getArtStylePrompt` 的 import 仍然保留，因为该函数本身在 Phase 2 不改动（Phase 4 才替换）。如果后续 worker handler 改用 `resolveStylePrompt`，届时再移除 import。

### 3. Schema 字段处理（D-11）

- `prisma/schema.prisma` 第 256 行：`artStylePrompt String? @db.Text` **保留不动**
- Phase 3 确认无任何读取路径后，才在后续迁移中删除该字段
- 当前 Phase 2 只移除写入和读取逻辑

### 4. TypeScript 类型保留

`src/types/project.ts` 第 263 行：`artStylePrompt: string | null` **保留**
- 理由：现有项目数据中可能仍有该字段值（历史数据），API 响应类型应保持兼容
- Phase 3 确认无读取路径后可移除

---

## artStylePrompt 废弃范围分析

### 写入路径（需移除）

| 文件 | 行号 | 当前行为 | Phase 2 操作 |
|------|------|---------|-------------|
| `src/lib/workers/handlers/analyze-novel.ts` | 367 | `artStylePrompt: getArtStylePrompt(...) \|\| ''` | **移除此字段** |

### 读取路径（Phase 2 不处理，Phase 3 确认后移除）

| 文件 | 行号 | 当前行为 | Phase 2 | Phase 3 |
|------|------|---------|---------|---------|
| `src/types/project.ts` | 263 | TypeScript 类型定义 | 保留 | 移除 |
| `prisma/schema.prisma` | 256 | Schema 字段定义 | 保留 | 移除 |

### 注释/文档（Phase 2 不处理）

- `src/app/api/projects/route.ts` 第 205 行：注释说明不再存储到 DB —— 该注释已正确描述 Phase 2 后的行为

---

## Worker Handler 调用点（Phase 4 才替换）

以下 7 处调用点在 Phase 2 **不修改**，Phase 4 统一替换：

| Handler | 行号 | 调用方式 |
|---------|------|---------|
| `panel-image-task-handler.ts` | 197 | `getArtStylePrompt(modelConfig.artStyle, job.data.locale)` |
| `character-image-task-handler.ts` | 110 | `getArtStylePrompt(payloadArtStyle ?? models.artStyle, job.data.locale)` |
| `location-image-task-handler.ts` | 67 | `getArtStylePrompt(payloadArtStyle ?? models.artStyle, job.data.locale)` |
| `panel-variant-task-handler.ts` | 214 | `getArtStylePrompt(modelConfig.artStyle, job.data.locale)` |
| `asset-hub-image-task-handler.ts` | 63-65 | `getArtStylePrompt(typeof payload.artStyle === 'string' ? payload.artStyle : undefined, job.data.locale)` |
| `reference-to-character.ts` | 194 | `getArtStylePrompt(artStyle, job.data.locale)` |
| `analyze-novel.ts` | 6,367 | import + 写入 `artStylePrompt` 字段 |

**Phase 4 替换模式：**
```typescript
// Phase 4: 将 getArtStylePrompt 替换为 resolveStylePrompt
// 旧：
const artStyle = getArtStylePrompt(modelConfig.artStyle, job.data.locale)

// 新：
const artStyle = await resolveStylePrompt(modelConfig.artStyle, job.data.userId, job.data.locale) ?? ''
```

---

## 迁移策略（按执行顺序）

### 步骤 1：创建解析器
1. 新建 `src/lib/styles/style-resolver.ts`
2. 导出 `resolveStylePrompt` 函数和 `UserStylePrompt` 类型
3. 使用 Phase 1 的 `style-namespace.ts` 工具函数

### 步骤 2：移除 artStylePrompt 写入
1. 修改 `analyze-novel.ts`，移除 `artStylePrompt` 字段的 update
2. 保留 `getArtStylePrompt` import（Phase 4 才替换）

### 步骤 3：单元测试
1. 创建 `tests/unit/styles/style-resolver.test.ts`
2. 测试预设风格查询（zh/en）
3. 测试用户自定义风格查询（DB 存在/不存在）
4. 测试无效标识符返回 null
5. 测试 userId 不匹配时返回 null（安全性）

### 步骤 4：TypeScript 类型检查
```bash
npx tsc --noEmit
```

---

## Validation Architecture

### Test Framework

| 属性 | 值 |
|------|-----|
| Framework | Vitest 2.1.8（项目现有） |
| Config file | `vitest.config.ts` (存在) |
| Quick run command | `npx vitest run tests/unit/` |
| Full suite command | `npx vitest run` |

### Phase Requirements to Test Map

| Req ID | 行为 | 测试类型 | 自动化命令 | 文件存在？ |
|--------|------|---------|------------|-----------|
| INTEG-04 | 预设风格查询返回正确 prompt | unit | `npx vitest run tests/unit/styles/style-resolver.test.ts::preset styles` | ❌ Wave 0 需创建 |
| INTEG-04 | 用户风格查询返回正确 prompt | unit | `npx vitest run tests/unit/styles/style-resolver.test.ts::user styles` | ❌ Wave 0 需创建 |
| INTEG-04 | 无效标识符返回 null | unit | `npx vitest run tests/unit/styles/style-resolver.test.ts::invalid identifiers` | ❌ Wave 0 需创建 |
| INTEG-04 | userId 不匹配返回 null | unit | `npx vitest run tests/unit/styles/style-resolver.test.ts::userId mismatch` | ❌ Wave 0 需创建 |
| DATA-03 | analyze-novel 不再写入 artStylePrompt | unit | 检查 update 调用中无 artStylePrompt 字段 | 通过代码审查验证 |
| DATA-04 | 解析器本身不做数量检查 | code review | 确认函数内无 count 查询 | 通过代码审查验证 |

### Sampling Rate

- **Per task commit:** `npx vitest run tests/unit/styles/`
- **Per wave merge:** `npx vitest run tests/unit/`
- **Phase gate:** `npx tsc --noEmit && npx vitest run`

### Wave 0 Gaps

- [ ] `tests/unit/styles/style-resolver.test.ts` — 覆盖 INTEG-04 所有行为
- [ ] `tests/unit/styles/style-namespace.test.ts` — 覆盖 DATA-02 命名空间工具（Phase 1 未完成）

---

## Common Pitfalls

### Pitfall 1: userId 验证缺失（安全性）

**问题：** 如果只按 styleId 查询，不验证 userId，则用户 A 可以通过知道用户 B 的风格 ID 来查询用户 B 的风格提示词。

**预防：** 解析器必须使用 `where: { id: styleId, userId }` 查询，确保用户只能查询自己的风格。

```typescript
// 正确
const userStyle = await prisma.userStyle.findUnique({
  where: { id: styleId, userId }, // userId 必须参与查询
  select: { promptZh: true, promptEn: true },
})

// 错误（安全漏洞）
const userStyle = await prisma.userStyle.findUnique({
  where: { id: styleId }, // 缺少 userId 验证
  select: { promptZh: true, promptEn: true },
})
```

### Pitfall 2: 混淆 null 和空字符串

**问题：** 原 `getArtStylePrompt()` 找不到时返回空字符串 `''`，但 Phase 2 解析器返回 `null`。如果调用方忘记用 `?? ''` 处理，会导致类型不匹配或空指针。

**预防：** 单元测试必须覆盖"找不到时返回 null"的行为，并在代码中显式使用 `?? ''`。

### Pitfall 3: 预设风格查询忽略 userId（效率）

**问题：** D-10 说"系统预设 userId 不参与查询"，但如果传入 `user:` 格式的标识符但 userId 错误，仍然会查库（虽然查不到）。

**预防：** 先用 `isUserStyle()` 判断类型，只有自定义风格才查库。

```typescript
// 正确：预设走常量路径，不查库
if (!isUserStyle(artStyle)) {
  const style = ART_STYLES.find(s => s.value === artStyle)
  return style ? (locale === 'en' ? style.promptEn : style.promptZh) : null
}
// 只有自定义风格才查库
const styleId = extractUserStyleId(artStyle)
```

---

## Backward Compatibility Strategy

### Phase 2 结束后的状况

| 组件 | 状态 | 说明 |
|------|------|------|
| `getArtStylePrompt()` | 保留不动 | Phase 4 才替换 |
| `resolveStylePrompt()` | 新建，Phase 4 才被调用 | 解析器本身完成 |
| `artStylePrompt` 字段 | Schema 保留，写入移除，读取保留 | Phase 3 确认后移除 |
| Worker handler | 不修改 | Phase 4 统一替换 |

### 为什么 Phase 2 不改 Worker handler？

根据 CONTEXT.md D-14：`不改变原 getArtStylePrompt() — Phase 4 Worker 集成时统一替换`。原因：
1. Phase 2 的目标是验证解析器本身正确性
2. Worker handler 改动涉及 7 个文件，改动面大，应独立成 Phase 4
3. 避免"解析器 + 集成"同时改动导致的排查困难

---

## Environment Availability

| 依赖 | Required By | Available | Version | 说明 |
|------|------------|-----------|---------|------|
| Node.js | 运行测试 | ✓ | v25.5.0 | 满足要求 |
| Prisma | DB 查询 | ✓ | 6.19.2 | 已安装 |
| TypeScript | 类型检查 | ✓ | 5.x | 通过 tsc 验证 |
| Vitest | 单元测试 | ✓ | 2.1.8 | 已配置 |

**无外部依赖缺失。** Phase 2 是纯代码重构，不引入新的外部依赖。

---

## Sources

### Primary (HIGH confidence)

- 直接代码分析：`src/lib/constants.ts` — ART_STYLES 结构、getArtStylePrompt 函数签名
- 直接代码分析：`src/lib/styles/style-namespace.ts` — Phase 1 工具函数
- 直接代码分析：`prisma/schema.prisma` — UserStyle 模型定义（第 1003-1020 行）
- 直接代码分析：`src/lib/workers/handlers/analyze-novel.ts` — artStylePrompt 写入位置（第 364-369 行）
- 直接代码分析：`src/app/api/projects/route.ts` — 已有"不再存储到数据库"注释（第 205 行）
- 直接代码分析：`vitest.config.ts` — 测试框架配置确认

### Secondary (MEDIUM confidence)

- `.planning/research/PITFALLS.md` — Pitfall 1 和 Pitfall 2 的 CRITICAL 风险分析
- `.planning/phases/01-userstyle/01-RESEARCH.md` — Phase 1 数据模型研究
- `.planning/phases/02-style-resolver/02-CONTEXT.md` — 所有决策已锁定

---

## Metadata

**Confidence breakdown:**
- 实现细节: HIGH — 所有决策已锁定，代码路径清晰
- 废弃范围: HIGH — 写入路径已确认唯一，Schema 保留策略明确
- 测试策略: MEDIUM — 测试框架已确认，但 Wave 0 测试文件需创建
- 风险评估: HIGH — Pitfall 1 和 2 的根因和修复策略已明确

**Research date:** 2026-03-27
**Valid until:** 2026-04-27（代码库结构稳定，30 天有效）

