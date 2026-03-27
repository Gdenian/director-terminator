# Phase 9: 风格管理 UI - Research

**Researched:** 2026-03-27
**Domain:** 前端 UI/UX, React 19, Next.js 15 App Router, Tailwind CSS 4
**Confidence:** HIGH

## Summary

Phase 9 是自定义风格系统的最终交付阶段，需要实现完整的风格管理 UI，包括风格列表页面、创建/编辑弹窗、标签选择器、参考图上传和 AI 提取状态追踪。

**Primary recommendation:** 将风格管理页面放在 `/profile/styles` 路由下（复用现有 profile 页面布局），使用 GlassModalShell 作为弹窗基础组件，复用现有的 useUserStyles hook 和 StyleSelector 模式。

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React 19 | 19.1.2 | UI 组件 | 项目核心框架 |
| Next.js 15 | 15.5.7 | App Router | 全栈框架 |
| Tailwind CSS 4 | 4.x | 样式系统 | 项目标准样式 |
| next-intl | 4.7.0 | 国际化 | 现有 i18n 方案 |
| zod | 3.25.76 | 表单验证 | 现有验证方案 |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| next-auth | 4.24.11 | 认证状态 | useSession 检测登录 |
| lucide-react | 0.575.0 | 图标 | 通过 @/components/ui/icons 引用 |
| @aws-sdk/client-s3 | 3.883.0 | 图片上传 | 参考图上传到 S3 |

### Existing Components (Reuse)
| Component | Location | Purpose |
|-----------|----------|---------|
| GlassModalShell | src/components/ui/primitives/GlassModalShell.tsx | 弹窗基础壳 |
| ConfigConfirmModal | src/components/ui/config-modals/ConfigConfirmModal.tsx | 确认删除弹窗 |
| ConfigDeleteModal | src/components/ui/config-modals/ConfigDeleteModal.tsx | 删除确认封装 |
| useUserStyles | src/hooks/useUserStyles.ts | 用户风格列表获取 |
| StyleSelector | src/components/selectors/RatioStyleSelectors.tsx | 风格选择器模式 |
| useToast | src/contexts/ToastContext.tsx | Toast 通知 |
| apiFetch | src/lib/api-fetch.ts | API 请求封装 |

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/[locale]/profile/
│   ├── page.tsx                    # 现有 profile 页面
│   └── components/
│       └── StylesTab.tsx           # 新增：风格管理 Tab
├── components/
│   └── styles/                     # 新增：风格管理组件目录
│       ├── StyleManager.tsx        # 风格列表管理
│       ├── StyleCard.tsx           # 单个风格卡片
│       ├── StyleCreateModal.tsx    # 创建/编辑弹窗
│       ├── StyleTagSelector.tsx    # 标签选择器
│       └── ReferenceImageUpload.tsx # 参考图上传组件
├── hooks/
│   └── useUserStyles.ts            # 现有：风格列表 hook
├── lib/styles/
│   ├── style-service.ts            # 现有：后端服务
│   ├── style-schema.ts             # 现有：Zod 验证
│   └── style-namespace.ts          # 现有：命名空间工具
└── messages/
    ├── zh/profile.json             # 需扩展：风格管理文案
    └── en/profile.json             # 需扩展：英文文案
```

### Pattern 1: Profile Page Tab Extension
**What:** 在现有 profile 页面添加"风格管理"Tab，复用左侧边栏布局
**When to use:** 风格管理入口
**Example:**
```tsx
// src/app/[locale]/profile/page.tsx 现有模式
const [activeSection, setActiveSection] = useState<'billing' | 'apiConfig'>('apiConfig')

// 扩展为
const [activeSection, setActiveSection] = useState<'billing' | 'apiConfig' | 'styles'>('apiConfig')

// 在侧边栏添加导航按钮
<button onClick={() => setActiveSection('styles')}>
  <AppIcon name="palette" />
  <span>{t('styles')}</span>
</button>

// 在内容区渲染 StylesTab
{activeSection === 'styles' && <StylesTab />}
```

### Pattern 2: Modal with Form
**What:** 创建/编辑弹窗使用 GlassModalShell + 表单布局
**When to use:** 风格创建/编辑
**Example:**
```tsx
// 基于 CharacterCreationModal.tsx 模式
import GlassModalShell from '@/components/ui/primitives/GlassModalShell'

<GlassModalShell
  open={isOpen}
  onClose={onClose}
  title={isEdit ? '编辑风格' : '新建风格'}
  size="md"
  footer={
    <div className="flex justify-end gap-2">
      <button onClick={onClose}>取消</button>
      <button onClick={handleSubmit} disabled={isSubmitting}>
        {isSubmitting ? '保存中...' : '保存'}
      </button>
    </div>
  }
