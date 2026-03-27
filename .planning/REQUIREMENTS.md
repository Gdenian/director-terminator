# Requirements: 导演终结者 — 自定义风格系统

**Defined:** 2026-03-27
**Core Value:** 用户可以用自己定义的视觉风格生成视频，而不受限于固定的预设选项

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### 风格管理 (STYLE)

- [ ] **STYLE-01**: 用户可以创建自定义风格，包含名称和中英文描述提示词
- [ ] **STYLE-02**: 用户可以编辑已创建的自定义风格（名称、描述、标签）
- [ ] **STYLE-03**: 用户可以删除自定义风格
- [ ] **STYLE-04**: 系统限制每用户最多创建 N 个自定义风格，达到上限时给出明确提示
- [ ] **STYLE-05**: 用户可以给风格打标签分类（如"写实"、"动漫"、"抽象"）
- [ ] **STYLE-06**: 自定义风格保存在用户账号级别，所有项目可复用

### AI 风格提取 (EXTRACT)

- [ ] **EXTRACT-01**: 用户可以上传参考图片作为风格参考
- [ ] **EXTRACT-02**: 系统 AI 自动从参考图提取风格描述（输出风格特征而非内容描述）
- [ ] **EXTRACT-03**: AI 提取结果用户可编辑修改后保存
- [ ] **EXTRACT-04**: 参考图提取显示状态追踪（pending/completed/failed）

### 系统集成 (INTEG)

- [x] **INTEG-01**: 4 个系统预设风格保留且不可删除不可编辑
- [x] **INTEG-02**: 现有项目的 artStyle 数据完全向后兼容，无数据损坏
- [ ] **INTEG-03**: StyleSelector 扩展为混合展示系统预设和用户自定义风格
- [ ] **INTEG-04**: 统一风格解析器 resolveStylePrompt 替代 getArtStylePrompt，支持预设和自定义风格
- [ ] **INTEG-05**: 所有 Worker handler 的图片生成流程正确使用新解析器

### 数据模型 (DATA)

- [ ] **DATA-01**: 新增 UserStyle 数据库模型，关联用户，存储风格信息
- [ ] **DATA-02**: 使用前缀命名空间方案（如 "user:uuid"）区分预设和自定义风格标识符
- [ ] **DATA-03**: 废弃 artStylePrompt 缓存字段，统一走实时查询
- [ ] **DATA-04**: 风格创建使用事务保护数量限制，防止竞态条件

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### 风格增强

- **STYLE-V2-01**: 风格预览图自动生成（创建时 AI 生成一张预览）
- **STYLE-V2-02**: 风格搜索和筛选功能
- **STYLE-V2-03**: 风格使用频次统计和排序

### 社交功能

- **SOCIAL-V2-01**: 风格市场 — 用户可发布和浏览其他用户创建的风格
- **SOCIAL-V2-02**: 风格收藏功能

## Out of Scope

| Feature | Reason |
|---------|--------|
| 风格市场/社区分享 | 内容审核 + 知识产权风险，初期聚焦个人创作 |
| 多滑块参数调节器（画风/色调/线条） | 复杂度高，描述词+参考图已覆盖大部分需求 |
| 无限风格数量 | 存储膨胀 + UX 退化 |
| 系统预设入库管理 | 保留为常量零迁移风险，降低复杂度 |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| STYLE-01 | Phase 5 | Pending |
| STYLE-02 | Phase 5 | Pending |
| STYLE-03 | Phase 5 | Pending |
| STYLE-04 | Phase 5 | Pending |
| STYLE-05 | Phase 6 | Pending |
| STYLE-06 | Phase 5 | Pending |
| EXTRACT-01 | Phase 7 | Pending |
| EXTRACT-02 | Phase 7 | Pending |
| EXTRACT-03 | Phase 7 | Pending |
| EXTRACT-04 | Phase 7 | Pending |
| INTEG-01 | Phase 3 | Complete |
| INTEG-02 | Phase 3 | Complete |
| INTEG-03 | Phase 8 | Pending |
| INTEG-04 | Phase 2 | Pending |
| INTEG-05 | Phase 4 | Pending |
| DATA-01 | Phase 1 | Pending |
| DATA-02 | Phase 1 | Pending |
| DATA-03 | Phase 2 | Pending |
| DATA-04 | Phase 2 | Pending |

**Coverage:**
- v1 requirements: 19 total
- Mapped to phases: 19
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-27*
*Last updated: 2026-03-27 after roadmap creation*
