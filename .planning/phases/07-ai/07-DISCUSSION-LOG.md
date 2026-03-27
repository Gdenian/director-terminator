# Phase 7: AI 参考图提取 - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-27
**Phase:** 07-ai
**Areas discussed:** 状态追踪, 上传流程, 草稿工作流, Prompt 设计, Schema 变更

---

## 状态追踪

| Option | Description | Selected |
|--------|-------------|----------|
| extractionStatus 字段 | 添加到 UserStyle 表，pending/completed/failed | ✓ (auto) |

**[auto]** Selected: extractionStatus 字段 — 用户跨页面查看状态，Worker 异步处理后更新 DB

---

## 上传流程

| Option | Description | Selected |
|--------|-------------|----------|
| S3 上传获取 URL | 先创建 pending 记录，再上传图片到 `user-styles/{userId}/{styleId}/ref.jpg` | ✓ (auto) |

**[auto]** Selected: 先创建草稿记录获得 styleId，再上传图片

---

## 草稿工作流

| Option | Description | Selected |
|--------|-------------|----------|
| 同一记录更新 | 创建 pending 记录 → 上传图片 → 触发 Worker → 更新 prompt | ✓ (auto) |

**[auto]** Selected: 同一 UserStyle 记录更新状态和 prompt，不创建独立草稿表

---

## Prompt 设计

| Option | Description | Selected |
|--------|-------------|----------|
| 风格特征提取 | 描述线条、色调、光影等视觉特征，不描述画面内容 | ✓ (auto) |

**[auto]** Selected: 明确的风格特征 prompt + chatCompletionWithVision()

---

## Schema 变更

| Option | Description | Selected |
|--------|-------------|----------|
| 新增 extractionStatus + extractionMessage | 添加到 UserStyle 表 | ✓ (auto) |

**[auto]** Selected: 新增 2 字段 — extractionStatus (pending/completed/failed) + extractionMessage (错误信息)

---

## Deferred Ideas

- 草稿过期自动删除 — 推迟到 Phase 9 后
- 预定义风格标签列表 — Phase 9 范围
