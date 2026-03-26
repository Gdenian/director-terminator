---
phase: 1
slug: userstyle
status: approved
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-27
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 2.1.8 |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run --coverage` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run --coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-01-T0 | 01 | 1 | DATA-01 | integration (RED phase) | `npx vitest run tests/integration/user-style.test.ts` | ❌ W0 creates it | ⬜ pending |
| 01-01-T1 | 01 | 1 | DATA-01 | integration | `npx prisma validate && npx tsc --noEmit && npx vitest run tests/integration/user-style.test.ts` | ✅ after T0 | ⬜ pending |
| 01-02-T1 | 02 | 1 | DATA-02 | unit | `npx vitest run tests/unit/style-namespace.test.ts` | ❌ W0 creates it | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `tests/integration/user-style.test.ts` — 集成测试骨架，含 5 个 DATA-01 测试用例（由 Plan 01 Task 0 创建）
- [x] `tests/unit/style-namespace.test.ts` — 命名空间工具函数单元测试，含 12+ 个 DATA-02 测试用例（由 Plan 02 Task 1 RED 阶段创建）
- [x] Vitest 已安装并配置 — 无需额外框架安装

*Wave 0 测试桩在各自 Plan 的第一个 task 中创建，执行顺序与 RED→GREEN TDD 流程一致。*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Prisma migrate success | DATA-01 | 需要数据库连接 | 运行 `npx prisma migrate dev` 确认无报错 |
| Prisma Client generation | DATA-01 | 构建时验证 | 运行 `npx prisma generate` 确认类型编译正常 |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 10s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved
