# Growth Hack OS — Implementation Backlog v0.1

> 目的：讓 Claude Code / ChatGPT / Developer Agent 可直接依 dependency 拆工，不把 Spec 再翻譯一次才開發。

---

## Epic 0 — Measurement Spine

| ID | Pri | Task | Depends on | Acceptance |
|---|---|---|---|---|
| GHOS-001 | P0 | 定義 Product / Campaign schema | — | 可建立至少兩種不同產品，不需修改 schema |
| GHOS-002 | P0 | 定義 Experiment / Arm contract | 001 | hypothesis、primary outcome、tested/frozen dimension 可保存 |
| GHOS-003 | P0 | 建立全域 ID / lineage convention | 002 | asset/publication/conversion 可追至 arm |
| GHOS-004 | P0 | 建立標準 event envelope | 003 | event 有 schema_version + experiment refs |
| GHOS-005 | P0 | Tracking Link service | 003 | click 可 mapping 到 publication/arm |
| GHOS-006 | P0 | Product conversion ingest endpoint | 004 | 可 idempotent ingest product event |
| GHOS-007 | P0 | Cost Ledger | 003 | model / distribution cost 可歸到 experiment |
| GHOS-008 | P0 | Social telemetry normalized schema | 004 | raw snapshot 與 normalized metric 分離 |
| GHOS-009 | P0 | Attribution v1 | 005,006 | direct / modeled / unattributed 可區分 |
| GHOS-010 | P0 | Dashboard read model v1 | 007,008,009 | experiment 可看到 funnel + cost |

### Epic 0 Exit

手動建立並發布一筆 Pilot 內容後，可完整追：

`Experiment → Arm → Publication → Click → Conversion → Cost`。

---

## Epic 1 — Opportunity × Persona Experiment Factory

| ID | Pri | Task | Depends on | Acceptance |
|---|---|---|---|---|
| GHOS-020 | P0 | Opportunity entity + CRUD | 001 | 可保存 why_now/evidence/risk flags |
| GHOS-021 | P0 | Signal intake interface | 020 | manual signal 可先跑，source 可擴充 |
| GHOS-022 | P0 | Sync Buildup_KOL persona registry | — | `kols/` 為 source of truth，不複製 persona bible |
| GHOS-023 | P0 | Persona growth overlay | 022 | product role/platform role/policy 可設定 |
| GHOS-024 | P0 | Persona candidate router v1 | 020,023 | 輸出 candidate + reason，不用黑箱總分 |
| GHOS-025 | P0 | Experiment planner UI/API | 002,024 | 可建立多 arm 並鎖 tested dimension |
| GHOS-026 | P0 | Hook / creative brief schema | 025 | 每 arm 有可 version 的 creative brief |
| GHOS-027 | P0 | Generation provider adapter interface | 026 | 任一 provider 可透過共同 request/result contract 接入 |
| GHOS-028 | P0 | ModelRun usage/cost logging | 007,027 | 每次 generation 有 cost/latency/status |
| GHOS-029 | P0 | Asset registry | 003,027 | output 有 content hash/storage ref/arm id |
| GHOS-030 | P0 | Review queue v1 | 029 | approve/reject/revise + reason + audit |
| GHOS-031 | P0 | Publication record + adapter interface | 030 | publish status/platform ID 可保存 |

### Epic 1 Exit

一個 Opportunity 能建立至少兩個有明確比較維度的 Persona / Hook arms，生成後進 review 並形成 publication records。

---

## Epic 2 — Dashboard Control Plane

| ID | Pri | Task | Depends on | Acceptance |
|---|---|---|---|---|
| GHOS-040 | P0 | Growth OS route / dashboard shell | 010 | 現有 Dashboard 中可進入 Growth OS 專區 |
| GHOS-041 | P0 | Command Center | 010 | active/evaluable/review/winner/cost/conversion 可見 |
| GHOS-042 | P0 | Opportunity Radar | 020 | why_now/evidence/status/risk 可操作 |
| GHOS-043 | P0 | Experiment List | 025 | status/outcome/data completeness 可 filter |
| GHOS-044 | P0 | Experiment Detail | 010,043 | arms + funnel + cost + timeline 同頁 |
| GHOS-045 | P0 | Persona Portfolio growth view | 023,010 | Persona 可看到 experiment history/outcome |
| GHOS-046 | P0 | Funnel & Attribution | 009 | measured/modeled/unattributed 分離 |
| GHOS-047 | P0 | Unit Economics | 007,009 | 可依 persona/topic/platform/experiment 切換 |
| GHOS-048 | P0 | Review & Compliance queue | 030 | pending / decision / policy version 可見 |
| GHOS-049 | P1 | System Ops | jobs/adapters | retry/rate-limit/freshness 可見 |

