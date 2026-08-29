# Growth Hack OS — Product Spec v0.1

**Status:** Draft for implementation  
**Scope:** P0 architecture + P1/P2 system boundary  
**Parent project:** Buildup_KOL / Media House

---

## 1. Product Definition

Growth Hack OS（GHOS）是一套 **AI-native Customized Acquisition Infrastructure**。

它將 KOL / Persona、AIGC、社群分發、產品轉換、成本與實驗管理整合成同一個 Operating System，使 Media House 可以：

1. 持續發現值得測試的市場訊號與爭議性切角。
2. 依 Persona 與平台產生結構化內容實驗。
3. 自動追蹤發布後的曝光、互動、點擊、轉換與成本。
4. 判定 Winner / Loser / Inconclusive。
5. 對 Winner 產生新變體並重新測試。
6. 將產能與預算逐步移向高績效組合。
7. 最後把內容層 KPI 與產品端商業成果連起來。

---

## 2. Problem Statement

目前 AIGC Media House 常見的結構性問題：

- 生成產能不足，測試樣本太少。
- 即使提高產能，也容易變成「素材庫變大」，而不是「學習速度變快」。
- Persona、題目、平台、素材、產品 conversion 各自分散，無法歸因。
- 爆款出現後靠人工記憶複製，沒有 parent / child lineage。
- API / 生成成本沒有與 conversion outcome 放在同一張損益表。
- 社群 metrics 與產品營收分離，因此無法知道什麼內容值得繼續放大。

GHOS 要解決的是這個閉環，而不是單點生成工具。

---

## 3. Target Users

### Primary

- Media House Growth Lead
- Content / KOL Strategist
- Growth Operator
- AIGC Production Operator
- Performance / Data Analyst

### Secondary

- Product Owner
- Brand / Campaign Owner
- Compliance / Reviewer
- Engineering / Agent operator

---

## 4. Core Objects

GHOS 最少以六個核心物件運作：

1. **Product** — 要被導流與轉換的產品。
2. **Campaign** — 一段具體商業目標與時間範圍。
3. **Opportunity** — 從趨勢、事件、產品賣點或爭議點抽出的可測機會。
4. **Persona** — 有角色定位、內容支柱、紅線、平台適配與產品角色的 KOL / IP。
5. **Experiment** — 一個可被證偽／比較的 acquisition hypothesis。
6. **Asset / Publication** — 實驗 arm 的素材與實際發布實例。

---

## 5. Golden Path

```text
1. Create Product
2. Define conversion events
3. Create Campaign
4. Intake signals / product propositions
5. Create Opportunity candidates
6. Bind Opportunity × Persona × Hook
7. Create Experiment + arms
8. Generate assets
9. Policy / human review
10. Publish
11. Collect telemetry and cost
12. Collect product conversion events
13. Evaluate experiment
14. Mark Winner / Loser / Inconclusive
15. Clone / mutate Winner or stop Loser
16. Re-run experiment
17. Reallocate production / distribution resources
```

---

## 6. Experiment Contract

每一個 experiment 必須至少回答：

- `hypothesis`：要驗證什麼？
- `primary_outcome`：哪一個 outcome 決定此實驗是否有商業意義？
- `comparison_unit`：比較的是 Hook、Persona、Topic、Format、CTA、Platform 或其他變因？
- `arms`：有哪些版本？
- `observation_window`：何時開始與停止觀測？
- `cost_scope`：哪些成本歸到這個實驗？
- `attribution_scope`：產品事件如何回到 publication / arm？
- `decision_state`：Winner / Loser / Inconclusive / Needs More Data。

禁止把「發幾篇看看」當成 experiment。

---

## 7. Experiment Lifecycle

```text
DRAFT
  → PLANNED
  → GENERATED
  → REVIEW_REQUIRED / APPROVED
  → PUBLISHED
  → COLLECTING
  → EVALUABLE
  → WINNER | LOSER | INCONCLUSIVE
  → CLONE_QUEUED | RETEST_QUEUED | STOPPED
```

