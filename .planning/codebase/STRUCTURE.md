# Codebase Structure

**Analysis Date:** 2026-03-27

## Directory Layout

```
导演终结者/
├── prisma/                    # 数据库 schema 和迁移
│   └── schema.prisma          # Prisma 数据模型定义
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── [locale]/          # 国际化路由 (zh, en)
│   │   │   ├── layout.tsx     # 根布局
│   │   │   ├── page.tsx      # 首页/落地页
│   │   │   ├── providers.tsx  # 客户端 providers
│   │   │   ├── home/          # 首页
│   │   │   ├── auth/          # 认证 (signin, signup)
│   │   │   ├── workspace/     # 工作区
│   │   │   │   ├── page.tsx   # 工作区列表
│   │   │   │   ├── [projectId]/ # 项目详情
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   ├── components/
│   │   │   │   │   ├── hooks/
│   │   │   │   │   └── modes/
│   │   │   │   │       └── novel-promotion/ # 小说推文模式
│   │   │   │   │           ├── components/
│   │   │   │   │           └── hooks/
│   │   │   │   └── asset-hub/ # 资产中心
│   │   │   │       ├── page.tsx
│   │   │   │       └── components/
│   │   │   └── profile/       # 用户设置
│   │   │       ├── page.tsx
│   │   │       └── components/
│   │   └── api/               # API 路由
│   │       ├── tasks/         # 任务管理
│   │       ├── projects/      # 项目管理
│   │       ├── novel-promotion/ # 小说推文功能
│   │       ├── asset-hub/     # 资产管理
│   │       ├── auth/          # 认证
│   │       ├── user/          # 用户API
│   │       └── storage/       # 存储API
│   ├── components/            # 共享组件
│   │   ├── ui/                # 基础UI组件
│   │   ├── providers/         # React providers
│   │   └── task/              # 任务相关组件
│   ├── contexts/              # React contexts
│   │   └── ToastContext.tsx   # Toast通知
│   ├── lib/                   # 核心业务逻辑
│   │   ├── task/              # 任务系统
│   │   ├── billing/           # 计费系统
│   │   ├── assets/            # 资产管理
│   │   ├── workers/           # 后台任务处理器
│   │   │   ├── index.ts       # Worker入口
│   │   │   ├── handlers/      # 具体任务处理
│   │   │   ├── image.worker.ts
│   │   │   ├── video.worker.ts
│   │   │   ├── voice.worker.ts
│   │   │   └── text.worker.ts
│   │   ├── generators/        # AI生成器
│   │   │   ├── fal.ts
│   │   │   ├── minimax.ts
│   │   │   ├── bailian.ts
│   │   │   └── google.ts
│   │   ├── ai-runtime/        # AI运行时抽象
│   │   ├── billing/           # 计费逻辑
│   │   ├── providers/         # AI提供商
│   │   ├── llm/               # LLM调用封装
│   │   ├── storage/           # 文件存储
│   │   ├── prompt-i18n/       # 提示词国际化
│   │   └── logging/           # 日志系统
│   ├── i18n/                  # 国际化配置
│   │   ├── routing.ts         # 路由配置
│   │   └── navigation.ts      # 导航工具
│   └── types/                 # TypeScript类型定义
├── messages/                  # 国际化消息
│   ├── zh/                    # 中文翻译
│   └── en/                    # 英文翻译
├── tests/                     # 测试文件
│   ├── unit/                  # 单元测试
│   ├── integration/           # 集成测试
│   └── ...
├── scripts/                   # 工具脚本
├── middleware.ts              # Next.js中间件
└── package.json               # 项目配置
```

## Directory Purposes

**`src/app/[locale]/`:**
- Purpose: Next.js App Router with locale-based routing
- Contains: Pages, layouts, nested routes
- Key files: `layout.tsx`, `page.tsx`, `providers.tsx`

**`src/app/api/`:**
- Purpose: API route handlers (App Router route.ts files)
- Contains: RESTful endpoints organized by domain
- Pattern: Each `route.ts` exports HTTP method handlers (GET, POST, etc.)

