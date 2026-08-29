# Growth Hack OS — Roadmap & Prioritization v0.1

## 1. Priority Logic

GHOS 不以「哪個功能最酷」排序，而以四個問題排序：

1. 它是不是其他模組的 dependency？
2. 它能不能讓我們更快得到真實市場證據？
3. 它能不能把產能轉成商業 outcome，而不是只增加素材量？
4. 它能不能跨產品重用？

因此，雖然商業上最吸引人的三個模組是 Winner Evolution、Controversy × Persona、AI Traffic Trader，**工程上必須先打通 Measurement Spine**。

---

## 2. Prioritized Capability Map

### P0 — 必須先完成

#### P0-A Measurement Spine / AI Traffic Trader Foundation

- Product / Campaign registry
- Experiment identity
- Arm / asset / publication lineage
- Social telemetry
- Product conversion events
- Tracking link / attribution
- Cost ledger
- Basic unit economics
- Dashboard read model

**原因：** 沒有這層，任何「Winner」都只是印象判斷。

#### P0-B Opportunity & Controversy Engine × Persona Portfolio

- Opportunity intake
- Evidence / why-now
- Product relevance
- risk flags
- Persona growth overlay
- Persona router
- Experiment planner
- batch creative plan

**原因：** 把產能從「多做素材」變成「多做結構化市場實驗」。

#### P0-C Winner Evolution Engine

- evaluator
- Winner / Loser / Inconclusive
- mutation plan
- parent/child lineage
- clone queue
- Winner Factory Dashboard
- scale / hold / reduce / stop recommendation

**原因：** 完成真正的 feedback loop，讓 AIGC 產能具複利性。

---

## 3. P1 — 在 P0 閉環跑通後

### P1-A Real-Time Opportunity Engine

- scheduled signal ingestion
- freshness / latency tracking
- fast-lane experiment creation
- signal → publish latency dashboard

### P1-B Native Product Integration

- Product CTA role library
- Product-specific conversion templates
- persona × product interaction patterns
- CTA test dimensions

### P1-C Persona Debate Engine

- structured viewpoint generation
- multi-persona content chains
- experiment tracking per viewpoint
- disclosure / policy rules

---

## 4. P2 — 放大與產品化

### P2-A Trend-to-Product Engine

把 trend / meme / culture signal 轉成產品能承接的 campaign opportunity。

### P2-B Distributed Persona Distribution

- account portfolio
- publication scheduling
- account health
- policy incidents
- cross-account experiment coordination

禁止實作 fake engagement、undisclosed impersonation、astroturfing 或 ban evasion。

### P2-C Multi-product Growth OS

- reusable Product Adapter
- reusable Platform Adapter
- reusable Generation Adapter
- reusable Metric Adapter
- tenant / client separation（若未來商品化需要）

---

## 5. Implementation Phases

> 以下用 Sprint / Gate 描述依賴，不在 Spec 階段硬估日曆工期。

### Phase 0 — Instrumentation Contract

**Goal:** 先讓一篇內容從生成到產品 conversion 全程有 ID。

Deliverables：

- Product / Campaign schema
- Experiment / Arm schema
- Event envelope
- Tracking link
- Cost event
- Conversion event
- minimal telemetry endpoint
- Dashboard shell

**Exit criteria:**

對一筆手動發布內容，可完整追出 `experiment → arm → publication → click/conversion → cost`。

---

### Phase 1 — Experiment Factory

**Goal:** 開始批次生產「實驗」，不是批次生產沒有 hypothesis 的素材。

Deliverables：

- Opportunity queue
- Persona sync from `kols/`
- Growth overlay
- Experiment Planner
- Generation adapter interface
- Review queue
- Publication record

**Exit criteria:**

同一 Opportunity 可產生多個 Persona / Hook arms，且每個 arm 有明確 tested/frozen dimension。

---

### Phase 2 — Measurement & Attribution

**Goal:** 讓內容 outcome 與產品 outcome 進同一張資料圖。

Deliverables：

- Social metric ingestion
- Product conversion ingestion
- Attribution service
- Cost ledger
- Funnel dashboard
- Unit economics view
- data completeness state

**Exit criteria:**

至少一個 Pilot campaign 可以在 Experiment Detail 看到 social → click → product conversion → cost。

---

### Phase 3 — Winner Evolution

**Goal:** 完成 feedback loop。

Deliverables：

- evaluator v1
- Winner / Loser / Inconclusive
- Winner Factory
- mutation planner
- clone job
- lineage graph
- scale / hold / reduce / stop recommendation

**Exit criteria:**

至少一個 Winner 可一鍵建立 child experiment，且 children 回流後可與 parent 合法比較。

---

### Phase 4 — Real-Time Growth Loop

**Goal:** 縮短信號到實驗的時間。

Deliverables：

- signal adapters
- scheduled scanning
- freshness
- opportunity fast lane
- latency metrics
- real-time alert

