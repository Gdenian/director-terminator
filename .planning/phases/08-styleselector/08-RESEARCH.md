# Phase 8: StyleSelector 扩展 - Research

**Researched:** 2026-03-27
**Domain:** React 组件开发、API 集成、前端状态管理
**Confidence:** HIGH

## Summary

本阶段需要扩展现有的 StyleSelector 组件，使其能够同时展示系统预设风格（4 个固定选项）和用户自定义风格（从 Phase 5 实现的 `/api/user-styles` API 获取）。核心挑战在于：
1. 需要在两个不同位置（首页和配置弹窗）统一修改
2. 需要修改后端 `validateArtStyleField` 函数以支持 `"user:uuid"` 格式
3. 需要实现分组展示 UI 模式（系统预设 + 用户自定义）
4. 当用户无自定义风格时，不显示空分组

**Primary recommendation:** 创建统一的 `useUserStyles` hook 获取用户风格，修改 StyleSelector 组件支持分组展示，更新后端验证逻辑支持用户风格标识符。

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.1.2 | UI 框架 | 项目标准框架 |
| Next.js | 15.5.7 | 全栈框架 | App Router 架构 |
| Prisma | 6.19.2 | ORM | 已有 UserStyle 模型 |
| zod | 3.25.76 | Schema 验证 | 项目标准验证库 |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| next-intl | 4.7.0 | 国际化 | 多语言支持 |
| lucide-react | 0.575.0 | 图标库 | 通过 `@/components/ui/icons` 使用 |

**Installation:** 无需额外安装，所有依赖已存在于项目中。

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/
│   ├── selectors/
│   │   └── RatioStyleSelectors.tsx    # 首页 StyleSelector
│   └── ui/config-modals/
│       └── config-modal-selectors.tsx  # 配置弹窗 StyleSelector
├── hooks/
│   └── useUserStyles.ts               # 新增：用户风格 hook
├── lib/
│   ├── styles/
│   │   ├── style-namespace.ts         # 风格命名空间工具
│   │   ├── style-resolver.ts          # 风格解析器
│   │   └── style-service.ts           # 风格服务层
│   └── constants.ts                   # ART_STYLES 常量
└── app/api/user-styles/
    └── route.ts                       # 用户风格 API
```

### Pattern 1: 分组选择器模式
**What:** 在下拉列表中展示分组选项（系统预设 + 用户自定义）
**When to use:** 当选择器需要同时展示固定选项和动态选项时
**Example:**
```tsx
// 来源：基于现有 StyleSelector 组件扩展
interface StyleOption {
  value: string
  label: string
  isSystem?: boolean  // 标记是否为系统预设
}

interface GroupedStyleOptions {
  system: StyleOption[]   // 系统预设（始终展示）
  user: StyleOption[]     // 用户自定义（可能为空）
}

// 组件内部逻辑
const renderOptions = (options: StyleOption[], groupLabel?: string) => (
  <>
    {groupLabel && options.length > 0 && (
      <div className="text-xs text-[var(--glass-text-tertiary)] px-3 py-1.5 font-medium">
        {groupLabel}
      </div>
    )}
    {options.map((option) => (
      <button key={option.value} ...>
        {option.label}
      </button>
    ))}
  </>
)
```

### Pattern 2: 用户风格 Hook
**What:** 封装用户风格获取逻辑，支持缓存和状态管理
**When to use:** 需要在多个组件中访问用户风格列表时
**Example:**
```tsx
// 来源：参考现有 apiFetch 和 session 模式
import { useSession } from 'next-auth/react'
import { apiFetch } from '@/lib/api-fetch'
import { toUserStyleIdentifier } from '@/lib/styles/style-namespace'

interface UserStyle {
  id: string
  name: string
  promptZh: string
  promptEn: string
  tags: string | null
  referenceImageUrl: string | null
}

