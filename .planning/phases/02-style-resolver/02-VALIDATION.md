---
phase: 02
slug: style-resolver
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-27
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 2.1.8 |
| **Config file** | `vitest.config.ts` (existing) |
| **Quick run command** | `npx vitest run tests/unit/style-resolver.test.ts --reporter=verbose` |
| **Full suite command** | `npx vitest run tests/unit/style-resolver.test.ts && npx tsc --noEmit` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run quick run command
- **After every plan wave:** Run full suite command
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01 | 01 | 1 | DATA-03, INTEG-04 | unit | `npx vitest run tests/unit/style-resolver.test.ts` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/unit/style-resolver.test.ts` — 单元测试 stubs（TDD 模式，RED 阶段）
- [ ] `src/lib/styles/style-resolver.ts` — resolveStylePrompt 函数桩（RED 阶段）

*Wave 0 由 Task 1 的 TDD RED 阶段覆盖。*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| 向后兼容：预设风格返回正确提示词 | INTEG-04 | 需要端到端验证 Worker 调用链 | 运行 `npx vitest run tests/unit/style-resolver.test.ts`，检查预设风格测试用例 |
| DB 查询：用户自定义风格返回正确提示词 | INTEG-04 | 需真实 DB fixture | 运行集成测试，验证 DB 查询路径 |

*所有行为均有自动化测试覆盖。*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