---

## Epic 3 — Winner Evolution Engine

| ID | Pri | Task | Depends on | Acceptance |
|---|---|---|---|---|
| GHOS-060 | P0 | Data completeness evaluator | 008,009 | 缺資料時不得進 Winner 判定 |
| GHOS-061 | P0 | Evaluator v1 rule contract | 060 | WINNER/LOSER/INCONCLUSIVE/NEEDS_MORE_DATA + reason |
| GHOS-062 | P0 | Winner decision persistence | 061 | evaluator version / baseline / window 可追溯 |
| GHOS-063 | P0 | Mutation plan schema | 062 | mutation dimension + frozen dimensions 可保存 |
| GHOS-064 | P0 | Clone experiment action | 063 | parent → child experiment 自動建立 lineage |
| GHOS-065 | P0 | Winner Factory queue | 062 | new winner/clone queued/collecting/proven 可看 |
| GHOS-066 | P0 | Lineage graph | 064 | parent/child + mutation + outcome 可視化 |
| GHOS-067 | P0 | Clone lift comparison | 064,061 | child 與明確 parent baseline 比較 |
| GHOS-068 | P0 | Portfolio recommendation v1 | 047,062 | SCALE/HOLD/REDUCE/STOP/RETEST，僅 recommendation |

### Epic 3 Exit

一個實際 Winner 能建立 child experiment，child 回收資料後可與 parent 比較且 lineage 不遺失。

---

## Epic 4 — Real-Time Opportunity Engine

| ID | Pri | Task | Depends on | Acceptance |
|---|---|---|---|---|
| GHOS-080 | P1 | Signal adapter contract | 021 | news/social/manual sources 同 schema |
| GHOS-081 | P1 | Scheduled signal collector | 080 | job 可 retry/dedupe |
| GHOS-082 | P1 | Freshness metadata | 080 | signal/opportunity 顯示 freshness |
| GHOS-083 | P1 | Signal → publish stage timestamps | 031,081 | 可算每階段 latency |
| GHOS-084 | P1 | Fast-lane review workflow | 030 | 加速但不跳不可省略 policy gate |
| GHOS-085 | P1 | Opportunity alert / queue | 042,081 | 新 high-priority evidence 可進操作 queue |

---

## Epic 5 — Native Product Integration

| ID | Pri | Task | Depends on | Acceptance |
|---|---|---|---|---|
| GHOS-100 | P1 | Product role taxonomy | 001 | utility/debate answer/destination/tool/challenge 可擴充 |
| GHOS-101 | P1 | CTA template + tracking binding | 005,100 | CTA 自動綁 tracking context |
| GHOS-102 | P1 | Product-specific conversion templates | 006 | 新產品可配置事件，不改核心 evaluator |
| GHOS-103 | P1 | CTA experiment dimension | 025,101 | CTA 可成為單一 tested dimension |

---

## Epic 6 — Persona Debate Engine

| ID | Pri | Task | Depends on | Acceptance |
|---|---|---|---|---|
| GHOS-120 | P1 | Viewpoint schema | 024 | stance/reason/product relevance 可保存 |
| GHOS-121 | P1 | Multi-persona debate planner | 120 | 產生多 arm / chain，不混淆 persona identity |
| GHOS-122 | P1 | Debate publication linkage | 031,121 | chain 每篇仍有 publication/experiment refs |
| GHOS-123 | P1 | Disclosure/policy checks | 030,121 | 禁假冒真人/假互動/虛假社會證明 |

---

## Epic 7 — Trend-to-Product Engine