export function useUserStyles() {
  const { data: session, status } = useSession()
  const [styles, setStyles] = useState<UserStyle[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (status !== 'authenticated') return
    setLoading(true)
    apiFetch('/api/user-styles')
      .then(res => res.json())
      .then(data => setStyles(data.styles ?? []))
      .finally(() => setLoading(false))
  }, [status])

  // 转换为选择器选项格式
  const options = useMemo(() => styles.map(s => ({
    value: toUserStyleIdentifier(s.id),
    label: s.name,
    isSystem: false,
  })), [styles])

  return { styles, options, loading }
}
```

### Anti-Patterns to Avoid
- **直接在组件中调用 fetch:** 应使用 apiFetch 以注入 locale header
- **硬编码系统预设 ID:** 应从 ART_STYLES 常量派生
- **忽略空状态:** 用户无自定义风格时应隐藏分组，不显示空分组标题
- **同步验证用户风格:** 后端需要异步查询数据库验证用户风格存在性

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| 风格标识符解析 | 自己写字符串处理 | `style-namespace.ts` 工具函数 | 已有 isUserStyle, extractUserStyleId, toUserStyleIdentifier |
| 风格提示词获取 | 自己写数据库查询 | `resolveStylePrompt()` | 已有统一解析器，支持系统预设和用户风格 |
| API 调用 | 原生 fetch | `apiFetch` | 自动注入 Accept-Language header |
| 系统预设列表 | 自己定义常量 | `ART_STYLES` | 已有 4 个系统预设定义 |

**Key insight:** Phase 2-5 已完成核心基础设施，本阶段主要是 UI 层集成和后端验证逻辑扩展。

## Common Pitfalls

### Pitfall 1: 后端验证不兼容用户风格
**What goes wrong:** `validateArtStyleField` 只接受 ART_STYLES 中的值，拒绝 `"user:uuid"` 格式
**Why it happens:** Phase 5 实现 API 时未修改项目配置的验证逻辑
**How to avoid:** 扩展验证函数，检测 `"user:"` 前缀时走用户风格验证路径
**Warning signs:** 创建项目后选择自定义风格报 "INVALID_ART_STYLE" 错误

### Pitfall 2: 两个 StyleSelector 不同步
**What goes wrong:** 只修改首页的 StyleSelector，忘记修改配置弹窗中的
**Why it happens:** 两个同名组件位于不同文件
**How to avoid:** 创建统一的 `useUserStyles` hook，两个组件共用
**Warning signs:** 首页能看到自定义风格，配置弹窗看不到

### Pitfall 3: 空分组显示
**What goes wrong:** 用户无自定义风格时，显示空的"自定义风格"分组
**Why it happens:** 未检查 user options 数组长度
**How to avoid:** 条件渲染分组，仅当 `userOptions.length > 0` 时显示分组标题
**Warning signs:** 选择器中显示孤立的分组标题

### Pitfall 4: 选中状态丢失
**What goes wrong:** 切换到自定义风格后，显示为空或默认选项
**Why it happens:** `selectedOption` 查找逻辑未考虑用户风格标识符格式
**How to avoid:** 查找时使用完整标识符匹配，包括 `"user:uuid"` 格式
**Warning signs:** 选中自定义风格后下拉框显示不正确

## Code Examples

### 现有系统预设常量 (ART_STYLES)
```typescript
// 来源：src/lib/constants.ts
export const ART_STYLES = [
  {
    value: 'american-comic',
    label: '漫画风',
    preview: '漫',
    promptZh: '日式动漫风格',
    promptEn: 'Japanese anime style'
  },
  {
    value: 'chinese-comic',
    label: '精致国漫',
    preview: '国',
    promptZh: '现代高质量漫画风格，动漫风格，细节丰富精致，线条锐利干净，质感饱满，超清，干净的画面风格，2D风格，动漫风格。',
    promptEn: 'Modern premium Chinese comic style, rich details, clean sharp line art, full texture, ultra-clear 2D anime aesthetics.'
  },
  {
    value: 'japanese-anime',
    label: '日系动漫风',
    preview: '日',
    promptZh: '现代日系动漫风格，赛璐璐上色，清晰干净的线条，视觉小说CG感。高质量2D风格',
    promptEn: 'Modern Japanese anime style, cel shading, clean line art, visual-novel CG look, high-quality 2D style.'
  },
  {
    value: 'realistic',
    label: '真人风格',
    preview: '实',
    promptZh: '真实电影级画面质感，真实现实场景，色彩饱满通透，画面干净精致，真实感',
    promptEn: 'Realistic cinematic look, real-world scene fidelity, rich transparent colors, clean and refined image quality.'
  }
]
```

### 风格命名空间工具
```typescript
// 来源：src/lib/styles/style-namespace.ts
/** 判断风格标识符是否为用户自定义风格（以 "user:" 前缀开头） */
export function isUserStyle(artStyle: string): boolean {
  return artStyle.startsWith('user:')
}

