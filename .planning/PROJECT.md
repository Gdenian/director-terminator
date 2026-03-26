# 导演终结者 — 风格自定义系统

## What This Is

导演终结者是一个 AI 驱动的视频创作平台，用户可以通过文本描述生成视频内容。本次迭代的目标是将现有的硬编码预设风格系统升级为通用的自定义风格系统，让用户拥有更大的创作自由度。

## Core Value

用户可以用自己定义的视觉风格生成视频，而不受限于固定的预设选项。

## Requirements

### Validated

- ✓ 项目创建与管理 — existing
- ✓ 4 种预设艺术风格（漫画风、精致国漫、日系动漫风、真人风格） — existing
- ✓ 风格选择器 UI（StyleSelector 组件） — existing
- ✓ 风格提示词注入图片生成流程 — existing
- ✓ AI 图片/视频/语音生成 Worker 系统 — existing
- ✓ 角色/场景/道具资产创建与管理 — existing
- ✓ 用户认证与会话管理 — existing
- ✓ 计费与用量追踪 — existing
- ✓ 国际化（中/英） — existing

### Active

- [ ] 用户可以创建自定义风格（名称 + 描述提示词）
- [ ] 用户可以上传参考图片，系统 AI 自动提取风格描述
- [ ] 用户可以给风格打标签分类（如"写实"、"动漫"、"抽象"）
- [ ] 自定义风格保存在用户账号级别，所有项目可复用
- [ ] 自定义风格有数量上限
- [ ] 4 个系统预设风格保留且不可删除
- [ ] 自定义风格可编辑和删除
- [ ] 风格系统通用化，不限于食品类内容

### Out of Scope

- 风格市场/社区分享 — 初期聚焦个人创作，社交功能后续考虑
- 风格参数多维度调节器（画风/色调/线条等独立滑块） — 复杂度高，用描述词+参考图已能覆盖大部分需求
- 风格预览图自动生成 — 可作为后续优化

## Context

- 现有风格系统完全硬编码在 `src/lib/constants.ts` 的 `ART_STYLES` 数组中
- 每个风格包含 value、label、preview、promptZh、promptEn 字段
- 风格提示词通过 `getArtStylePrompt()` 注入到图片生成的 prompt 中
- 数据库中 `NovelPromotionProject.artStyle` 字段存储风格值（默认 'american-comic'）
- UI 通过 `StyleSelector` 组件在配置弹窗和创建表单中使用
- 项目使用 Prisma + MySQL，用户认证基于 next-auth
- 已有 S3 兼容的文件存储系统（参考图上传可复用）
- AI SDK 已集成多家供应商（可用于参考图风格提取）

## Constraints

- **技术栈**: 必须在现有 Next.js 15 + Prisma + MySQL 架构上实现
- **向后兼容**: 现有项目的 artStyle 字段和数据不能损坏
- **性能**: 风格列表加载不应影响页面性能
- **存储**: 参考图上传复用现有 S3 存储方案

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| 自定义风格保存在用户级别而非项目级别 | 风格是用户的创作资产，应跨项目复用 | — Pending |
| 参考图通过 AI 自动提取风格描述 | 降低用户创建门槛，不需要手写专业提示词 | — Pending |
| 保留 4 个预设风格不可删除 | 确保新用户有开箱即用的选择 | — Pending |
| 风格数量设上限 | 防止滥用和存储膨胀 | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-27 after initialization*
