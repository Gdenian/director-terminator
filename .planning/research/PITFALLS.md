# Pitfalls Research: 自定义风格系统

**Research Date:** 2026-03-27
**Domain:** AI视频创作平台 — 从硬编码预设迁移到自定义风格系统
**Confidence:** HIGH — 所有陷阱基于实际代码分析，非通用建议

## Critical Pitfalls

### Pitfall 1: `getArtStylePrompt()` 解析层未同步更新

**风险等级:** CRITICAL
**描述:** 该函数是同步常量查找，在 7 个地方跨 6 个 Worker handler 使用。当自定义风格以 UUID 传入时，`getArtStylePrompt()` 会静默返回空字符串 — 图片仍然生成，但没有风格应用。零错误，零警告。
**预警信号:** 用户报告"自定义风格没效果"但系统无任何错误日志
**预防策略:** 必须将 `getArtStylePrompt()` 重构为异步的 `resolveArtStylePrompt(id, userId, locale)`，在任何其他工作之前完成
**应在阶段:** Phase 1（数据层 + 解析器）

### Pitfall 2: `artStylePrompt` 缓存字段导致脏数据

**风险等级:** CRITICAL
**描述:** Schema 中有 `artStylePrompt String? @db.Text` 字段。代码注释已自相矛盾 — "artStylePrompt 通过实时查询获取，不再存储到数据库"。当用户编辑自定义风格后，缓存字段不会更新，导致 Worker 用旧提示词生成图片。
**预警信号:** 用户修改风格后新生成的图片仍是旧风格
**预防策略:** 废弃 `artStylePrompt` 缓存字段，统一走实时查询
**应在阶段:** Phase 1（数据层）

## High Pitfalls

### Pitfall 3: AI 提取无状态追踪

**风险等级:** HIGH
**描述:** 参考图 → AI 风格提取 → 保存提示词是异步链，但没有 `pending/completed/failed` 状态。用户看到"已保存"但提示词为空。此外，AI 倾向于描述图片**内容**（"一个穿红衣的女孩"）而非图片**风格**（"赛璐璐上色，动漫线条"），需要精确的 prompt engineering。
**预警信号:** 提取结果描述画面内容而非画面风格
**预防策略:** 设计 3 态提取状态（pending/completed/failed）；精心设计提取 prompt 要求输出风格词汇而非内容描述
**应在阶段:** Phase 2（AI 提取）

### Pitfall 4: 系统预设保护仅在 UI 层

**风险等级:** HIGH
**描述:** 如果系统预设入库统一管理，DELETE API 需要服务端 `isSystem` 检查 — 仅 UI 层的保护可被直接 API 调用绕过
**预警信号:** 通过 API 工具可以删除系统预设
**预防策略:** 在 API 层添加 `isSystem` 校验，拒绝删除/修改系统预设
**应在阶段:** Phase 1（CRUD API）

## Medium Pitfalls

### Pitfall 5: 风格数量限制存在竞态条件

**风险等级:** MEDIUM
**描述:** `count() + create()` 模式如果没有事务保护，并发请求可以绕过数量限制
**预警信号:** 用户风格数超过设定上限
**预防策略:** 使用 Prisma 事务 `$transaction` 包裹计数+创建操作
**应在阶段:** Phase 1（CRUD API）

## 关键决策点

| 问题 | 建议 | 影响 |
|------|------|------|
| 系统预设保留为常量还是入库？ | 保留为常量（零迁移风险） | 显著降低 Phase 1 复杂度 |
| `isArtStyleValue()` 类型守卫如何更新？ | 扩展为支持常量值 + UUID 格式 | 影响所有验证逻辑 |

---
*Pitfalls research: 2026-03-27*
