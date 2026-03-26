# Architecture Research

**Domain:** AI 视频创作平台 — 自定义风格系统
**Researched:** 2026-03-27
**Confidence:** HIGH（基于完整代码库分析，直接检查现有架构）

## 现有风格系统架构

在新增自定义风格功能之前，先理清现有系统的边界：

```
┌─────────────────────────────────────────────────────────────┐
│                        客户端层                              │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ StyleSelector│  │ ConfigStage  │  │ NovelInput   │       │
│  │ (下拉选择器) │  │ (项目配置页) │  │ (故事输入页) │       │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘       │
│         └────────────────┼──────────────────┘               │
│                          ↓ artStyle (string value)          │
├─────────────────────────────────────────────────────────────┤
│                        数据层                                │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────┐                 │
│  │ NovelPromotion   │  │ UserPreference   │                 │
│  │ Project.artStyle │  │ .artStyle        │                 │
│  │ (项目级覆盖)     │  │ (用户默认值)     │                 │
│  └──────┬───────────┘  └──────────────────┘                 │
│         ↓                                                    │
│  ┌──────────────────┐                                       │
│  │ config-service   │                                       │
│  │ getProjectModel  │ ← 项目配置 > 用户偏好 > null          │
│  │ Config()         │                                       │
│  └──────┬───────────┘                                       │
├─────────┼───────────────────────────────────────────────────┤
│         ↓        Worker 层                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  getArtStylePrompt(artStyle, locale)                 │   │
│  │  ↓ 从 ART_STYLES 常量查找 promptZh / promptEn       │   │
│  │  ↓ styleText 注入到 buildPanelPrompt() 的 {style}   │   │
│  │  → 图片生成 API 调用                                 │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 关键约束（来自代码分析）

1. `artStyle` 字段在数据库中存的是 **风格标识符字符串**（如 `'american-comic'`），不是提示词本身
2. 提示词在运行时由 `getArtStylePrompt()` 从常量中查找 — 风格标识符与提示词完全解耦
3. `config-service.ts` 统一管理配置层次：项目级 > 用户偏好级
4. Worker 层消费 `modelConfig.artStyle` 并立即转换为提示词文本

---

## 自定义风格系统推荐架构

### 系统总览

```
┌─────────────────────────────────────────────────────────────────┐
│                         客户端层                                 │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌──────────────────┐  ┌───────────────┐   │
│  │  StyleSelector  │  │  StyleManager    │  │ StyleCreate/  │   │
│  │  (扩展版)       │  │  (风格库管理页)  │  │ EditModal     │   │
│  │  系统预设+用户  │  │  CRUD + 标签筛选 │  │ 名称+描述+图  │   │
│  └────────┬────────┘  └──────────────────┘  └───────────────┘   │
├───────────┼─────────────────────────────────────────────────────┤
│           ↓           API 层                                     │
│  ┌───────────────────────────────────────────────────────────┐   │
│  │  /api/user-styles                                         │   │
│  │    GET    → 列出用户所有自定义风格（含系统预设合并）      │   │
│  │    POST   → 创建新风格（手动填写 or 上传参考图触发提取）  │   │
│  │  /api/user-styles/[styleId]                               │   │
│  │    PUT    → 更新风格（名称、描述、标签）                  │   │
│  │    DELETE → 删除风格（系统预设不可删除）                  │   │
│  │  /api/user-styles/extract-from-image                      │   │
│  │    POST   → 上传参考图 → AI 提取风格描述 → 返回草稿      │   │
│  └───────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│                         数据层                                   │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  UserStyle 模型（新增）                                   │    │
│  │    id, userId, name, description, tags                    │    │
│  │    promptZh, promptEn                                     │    │
│  │    referenceImageUrl (S3, nullable)                       │    │
│  │    isSystem: false (用户创建)                             │    │
│  │    createdAt, updatedAt                                   │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  config-service.ts（扩展）                                │    │
│  │    artStyle → 解析 "system:american-comic" 或 "user:uuid"│    │
│  │    getStylePrompt() → 统一查找函数（替换 getArtStyle…）   │    │
│  └──────────────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────────┤
│                         Worker 层                                │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  getStylePrompt(artStyle, locale) → string               │    │
│  │    if system prefix → 查 ART_STYLES 常量                 │    │
│  │    if user prefix   → 查 UserStyle 数据库记录             │    │
│  └──────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### 组件边界

