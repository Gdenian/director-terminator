# Technology Stack

**Analysis Date:** 2026-03-27

## Languages

**Primary:**
- TypeScript 5 - 全栈开发 (Next.js, Workers, API routes)
- JavaScript - 部分脚本和配置

**Target Environment:**
- Node.js 20+ (Alpine Linux in Docker)
- Browser (React 19, Next.js 15)

## Runtime

**Environment:**
- Node.js 22.14.0 (通过 .nvmrc 指定)
- React 19.1.2 (前端框架)
- Next.js 15.5.7 (全栈框架)

**Package Manager:**
- npm 9+
- Lockfile: `package-lock.json` (present)

## Frameworks

**Core:**
- Next.js 15.5.7 - 全栈 Web 框架 (App Router)
- React 19.1.2 - UI 库
- Express 5.2.1 - API 服务 (Bull Board 管理面板)

**Testing:**
- Vitest 2.1.8 - 单元/集成测试
- @vitest/coverage-v8 - 覆盖率报告

**Build/Dev:**
- Tailwind CSS 4 - CSS 框架
- PostCSS - 样式处理
- ESLint 9 - 代码检查
- tsx 4.20.5 - TypeScript 执行
- concurrently 9.2.1 - 并行运行多个进程
- Husky 9.1.7 - Git hooks

## Key Dependencies

**AI/ML Providers:**
- `ai` 6.0.116 - AI SDK (统一调用接口)
- `@ai-sdk/react` 3.0.118 - React hooks for AI
- `@ai-sdk/openai` 3.0.26 - OpenAI provider
- `@ai-sdk/google` 3.0.22 - Google AI provider
- `openai` 6.8.1 - OpenAI 官方 SDK
- `@openrouter/sdk` 0.3.11 - OpenRouter 聚合
- `@fal-ai/client` 1.7.2 - FAL AI (图片/视频/语音)
- `@google/genai` 1.34.0 - Google Gemini

**Database:**
- Prisma 6.19.2 - ORM
- `@prisma/client` 6.19.2 - Prisma client
- mysql2 3.15.1 - MySQL 驱动

**Storage:**
- `@aws-sdk/client-s3` 3.883.0 - S3 客户端
- `@aws-sdk/s3-request-presigner` 3.883.0 - S3 签名 URL
- `cos-nodejs-sdk-v5` 2.15.4 - 腾讯云 COS (预留)

**Task Queue:**
- bullmq 5.67.3 - Redis 队列
- `@bull-board/api` 6.16.4 - 队列管理 API
- `@bull-board/express` 6.16.4 - 队列管理 UI

**Redis:**
- ioredis 5.9.2 - Redis 客户端

**UI Components:**
- @dnd-kit/core 6.3.1 - 拖拽排序
- @dnd-kit/sortable 10.0.0 - 排序组件
- lucide-react 0.575.0 - 图标库
- react-hot-toast 2.6.0 - Toast 通知
- react-grab 0.1.20 - 拖拽组件

**Media Processing:**
- sharp 0.34.5 - 图片处理
- remotion 4.0.405 - 视频生成
- `@remotion/cli` 4.0.405 - Remotion CLI
- `@remotion/player` 4.0.405 - Remotion 播放器
- archiver 7.0.1 - 文件压缩
- mammoth 1.11.0 - Word 文档处理
- jszip 3.10.1 - ZIP 处理
- file-saver 2.0.5 - 文件下载

**Authentication:**
- next-auth 4.24.11 - 认证框架
- `@next-auth/prisma-adapter` 1.0.7 - Prisma 适配器
- bcryptjs 3.0.2 - 密码哈希

**Validation & Utils:**
- zod 3.25.76 - Schema 验证
- jsonrepair 3.13.2 - JSON 修复
- lru-cache 11.2.6 - LRU 缓存
- undici 7.22.0 - HTTP 客户端

**i18n:**
- next-intl 4.7.0 - 国际化

**OG Image:**
- @vercel/og 0.8.6 - Open Graph 图片生成

## Configuration

**TypeScript:**
- `tsconfig.json` - 严格模式, ES2017+ target
- 路径别名: `@/*` → `./src/*`

**Next.js:**
- `next.config.ts` - Turbopack, i18n plugin
- 允许开发 origins: `192.168.31.*:3000`

**Tailwind:**
- PostCSS 配置使用 `@tailwindcss/postcss` v4

**Vitest:**
- `vitest.config.ts` - Node environment, v8 coverage
- 覆盖率阈值: 80%

**ESLint:**
- `eslint.config.mjs` - Flat config

## Platform Requirements

**Development:**
- Node.js 18.18.0+
- npm 9.0.0+
- MySQL 8.0 (localhost:13306)
- Redis 7 (localhost:16379)
- MinIO (localhost:19000)

**Production:**
- Docker (linux/amd64, linux/arm64)
- MySQL 8.0
- Redis 7
- S3 兼容存储 (MinIO/AWS S3)

---

*Stack analysis: 2026-03-27*