**Exit criteria:**

Dashboard 可量出 signal → opportunity → experiment → publish 各階段 latency，並證明 fast lane 不繞過 policy gate。

---

### Phase 5 — Portfolio Optimization

**Goal:** 從單篇 Winner 進化到資源配置。

Deliverables：

- Persona / Topic / Platform portfolio view
- fatigue tracking
- marginal performance comparison
- budget / production recommendation
- product-level contribution view

**Exit criteria:**

Growth Lead 可用系統資料決定下一輪產能往哪個 Persona × Topic × Platform 移動，而不是靠會議印象。

---

### Phase 6 — Multi-product Productization

**Goal:** 讓 GHOS 成為可重用 infrastructure。

Deliverables：

- Product Adapter SDK / interface
- Adapter test harness
- tenant-aware settings if needed
- product policy profile
- reusable dashboard filters

**Exit criteria:**

第二個產品接入不需複製 Growth OS 核心 code，只需新增設定／adapter 與產品 conversion contract。

---

## 6. Pilot Strategy

### Pilot A — Showgame

適合驗證：

- Persona portfolio
- content format variation
- native product integration
- social → landing / signup / engagement conversion
- Winner cloning

### Pilot B — Prediction Market 類產品

適合驗證：

- controversy / opposing viewpoints
- fast trend response
- debate content
- topic → product action

但產品推廣可能涉及地區、年齡、金融／博彩／預測市場等不同法律與平台限制，因此必須由 Product Adapter policy 決定哪些 conversion、CTA 與平台可用，不能把單一市場策略硬套到所有地區。

**建議：先以一個 Pilot Product 跑完整 closed loop，再接第二個產品驗證 architecture 是否真正 reusable。**

---

## 7. Priority Matrix

| Capability | Business leverage | Dependency value | Learning value | Recommended |
|---|---|---|---|---|
| Measurement / Attribution / Cost | 極高 | 極高 | 極高 | **First** |
| Opportunity × Persona Factory | 極高 | 高 | 極高 | **Second** |
| Winner Evolution | 極高 | 中（依賴前兩者） | 極高 | **Third** |
| Real-Time Opportunity | 高 | 中 | 高 | P1 |
| Native Product Integration | 高 | 中 | 高 | P1 |
| Persona Debate | 中高 | 低 | 高 | P1 |
| Trend-to-Product | 中高 | 中 | 中高 | P2 |
| Distributed Persona Distribution | 高 | 中 | 中 | P2 |
| Multi-product Productization | 極高 | 高 | 中 | P2 after proof |

這裡使用定性 priority，而不是未經驗證的數字加權，以符合本 repo 既有「不拿編造權重冒充證據」的規格紀律。

---

## 8. Decision Gates

### Gate 1 — Instrumentation Ready

若 publication 無法追到 experiment / conversion / cost，禁止進入 Winner automation。

### Gate 2 — Experiment Quality Ready

若 arms 一次改動過多維度、沒有 primary outcome 或 baseline，不進 evaluator。

### Gate 3 — Evaluation Ready

若 observation window 未完成或關鍵資料缺失，輸出 `NEEDS_MORE_DATA / INCONCLUSIVE`，不得硬選 Winner。

### Gate 4 — Automation Ready

只有在 evaluator 與 policy incidents 經足夠 Pilot 實測後，才擴大 auto-clone / auto-scale 權限。

### Gate 5 — Multi-product Ready

第二產品接入前，先驗證核心資料模型沒有被第一產品特例污染。

---

## 9. Main Risks

| Risk | Consequence | Mitigation |
|---|---|---|
| 只提高素材量 | 成本上升但 learning 不增加 | Experiment contract + PET |
| Vanity metric bias | 爆量但不轉換 | Product conversion + attribution |
| Attribution 假精準 | 錯誤放大內容 | measured/modeled/unattributed 分離 |
| Winner overfitting | 一次爆款被過度放大 | observation window + retest + lineage |
| Persona 漂移 | 人設失真 | Buildup_KOL source of truth + growth overlay |
| 平台政策風險 | 刪文／限流／封號 | platform adapter policy + incident log |
| 爭議內容品牌傷害 | 流量有、信任下降 | product relevance + risk gate + human review |
| 自動化太早 | 錯誤大規模放大 | recommendation-first, automation later |
| 模型成本失控 | ROI 被生成成本吃掉 | ModelRun + Cost Ledger |
| 多產品過早抽象化 | 架構過重 | single pilot → second product proof → productization |

---

## 10. End State

Roadmap 的終點不是「全自動發文」。

它是：

```text
大量低成本 acquisition hypotheses
→ 快速市場驗證
→ 可歸因的產品結果
→ Winner 演化
→ 資源再配置
→ 新一輪實驗
```

當這個 loop 可以跨不同 Persona、平台與產品反覆執行時，Media House 才真正成為 AI-native acquisition infrastructure。