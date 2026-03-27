---
phase: 07
slug: ai
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-27
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 2.1.8 + TypeScript compiler |
| **Config file** | `vitest.config.ts` (existing) |
| **Quick run command** | `npx vitest run tests/unit/style-extract.test.ts --reporter=verbose 2>&1 \| tail -30` |
| **Full suite command** | `npx vitest run tests/ && npx tsc --noEmit` |
| **Estimated runtime** | ~60 seconds |

---

## Sampling Rate

- **After task:** Run quick suite
- **After plan wave:** Run full suite
- **Before verification:** All tests green

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 07-01-01 | 07-01 | 1 | EXTRACT-04 | prisma | `grep -n "extractionStatus" prisma/schema.prisma \| head -5` | ✅ | ⬜ pending |
| 07-01-02 | 07-01 | 1 | EXTRACT-01 | tsc | `npx tsc --noEmit src/app/api/user-styles/[id]/upload-ref/route.ts 2>&1 \| head -20` | ✅ | ⬜ pending |
| 07-01-03 | 07-01 | 1 | EXTRACT-02 | tsc | `npx tsc --noEmit src/lib/workers/handlers/style-extract-task-handler.ts 2>&1 \| head -20` | ✅ | ⬜ pending |
| 07-01-04 | 07-01 | 1 | EXTRACT-02 | grep | `grep -n "styleExtractQueue.add" src/app/api/user-styles/[id]/upload-ref/route.ts` | ✅ | ⬜ pending |
| 07-01-05 | 07-01 | 1 | EXTRACT-02, EXTRACT-04 | vitest | `npx vitest run tests/unit/style-extract.test.ts --reporter=verbose 2>&1 \| tail -30` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing Vitest infrastructure covers all phase test requirements — no Wave 0 setup needed.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| 实际图片上传到 S3 | EXTRACT-01 | 需要 MinIO 环境 | `curl -X POST http://localhost:3000/api/user-styles/{id}/upload-ref -F "file=@test.jpg"` |
| LLM Vision 返回风格特征 | EXTRACT-02 | 需要 LLM API 调用 | 检查提取结果描述的是线条/色调而非内容 |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify command
- [ ] Phase goal derived from ROADMAP.md
- [ ] `nyquist_compliant: true` set in frontmatter after all checks pass

**Approval:** pending
