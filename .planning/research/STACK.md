# Stack Research: 自定义风格系统

**Research Date:** 2026-03-27
**Domain:** AI视频创作平台 — 自定义风格系统
**Confidence:** HIGH（所有发现基于直接代码分析）

## 核心结论

**零新依赖。** 现有技术栈已完整覆盖所有需求。这个里程碑是纯粹的数据建模 + API + UI 工程，无需引入任何新的 npm 包。

## 现有能力复用

### 视觉 AI 提取（已实现）

- `src/lib/llm/vision.ts` 中的 `chatCompletionWithVision(userId, model, prompt, imageUrls)` 已支持 Google/Ark/OpenAI-兼容等全部 provider
- 参考图风格提取直接调用此函数即可
- **Confidence:** HIGH — 直接读取 vision.ts 实现确认

### 图片上传流程（已实现）

- `src/app/api/asset-hub/upload-image/route.ts` 是完整参考实现
- 流程：`request.formData()` + `sharp` 压缩 + `uploadObject` 存储
- 参考图上传照搬此模式
- **Confidence:** HIGH — 直接读取 upload-image/route.ts 确认

### 数据层（需新增）

- 需在 Prisma schema 添加 `UserStyle` 模型
- 关联 User，存储 name/promptZh/promptEn/tags/referenceImageKey/isSystem
- 运行 `prisma migrate dev` 生成迁移
- **Confidence:** HIGH — 直接读取 schema.prisma 建立对比

### 向后兼容策略

- `NovelPromotionProject.artStyle` 和 `UserPreference.artStyle` 字段保留原有字符串值
- 新增 `resolveStylePrompt(artStyle, userId, locale)` 函数统一处理
- 逻辑：先查 UserStyle 表，找不到则回退 `getArtStylePrompt()`
- 代码库中有约 52 个 artStyle 引用文件需要追踪
- **Confidence:** HIGH — 追踪全部引用确认

## 不需要的技术

| 技术 | 原因 |
|------|------|
| 新的 AI SDK | 现有 vision.ts 已覆盖 |
| 新的上传库 | 现有 S3 + sharp 流程已覆盖 |
| 新的 UI 组件库 | 现有 StyleSelector 可扩展 |
| 风格迁移脚本 | 预设值保持不变，无需迁移数据 |

## 建议构建顺序

1. **数据层** — UserStyle Prisma 模型 + 迁移 + CRUD API Routes
2. **AI 提取** — 参考图上传 API + 风格提取 API（调用 chatCompletionWithVision）
3. **向后兼容** — resolveStylePrompt 函数 + 替换 getArtStylePrompt 调用点
4. **UI** — StyleSelector 重构，创建/编辑/删除 UI

---
*Stack research: 2026-03-27*