| 组件 | 职责 | 与谁通信 |
|------|------|---------|
| `StyleSelector` (扩展) | 展示系统预设 + 用户自定义列表，触发选择 | 父组件 props，`/api/user-styles` |
| `StyleManager` (新增) | 风格库管理 UI，CRUD 操作入口 | `/api/user-styles/*` |
| `StyleCreateModal` (新增) | 创建/编辑风格表单，支持上传参考图 | `/api/user-styles/extract-from-image`，S3 上传 |
| `/api/user-styles` (新增) | 风格 CRUD REST 端点 | `UserStyle` Prisma 模型，权限验证 |
| `/api/user-styles/extract-from-image` (新增) | 接收参考图，调用 LLM 提取风格描述 | LLM 客户端（复用现有 `llm-client.ts`），S3 存储 |
| `config-service.ts` (扩展) | 解析风格标识符（区分系统/用户） | `UserStyle` 数据库，`ART_STYLES` 常量 |
| Worker 层 `getStylePrompt()` (替换/扩展) | 将风格标识符转为提示词文本 | `config-service.ts`，`ART_STYLES`，`UserStyle` |

---

## 数据模型

### UserStyle 表（新增）

```typescript
model UserStyle {
  id               String   @id @default(uuid())
  userId           String
  name             String
  promptZh         String   @db.Text
  promptEn         String   @db.Text
  tags             String?  // JSON 数组，如 ["写实", "动漫"]
  referenceImageUrl String? @db.Text  // S3 URL（可选）
  createdAt        DateTime @default(now())
  updatedAt        DateTime @default(now()) @updatedAt
  user             User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("user_styles")
}
```

### 风格标识符约定（向后兼容关键）

现有数据库中 `artStyle` 存储裸字符串（如 `"american-comic"`）。新系统需要区分来源：

```
系统预设：  "american-comic"        (保持不变，兼容现有数据)
用户自定义: "user:{uuid}"           (新格式，通过前缀区分)
```

`getStylePrompt()` 解析逻辑：
- 以 `"user:"` 开头 → 查 `UserStyle` 数据库
- 否则 → 查 `ART_STYLES` 常量（现有行为）
- 找不到 → 返回空字符串（现有行为）

这保证了：
- 现有项目的 `artStyle = "american-comic"` 数据不受影响
- 新用户选择自定义风格时存 `"user:{uuid}"`
- Worker 层只改一个函数签名

---

## 数据流

### 创建自定义风格（手动模式）

```
用户填写 [名称 + 描述提示词 + 标签]
    ↓
StyleCreateModal.submit()
    ↓
POST /api/user-styles
    ↓ 验证: 用户风格数量 < 上限
    ↓ 写入 UserStyle 表（userId, name, promptZh, promptEn, tags）
    ↓ 返回新风格对象
    ↓
StyleSelector 列表更新（客户端缓存失效）
```

### 创建自定义风格（参考图模式）

```
用户上传参考图
    ↓
POST /api/asset-hub/upload-temp  (复用现有临时上传端点)
    ↓ 返回临时 S3 URL
    ↓
POST /api/user-styles/extract-from-image { imageUrl }
    ↓ LLM 视觉分析（复用现有 llm-client.ts）
    ↓ 提示词模板："分析这张图片的视觉风格，用于 AI 图像生成..."
    ↓ 返回 { promptZh, promptEn } 草稿
    ↓
StyleCreateModal 填充描述字段（用户可编辑）
    ↓
用户确认 → POST /api/user-styles（同手动模式）
    ↓ 同时将临时图 URL 持久化为 referenceImageUrl
```

### 风格提示词注入图片生成

```
Worker 收到任务 job.data.projectId
    ↓
getProjectModels(projectId, userId) → modelConfig.artStyle = "user:abc-123"
    ↓
getStylePrompt("user:abc-123", locale)
    ↓ 检测 "user:" 前缀
    ↓ prisma.userStyle.findUnique({ where: { id: "abc-123" } })
    ↓ 返回 locale === 'zh' ? style.promptZh : style.promptEn
    ↓
styleText 注入 buildPanelPrompt() → 图片生成 API 调用
```

### StyleSelector 数据加载

```
组件挂载
    ↓
GET /api/user-styles → 返回 { systemStyles: ART_STYLES[], userStyles: UserStyle[] }
    ↓
合并展示：系统预设（不可删除）+ 用户自定义（可编辑/删除）
    ↓
用户选择 → onChange(styleValue) → 父组件存储 artStyle 字段
```

---

## 推荐项目结构（新增部分）

