# External Integrations

**Analysis Date:** 2026-03-27

## APIs & External Services

**AI/ML Providers:**

- **OpenAI** - GPT 系列模型
  - SDK: `openai` 6.8.1, `@ai-sdk/openai` 3.0.26
  - Auth: `llmApiKey` (用户配置)

- **Google AI (Gemini)** - Gemini 模型
  - SDK: `@google/genai` 1.34.0, `@ai-sdk/google` 3.0.22
  - Auth: `googleAiKey` (用户配置)

- **FAL AI** - 图片/视频/语音生成
  - SDK: `@fal-ai/client` 1.7.2
  - Auth: `falApiKey` (用户配置)

- **OpenRouter** - AI 模型聚合平台
  - SDK: `@openrouter/sdk` 0.3.11
  - Auth: `llmApiKey` (用户配置)

- **SiliconFlow** - LLM provider
  - 实现: `src/lib/providers/siliconflow/llm.ts`

- **百炼 (Bailian)** - 阿里云 LLM
  - 实现: `src/lib/providers/bailian/llm.ts`

- **火山引擎 (Ark)** - 字节跳动 AI
  - SDK: `@arkjs/sdk` 相关 (见 `src/lib/ark-api.ts`, `src/lib/ark-llm.ts`)
  - Auth: `arkApiKey` (用户配置)

- **通义千问 (Qwen)** - 阿里云语音
  - Auth: `qwenApiKey` (用户配置)

## Data Storage

**Database:**
- MySQL 8.0
  - Connection: `DATABASE_URL` env var
  - ORM: Prisma 6.19.2
  - Port: 3306 (容器内), 13306 (宿主机映射)
  - Schema: `prisma/schema.prisma`

**File Storage:**

- **MinIO (默认)** - S3 兼容对象存储
  - Endpoint: `MINIO_ENDPOINT` (默认 `http://localhost:19000`)
  - Bucket: `MINIO_BUCKET` (默认 `waoowaoo`)
  - Credentials: `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`
  - SDK: `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`
  - 实现: `src/lib/storage/providers/minio.ts`

- **腾讯云 COS (预留)** - 暂未启用
  - SDK: `cos-nodejs-sdk-v5`
  - 配置: `COS_SECRET_ID`, `COS_SECRET_KEY`, `COS_BUCKET`, `COS_REGION`

- **本地存储 (开发调试)** - `STORAGE_TYPE=local`

## Queue & Caching

**Redis:**
- Version: Redis 7 (Alpine)
- Connection: `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`
- Port: 6379 (容器内), 16379 (宿主机映射)
- 用途: BullMQ 任务队列, 会话存储
- Client: `ioredis` 5.9.2
- 实现: `src/lib/redis.ts`

**BullMQ:**
- Task Queue 系统
- 队列类型: image, video, voice, text
- 并发配置: `QUEUE_CONCURRENCY_*` 环境变量
- 管理面板: Bull Board (`/admin/queues`)

## Authentication & Identity

**Auth Provider:**
- NextAuth.js 4.24.11
  - 实现: `src/lib/auth.ts`
  - Adapter: `@next-auth/prisma-adapter`
  - Database-backed sessions

**User Management:**
- 自定义用户系统 (用户名/密码)
- OAuth 账户链接 (Account model)
- Session 管理

## Monitoring & Observability

**Error Tracking:**
- 自定义错误处理 (`src/lib/api-errors.ts`, `src/lib/errors/`)
- 错误边界 (ErrorBoundary components)

**Logs:**
- 自定义日志系统 (`src/lib/logging/`)
- 统一日志格式: JSON
- 日志级别: `LOG_LEVEL` (ERROR/INFO/DEBUG)
- 审计日志: `LOG_AUDIT_ENABLED`
- 脱敏: `LOG_REDACT_KEYS`

## CI/CD & Deployment

**Container Registry:**
- GitHub Container Registry (ghcr.io)
- Registry: `ghcr.io/saturndec/waoowaoo`

**CI Pipeline:**
- GitHub Actions: `.github/workflows/docker-publish.yml`
- Build: Docker Buildx (linux/amd64, linux/arm64)
- Push: On push to main branch or tags (v*)

**Hosting:**
- Docker Compose (本地/私有部署)
- 容器化: Next.js + Workers + Watchdog + Bull Board

## Environment Configuration

**Required env vars (核心):**
```bash
# Database
DATABASE_URL="mysql://root:password@localhost:13306/waoowaoo"

# Storage
STORAGE_TYPE=minio|local|cos
MINIO_ENDPOINT=http://localhost:19000
MINIO_BUCKET=waoowaoo
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin

# Auth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=random-string

# Redis
REDIS_HOST=127.0.0.1
REDIS_PORT=16379

# Internal
CRON_SECRET=random-string
INTERNAL_TASK_TOKEN=random-string
API_ENCRYPTION_KEY=random-string
```

**User-configurable API Keys:**
```bash
llmApiKey          # OpenAI/OpenRouter
falApiKey          # FAL AI
googleAiKey        # Google AI
arkApiKey          # 火山引擎
qwenApiKey         # 阿里百炼
```

**Worker Configuration:**
```bash
WATCHDOG_INTERVAL_MS=30000
TASK_HEARTBEAT_TIMEOUT_MS=90000
QUEUE_CONCURRENCY_IMAGE=50
QUEUE_CONCURRENCY_VIDEO=50
QUEUE_CONCURRENCY_VOICE=20
QUEUE_CONCURRENCY_TEXT=50
```

## Webhooks & Callbacks

**Incoming:**
- 自定义服务器 API (`src/lib/server-api/`)
- Cron jobs: `CRON_SECRET` 验证

**Outgoing:**
- LLM API 调用 (图片/视频/语音生成)
- S3 兼容存储上传/下载

---

*Integration audit: 2026-03-27*