### 重要原則

- `INCONCLUSIVE` 是合法結果，不得被硬塞成輸贏。
- Gate 失敗的案例仍保留 audit record。
- Borderline / experimental 案例可以在合規前提下保留小流量測試，以避免只觀測到系統本來就喜歡的內容。

---

## 8. P0 Functional Requirements

### FR-P0-01 — Product & Campaign Registry

系統可以建立多個 Product，每個 Product 可配置：

- Product name / owner
- landing / deep-link domain
- business model
- allowed geographies / age constraints（若適用）
- conversion events
- attribution settings
- platform restrictions

**Acceptance:** 同一套 GHOS 可以同時容納 Showgame 與另一個產品，而不需 fork codebase。

### FR-P0-02 — Experiment Identity & Lineage

所有生成素材、publication、metric event、cost event、conversion event 都必須可追到：

`product_id → campaign_id → experiment_id → arm_id → asset_id → publication_id`

Winner clone 另需：

`parent_asset_id / parent_arm_id / mutation_reason`

### FR-P0-03 — Opportunity & Controversy Engine

輸入來源可包括：

- Product proposition
- Product event
- News / public trend
- Social signal
- Existing high-performing content pattern
- Manual strategist input

系統輸出 Opportunity candidate：

- topic
- why_now
- tension / competing viewpoints
- product relevance
- plausible personas
- platform fit notes
- evidence / source references
- risk flags

第一版允許人工建立與人工排序；不得因沒有校準資料而先製造虛假的「精準總分」。

### FR-P0-04 — Persona Portfolio & Router

沿用 `Buildup_KOL/kols` 作為 Persona source of truth，GHOS 增加 growth-specific overlay：

- product_role
- platform_roles
- allowed / blocked claims
- CTA compatibility
- audience hypothesis
- historical performance summary

Router 產生 candidate，不直接無條件自動發布。

### FR-P0-05 — Creative Experiment Planner

可以把：

`Opportunity × Persona × Hook × Format × CTA × Platform`

組成 experiment arms，並鎖定「這輪只比較哪些變因」。

### FR-P0-06 — Generation Orchestrator

支援不同生成 provider / model adapter，並記錄：

- model / provider
- prompt template version
- input asset / reference
- output asset
- latency
- token / generation usage
- direct cost
- retry / failure

### FR-P0-07 — Review Gate

支援：

- auto checks
- human review queue
- approve / reject / revise
- reason code
- audit log

### FR-P0-08 — Publishing & Distribution

每個 platform 使用 adapter，處理：

- format
- account
- scheduled_at / published_at
- platform_post_id
- publish status
- rate limit / error
- policy restrictions

### FR-P0-09 — Telemetry & Attribution

至少可接：

- impression / view
- engagement
- click
- landing session
- signup
- activation
- product-specific conversion
- revenue / contribution event（若有）

所有產品 CTA 優先使用 trackable URL / campaign params / referral code / server-side event，減少純推測歸因。

### FR-P0-10 — AI Traffic Trader / Unit Economics

每個 experiment / arm / persona / platform 至少可查看：

- generation cost
- manual cost（可選）
- distribution cost
- total attributable cost
- impressions
- clicks
- conversions
- attributed revenue / value
- derived unit economics

### FR-P0-11 — Winner Evaluation

第一版 evaluator 以可解釋 rule / comparison 為主，禁止先硬編全域通用 Winner score。

輸出：

- WINNER
- LOSER
- INCONCLUSIVE
- NEEDS_MORE_DATA

並顯示：

- 判定依據
- data completeness
- observation window
- compared baseline
- caveats

### FR-P0-12 — Winner Evolution

對 Winner 建立 clone job：

- select mutation dimension
- freeze non-tested dimensions
- generate child arms
- preserve lineage
- create next experiment

Mutation dimension 範例：

- hook
- opening frame
- persona
- format
- caption
- CTA
- visual setting
- duration
- tone

不可一次全部變掉後仍宣稱知道提升原因。

---

