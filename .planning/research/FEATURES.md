# Features Research: 自定义风格系统

**Research Date:** 2026-03-27
**Domain:** AI视频创作平台的自定义风格/预设系统

## Table Stakes (必须有，否则用户流失)

| Feature | Complexity | Dependencies |
|---------|-----------|-------------|
| 创建自定义风格（名称 + 描述提示词） | LOW | 数据库表 |
| 编辑和删除自定义风格 | LOW | CRUD API |
| StyleSelector 扩展显示系统预设 + 用户自定义风格 | LOW | 风格查询 API |
| 向后兼容：旧 artStyle 字段值（如 'american-comic'）必须正常解析 | MEDIUM | 迁移策略 |
| 风格数量上限与明确提示 | LOW | 计数查询 |
| 参考图上传 + AI 风格描述提取 | HIGH | AI API、S3 存储 |

## Differentiators (竞争优势)

| Feature | Complexity | Dependencies |
|---------|-----------|-------------|
| AI 提取 + 用户可编辑（两步流程：AI 生成草稿，用户确认修改） | MEDIUM | AI 视觉分析 |
| 双语提示词（zh/en），与现有 promptZh/promptEn 模式一致 | LOW | 翻译 API 或 AI |
| 标签/分类系统用于风格组织 | LOW | 标签数据模型 |

## Anti-Features (刻意不做)

| Feature | Reason |
|---------|--------|
| 风格市场/社交分享 | 内容审核 + 知识产权风险，不在范围内 |
| 多滑块参数调节器 | 复杂度高，价值不成比例 |
| 保存时自动生成预览图 | 不可控的 AI 成本 |
| 无限风格数量 | 存储膨胀 + UX 退化 |

## 关键集成点（代码分析）

1. `getArtStylePrompt()` 需要扩展：先检查常量预设，未命中则回退到数据库查询
2. `NovelPromotionProject.artStyle` 存储原始字符串 — 需要区分预设值和自定义风格 UUID
3. Schema 中已有 `artStylePrompt` 字段 — 可作为提示词快照缓存

## Feature Dependencies

```
创建自定义风格 → 编辑/删除风格
                → StyleSelector 扩展
参考图上传 → AI 风格提取 → 用户编辑确认
标签系统 → 风格筛选/组织
向后兼容 → 所有功能的前提
```

---
*Features research: 2026-03-27*
