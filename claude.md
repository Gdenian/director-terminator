# 项目开发规范

## 通用规范
- 避免不必要的对象复制或克隆
- 避免多层嵌套，提前返回
- 使用适当的并发控制机制

## 语言规范
- 所有对话和文档都使用中文
- 注释使用中文
- 错误提示使用中文
- 文档使用中文Markdown格式

## 代码可读性
### 命名约定
- 使用有意义的、描述性的名称
- 遵循项目或语言的命名规范
避免缩写和单字母变量（除非是约定俗成的，如循环中的 `i`）

### 代码组织
- 相关代码放在一起
- 一个函数只做一件事
- 保持适当的抽象层次

### 注释与文档
- 注释应该解释为什么，而不是做什么
- 为公共 API 提供清晰的文档
- 更新注释以反映代码变化

## 性能优化
### 内存优化
- 避免不必要的对象创建
- 及时释放不再需要的资源
- 注意内存泄漏问题

### 计算优化
- 避免重复计算
- 使用适当的数据结构和算法
- 延迟计算直到必要时

### 并行优化
- 识别可并行化的任务
- 避免不必要的同步
- 注意线程安全问题

<!-- GSD:project-start source:PROJECT.md -->
## Project

**导演终结者 — 风格自定义系统**

导演终结者是一个 AI 驱动的视频创作平台，用户可以通过文本描述生成视频内容。本次迭代的目标是将现有的硬编码预设风格系统升级为通用的自定义风格系统，让用户拥有更大的创作自由度。

**Core Value:** 用户可以用自己定义的视觉风格生成视频，而不受限于固定的预设选项。

### Constraints

- **技术栈**: 必须在现有 Next.js 15 + Prisma + MySQL 架构上实现
- **向后兼容**: 现有项目的 artStyle 字段和数据不能损坏
- **性能**: 风格列表加载不应影响页面性能
- **存储**: 参考图上传复用现有 S3 存储方案
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Languages
- TypeScript 5 - 全栈开发 (Next.js, Workers, API routes)
- JavaScript - 部分脚本和配置
- Node.js 20+ (Alpine Linux in Docker)
- Browser (React 19, Next.js 15)
## Runtime
- Node.js 22.14.0 (通过 .nvmrc 指定)
- React 19.1.2 (前端框架)
- Next.js 15.5.7 (全栈框架)
- npm 9+
- Lockfile: `package-lock.json` (present)
## Frameworks
- Next.js 15.5.7 - 全栈 Web 框架 (App Router)
- React 19.1.2 - UI 库
- Express 5.2.1 - API 服务 (Bull Board 管理面板)
- Vitest 2.1.8 - 单元/集成测试
- @vitest/coverage-v8 - 覆盖率报告
- Tailwind CSS 4 - CSS 框架
- PostCSS - 样式处理
- ESLint 9 - 代码检查
- tsx 4.20.5 - TypeScript 执行
- concurrently 9.2.1 - 并行运行多个进程
- Husky 9.1.7 - Git hooks
## Key Dependencies
- `ai` 6.0.116 - AI SDK (统一调用接口)
- `@ai-sdk/react` 3.0.118 - React hooks for AI
- `@ai-sdk/openai` 3.0.26 - OpenAI provider
- `@ai-sdk/google` 3.0.22 - Google AI provider
- `openai` 6.8.1 - OpenAI 官方 SDK
- `@openrouter/sdk` 0.3.11 - OpenRouter 聚合
- `@fal-ai/client` 1.7.2 - FAL AI (图片/视频/语音)
- `@google/genai` 1.34.0 - Google Gemini
- Prisma 6.19.2 - ORM
- `@prisma/client` 6.19.2 - Prisma client
- mysql2 3.15.1 - MySQL 驱动
- `@aws-sdk/client-s3` 3.883.0 - S3 客户端
- `@aws-sdk/s3-request-presigner` 3.883.0 - S3 签名 URL
- `cos-nodejs-sdk-v5` 2.15.4 - 腾讯云 COS (预留)
- bullmq 5.67.3 - Redis 队列
- `@bull-board/api` 6.16.4 - 队列管理 API
- `@bull-board/express` 6.16.4 - 队列管理 UI
- ioredis 5.9.2 - Redis 客户端
- @dnd-kit/core 6.3.1 - 拖拽排序
- @dnd-kit/sortable 10.0.0 - 排序组件
- lucide-react 0.575.0 - 图标库
- react-hot-toast 2.6.0 - Toast 通知
- react-grab 0.1.20 - 拖拽组件
- sharp 0.34.5 - 图片处理
- remotion 4.0.405 - 视频生成
- `@remotion/cli` 4.0.405 - Remotion CLI
- `@remotion/player` 4.0.405 - Remotion 播放器
- archiver 7.0.1 - 文件压缩
- mammoth 1.11.0 - Word 文档处理
- jszip 3.10.1 - ZIP 处理
- file-saver 2.0.5 - 文件下载
- next-auth 4.24.11 - 认证框架
- `@next-auth/prisma-adapter` 1.0.7 - Prisma 适配器
- bcryptjs 3.0.2 - 密码哈希
- zod 3.25.76 - Schema 验证
- jsonrepair 3.13.2 - JSON 修复
- lru-cache 11.2.6 - LRU 缓存
- undici 7.22.0 - HTTP 客户端
- next-intl 4.7.0 - 国际化
- @vercel/og 0.8.6 - Open Graph 图片生成
## Configuration
- `tsconfig.json` - 严格模式, ES2017+ target
- 路径别名: `@/*` → `./src/*`
- `next.config.ts` - Turbopack, i18n plugin
- 允许开发 origins: `192.168.31.*:3000`
- PostCSS 配置使用 `@tailwindcss/postcss` v4
- `vitest.config.ts` - Node environment, v8 coverage
- 覆盖率阈值: 80%
- `eslint.config.mjs` - Flat config
## Platform Requirements
- Node.js 18.18.0+
- npm 9.0.0+
- MySQL 8.0 (localhost:13306)
- Redis 7 (localhost:16379)
- MinIO (localhost:19000)
- Docker (linux/amd64, linux/arm64)
- MySQL 8.0
- Redis 7
- S3 兼容存储 (MinIO/AWS S3)
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