>
  {/* 表单内容 */}
</GlassModalShell>
```

### Pattern 3: Tag Selector (Multi-select Chips)
**What:** 标签选择器使用 chip 模式，支持预设标签 + 自定义输入
**When to use:** 风格标签选择
**Example:**
```tsx
// 预设标签列表
const PRESET_TAGS = ['写实', '动漫', '抽象', '油画', '水彩', '赛璐璐', '厚涂', '像素']

function StyleTagSelector({ value, onChange }: { value: string[], onChange: (tags: string[]) => void }) {
  const [customInput, setCustomInput] = useState('')

  const toggleTag = (tag: string) => {
    if (value.includes(tag)) {
      onChange(value.filter(t => t !== tag))
    } else {
      onChange([...value, tag])
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {PRESET_TAGS.map(tag => (
          <button
            key={tag}
            onClick={() => toggleTag(tag)}
            className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
              value.includes(tag)
                ? 'border-[var(--glass-accent-from)] bg-[var(--glass-accent-from)]/10 text-[var(--glass-accent-from)]'
                : 'border-[var(--glass-stroke-soft)] text-[var(--glass-text-secondary)]'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>
      {/* 自定义标签输入 */}
      <input
        value={customInput}
        onChange={(e) => setCustomInput(e.target.value)}
        placeholder="添加自定义标签..."
        className="glass-input-base h-9 px-3 text-sm"
      />
    </div>
  )
}
```

### Pattern 4: Reference Image Upload with Status
**What:** 参考图上传组件，集成 AI 提取状态追踪
**When to use:** 风格创建/编辑时上传参考图
**Example:**
```tsx
// 基于 CharacterCreationModal 的文件上传模式
interface ReferenceImageUploadProps {
  styleId: string | null  // 编辑时有值，创建时为 null
  referenceImageUrl: string | null
  extractionStatus: 'pending' | 'completed' | 'failed'
  extractionMessage: string | null
  onUpload: (file: File) => Promise<void>
  onRetry: () => void
}

function ReferenceImageUpload({ ... }: ReferenceImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="space-y-3">
      {/* 图片预览 + 状态指示 */}
      {referenceImageUrl && (
        <div className="relative">
          <img src={toFetchableUrl(referenceImageUrl)} className="w-full rounded-lg" />
          {/* 状态角标 */}
          {extractionStatus === 'pending' && (
            <div className="absolute top-2 right-2 px-2 py-1 bg-blue-500/80 text-white text-xs rounded">
              AI 提取中...
            </div>
          )}
          {extractionStatus === 'completed' && (
            <div className="absolute top-2 right-2 px-2 py-1 bg-green-500/80 text-white text-xs rounded">
              提取完成
            </div>
          )}
          {extractionStatus === 'failed' && (
            <div className="absolute top-2 right-2 px-2 py-1 bg-red-500/80 text-white text-xs rounded">
              提取失败
            </div>
          )}
        </div>
      )}

      {/* 上传按钮 */}
      <button onClick={() => fileInputRef.current?.click()}>
        {referenceImageUrl ? '更换参考图' : '上传参考图'}
      </button>
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

      {/* 失败时重试按钮 */}
      {extractionStatus === 'failed' && (
        <button onClick={onRetry} className="text-red-500">重试</button>
      )}
    </div>
  )
}
```

### Anti-Patterns to Avoid
- **直接使用 lucide-react 导入图标**: 必须通过 `@/components/ui/icons` 的 AppIcon 组件
- **内联 SVG**: 使用 AppIcon 或 icons 模块
- **硬编码中文文案**: 所有文案必须通过 next-intl 的 useTranslations 获取
- **直接 fetch 调用**: 使用 apiFetch 以自动注入 locale header
- **忽略未登录状态**: 所有涉及用户数据的组件必须处理未登录情况

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| 模态框基础 | 自己写 Portal + 动画 | GlassModalShell | 项目标准，统一交互 |
| 确认弹窗 | 自己写确认/取消 | ConfigDeleteModal | 统一风格，支持 danger 样式 |
| Toast 通知 | react-hot-toast 直接调用 | useToast context | 统一错误码翻译 |
| API 请求 | 直接 fetch | apiFetch | 自动注入 locale header |
| 用户风格列表 | 重复请求逻辑 | useUserStyles hook | 已封装，含登录检测 |
| 图片预览 URL | 直接拼接 | toFetchableUrl from storage | 处理 MinIO/S3 兼容 |

**Key insight:** 项目已有完善的 UI 组件体系和 API 封装，Phase 9 主要是组合和扩展，而非创造新组件。

## User Constraints

> Phase 9 无 CONTEXT.md，从 ROADMAP.md 提取约束

### Locked Decisions
- 技术栈：必须在现有 Next.js 15 + React 19 + Tailwind CSS 4 架构上实现
- 语言：所有注释、错误提示、文档使用中文
- API：复用 Phase 5 实现的 CRUD API（POST/GET/PUT/DELETE /api/user-styles）
- AI 提取：复用 Phase 7 实现的上传 + 异步提取流程
- 风格选择器：复用 Phase 8 实现的 StyleSelector 组件

### Claude's Discretion
- 风格管理页面放置位置（推荐 /profile/styles Tab）
- 标签选择器 UI 样式（推荐 chip 模式）
- 参考图上传组件交互细节
- 风格卡片布局设计

### Deferred Ideas (OUT OF SCOPE)
- 风格预览图自动生成（STYLE-V2-01）
- 风格搜索和筛选功能（STYLE-V2-02）
- 风格使用频次统计和排序（STYLE-V2-03）
- 风格市场/社区分享（SOCIAL-V2-01/02）

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| STYLE-05 | 用户可以给风格打标签分类 | 预设标签列表 + 自定义输入模式 |
| EXTRACT-01 | 用户可以上传参考图片 | 参考 CharacterCreationModal 文件上传模式 |
| EXTRACT-02 | AI 自动提取风格描述 | 复用 Phase 7 的 style-extract-task-handler |
| EXTRACT-03 | AI 提取结果可编辑 | 弹窗中 promptZh/promptEn 字段可编辑 |
| EXTRACT-04 | 参考图提取显示状态追踪 | extractionStatus: pending/completed/failed |

## Common Pitfalls

### Pitfall 1: 未登录状态处理不当
**What goes wrong:** 组件在未登录时尝试调用 API 或渲染需要登录的功能
**Why it happens:** 忘记检查 session status
**How to avoid:** 参考 useUserStyles hook 模式，使用 `useSession` 检测状态
```tsx
const { status } = useSession()
if (status !== 'authenticated') return <LoginPrompt />
```
**Warning signs:** 页面加载时出现 401 错误或空白内容

### Pitfall 2: 风格数量上限 UI 反馈缺失
**What goes wrong:** 用户达到上限后点击"新建"无反应或报错
**Why it happens:** 未在前端预检查数量
**How to avoid:**
- 在 StyleManager 中获取 `styles.length`
- 当 `styles.length >= MAX_STYLE_LIMIT (20)` 时禁用新建按钮
- 显示提示文案："已达到风格数量上限（20 个）"

### Pitfall 3: AI 提取状态轮询缺失
**What goes wrong:** 上传参考图后 UI 不更新，用户不知道提取进度
**Why it happens:** 依赖一次性数据获取，未实现状态同步
**How to avoid:**
- 方案 1：使用 SWR/React Query 轮询（推荐）
- 方案 2：设置定时器定期刷新风格详情
- 方案 3：Worker 完成后通过 WebSocket 推送（未来）

### Pitfall 4: 表单验证不一致
**What goes wrong:** 前端验证通过但后端返回 400 错误
**Why it happens:** 前后端验证规则不同步
**How to avoid:** 前端使用与后端相同的 Zod schema（style-schema.ts）
```tsx
import { createUserStyleSchema } from '@/lib/styles/style-schema'
// 前端使用 safeParse 预验证
const parsed = createUserStyleSchema.safeParse(formData)
if (!parsed.success) {
  // 显示错误
}
```

### Pitfall 5: 图片上传后无法预览
**What goes wrong:** 上传到 S3 后图片 URL 无法在浏览器显示
**Why it happens:** MinIO/S3 URL 需要签名或转换
**How to avoid:** 使用 `toFetchableUrl` from `@/lib/storage` 转换 URL

## Code Examples

### API 调用模式
```tsx
// 创建风格
const createStyle = async (data: CreateUserStyleInput) => {
  const res = await apiFetch('/api/user-styles', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.message || '创建失败')
  }
  return res.json()
}

// 删除风格
const deleteStyle = async (id: string) => {
  const res = await apiFetch(`/api/user-styles/${id}`, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error('删除失败')
  return res.json()
}

// 上传参考图
const uploadReferenceImage = async (styleId: string, file: File) => {
  const formData = new FormData()
  formData.append('file', file)
  const res = await apiFetch(`/api/user-styles/${styleId}/upload-ref`, {
    method: 'POST',
    body: formData,
  })
  if (!res.ok) throw new Error('上传失败')
  return res.json()
}
```

### Toast 通知使用
```tsx
import { useToast } from '@/contexts/ToastContext'

const { showToast, showError } = useToast()

// 成功提示
showToast('风格创建成功', 'success')

// 错误提示（自动翻译错误码）
showError('QUOTA_EXCEEDED', { limit: 20 })
// 显示为: "配额已用尽，请稍后重试"
```

### 图片预览 URL 转换
```tsx
import { toFetchableUrl } from '@/lib/storage'

// S3 key 转换为可访问 URL
const previewUrl = toFetchableUrl(style.referenceImageUrl)
// "user-styles/user-123/style-456/ref.jpg" -> "http://localhost:19000/bucket/user-styles/..."
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| 内联 CSS 样式 | Tailwind CSS 4 + CSS 变量 | 项目初期 | 统一视觉风格 |
| 直接 fetch | apiFetch + locale 注入 | 项目初期 | 国际化支持 |
| 硬编码错误码 | showError + next-intl 翻译 | ToastContext 引入 | 统一错误处理 |
| 同步 getArtStylePrompt | 异步 resolveStylePrompt | Phase 2 | 支持自定义风格 |

**Deprecated/outdated:**
- artStylePrompt 缓存字段: Phase 2 废弃，统一走实时查询

## Open Questions

1. **风格数量上限具体数值**
   - What we know: MAX_STYLE_LIMIT = 20 (from style-service.ts)
   - What's unclear: 是否需要显示当前数量/上限（如 "5/20"）
   - Recommendation: 在"新建风格"按钮旁显示 "当前 5/20 个风格"

2. **AI 提取轮询策略**
   - What we know: extractionStatus 有三态
   - What's unclear: 前端如何感知状态变化
   - Recommendation: 创建/编辑弹窗内设置 3 秒轮询，直到状态变为 completed/failed

3. **标签数据存储格式**
   - What we know: tags 字段为 string（逗号分隔）
   - What's unclear: 前端是否需要去重/排序
   - Recommendation: 前端使用 Set 去重，保存时 join(',')

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | 运行时 | ✓ | 22.14.0 | — |
| MySQL | 数据库 | ✓ | 8.0 | — |
| Redis | Worker 队列 | ✓ | 7 | — |
| MinIO/S3 | 图片存储 | ✓ | localhost:19000 | — |
| next-auth | 认证 | ✓ | 4.24.11 | — |

**Missing dependencies with no fallback:**
- None

**Missing dependencies with fallback:**
- None

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 2.1.8 |
| Config file | vitest.config.ts |
| Quick run command | `npm test -- --filter=styles --run` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| STYLE-05 | 标签选择器交互 | unit | `npm test -- tests/unit/components/style-tag-selector.test.ts --run` | ❌ Wave 0 |
| EXTRACT-01 | 图片上传验证 | unit | `npm test -- tests/unit/styles/upload-ref.test.ts --run` | ❌ Wave 0 |
| EXTRACT-04 | 提取状态追踪 | unit | `npm test -- tests/unit/style-extract.test.ts --run` | ✅ |
| UI-01 | 风格列表渲染 | integration | `npm test -- tests/integration/ui/style-manager.test.ts --run` | ❌ Wave 0 |
| UI-02 | CRUD 操作 | e2e | Playwright | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test -- --filter=styles --run`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/unit/components/style-tag-selector.test.ts` — 标签选择器单元测试
- [ ] `tests/unit/styles/upload-ref.test.ts` — 图片上传验证测试
- [ ] `tests/integration/ui/style-manager.test.ts` — 风格管理 UI 集成测试
- [ ] 国际化文案: `messages/zh/profile.json` 需扩展风格管理相关 key

*(If no gaps: "None — existing test infrastructure covers all phase requirements")*

## Sources

### Primary (HIGH confidence)
- 项目源码分析（CharacterCreationModal, GlassModalShell, StyleSelector, useUserStyles, style-service.ts）
- prisma/schema.prisma - UserStyle 模型定义
- src/lib/styles/style-service.ts - MAX_STYLE_LIMIT = 20

### Secondary (MEDIUM confidence)
- Phase 5 CRUD API 实现（src/app/api/user-styles/）
- Phase 7 AI 提取实现（style-extract-task-handler.ts）
- Phase 8 StyleSelector 扩展（08-01-PLAN.md）

### Tertiary (LOW confidence)
- 无

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - 基于现有项目源码分析
- Architecture: HIGH - 复用现有组件模式
- Pitfalls: HIGH - 基于项目已有模式和常见问题

**Research date:** 2026-03-27
**Valid until:** 30 days（项目架构稳定）
