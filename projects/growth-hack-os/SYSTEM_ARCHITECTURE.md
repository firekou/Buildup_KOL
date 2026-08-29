# Growth Hack OS — System Architecture v0.1

## 1. Architecture Goal

GHOS 採 **event-driven experiment architecture**。最重要的不是某個模型或某個社群 API，而是所有模組共享同一組 identity、event contract、cost ledger、attribution 與 lineage。

```text
                    ┌─────────────────────────────┐
                    │        Control Plane        │
                    │ Product / Campaign / Policy │
                    │ Persona / Experiment / UX   │
                    └──────────────┬──────────────┘
                                   │
Signal Sources ─→ Signal Intake ─→ Opportunity Engine
                                   │
                                   ↓
                           Persona Router
                                   │
                                   ↓
                       Experiment Planner
                                   │
                                   ↓
                    Generation Orchestrator
                                   │
                                   ↓
                       Review / Policy Gate
                                   │
                                   ↓
                         Publisher Adapters
                                   │
            ┌──────────────────────┴──────────────────────┐
            ↓                                             ↓
     Social Telemetry                              Product Events
            │                                             │
            └──────────────→ Event Backbone ←─────────────┘
                                   │
                         Cost + Attribution
                                   │
                                   ↓
                        Experiment Evaluator
                                   │
                ┌──────────────────┴──────────────────┐
                ↓                                     ↓
        Winner Evolution                       Stop / Retest
                │
                ↓
        Resource Allocation
                │
                └──────────────↺ next experiment
```

---

## 2. Architectural Principles

1. **One event spine** — 社群資料與產品資料不能各自為政。
2. **Stable IDs** — `product_id/campaign_id/experiment_id/arm_id/asset_id/publication_id` 全程不變。
3. **Adapters over forks** — 新平台、新模型、新產品用 adapter 接入。
4. **Asynchronous by default** — 生成、發布、抓 metrics、轉換回傳都視為可重試 job。
5. **Idempotent writes** — webhook / metrics sync 重送不能重複計數。
6. **Auditability** — 每一個自動決策與人工 override 都要留下 reason / actor / timestamp。
7. **Observable cost** — API、模型、分發與人工成本從第一天就是一級資料。
8. **Policy as code + human gate** — policy 不只存在文件裡。
9. **No black-box Winner score in P0** — P0 優先可解釋比較與 completeness check。
10. **Decouple generation from evaluation** — Generator 不應自己決定自己的內容是否成功。

---

## 3. Logical Services / Agents

### 3.1 Product Registry
管理產品、Campaign、conversion event definition、可推廣市場與 policy profile。

### 3.2 Signal Collector
接入 public trend/news/social/product signals 與人工輸入。輸出標準 `Signal`，不直接決定內容。

### 3.3 Opportunity & Controversy Engine
把 Signal 轉為可測 Opportunity：

- `why_now`
- tension / competing viewpoints
- relevance to product
- candidate persona
- evidence
- freshness
- risk flags

P0 先保留 evidence 與人工 review，不虛構跨領域通用 scoring weights。

### 3.4 Persona Registry Adapter
讀取現有 `kols/`：

- profile
- topic affinity
- persona direction
- red lines
- content style

GHOS 只增加 growth overlay，避免複製另一份 Persona source of truth。

### 3.5 Persona Router
根據：

- Opportunity
- Persona pillars / credibility mode
- platform role
- product role
- historical experiment evidence
- hard policy gates

輸出 candidate pairing + reason。

### 3.6 Experiment Planner
建立 hypothesis、comparison dimension、arms、primary outcome、observation window 與 lineage。

### 3.7 Generation Orchestrator
對模型/provider 建立 adapter：

```text
GenerationRequest
  → provider adapter
  → generation result
  → asset registry
  → cost event
```

每次 run 必須保存 prompt template version、model、inputs、outputs、usage、cost 與 failure reason。

### 3.8 Review & Policy Gate
Pipeline：

```text
schema validation
→ product policy
→ persona policy
→ platform policy
→ claim / media policy
→ optional human review
→ publication approval
```

### 3.9 Publisher Service
每個平台為獨立 adapter：

- credential reference
- format validation
- scheduling
- publish
- retry
- platform_post_id mapping
- delete / status sync（若 API 支援）

Credential 不應寫入 content repo。

### 3.10 Telemetry Collector
以 polling / webhook / platform API 收回 metrics。所有 raw snapshot 與 normalized metric event 分層保存，避免 normalization 規則改版後無法重算。

### 3.11 Product Event Collector
接產品 analytics / server events：

- landing session
- signup
- activation
- purchase / trade / deposit（依產品定義）
- revenue/value

### 3.12 Attribution Service
P0 支援明確可追蹤機制優先：

- tagged URL
- referral / campaign code
- click ID
- server-side conversion event

Attribution model 必須 versioned；Dashboard 要能區分 measured / modeled / unattributed。

### 3.13 Cost Ledger
統一記錄：

- generation model cost
- token/API cost
- image/video cost
- distribution/ad cost
- optional human cost
- infrastructure cost allocation（若啟用）

