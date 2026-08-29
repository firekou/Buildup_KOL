# Growth Hack OS — Dashboard Spec v0.1

## 1. Dashboard Mission

Growth OS Dashboard 不是 Content Calendar，也不是 Social Analytics clone。

它的任務是讓使用者在同一個介面回答：

> **我們正在測什麼？哪個組合贏？為什麼贏？花多少錢？帶來什麼產品行為？下一輪該放大什麼？**

Dashboard 的主導航必須以 acquisition loop 為中心，而不是以素材類型為中心。

---

## 2. Information Architecture

```text
Growth OS
├─ 01 Command Center
├─ 02 Opportunity Radar
├─ 03 Experiment Lab
├─ 04 Winner Factory
├─ 05 Persona Portfolio
├─ 06 Distribution
├─ 07 Funnel & Attribution
├─ 08 Unit Economics
├─ 09 Review & Compliance
└─ 10 System Ops
```

全站 filter：

- Product
- Campaign
- Date range
- Platform
- Persona
- Topic / Opportunity
- Experiment status
- Content format

---

## 3. 01 — Command Center

### Purpose

管理者一眼看到整個 Growth Engine 的狀態與需要處理的事。

### Top Cards

- Active experiments
- Evaluable experiments
- Winner count / yield
- Experiments awaiting review
- Experiments needing more data
- Signal → publish median latency
- Total attributable cost
- Attributed conversions / revenue/value
- Policy incidents

### Core Panels

#### A. Acquisition Funnel

```text
Impressions
→ engagements
→ clicks
→ qualified sessions
→ signup
→ activation
→ product-specific conversion
→ revenue/value
```

每個階段可 drill-down 到 Experiment / Persona / Platform。

#### B. Experiments Requiring Action

- Review pending
- Data incomplete
- Winner waiting for clone
- Loser still consuming cost
- Publication failure
- Policy incident

#### C. Top Opportunities

顯示 why_now、evidence freshness、currently running experiments 與未測 Persona 空間。

#### D. Winner Feed

每筆顯示：

- parent / child lineage
- what changed
- baseline
- observed lift
- confidence / data completeness statement
- next recommended action

---

## 4. 02 — Opportunity Radar

### Purpose

把「今天該做什麼題目」從靈感會議改成可追蹤的 opportunity queue。

### Candidate Row

- Topic
- Source / evidence
- Why now
- Tension / controversy framing
- Product relevance
- Candidate personas
- Platform notes
- Freshness
- Risk flags
- Status: NEW / REVIEWED / EXPERIMENTING / ARCHIVED

### Important UX Rule

P0 若缺乏已校準資料，不顯示虛構的 `87/100 Viral Score`。

可以顯示：

- observed evidence
- explicit gates
- qualitative reason codes
- historical similar experiments

等資料量與驗證機制成熟後，再引入 versioned model score。

---

## 5. 03 — Experiment Lab

### Experiment List

Columns：

- Experiment ID
- Hypothesis
- Product / Campaign
- Opportunity
- Comparison dimension
- Arms
- Primary outcome
- Status
- Spend / cost
- Data completeness
- Decision

### Experiment Detail

#### Header

```text
EXP-xxx | hypothesis | status | owner
```

#### A. Experiment Contract

- primary outcome
- baseline
- observation window
- comparison unit
- frozen dimensions
- tested dimension

#### B. Arms Comparison

每個 arm 顯示：

- Persona
- Hook
- Asset preview
- Platform
- Impressions
- CTR
- product conversions
- attributed value
- total cost
- status

#### C. Timeline

```text
planned → generated → reviewed → published → collecting → evaluable → decision
```

#### D. Evidence & Caveats

- missing data
- late conversions
- attribution coverage
- platform anomalies
- policy/review notes

---

## 6. 04 — Winner Factory

這是 P0 的核心畫面之一。

### Winner Queue

分成：

- New Winners
- Clone queued
- Clone running
- Children collecting
- Proven family
- Fatigued / stop candidates

### Lineage View

```text
Parent A
├─ A1 hook mutation
│  ├─ A1a CTA mutation
│  └─ A1b visual mutation
├─ A2 opening mutation
└─ A3 persona mutation
```

每個 node 顯示：

- mutation dimension
- experiment result
- baseline delta
- cost
- conversion outcome

### Clone Builder

操作員選：

- Parent
- Mutation dimension
- Dimensions to freeze
- Number of child arms
- Product outcome
- Platform

系統自動建立下一個 experiment contract，而不是只生成散落素材。

---

## 7. 05 — Persona Portfolio

Persona 不只顯示 character sheet，也顯示 acquisition performance。

### Portfolio Table