```
src/
├── app/api/user-styles/
│   ├── route.ts                    # GET 列表 / POST 创建
│   ├── [styleId]/route.ts          # PUT 更新 / DELETE 删除
│   └── extract-from-image/route.ts # POST 参考图风格提取
├── components/
│   └── styles/
│       ├── StyleManager.tsx         # 风格库管理页面组件
│       ├── StyleCreateModal.tsx     # 创建/编辑风格弹窗
│       └── StyleTagSelector.tsx     # 标签选择器子组件
├── lib/
│   └── styles/
│       ├── style-resolver.ts        # getStylePrompt() 统一函数
│       ├── style-limit.ts           # 数量上限常量与检查
│       └── style-extract-prompt.ts  # 参考图提取的 LLM 提示词模板
└── prisma/
    └── schema.prisma               # 添加 UserStyle 模型
```

### 结构说明

- **`api/user-styles/`：** 与现有 `api/asset-hub/` 模式一致，独立路由文件夹
- **`components/styles/`：** 风格相关 UI 组件集中，不分散到 ui/ 目录
- **`lib/styles/`：** 风格业务逻辑与 constants.ts 解耦，方便 Worker 引用
- **`style-resolver.ts`：** 单一入口替换现有 `getArtStylePrompt()`，避免多处分叉

---

## 架构模式

### 模式 1：前缀命名空间标识符（兼容扩展）

**场景：** 需要向后兼容存量数据，同时支持新类型实体。

**做法：** 不更改字段类型，用字符串前缀区分语义命名空间。

```typescript
// style-resolver.ts
export async function getStylePrompt(
  artStyle: string | null | undefined,
  locale: 'zh' | 'en',
): Promise<string> {
  if (!artStyle) return ''

  if (artStyle.startsWith('user:')) {
    const styleId = artStyle.slice('user:'.length)
    const style = await prisma.userStyle.findUnique({ where: { id: styleId } })
    if (!style) return ''
    return locale === 'en' ? style.promptEn : style.promptZh
  }

  // 现有行为：查系统预设常量
  const style = ART_STYLES.find(s => s.value === artStyle)
  if (!style) return ''
  return locale === 'en' ? style.promptEn : style.promptZh
}
```

**优点：** 零数据迁移，现有 Worker 只改一行函数调用。
**缺点：** 字符串解析耦合，未来类型多了需要管理命名空间。

### 模式 2：列表 API 合并系统预设与用户风格

**场景：** UI 需要展示统一列表，后端来源不同。

**做法：** API 层合并，而非前端各自查询。

```typescript
// GET /api/user-styles
export async function GET(request: NextRequest) {
  const { session } = await requireUserAuth()

  const userStyles = await prisma.userStyle.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json({
    systemStyles: ART_STYLES,  // 来自常量，始终最新
    userStyles,                 // 来自数据库
  })
}
```

**优点：** 客户端不需要感知两种来源，StyleSelector 接口不变（只换数据结构）。
**缺点：** 列表 API 有轻微混合关注点，但可接受。

### 模式 3：参考图两阶段工作流（提取 + 确认）

**场景：** AI 自动提取风格描述，但不直接持久化，用户需确认编辑。

**做法：** 提取接口返回草稿，保存接口接收最终值。

```typescript
// Step 1: POST /api/user-styles/extract-from-image
// 返回草稿，不写数据库
const draft = await extractStyleFromImage(imageUrl, locale)
// { promptZh: "...", promptEn: "..." }

// Step 2: 用户在 modal 中确认/编辑
// Step 3: POST /api/user-styles
// 写数据库（含 referenceImageUrl）
```

**优点：** 用户对 AI 输出有控制权，失败时不产生垃圾数据。
**缺点：** 前端需要管理临时状态。

---

## 集成点

### 与现有系统的边界

| 边界 | 通信方式 | 注意事项 |
|------|---------|---------|
| `StyleSelector` ↔ 新数据 | props 接口兼容，options 格式不变 | `value` 字段新增 `"user:uuid"` 格式 |
| `config-service.ts` ↔ `UserStyle` | 直接 prisma 查询 | `getProjectModelConfig` 不需改，只改 Worker 调用处 |
| Worker 层 ↔ `getStylePrompt()` | 函数替换（getArtStylePrompt → getStylePrompt） | 需要改为 async，因为用户风格要查 DB |
| 参考图上传 ↔ S3 | 复用 `/api/asset-hub/upload-temp` | 确认后将 tempUrl 持久化到 `UserStyle.referenceImageUrl` |
| 风格提取 ↔ LLM | 复用 `llm-client.ts` | 使用视觉模型（如 Gemini），需要 `imageUrl` 作为输入 |

### 外部服务