/** 从用户风格标识符中提取 UserStyle ID */
export function extractUserStyleId(artStyle: string): string {
  return artStyle.slice('user:'.length)
}

/** 将 UserStyle ID 转换为完整的风格标识符 */
export function toUserStyleIdentifier(styleId: string): string {
  return `user:${styleId}`
}
```

### 用户风格 API 响应格式
```typescript
// 来源：src/app/api/user-styles/route.ts
// GET /api/user-styles 响应格式
{
  styles: Array<{
    id: string
    name: string
    promptZh: string
    promptEn: string
    tags: string | null
    referenceImageUrl: string | null
    createdAt: Date
    updatedAt: Date
  }>
}
```

### 后端验证扩展示例
```typescript
// 来源：需要修改 src/app/api/novel-promotion/[projectId]/route.ts
import { isUserStyle, extractUserStyleId } from '@/lib/styles/style-namespace'
import { prisma } from '@/lib/prisma'

// 当前实现（仅支持系统预设）
function validateArtStyleField(value: unknown): string {
  if (typeof value !== 'string') {
    throw new ApiError('INVALID_PARAMS', { ... })
  }
  const artStyle = value.trim()
  if (!isArtStyleValue(artStyle)) {  // 只检查 ART_STYLES
    throw new ApiError('INVALID_PARAMS', { ... })
  }
  return artStyle
}