## 9. P1 Requirements

### Real-Time Opportunity Engine

- 縮短 signal → candidate → experiment → publish latency。
- Dashboard 顯示每個環節耗時。
- 事件時效性高時，review workflow 可切換到 fast lane，但不可跳過不可省略的 compliance gate。

### Native Product Integration

Persona / content planner 能定義產品在內容中扮演的角色：

- utility
- answer to debate
- entertainment destination
- tool
- challenge
- next action

避免每篇最後硬貼相同廣告 CTA。

### Persona Debate Engine

可生成多 Persona / 多立場內容鏈，但必須：

- 不偽造成真實未揭露人物間的自然衝突。
- 不自動製造假按讚、假評論或虛假社會證明。
- 所有 AI Persona 關係可在內部 audit。

---

## 10. P2 Requirements

### Trend-to-Product Engine

建立：

`Trend → Cultural framing → Content → Relevant product action`

只在產品真的可承接該話題時使用；禁止無關事件硬蹭造成品牌風險。

### Distributed Persona Distribution

管理多 Persona / 多品牌帳號，但必須遵循：

- platform account policy
- synthetic / commercial disclosure（需要時）
- no impersonation
- no coordinated fake engagement
- no astroturfing
- no ban-evasion design

### Multi-product Growth OS

將 Product Adapter、Metric Adapter、Platform Adapter 與 Generation Adapter 標準化，讓新產品接入主要透過設定與 adapter，而非複製整套系統。

---

## 11. Dashboard Outcomes

系統必須讓管理者在一個 Dashboard 回答：

1. 今天有哪些 signal 值得測？
2. 哪些 experiments 正在跑？
3. 哪些 arms 已經能評估？
4. Winner 是誰？相對 baseline 提升在哪？
5. 哪個 Persona × Topic × Platform 最值得加產能？
6. 哪些內容只帶來 vanity metrics，沒有產品 conversion？
7. 目前多少 API / generation cost 被浪費在 Loser？
8. 哪些 Winner 已進入 clone loop？
9. 哪些 publication / account 出現 policy 或 distribution 風險？
10. 最後帶來多少 attributable business outcome？

詳細 IA 見 `DASHBOARD_SPEC.md`。

---

## 12. Non-goals

P0 不做：

- 全自動無人審核的敏感內容發布。
- 用單一神奇分數取代完整 funnel。
- 偽造真人身份、假見證、假評論、假互動。
- 為追求曝光而自動規避平台 moderation / ban。
- 未經資料驗證就建立複雜預測模型。
- 一開始覆蓋所有社群平台與所有生成模型。

---

## 13. Compliance / Safety Requirements

GHOS 是 acquisition infrastructure，因此 governance 必須是產品能力，不是 README 裡的一句提醒。

至少需支援：

- `product_policy`：產品可推廣地區、年齡與限制。
- `platform_policy`：每平台內容、API、自動化與 account 規範。
- `persona_policy`：角色不可宣稱事項、真人 likeness、身份揭露。
- `claim_policy`：健康、金融、法律、政治、成人等高敏感 claim review。
- `publication_policy`：哪些組合可 auto-approve、哪些必須 human review。
- `incident_log`：刪文、警告、帳號限制、錯誤 claim、使用者投訴。

Prediction Market 類產品另需依實際司法管轄區、產品性質、年齡限制與平台規範建立專屬 Product Adapter policy；GHOS 本身不假設所有市場都可用相同方式推廣。

---

## 14. Definition of MVP

P0 MVP 不是「可以自動發 1,000 篇」。

MVP 完成條件是：

> 任選一個 Pilot Product，可以從 Opportunity 建立結構化實驗，經 Persona / AIGC 生成與 review 後發布，完整收回 social telemetry、click、product conversion 與成本；Dashboard 能判定至少一輪可解釋的 Winner / Loser / Inconclusive，並從 Winner 建立有 lineage 的下一代實驗。

只要這個閉環沒有完成，GHOS 就仍是 Content Tool，不是 Growth OS。