| 服务 | 集成模式 | 备注 |
|------|---------|------|
| S3/COS 存储 | 复用 `uploadObject()` + `generateUniqueKey()` | 参考图存储路径建议 `user-styles/{userId}/{styleId}/ref.jpg` |
| LLM（视觉） | 复用 `llm-client.ts` | 提示词需要专门设计，要求输出结构化的 promptZh/promptEn |

---

## 构建顺序（依赖关系）

以下顺序基于组件依赖关系，后一阶段依赖前一阶段：

```
阶段 1：数据模型基础
    → 添加 UserStyle Prisma 模型 + 数据库迁移
    → 定义风格标识符命名空间约定

阶段 2：后端 API
    → /api/user-styles CRUD（GET、POST、PUT、DELETE）
    → 数量上限检查逻辑
    → /api/user-styles/extract-from-image（参考图 AI 提取）

阶段 3：风格解析扩展
    → lib/styles/style-resolver.ts（替换 getArtStylePrompt）
    → Worker 层调用点修改（panel-image、character-image、location-image 等）

阶段 4：UI 组件
    → StyleCreateModal（创建/编辑风格）
    → StyleSelector 扩展（展示用户风格 + 管理入口）
    → StyleManager（完整风格库管理页，可选作为独立路由）
```

**关键依赖：**
- 阶段 3 依赖阶段 1（UserStyle 表必须存在）
- 阶段 4 依赖阶段 2（UI 需要 API）
- 阶段 3 和阶段 4 可并行开发（API 合约确定后）

---

## 缩放考虑

| 规模 | 架构调整 |
|------|---------|
| 0-1000 用户 | 当前单体 Next.js 方案完全够用，无需调整 |
| 1000-10000 用户 | 风格列表加缓存（React Query 默认足够），提取接口考虑排队防滥用 |
| 10000+ 用户 | 若参考图提取 LLM 调用量大，考虑与图片/视频 Worker 同队列限流 |

**第一瓶颈：** 参考图 AI 提取接口（LLM 视觉分析延迟高，约 3-10s），需要在 UI 层做 loading 状态处理，不需要架构改动。

---

## 反面模式

### 反面模式 1：直接存 promptText 到 artStyle 字段

**做法：** 将完整提示词文本直接存入 `NovelPromotionProject.artStyle`（目前存的是标识符）。

**为什么错：** artStyle 字段设计为标识符，不是提示词文本。混合存储会破坏 `StyleSelector` 展示（选中状态无法匹配），且丢失双语能力。

**正确做法：** 始终存标识符（`"user:uuid"`），提示词在运行时通过 `getStylePrompt()` 解析。

### 反面模式 2：在 StyleSelector 中分别请求系统预设和用户风格

**做法：** `StyleSelector` 自己维护两个独立状态，分别 fetch。

**为什么错：** 增加组件复杂度，增加请求数，且后续合并排序逻辑难以维护。

**正确做法：** API 层统一合并返回 `{ systemStyles, userStyles }`，前端组件只关心展示逻辑。

### 反面模式 3：参考图提取完直接写数据库

**做法：** 上传参考图后立即在后端持久化一条 UserStyle 记录。

**为什么错：** 用户可能中途放弃，产生孤立记录；AI 提取结果可能不理想，用户需要编辑才能接受。

**正确做法：** 提取接口只返回草稿数据，用户确认后前端调用创建接口，一次写库。

### 反面模式 4：getArtStylePrompt 改为同步但加缓存

**做法：** 将 `getStylePrompt` 保持同步，通过模块级 Map 缓存用户风格。

**为什么错：** 内存缓存在多 Worker 进程/Serverless 环境下无效，且缓存失效复杂。Worker 层已经是异步上下文，async 函数是自然选择。

**正确做法：** 改为 async，让 Prisma 处理连接池和查询优化。

---

## 来源

- 代码分析：`/src/lib/constants.ts` — 现有 ART_STYLES 结构与 getArtStylePrompt()
- 代码分析：`/src/lib/config-service.ts` — ProjectModelConfig 与优先级逻辑
- 代码分析：`/src/lib/workers/handlers/panel-image-task-handler.ts` — artStyle 注入点
- 代码分析：`/prisma/schema.prisma` — NovelPromotionProject、UserPreference、User 模型
- 代码分析：`/src/components/selectors/RatioStyleSelectors.tsx` — StyleSelector 现有接口
- 代码分析：`/src/app/api/asset-hub/upload-image/route.ts` — 现有 S3 上传模式

---
*Architecture research for: AI 视频创作平台 — 自定义风格系统*
*Researched: 2026-03-27*
