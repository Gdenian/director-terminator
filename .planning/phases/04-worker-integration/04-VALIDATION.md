---
phase: 04
slug: worker-integration
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-27
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 2.1.8 + TypeScript compiler |
| **Config file** | `vitest.config.ts` (existing) |
| **Quick run command** | `npx vitest run tests/unit/ --reporter=verbose 2>&1 \| tail -20` |
| **Full suite command** | `npx vitest run tests/ && npx tsc --noEmit` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After task:** Run `npx tsc --noEmit`
- **After plan wave:** Run full suite
- **Before verification:** All tests green

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 04-01 | 1 | INTEG-05 | tsc | `npx tsc --noEmit` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Wave 0 not applicable — Phase 4 is a mechanical replacement with no new test files needed.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| 7 个 handler 均替换为 resolveStylePrompt | INTEG-05 | grep 直接验证 | `grep -rn "getArtStylePrompt" src/lib/workers/handlers/` 应无结果 |
| resolveStylePrompt 导入正确 | INTEG-05 | import 语句验证 | `grep "resolveStylePrompt" src/lib/workers/handlers/*.ts` 应有 6 处 |

*grep 验证已作为自动化命令包含在上表中。*

---

## Validation Sign-Off

- [ ] Task has `<automated>` verify command
- [ ] Phase goal derived from ROADMAP.md
- [ ] `nyquist_compliant: true` set in frontmatter after all checks pass

**Approval:** pending