## Naming Patterns
- TypeScript files use `camelCase` or `kebab-case`: `async-poll.ts`, `api-config.ts`
- React components use `PascalCase`: `ProviderCard.tsx`, `AssetToolbar.tsx`
- Test files use `.test.ts` suffix: `cost.test.ts`, `ledger.integration.test.ts`
- Directories use `kebab-case`: `tests/helpers`, `src/lib/billing`
- Functions use `camelCase`: `freezeBalance`, `calcText`, `resolveModelPriceStrict`
- Async functions return `Promise<T>` and are prefixed with action verbs
- Helper functions are named descriptively with verb prefixes: `parseModelKeyStrict`, `normalizeCapabilitySelections`
- Variables use `camelCase`: `normalizedAmount`, `freezeId`, `userId`
- Constants use `UPPER_SNAKE_CASE`: `MONEY_SCALE`, `DEFAULT_VOICE_MODEL_ID`
- Type aliases use `PascalCase`: `ApiType`, `UsageUnit`, `BalanceSnapshot`
- Interfaces preferred for object shapes that may be extended
- Types for unions, intersections, and utility types
- Naming: `ModelCustomPricing`, `LedgerRecordParams`, `FreezeSnapshot`
## Code Style
- Tool: ESLint with `next/core-web-vitals` and `next/typescript`
- Configuration: `eslint.config.mjs`
- Path alias: `@/` maps to `src/`
- No `lucide-react` direct imports - use `@/components/ui/icons` only
- No inline `<svg>` elements - use `AppIcon` or icons module
- Strict TypeScript mode enabled
- Explicit parameter and return types on exported functions
- Avoid `any` - use `unknown` with type narrowing
- Use generics when type depends on caller
## Import Organization
- `@/` - src directory (e.g., `@/lib/billing/cost`)
- Relative imports for sibling files
## Error Handling
- `BillingOperationError` for billing-specific errors
- Error codes as string constants: `'BILLING_INVALID_FREEZE'`, `'BILLING_UNKNOWN_MODEL'`
- Error structure: `{ code, message, metadata?, cause? }`
- Use `resolveErrorDisplay()` for user-facing error messages
- Extract provider details from raw API responses
- Normalize errors before display
## Logging
- `logInfo` for operational events
- `logError` for failures with context
## Comments
- Complex business logic requires explanation
- Non-obvious type conversions
- Important decisions or constraints
- Chinese comments for Chinese project context
- JSDoc for public APIs:
## Function Design
- Return `null` for "not found" or "insufficient" instead of throwing
- Throw errors for "invalid" or "impossible" states
- Use `Promise<boolean>` for operations with no return data
## Immutability
- Use spread operator for updates: `{ ...obj, field: newValue }`
- Avoid mutation of function parameters
- Create new objects rather than modifying existing ones
## Module Design
- Named exports preferred
- Barrel files (index.ts) for public interfaces
- Clear separation between internal and external APIs
- Related code co-located
- Feature-based directories under `src/lib/features/`
- Utilities in shared `src/lib/` directories
## React Component Conventions
- Define props with `interface` or `type`
- Use `PascalCase` for component names
- Destructure props in function signature
- Custom hooks in `src/hooks/` or co-located with features
- Follow `use` prefix naming
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## Pattern Overview
- Next.js 14 App Router with Turbopack for fast builds
- TypeScript throughout the entire codebase
- Server components for data fetching, client components for interactivity
- Bull-based worker queue for async task processing
- Repository pattern for data access abstraction
- API handler wrapper for consistent error handling and response format
## Layers
- Purpose: User interface and interactive components
- Location: `src/app/[locale]/*` and `src/components/*`
- Contains: Pages, layouts, React components
- Depends on: Service layer via API routes
- Pattern: Server components fetch data, client components handle interactivity
- Purpose: HTTP endpoint handlers, request validation, auth
- Location: `src/app/api/*`
- Contains: Next.js route handlers (route.ts)
- Depends on: Service layer (lib/*), Prisma
- Pattern: `apiHandler` wrapper provides consistent error handling
- Purpose: Core business logic, external integrations, data processing
- Location: `src/lib/*`
- Contains: Task services, billing, asset management, AI runtime
- Depends on: Data layer (Prisma)
- Pattern: Functional services with typed interfaces
- Purpose: Database access and persistence
- Location: `prisma/schema.prisma`, `src/lib/prisma.ts`
- Contains: Prisma client, migrations
- Pattern: Repository pattern via service modules
## Data Flow
## Key Abstractions
- Purpose: Consistent error handling wrapper for API routes
- Pattern: `apiHandler(async (req) => { ... })`
- Provides: Unified error response format, request logging
- Purpose: Async task tracking and state management
- Key files: `src/lib/task/service.ts`, `src/lib/task/publisher.ts`, `src/lib/task/types.ts`
- Pattern: Task has status (pending, processing, completed, failed), type, target
- Purpose: Background job processing
- Types: image.worker, video.worker, voice.worker, text.worker
- Pattern: Bull queue with event handlers for ready/error/failed
- Purpose: Unified asset handling (characters, locations, media)
- Key files: `src/lib/assets/services/asset-actions.ts`, `src/lib/assets/mappers.ts`
- Pattern: Service layer with contract definitions
- Purpose: Cost tracking and usage metering
- Key files: `src/lib/billing/service.ts`, `src/lib/billing/ledger.ts`
- Pattern: Ledger entries for all billable operations
- Purpose: Abstraction over AI model providers
- Key files: `src/lib/generators/*` (fal, minimax, bailian, google, etc.)
- Pattern: Factory pattern for generator creation
## Entry Points
- Location: `src/app/[locale]/layout.tsx`
- Triggers: User navigates to locale-prefixed path
- Responsibilities: Root layout with providers (SessionProvider, QueryProvider, ToastProvider)
- Pattern: `src/app/api/{domain}/{resource}/route.ts`
- Examples:
- Location: `src/lib/workers/index.ts`
- Triggers: `npm run dev:worker` or `npm run start:worker`
- Responsibilities: Initialize Bull queues, register workers, handle lifecycle
- Location: `middleware.ts`
- Triggers: Every HTTP request
- Responsibilities: i18n routing, locale detection
## Error Handling
- `src/lib/api-errors.ts` - API route error wrapper with unified response format
- `src/lib/errors/codes.ts` - Unified error code system
- `src/lib/errors/normalize.ts` - Error normalization
- Task-level errors via `src/lib/errors/normalize.ts` (normalizeTaskError)
## Cross-Cutting Concerns
<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
