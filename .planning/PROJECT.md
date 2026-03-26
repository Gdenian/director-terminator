# 小说推广视频生成平台 v2 改进

## What This Is

一个 AI 驱动的全栈应用，帮助用户将小说内容转化为推广视频。核心流程：小说输入 → 分镜脚本 → AI 生图/配音 → 视频剪辑。项目基于 Next.js 15 + React 19 构建，支持多种 AI 服务集成（图像生成、视频生成、TTS 语音等）。

## Core Value

让用户轻松将小说内容转化为高质量推广视频，同时资产可在多项目间复用。

## Requirements

### Validated

<!-- 现有已稳定运行的功能 -->

- ✓ 小说文本输入与解析
- ✓ 分镜脚本生成与管理
- ✓ AI 图像生成（角色、场景）
- ✓ AI 视频生成
- ✓ TTS 语音合成
- ✓ 项目内资产（角色/场景/配音）管理
- ✓ 多语言支持（中文/英文）
- ✓ 用户认证与授权
- ✓ 全局资产库浏览（只读）

### Active

- [ ] **UI 全面改造** — 视觉风格统一现代化、布局结构优化、交互体验提升
- [ ] **视频主题风格模板系统** — 支持预设风格模板（如电影感、动漫、水彩、写实等）一键切换，生成图片/视频时自动应用风格
- [ ] **项目资产推送到全局资产库** — 支持将项目内生成的角色、场景、配音推送到全局资产库，供其他项目复用

### Out of Scope

- 全新建设的全局资产库（已存在，只扩展功能）
- 改变核心 AI 生成逻辑
- 新增用户角色权限体系
- 多语言动态切换（非静态 i18n）

## Context

**技术背景：** 基于现有代码库（Next.js 15 + React 19 + Prisma + BullMQ），已完成代码库映射。

**现有痛点：**
1. UI 视觉风格过时、不统一，布局结构不合理，交互体验差
2. 视频生成缺乏主题风格控制，产出一致性低
3. 项目内资产无法推送到全局资产库，跨项目资产复用困难

**已映射代码库：** `.planning/codebase/` 包含完整技术栈、架构、目录结构、编码规范等参考文档。

## Constraints

- **Tech Stack**: Next.js 15 + React 19 + TypeScript 5 — 不更换技术栈
- **向后兼容**: 现有项目数据和资产不可丢失
- **渐进改进**: UI 改造分阶段进行，避免一次性大规模重构
- **API 兼容性**: 现有 API 路由保持接口稳定

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| 风格模板作为预设系统 | 用户需要一键切换，不需要完全自定义参数 | — Pending |
| 项目→全局资产推送作为核心功能 | 资产复用是明确痛点 | — Pending |
| UI 改造渐进式推进 | 避免大范围重构导致系统不稳定 | — Pending |

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

*Last updated: 2026-03-27 after new-project initialization in subdirectory*
