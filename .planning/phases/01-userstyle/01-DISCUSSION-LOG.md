# Phase 1: UserStyle 数据模型 - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-27
**Phase:** 01-userstyle
**Areas discussed:** Schema design, Naming convention, Relationship modeling
**Mode:** Auto (all recommended defaults selected)

---

## Schema Design

| Option | Description | Selected |
|--------|-------------|----------|
| 完整字段集 | name, promptZh, promptEn, tags JSON, referenceImageUrl, isSystem, userId | ✓ |
| 最小字段集 | name, prompt, userId（后续再扩展） | |

**User's choice:** 完整字段集 (auto-selected recommended)
**Notes:** 包含双语提示词以匹配现有 ART_STYLES 的 promptZh/promptEn 结构

---

## Naming Convention

| Option | Description | Selected |
|--------|-------------|----------|
| user:{uuid} 前缀格式 | 通过字符串前缀区分自定义和预设 | ✓ |
| 数据库外键关联 | artStyle 字段改为外键引用 UserStyle 表 | |
| 数字 ID 前缀 | 使用数字 ID 而非 uuid | |

**User's choice:** user:{uuid} 前缀格式 (auto-selected — aligned with STATE.md prior decision)
**Notes:** 零数据迁移方案，现有数据完全不受影响

---

## Relationship Modeling

| Option | Description | Selected |
|--------|-------------|----------|
| 多对一 + 标识符字符串 | UserStyle→User 外键，artStyle 字段保持 String | ✓ |
| 多对一 + artStyle 外键 | UserStyle→User + artStyle→UserStyle 双外键 | |

**User's choice:** 多对一 + 标识符字符串 (auto-selected recommended)
**Notes:** artStyle 字段可存预设值也可存 "user:uuid"，不需要外键约束

---

## Claude's Discretion

- Migration 文件命名
- @@map 表名选择
- Soft delete 字段

## Deferred Ideas

None
