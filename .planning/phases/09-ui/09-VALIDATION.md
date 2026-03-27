---
phase: "09"
phase_slug: ui
created: "2026-03-27"
status: pending
wave_0_gaps: 3
---

# Validation Strategy - Phase 9: 风格管理 UI

## Overview

本阶段为 UI 实现阶段，验证策略侧重于组件行为测试和集成测试。

## Wave 0 Gaps

以下测试文件需要在 Phase 执行前或执行中创建：

### 1. 标签选择器单元测试
**File:** `tests/unit/components/style-tag-selector.test.ts`
**Purpose:** 验证 StyleTagSelector 组件的标签选择/取消选择行为
**Priority:** HIGH
**Status:** MISSING

**Test cases:**
- 点击标签切换选中状态
- 选中标签显示高亮样式
- 已选标签传递给父组件
- 预设标签列表正确渲染

### 2. 图片上传验证测试
**File:** `tests/unit/styles/upload-ref.test.ts`
**Purpose:** 验证参考图上传 API 的文件类型和大小校验
**Priority:** MEDIUM
**Status:** MISSING

**Test cases:**
- 仅接受 JPEG/PNG/WebP 格式
- 拒绝超过 10MB 的文件
- 返回正确的 extractionStatus

### 3. 风格管理 UI 集成测试
**File:** `tests/integration/ui/style-manager.test.ts`
**Purpose:** 验证风格 CRUD 操作的完整流程
**Priority:** HIGH
**Status:** MISSING

**Test cases:**
- 风格列表正确渲染
- 创建风格后列表更新
- 删除风格后列表更新
- 数量上限时新建按钮禁用

## Validation Approach

由于项目尚未配置 @testing-library/react，Wave 0 测试文件创建推迟到 Phase 执行后通过 `gsd:verify-work` 完成。

**替代验证方式：**
1. 使用 `<verify>` 块中的 grep 命令验证代码结构
2. 手动 UI 测试确认用户流程
3. TypeScript 编译验证类型安全

## Sampling Rate

- **Per task commit:** TypeScript 编译通过
- **Per wave merge:** grep 验证关键代码存在
- **Phase gate:** 手动 UI 测试 + VERIFICATION.md

## Notes

UI 组件测试需要额外配置 React Testing Library，建议在后续迭代中统一添加测试基础设施。