- Persona
- Active platforms
- Content pillars
- Product roles
- Experiments run
- Winner yield
- Qualified traffic
- Product conversions
- Attributed value
- Cost
- Best topic families
- Best hook families
- Policy incidents

### Persona Detail

Tabs：

1. Identity / existing Buildup_KOL profile
2. Growth overlay
3. Topic performance
4. Platform performance
5. Experiment history
6. Winner families
7. Policy / red lines

不得因單次爆款就永久把 Persona 標成「高價值」；Dashboard 應保留觀測窗與樣本範圍。

---

## 8. 06 — Distribution

### Account / Channel Health

- platform
- account
- persona
- publish success rate
- recent publication volume
- rate-limit state
- warning / removal / restriction incidents
- last telemetry sync

### Publication Table

- publication_id
- experiment arm
- asset
- account
- URL / platform ID
- published_at
- metrics freshness
- clicks / conversions
- policy status

Distribution 頁不可提供 ban-evasion 或協同假互動功能。

---

## 9. 07 — Funnel & Attribution

### Funnel View

可切：

- Product
- Campaign
- Experiment
- Persona
- Platform
- Topic
- Asset family

### Attribution Coverage

明確區分：

- Directly measured
- Attributed by configured model
- Unattributed
- Missing / stale

### Conversion Drill-down

```text
Conversion
→ session/click
→ publication
→ asset
→ experiment arm
→ persona
→ opportunity
```

若無法追溯，不應假裝精準歸因。

---

## 10. 08 — Unit Economics / AI Traffic Trader

### Purpose

把內容組合視為 acquisition portfolio。

### Views

#### By Persona

- cost
- qualified traffic
- conversion
- attributed value
- unit economics

#### By Topic
同上。

#### By Platform
同上。

#### By Experiment Family
同上，外加 clone lift 與 fatigue。

### Recommendation States

- SCALE CANDIDATE
- HOLD
- REDUCE
- STOP
- RETEST

P0 只提出 recommendation；不自動調整真實廣告預算或大規模產量。

---

## 11. 09 — Review & Compliance

Queues：

- Human review required
- Claim review
- Persona / likeness review
- Product restriction review
- Platform restriction review
- Incident follow-up

每一筆 decision 保存：

- reviewer
- decision
- reason code
- notes
- timestamp
- policy version

### Incident Dashboard

- content removed
- warning
- account restriction
- inaccurate claim
- user complaint
- product policy violation

Growth KPI 與 incident rate 必須並列，避免只追流量造成錯誤激勵。

---

## 12. 10 — System Ops

顯示：

- generation jobs
- publish jobs
- telemetry sync
- conversion ingestion
- webhook errors
- rate limits
- retry queue
- cost ingestion lag
- adapter health
- event freshness

Ops 面向 production operator，不混進一般 strategist 首頁。

---

## 13. Core Metric Definitions

### Evaluable Experiment

符合該 experiment contract 的最低資料完整條件，可以合法進入 evaluator 的實驗。

### Winner Yield

```text
Winner experiments / Evaluable experiments
```

只在同定義、同觀測窗下比較。

### Clone Lift

Child 與其明確 parent / baseline 在指定 primary outcome 上的差異。畫面必須同時顯示 comparison context，不只顯示百分比。

### Cost per Evaluable Experiment

```text
Attributable experiment cost / # evaluable experiments
```

### Signal-to-Publish Latency

```text
first publication timestamp - signal/opportunity timestamp
```

### Profitable Experiment Throughput

目前為 North Star 候選；正式 threshold 與 profitability definition 在 Pilot 後依產品 economic model 鎖定。

---

## 14. Dashboard Anti-patterns

禁止：

- 把 follower count 當主要成功指標。
- 只排行 impressions，不顯示 product outcome。
- 沒有 data completeness 卻顯示 Winner。
- 跨不同平台、不同觀測窗直接比較絕對 views。
- 用沒有 calibration 的 composite score 製造精準感。
- clone 之後失去 parent lineage。
- 用漂亮圖表掩蓋 attribution gap。

---

## 15. MVP Dashboard Acceptance

P0 Dashboard 必須能完成以下操作：

1. 建立 Product / Campaign。
2. 查看 Opportunity queue。
3. 建立一個 multi-arm Experiment。
4. 查看每個 arm 的 Persona / Hook / Asset / Publication。
5. 收到 social metrics + product conversion + cost。
6. 顯示資料是否足以評估。
7. 顯示 Winner / Loser / Inconclusive 與原因。
8. 從 Winner 建立 child experiment 並看到 lineage。
9. 依 Persona / Topic / Platform 查看 unit economics。
10. 看到 policy/review queue 與 incident。

達成這十項，Dashboard 才是 Growth OS 的控制台，而不是社群報表。