### 3.14 Experiment Evaluator
輸入：experiment contract + metrics + attribution + cost + completeness。

輸出：

```text
WINNER
LOSER
INCONCLUSIVE
NEEDS_MORE_DATA
```

並保存 `decision_reason`, `baseline`, `data_window`, `evaluator_version`。

### 3.15 Winner Evolution Engine
只改變被指定的 mutation dimensions，child 永遠保留 lineage。

```text
parent experiment / arm
→ mutation plan
→ child arms
→ generation
→ next experiment
```

### 3.16 Acquisition Portfolio Allocator
P0 先做 recommendation，不做 autonomous spend：

- scale candidate
- hold
- reduce
- stop
- retest

P1/P2 在資料成熟後才考慮有限自動化。

### 3.17 Dashboard Aggregator
為 UI 提供 materialized views / read models，避免 Dashboard 每次從 raw events 臨時計算所有 funnel。

---

## 4. Event Backbone

標準 event envelope：

```json
{
  "event_id": "evt_...",
  "event_name": "publication.metric.updated",
  "occurred_at": "ISO-8601",
  "schema_version": 1,
  "product_id": "prd_...",
  "campaign_id": "cmp_...",
  "experiment_id": "exp_...",
  "arm_id": "arm_...",
  "persona_id": "kol-id",
  "asset_id": "ast_...",
  "publication_id": "pub_...",
  "platform": "x",
  "source": "platform_adapter",
  "properties": {}
}
```

### Core Events

- `signal.received`
- `opportunity.created`
- `experiment.created`
- `generation.started/completed/failed`
- `review.approved/rejected`
- `publication.published/failed`
- `publication.metric.updated`
- `product.conversion.occurred`
- `cost.recorded`
- `attribution.assigned`
- `experiment.evaluable`
- `experiment.decided`
- `mutation.queued/completed`
- `policy.incident.created`

---

## 5. Control Plane vs Data Plane

### Control Plane

- products
- campaigns
- personas
- experiment definitions
- policies
- model/platform configuration
- reviewers
- dashboard settings

### Data Plane

- signals
- generated assets
- publications
- raw telemetry
- normalized metric events
- product events
- costs
- attribution
- evaluator outputs

分開的好處是：策略與規則變更不會破壞歷史觀測資料。

---

## 6. API Boundary Draft

P0 可以先以 internal REST/route handlers 實作，介面先穩定：

```text
POST /api/growth/products
POST /api/growth/campaigns
POST /api/growth/opportunities
POST /api/growth/experiments
POST /api/growth/experiments/:id/generate
POST /api/growth/reviews/:id/decision
POST /api/growth/publications
POST /api/growth/events
POST /api/growth/conversions
POST /api/growth/experiments/:id/evaluate
POST /api/growth/experiments/:id/clone

GET  /api/growth/dashboard/overview
GET  /api/growth/experiments/:id
GET  /api/growth/personas/:id/performance
GET  /api/growth/opportunities
GET  /api/growth/winners
GET  /api/growth/unit-economics
GET  /api/growth/incidents
```

所有 write endpoint 需考慮 idempotency key。

---

## 7. Recommended Deployment Shape

不強迫 repo 在 Spec 階段換技術棧；優先延續現有 Dashboard 與部署方式。

最低邏輯元件：

```text
Web Dashboard
API / App Service
Worker / Job Runner
Relational DB
Object Storage
Queue / Durable Job mechanism
Scheduler
External adapters
```

若現有 Node + React / Railway 架構繼續使用，可先採同語言整合，避免 MVP 前過早拆 microservices。當 generation / telemetry volume 真正成長後再拆 worker boundary。

---

## 8. Reliability Requirements

- 每個 job 有 `status / retry_count / last_error`。
- metrics ingestion 支援 upsert / dedupe。
- API rate limit 與 cooldown per adapter。
- publish job 不因 UI timeout 重複發文。
- conversion event 可 late-arrive。
- evaluator 在資料補齊後可 deterministic re-run。
- lineage 不允許形成 cycle。
- policy config 與 evaluator 都 versioned。
- Dashboard 明確標示 data freshness。

---

## 9. Security / Governance

- OAuth/API credentials 放 secrets manager / runtime env，不進 repo。
- Role separation：operator / reviewer / admin / analyst。
- 高敏感 publication 可以要求 two-step review。
- 所有人工 override 要記 audit log。
- Persona 與真人 likeness 需保存來源/授權 metadata（若適用）。
- Product Adapter 可設定 geo/age/content restrictions。
- 不建立用於 ban evasion、假互動、虛假身份或平台規避的 automation。

---

## 10. P0 Technical Definition of Done

整套 P0 architecture 只有在以下 closed loop 全部通過時才算完成：

```text
Opportunity
→ Experiment
→ Persona arm
→ Generated Asset
→ Reviewed
→ Published
→ Social Telemetry
→ Click / Product Conversion
→ Cost
→ Attribution
→ Evaluation
→ Winner lineage
→ Clone Experiment
```

缺任一段，都不能宣稱 Growth OS MVP 已完成。