| ID | Pri | Task | Depends on | Acceptance |
|---|---|---|---|---|
| GHOS-140 | P2 | Trend framing library | 080 | trend 可映射 cultural framing |
| GHOS-141 | P2 | Product relevance gate | 100,140 | 無產品承接理由不得自動進 campaign |
| GHOS-142 | P2 | Trend campaign builder | 025,141 | 合格 trend 可建立 experiment plan |

---

## Epic 8 — Distributed Persona Distribution

| ID | Pri | Task | Depends on | Acceptance |
|---|---|---|---|---|
| GHOS-160 | P2 | Social account registry | 031 | account/persona/platform/status 可管理 |
| GHOS-161 | P2 | Scheduler | 160 | publication job idempotent |
| GHOS-162 | P2 | Account health | 160 | warning/removal/restriction 可記錄 |
| GHOS-163 | P2 | Platform policy config | 030,160 | account/content restrictions 可 version |
| GHOS-164 | P2 | Incident log | 162 | policy incident 可追到 publication |

**Explicit non-task:** 不開發 fake engagement、ban evasion、undisclosed impersonation、astroturfing。

---

## Epic 9 — Multi-product Productization

| ID | Pri | Task | Depends on | Acceptance |
|---|---|---|---|---|
| GHOS-180 | P2 | Product Adapter interface | P0 closed loop | 第二產品接入不 fork core |
| GHOS-181 | P2 | Metric Adapter interface | 180 | product-specific event normalize |
| GHOS-182 | P2 | Policy Profile | 180 | geo/age/platform/product restrictions 配置化 |
| GHOS-183 | P2 | Adapter contract tests | 180-182 | 新 adapter 可跑共同 fixture |
| GHOS-184 | P2 | Tenant/client boundary evaluation | 180 | 若商品化需要，再決定是否引入 tenant model |

---

## Cross-cutting Engineering Tasks

| ID | Pri | Task | Acceptance |
|---|---|---|---|
| GHOS-X01 | P0 | Audit log | automated + human decision 可追溯 |
| GHOS-X02 | P0 | Idempotency | publish/event/conversion 重送不重複 |
| GHOS-X03 | P0 | Retry/dead-letter handling | failed jobs 可診斷/重試 |
| GHOS-X04 | P0 | Config versioning | policy/evaluator/prompt version 可追 |
| GHOS-X05 | P0 | Data freshness | Dashboard 顯示 last synced |
| GHOS-X06 | P0 | Secret handling | credentials 不進 repo/database plaintext |
| GHOS-X07 | P1 | Role-based access | operator/reviewer/admin/analyst 分權 |
| GHOS-X08 | P1 | Test fixtures | experiment + telemetry + conversion closed-loop fixture |
| GHOS-X09 | P1 | Observability | job/error/latency/cost metrics |
| GHOS-X10 | P1 | Data retention | raw payload / user refs 有 retention policy |

---

## Recommended First Development Batch

第一批不要直接做「自動大量生成」。建議順序：

```text
GHOS-001 → 002 → 003 → 004
→ 005 / 006 / 007 / 008
→ 009 → 010
→ 020 / 022 / 023 → 024 → 025
→ 027 / 028 / 029 / 030 / 031
→ 040 / 043 / 044 / 046 / 047
→ 060 → 061 → 062 → 063 → 064 → 065 / 066 / 067
```

這條路線優先保證：**任何生成產能一上來，就已經進入可追蹤、可歸因、可演化的實驗系統。**

---

## Release Gate Checklist

### P0 MVP 不得宣告完成，除非全部 YES

- [ ] Product conversion contract 已建立
- [ ] Experiment / arm / publication identity 全程存在
- [ ] Generation cost 可追
- [ ] Social telemetry 可追
- [ ] Product conversion 可追
- [ ] Attribution coverage 可顯示
- [ ] Data completeness 可判斷
- [ ] Winner / Loser / Inconclusive 可解釋
- [ ] Winner 可 clone 成 child experiment
- [ ] Parent / child lineage 可視化
- [ ] Dashboard 可按 Persona / Topic / Platform 查看 unit economics
- [ ] Review / policy / incident 有 audit

只要缺一項，就仍是部分 Growth tooling，不是完整 Growth OS MVP。