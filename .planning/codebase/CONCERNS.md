# Codebase Concerns

**Analysis Date:** 2026-03-27

## Tech Debt

### 超大文件 (需要重构)

**[巨型路由文件]:**
- 问题: `src/app/api/user/api-config/route.ts` 达到 1908 行
- 影响: 可维护性差，难以测试，修改风险高
- 修复方法: 拆分为多个子路由或模块

**[核心服务文件过大]:**
- 问题: `src/lib/run-runtime/service.ts` 1171 行
- 问题: `src/lib/billing/service.ts` 1067 行
- 问题: `src/lib/workers/shared.ts` 730 行
- 问题: `src/lib/workers/handlers/script-to-storyboard.ts` 679 行
- 影响: 违反"小文件"原则（200-400 行），难以理解和维护
- 修复方法: 按功能拆分为独立模块

### 类型安全问题

**[any 类型使用]:**
- 文件: `src/lib/auth.ts:64,71` - NextAuth 回调使用 `any`
- 文件: `src/app/api/auth/[...nextauth]/route.ts:8` - NextAuth 类型断言
- 影响: 失去 TypeScript 类型检查保护
- 修复方法: 使用正确的 NextAuth 类型定义

## 错误处理问题

### 过度使用空值返回

**[空值返回模式]:**
- 大量使用 `return null`、`return []`、`return {}` 处理错误
- 文件: `src/lib/media/service.ts`、`src/lib/run-runtime/service.ts`、`src/lib/billing/service.ts` 等
- 影响: 调用方难以区分"成功返回空"和"发生错误"，可能导致静默失败
- 修复方法: 使用 Result 类型或抛出具体错误

**[JSON.parse 缺少错误处理]:**
- `src/lib/media/service.ts:205` - `JSON.parse(jsonStr)` 无 try-catch
- `src/lib/providers/bailian/voice-manage.ts:17` - `JSON.parse(raw)` 无 try-catch
- `src/lib/workers/text.worker.ts:203` - 大量 JSON.parse 操作
- 影响: 恶意或异常 JSON 数据会导致进程崩溃
- 修复方法: 使用 try-catch 包裹并返回安全的默认值

### 错误被静默吞掉

**[.catch(() => undefined) 模式]:**
- `src/lib/workers/text.worker.ts:82` - `.catch(() => undefined)`
- `src/lib/api-errors.ts:324` - `await publishQueue.catch(() => undefined)`
- 影响: 错误被忽略，问题难以追踪
- 修复方法: 至少记录错误日志

## 安全考虑

### 固定 Salt 值

**[加密工具中的固定盐值]:**
- 文件: `src/lib/crypto-utils.ts:14` - `const SALT = 'waoowaoo-api-key-salt-v1'`
- 影响: 如果 salt 被知晓，暴力破解 PBKDF2 变得更容易
- 当前缓解: 使用 10 万次迭代的 PBKDF2
- 建议: 考虑使用随机 salt 并存储

### 环境变量依赖

**[内网任务 Token 验证]:**
- 文件: `src/lib/api-auth.ts:38-47`
- 风险: 如果 `INTERNAL_TASK_TOKEN` 未设置，生产环境允许任何 `x-internal-user-id` 访问
- 当前缓解: 生产环境检查 `NODE_ENV`
- 建议: 确保 `INTERNAL_TASK_TOKEN` 在所有环境都强制设置

## 性能瓶颈

### 大量 setTimeout/setInterval 使用

**[潜在的内存泄漏]:**
- `src/app/api/sse/route.ts:194` - 心跳定时器 `setInterval`
- `src/hooks/common/useGithubReleaseUpdate.ts:113` - `window.setInterval`
- `src/lib/run-runtime/workflow-lease.ts:51` - 心跳定时器
- `src/components/Navbar.tsx:29-35` - 多个 setTimeout
- 影响: 如果未正确清理，可能导致内存泄漏
- 建议: 确保组件卸载时清理定时器

### 同步加密操作

**[PBKDF2 同步调用]:**
- 文件: `src/lib/crypto-utils.ts:37` - `crypto.pbkdf2Sync(secret, SALT, 100000, KEY_LENGTH, 'sha256')`
- 影响: 10 万次迭代的同步调用会阻塞事件循环
- 建议: 使用 `crypto.pbkdf2()` 异步版本

## 脆弱区域

### Worker 系统

**[共享状态处理]:**
- 文件: `src/lib/workers/shared.ts` 730 行
- 问题: 包含大量共享逻辑，修改可能影响所有 worker 类型
- 安全修改方式: 添加测试，确保每个 worker 类型的边界清晰

**[队列并发配置]:**
- `src/lib/workers/video.worker.ts:313` - `QUEUE_CONCURRENCY_VIDEO || '4'`
- `src/lib/workers/voice.worker.ts:60` - `QUEUE_CONCURRENCY_VOICE || '10'`
- `src/lib/workers/image.worker.ts:64` - `QUEUE_CONCURRENCY_IMAGE || '20'`
- `src/lib/workers/text.worker.ts:708` - `QUEUE_CONCURRENCY_TEXT || '10'`
- 问题: 如果环境变量未设置，使用硬编码默认值，可能不适合所有部署
- 建议: 记录启动时的实际并发值

### 复杂的状态序列化和反序列化

**[JSON.stringify 大面积使用]:**
- 文件: `src/lib/workers/text.worker.ts` 大量 JSON 操作
- `src/lib/run-runtime/service.ts:935` - `JSON.stringify(state)`
- 影响: 大型对象序列化可能影响性能
- 建议: 考虑使用更高效的序列化方案

## 测试覆盖缺口

### 路由文件测试困难

**[巨型 API 路由]:**
- `src/app/api/user/api-config/route.ts` 1908 行
- 问题: 由于文件过大，可能存在未充分测试的代码路径
- 建议: 拆分成更小的路由模块以提高可测试性

### 集成测试覆盖

**[测试文件位置]:**
- 测试分散在 `tests/unit`、`tests/integration`、`tests/system`、`tests/regression`
- 建议: 确保每个 worker handler 有对应的集成测试

## 依赖风险

### 关键依赖版本

**[依赖版本]:**
- `next`: `^15.5.7`
- `react`: `^19.1.2`
- `@prisma/client`: `^6.19.2`
- `prisma`: `^6.19.2`
- `zod`: `^3.25.76`

**风险评估:**
- Next.js 15 和 React 19 相对较新，可能存在兼容性问题
- 建议: 监控上游版本发布，及时更新

### 迁移脚本

**[数据库迁移]:**
- `scripts/migrations/` 目录下有多个迁移脚本
- 问题: 部分迁移脚本可能无法重复运行（幂等性问题）
- 建议: 确保所有迁移脚本支持多次运行

## 其他问题

### TODO/FIXME 注释

**无重大 TODO/FIXME 注释发现问题** - 代码库相对整洁

### 代码复杂度

**[嵌套回调和 Promise 链]:**
- `src/lib/api-errors.ts` - 大量嵌套的错误处理
- `src/lib/billing/service.ts` - 多层条件判断
- 建议: 使用早期返回模式减少嵌套

### Redis 连接管理

**[Redis 单例模式]:**
- 文件: `src/lib/redis.ts`
- 实现: 使用 globalThis 存储单例
- 评估: 实现正确，但需要注意多实例场景

---

*Concerns audit: 2026-03-27*
