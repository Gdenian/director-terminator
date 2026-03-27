# Phase 2: 风格解析器重构 - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-27
**Phase:** 2-style-resolver
**Areas discussed:** 解析器函数签名, 缓存字段废弃策略, 错误处理策略, 事务边界, 函数命名, TypeScript 类型

---

## 解析器函数签名

| Option | Description | Selected |
|--------|-------------|----------|
| `resolveStylePrompt(artStyle: string, locale: 'zh' \| 'en')` | 不带 userId，系统预设走常量查询，自定义风格用 artStyle 中的 uuid 直接查库 | |
| `resolveStylePrompt(artStyle: string, userId: string, locale: 'zh' \| 'en')` | userId 作为必填参数，与 Phase 5 CRUD API 对齐 | ✓ (auto) |

**User's choice:** (auto) — `resolveStylePrompt(artStyle: string, userId: string, locale: 'zh' | 'en')`
**Notes:** 自定义风格查询需要 userId 上下文；userId 在 Phase 5 调用处已可用；避免后续 API 签名变更

---

## 缓存字段废弃策略

| Option | Description | Selected |
|--------|-------------|----------|
| 立即删除 `artStylePrompt` schema 字段和所有引用 | 激进清理 | |
| 废弃但保留 schema 字段，所有读写路径移除 | 稳妥废弃策略，字段在后续迁移删除 | ✓ (auto) |

**User's choice:** (auto) — 废弃但保留 schema 字段，所有读写路径移除
**Notes:** Phase 3 确认无读取路径后才删除字段

---

## 错误处理策略

| Option | Description | Selected |
|--------|-------------|----------|
| 找不到时返回空字符串 `''`（与原函数一致） | 向后兼容，但无法区分"不存在"和"真的为空" | |
| 找不到时返回 `null` | 调用方通过 `?? ''` 保持兼容，可区分不存在和空 | ✓ (auto) |

**User's choice:** (auto) — 返回 `null`
**Notes:** Phase 2 验证无任何静默失效后，调用方统一用 `?? ''` 处理

---

## 事务边界

| Option | Description | Selected |
|--------|-------------|----------|
| Phase 2 解析器内含 `$transaction` 包裹计数检查 | 解析器承担计数限制逻辑，职责不清 | |
| Phase 5 CRUD API 负责事务，解析器只返回提示词 | 单一职责，Phase 2 和 Phase 5 边界清晰 | ✓ (auto) |

**User's choice:** (auto) — 解析器只返回提示词，事务落在 Phase 5
**Notes:** 数量限制取决于 Phase 5 前确定的上限值（20-50 待定）

---

## 函数命名

| Option | Description | Selected |
|--------|-------------|----------|
| `resolveStylePrompt` | 来自 ROADMAP.md Success Criteria 表述 | ✓ (auto) |
| `getStylePromptAsync` | 强调是异步版本的 getArtStylePrompt | |

**User's choice:** (auto) — `resolveStylePrompt`
**Notes:** 与 ROADMAP.md 一致

---

## TypeScript 类型

| Option | Description | Selected |
|--------|-------------|----------|
| `Promise<string | null>` 直接返回最终字符串 | 简单，但调用方无法区分语言 | |
| `Promise<{ promptZh: string, promptEn: string } | null>` 返回对象再按 locale 取字段 | 更类型安全，支持双语的 Phase 2 需求 | ✓ (auto) |

**User's choice:** (auto) — 返回结构化对象，调用方按 locale 取字段
**Notes:** TypeScript 类型安全，与 UserStyle 模型字段名一致

---

## Claude's Discretion

- `$transaction` 具体 API 形式（`$transaction` vs `$transaction(async tx => ...)`）—— 留给 planner
- 解析器内部错误日志策略 —— 找不到时 silent 返回 null，由调用方决定是否 log
- 是否需要 LRU 缓存层 —— Phase 2 不做，Phase 4 集成后按需评估

## Deferred Ideas

- 风格数量上限具体数值（20-50）—— Phase 5 前必须产品决策
- 解析器缓存层 —— Phase 4 集成后按需评估