// 扩展后（支持用户风格）- 需要改为异步
async function validateArtStyleField(
  value: unknown,
  userId: string,
): Promise<string> {
  if (typeof value !== 'string') {
    throw new ApiError('INVALID_PARAMS', { ... })
  }
  const artStyle = value.trim()

  // 系统预设路径
  if (!isUserStyle(artStyle)) {
    if (!isArtStyleValue(artStyle)) {
      throw new ApiError('INVALID_PARAMS', { ... })
    }
    return artStyle
  }

  // 用户风格路径：验证存在性和所有权
  const styleId = extractUserStyleId(artStyle)
  const userStyle = await prisma.userStyle.findUnique({
    where: { id: styleId, userId },
    select: { id: true },
  })
  if (!userStyle) {
    throw new ApiError('INVALID_PARAMS', {
      code: 'INVALID_ART_STYLE',
      field: 'artStyle',
      message: '指定的自定义风格不存在',
    })
  }
  return artStyle
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| 同步 `getArtStylePrompt()` | 异步 `resolveStylePrompt()` | Phase 2 | 支持异步查询用户风格 |
| 硬编码系统预设 | ART_STYLES 常量 + UserStyle 表 | Phase 1, 5 | 支持用户自定义 |
| 直接验证 artStyle | 仅验证系统预设 | Phase 5 之前 | 需扩展支持用户风格 |

**Deprecated/outdated:**
- `artStylePrompt` 缓存字段：Phase 3 已废弃，统一使用 `resolveStylePrompt()` 实时查询
- `isArtStyleValue()` 单独验证：需要扩展为同时支持用户风格标识符

## Open Questions

1. **是否需要支持用户风格预览图？**
   - What we know: UserStyle 模型有 `referenceImageUrl` 字段
   - What's unclear: StyleSelector 是否需要展示预览图
   - Recommendation: Phase 8 暂不实现，保持文字列表形式，Phase 9 风格管理 UI 再考虑

2. **用户风格排序规则？**
   - What we know: API 返回 `orderBy: { createdAt: 'desc' }`
   - What's unclear: 用户是否需要自定义排序
   - Recommendation: 暂用创建时间倒序，Phase 9 可扩展拖拽排序

3. **未登录用户如何处理？**
   - What we know: 首页有认证检查，未登录会跳转
   - What's unclear: 配置弹窗是否需要特殊处理
   - Recommendation: 复用现有认证逻辑，未登录时仅显示系统预设

## Environment Availability

> 无外部依赖，纯代码变更。

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| MySQL | UserStyle 存储 | ✓ | 8.0 | — |
| Redis | 无 | — | — | — |
| Node.js | 运行时 | ✓ | 22.14.0 | — |

**Missing dependencies with no fallback:** 无

**Missing dependencies with fallback:** 无

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 2.1.8 |
| Config file | `vitest.config.ts` |
| Quick run command | `npm test -- --run tests/unit/style-namespace.test.ts` |
| Full suite command | `npm test -- --run` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INTEG-03 | StyleSelector 展示 4 个系统预设风格 | unit | `npm test -- --run tests/components/StyleSelector.test.tsx` | Wave 0 |
| INTEG-03 | StyleSelector 展示用户自定义风格 | unit | `npm test -- --run tests/components/StyleSelector.test.tsx` | Wave 0 |
| INTEG-03 | 选中自定义风格保存 `"user:uuid"` 格式 | integration | `npm test -- --run tests/integration/art-style-update.test.ts` | Wave 0 |
| INTEG-03 | 用户无自定义风格时仅显示系统预设 | unit | `npm test -- --run tests/components/StyleSelector.test.tsx` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test -- --run tests/unit/style-namespace.test.ts tests/unit/style-resolver.test.ts`
- **Per wave merge:** `npm test -- --run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/components/StyleSelector.test.tsx` - StyleSelector 组件测试（需要 @testing-library/react）
- [ ] `tests/integration/art-style-update.test.ts` - artStyle 更新集成测试
- [ ] `tests/setup/react.ts` - React 测试环境 setup（如需要组件测试）

*(If no gaps: "None - existing test infrastructure covers all phase requirements")*

## Sources

### Primary (HIGH confidence)
- `src/components/selectors/RatioStyleSelectors.tsx` - 首页 StyleSelector 组件实现
- `src/components/ui/config-modals/config-modal-selectors.tsx` - 配置弹窗 StyleSelector 组件
- `src/lib/constants.ts` - ART_STYLES 常量定义
- `src/lib/styles/style-namespace.ts` - 风格命名空间工具函数
- `src/lib/styles/style-resolver.ts` - 异步风格解析器
- `src/lib/styles/style-service.ts` - 风格服务层（getUserStyles）
- `src/app/api/user-styles/route.ts` - 用户风格 CRUD API
- `src/app/api/novel-promotion/[projectId]/route.ts` - 项目配置 PATCH 端点
- `prisma/schema.prisma` - UserStyle 模型定义

### Secondary (MEDIUM confidence)
- `src/app/[locale]/home/page.tsx` - 首页 StyleSelector 使用示例
- `src/components/ui/config-modals/ConfigEditModal.tsx` - 配置弹窗使用示例
- `src/lib/home/create-project-launch.ts` - 项目创建时 artStyle 传递方式
- `src/lib/config-service.ts` - 项目配置获取（含 artStyle）

### Tertiary (LOW confidence)
- 无

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - 所有依赖已存在于项目中
- Architecture: HIGH - 两个 StyleSelector 组件结构清晰，API 已实现
- Pitfalls: HIGH - 基于代码审查发现的问题

**Research date:** 2026-03-27
**Valid until:** 30 days (React/Next.js 生态稳定)
