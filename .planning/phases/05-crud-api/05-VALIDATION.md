---
phase: 05
slug: crud-api
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-27
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 2.1.8 + TypeScript compiler |
| **Config file** | `vitest.config.ts` (existing) |
| **Quick run command** | `npx vitest run tests/unit/style-service.test.ts --reporter=verbose 2>&1 \| tail -30` |
| **Full suite command** | `npx vitest run tests/ && npx tsc --noEmit` |
| **Estimated runtime** | ~45 seconds |

---

## Sampling Rate

- **After task:** Run quick suite
- **After plan wave:** Run full suite
- **Before verification:** All tests green

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 05-01 | 1 | STYLE-01, STYLE-02, STYLE-03, STYLE-04, STYLE-06 | tsc | `npx tsc --noEmit src/lib/styles/style-service.ts 2>&1 \| head -20` | ✅ | ⬜ pending |
| 05-01-02 | 05-01 | 1 | STYLE-01, STYLE-02, STYLE-03, STYLE-04, STYLE-06 | tsc | `npx tsc --noEmit src/lib/styles/style-schema.ts src/app/api/user-styles/route.ts src/app/api/user-styles/[id]/route.ts 2>&1 \| head -20` | ✅ | ⬜ pending |
| 05-01-03 | 05-01 | 1 | STYLE-04, STYLE-02, STYLE-03 | vitest | `npx vitest run tests/unit/style-service.test.ts --reporter=verbose 2>&1 \| tail -30` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing Vitest infrastructure covers all phase test requirements — no Wave 0 setup needed.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| POST /api/user-styles 返回 201 且包含 id | STYLE-01 | 需要实际 HTTP 请求或集成测试环境 | `curl -X POST http://localhost:3000/api/user-styles -H "Content-Type: application/json" -H "Cookie: ..." -d '{"name":"test","promptZh":"测试","promptEn":"test"}'` |
| PUT /api/user-styles/:id 更新成功 | STYLE-02 | 需要实际 HTTP 请求 | `curl -X PUT http://localhost:3000/api/user-styles/{id} -H "Content-Type: application/json" -H "Cookie: ..." -d '{"name":"updated"}'` |
| DELETE /api/user-styles/:id 删除成功 | STYLE-03 | 需要实际 HTTP 请求 | `curl -X DELETE http://localhost:3000/api/user-styles/{id} -H "Cookie: ..."` |
| 未登录时返回 401 | 所有端点 | 需要移除认证 cookie 测试 | 无 cookie 调用各端点，确认返回 401 |

*grep 验证已作为自动化命令包含在上表中。*

---

## Validation Sign-Off

- [ ] Task has `<automated>` verify command
- [ ] Phase goal derived from ROADMAP.md
- [ ] `nyquist_compliant: true` set in frontmatter after all checks pass

**Approval:** pending
