# Phase 3: 向后兼容与系统预设保护 - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-27
**Phase:** 03-backward-compat
**Areas discussed:** 系统预设保护模式, 向后兼容验证, 服务层位置, Phase 5 API 契约

---

## 系统预设保护模式

| Option | Description | Selected |
|--------|-------------|----------|
| isSystem 布尔字段检查 | UserStyle.isSystem=true 时拒绝删除/修改 | ✓ (auto) |
| 常量白名单检查 | 硬编码 4 个预设值，拒绝删除/修改 | |

**User's choice:** (auto) — isSystem 布尔字段检查
**Notes:** 与 Phase 1 schema 设计一致，isSystem 字段已在 UserStyle 模型建立

---

## 向后兼容验证

| Option | Description | Selected |
|--------|-------------|----------|
| 创建集成测试验证 8 个断言 | 4 个预设 × 2 locale，与 getArtStylePrompt() 结果比对 | ✓ (auto) |
| 仅人工验证 | 不创建自动化测试 | |

**User's choice:** (auto) — 创建集成测试
**Notes:** TDD 模式，保持项目规范

---

## 服务层位置

| Option | Description | Selected |
|--------|-------------|----------|
| `src/lib/styles/style-service.ts` | 独立 service 文件 | ✓ (auto) |
| 放在 `style-resolver.ts` 里 | 合并到 Phase 2 文件 | |

**User's choice:** (auto) — 独立 service 文件
**Notes:** 职责分离，CRUD API（Phase 5）可独立引用

---

## Phase 5 API 契约

| Option | Description | Selected |
|--------|-------------|----------|
| DELETE/PUT 前检查 isSystem | 先查记录 → 验证用户 → 检查 isSystem → 执行 | ✓ (auto) |
| 在 API route 层检查 | API route 直接查 DB | |

**User's choice:** (auto) — 服务层检查，Phase 5 API route 调用
**Notes:** 保持服务层单一职责，API route 薄转发

---

## 错误码澄清 (2026-03-27)

**Issue:** D-19 指定 `'STYLE_SYSTEM_NOT_MODIFIABLE'` 作为错误码，但该 code 不在 `ERROR_CATALOG` 中。`ApiError` 构造函数调用 `getErrorSpec(code)` 返回 `undefined`，访问 `.httpStatus` 时触发 TypeError 运行时错误。

**Options evaluated:**

| Option | Description | Selected |
|--------|-------------|----------|
| Option A: 使用 `ApiError('FORBIDDEN', { message: '系统预设不可修改或删除' })` | 复用水已在 ERROR_CATALOG 中的 FORBIDDEN (httpStatus=403)，用 details.message 覆盖默认消息 | ✓ |
| Option B: 先在 ERROR_CATALOG 中新增 `STYLE_SYSTEM_NOT_MODIFIABLE` 条目 | 增加新的 catalog entry | |

**Selected:** Option A
**Rationale:** FORBIDDEN 语义正确（禁止操作），无需扩展 ERROR_CATALOG，保持简洁。
**Changes:**
- D-19 更新：`'STYLE_SYSTEM_NOT_MODIFIABLE'` → `'FORBIDDEN'`
- D-18 服务层实现：抛出 `ApiError('FORBIDDEN', { message: '系统预设不可修改或删除', styleId })`

---

## Deferred Ideas

- **系统预设 seed 到数据库**：等待 Phase 5 产品决策；当前方案预设不入库，isSystem 仅保护用户自定义创建的系统级风格
- **ART_STYLES 迁移到数据库**：长期课题，Phase 3 不考虑