**`src/components/`:**
- Purpose: Shared React components
- Contains: UI components, domain-specific components
- Subdirs: `ui/`, `providers/`, `task/`, `assistant/`, `media/`

**`src/lib/`:**
- Purpose: Core business logic, services, utilities
- Contains: Service modules, workers, generators, integrations
- Key modules: `task/`, `billing/`, `assets/`, `workers/`, `generators/`

**`src/contexts/`:**
- Purpose: React context providers
- Contains: `ToastContext.tsx` for notifications

**`src/types/`:**
- Purpose: TypeScript type definitions
- Contains: Domain types, NextAuth types

**`src/i18n/`:**
- Purpose: Internationalization configuration
- Contains: Routing and navigation utilities

## Key File Locations

**Entry Points:**
- `src/app/[locale]/layout.tsx` - Root layout with providers
- `middleware.ts` - i18n middleware
- `src/lib/workers/index.ts` - Worker process entry

**Configuration:**
- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript configuration
- `next.config.ts` - Next.js configuration
- `vitest.config.ts` - Test runner configuration
- `prisma/schema.prisma` - Database schema
- `.env.example` - Environment variables template

**Core Logic:**
- `src/lib/api-errors.ts` - API错误处理封装
- `src/lib/task/service.ts` - 任务服务
- `src/lib/async-submit.ts` - 异步任务提交
- `src/lib/async-poll.ts` - 异步任务轮询
- `src/lib/api-auth.ts` - API认证中间件

**Testing:**
- `tests/unit/` - 单元测试目录
- `tests/integration/` - 集成测试目录

## Naming Conventions

**Files:**
- React components: PascalCase (`Navbar.tsx`, `TaskCard.tsx`)
- TypeScript modules: kebab-case or camelCase (`async-submit.ts`, `apiErrors.ts`)
- API routes: kebab-case (`asset-hub/`, `novel-promotion/`)
- Tests: `.test.ts` or `.spec.ts` suffix

**Directories:**
- Features/domains: kebab-case (`novel-promotion/`, `asset-hub/`)
- Components: PascalCase (`components/`, `providers/`)

**Functions:**
- camelCase: `submitFalTask`, `queryTasks`
- React hooks: `useImageGeneration`, `useTaskPolling`

## Where to Add New Code

**New API Route:**
- Primary: `src/app/api/{domain}/{resource}/route.ts`
- Example: `src/app/api/tasks/route.ts`
- Pattern: Export named HTTP method handlers

**New Page:**
- Primary: `src/app/[locale]/{feature}/page.tsx`
- Components: `src/app/[locale]/{feature}/components/`
- Hooks: `src/app/[locale]/{feature}/hooks/`

**New Shared Component:**
- Location: `src/components/{category}/`
- Example: `src/components/ui/Button.tsx`

**New Worker Handler:**
- Location: `src/lib/workers/handlers/`
- Pattern: Export handler function matching worker interface

**New Service Module:**
- Location: `src/lib/{domain}/`
- Example: `src/lib/billing/service.ts`

**New Test:**
- Unit: `tests/unit/{domain}/{feature}.test.ts`
- Integration: `tests/integration/{domain}/{feature}.test.ts`

## Special Directories

**`src/lib/assets/`:**
- Purpose: Asset management services (characters, locations)
- Pattern: Services under `services/`, types under `kinds/`

**`src/lib/workers/handlers/`:**
- Purpose: Task-specific processing logic
- Contains: 20+ handlers for various task types

**`src/app/api/novel-promotion/`:**
- Purpose: Novel promotion mode API endpoints
- Note: Highly specific feature with many nested routes

**`src/app/[locale]/workspace/[projectId]/modes/novel-promotion/`:**
- Purpose: Novel promotion mode UI
- Contains: Components, hooks, and page for this mode

**`messages/`:**
- Purpose: i18n translation files
- Structure: `messages/{locale}/{namespace}.json`

---

*Structure analysis: 2026-03-27*
