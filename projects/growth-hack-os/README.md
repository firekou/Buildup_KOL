# Growth Hack OS — Media House Growth OS

> **Project status:** P0 閉環已實作（見 [`IMPLEMENTATION.md`](./IMPLEMENTATION.md)）；尚未在真實 Pilot 產品上跑過一輪 planning  
> **Project type:** AI-native Customized Acquisition Infrastructure  
> **Repository:** `firekou/Buildup_KOL`  
> **Primary goal:** 把 Media House 從「AIGC 內容製作團隊」升級成「可量測、可自動化、可複製、可持續優化的 AI-native Customer Acquisition Infrastructure」。

---

## 1. 核心命題

Growth Hack OS（以下簡稱 **GHOS**）不是一套「大量生圖／大量發文」工具。

它真正要最佳化的是：

> **用最低的內容與 API 邊際成本，持續增加可被量測的市場實驗數，找出 Winner，再自動放大 Winner，最後把 Attention 轉成產品端可歸因的商業價值。**

核心公式：

```text
Product × Market Signal × Persona × AIGC × Distribution × Feedback Loop
→ Qualified Attention → Product Action → Revenue / Business Outcome
```

因此：

- 產量不是 North Star。
- 曝光不是最終成果。
- 粉絲數不是唯一資產。
- **可評估的市場實驗、Winner 產率、Winner 放大後的增量，以及產品端商業成果，才是系統的核心。**

---

## 2. Growth OS 的完整閉環

```text
Product / Campaign
      ↓
Signal & Trend Intake
      ↓
Opportunity / Controversy Analysis
      ↓
Persona Routing × Hook Planning
      ↓
Creative Experiment Design
      ↓
AIGC Generation
      ↓
Policy Gate + Human Review (when required)
      ↓
Distribution / Publish
      ↓
Telemetry + Attribution + Cost Ledger
      ↓
Experiment Evaluation
      ↓
Winner / Loser / Inconclusive
      ↓
Mutation / Cloning / Stop / Re-test
      ↓
Budget & Production Re-allocation
      ↓
Product Conversion / Revenue
      ↺ feedback to next experiment
```

所有內容必須從生成時就帶著 `experiment_id` 與 lineage；不能等發完之後才猜「這篇是不是某個測試」。

---

## 3. 前 9 個能力模組全部納入

| # | Module | 系統化後的名稱 | 作用 | Priority |
|---|---|---|---|---|
| 1 | Controversy Engine | **Opportunity & Controversy Engine** | 從產品、事件、新聞、社群訊號中找出高討論潛力的可測題目 | **P0** |
| 2 | Persona Army | **Persona Portfolio & Router** | 管理 Persona、平台適配、內容支柱、紅線與產品角色，將同一題目路由到不同人設 | **P0** |
| 3 | AI Debate Arena | **Persona Debate Engine** | 以不同立場與角色產生可追蹤的多觀點內容，建立討論入口 | P1 |
| 4 | Meme-to-Market | **Trend-to-Product Engine** | 將熱門文化／迷因／事件轉成產品可承接的內容與 CTA | P2 |
| 5 | Winner Cloning | **Winner Evolution Engine** | Winner 自動變體、 lineage、再測試、升降載與停止 | **P0** |
| 6 | Dark Social Funnel | **Distributed Persona Distribution** | 多帳號／多 Persona 的合規內容分發與帳號組合管理；禁止假冒真人、假互動與 astroturfing | P2 |
| 7 | Character × Product | **Native Product Integration** | 讓產品用途、情境與 CTA 成為 Persona 內容的一部分，而非後貼廣告 | P1 |
| 8 | Event Hijacking | **Real-Time Opportunity Engine** | 即時偵測事件與話題，縮短 Signal → Publish latency | P1 |
| 9 | AI Traffic Trader | **Acquisition Portfolio & Unit Economics Engine** | 把內容視為投資組合，追蹤成本、流量、轉換、營收與資源再配置 | **P0 / Data Spine** |

> 註：第 6 與第 8 模組在正式產品命名中改用較精確的治理語言。GHOS 的目標是提高分發槓桿，不是建立欺騙式帳號、假草根運動或規避平台規範的機制。

---

## 4. 第一批優先做的 3 個能力

商業上優先驗證：

1. **Winner Evolution Engine** — 找出 Winner 並複製、變異、放大。
2. **Opportunity & Controversy Engine × Persona Portfolio** — 持續產生不同人設 × 不同 Hook 的可測實驗。
3. **Acquisition Portfolio / AI Traffic Trader** — 量化每個 Persona、題目、平台、內容與生成成本帶來的商業結果。

工程實作順序則必須反過來考慮依賴：

### P0-A — Measurement Spine
先建立 `experiment_id`、事件 schema、成本帳、發布紀錄、產品 conversion event 與 attribution。沒有這層，就沒有 Winner。

### P0-B — Opportunity × Persona Experiment Factory
接著建立 Signal / Opportunity、Persona Router、Hook 與 Batch Experiment Planner，讓系統可以大量產生「結構化實驗」，而不是散落的素材。

### P0-C — Winner Evolution Engine
最後在真實資料上建立 Winner 判定、clone / mutation lineage、再測試與資源放大。

---

## 5. North Star 與核心 KPI

GHOS 不預設一組沒有資料依據的魔法權重。第一階段先完整觀測，之後再依實際 conversion data 校準。

### North Star 候選

**Profitable Experiment Throughput（PET）**

定義概念：在固定成本／固定時間窗內，系統能完成多少「資料完整、可評估、且對商業目標產生正向貢獻」的市場實驗。

正式 production definition 必須經 Pilot 資料校準後鎖定，不在 Spec 階段任意設定閾值。

### 必看 KPI

- Evaluable experiments / day
- Cost per evaluable experiment
- Time from signal → first publish
- Winner yield
- Clone lift vs parent
- CTR / qualified visit rate
- Signup / activation / product-specific conversion
- Attributed revenue / contribution margin
- Cost per acquisition / CAC（適用時）
- Revenue or contribution per 1K impressions
- Persona × Topic × Platform performance
- Generation / API / distribution cost
- Policy rejection / incident rate

---

## 6. 系統最重要的設計原則

1. **Experiment-first**：每個 asset 都是某個假設的實驗 arm，不做無法被評估的內容堆積。
2. **Product-outcome-first**：Dashboard 必須能看到產品端事件，而不只社群 metrics。
3. **Lineage-first**：Winner 的變體必須知道從哪個 parent 演化而來。
4. **Cost-native**：模型 API、素材、人工、分發成本進同一 Cost Ledger。
5. **Persona is an asset**：Persona 是可比較的 acquisition asset，不只是一份角色設定。
6. **Platform-native**：同一 idea 不直接跨平台複製；平台規範、格式、受眾與發布限制由 adapter 管理。
7. **Evidence before scoring**：沒有真實資料前不虛構精準權重；使用 gate、狀態與觀測值優先。
8. **Human / policy gates where necessary**：涉及敏感議題、爭議性 claim、成人化視覺、金融／預測市場、真人 likeness 等，必須有對應 gate。
9. **No deceptive growth**：禁止未揭露的真人冒充、虛假見證、假互動、astroturfing、操縱性社會證明。
10. **Multi-product by design**：Showgame、Prediction Market、AI Token King 或其他客戶產品應透過 Product Adapter 接入同一 OS，而不是各做一套。

---

## 7. 文件索引

- [`PRODUCT_SPEC.md`](./PRODUCT_SPEC.md) — 產品規格、使用者、流程、需求與驗收
- [`SYSTEM_ARCHITECTURE.md`](./SYSTEM_ARCHITECTURE.md) — 系統架構、Service / Agent、事件流與 API 邊界
- [`DASHBOARD_SPEC.md`](./DASHBOARD_SPEC.md) — Dashboard IA、頁面、KPI、drill-down
- [`DATA_MODEL.md`](./DATA_MODEL.md) — 核心資料模型、事件模型、Cost / Attribution / lineage
- [`ROADMAP.md`](./ROADMAP.md) — 優先序、Phase / Sprint、dependency、exit criteria
- [`IMPLEMENTATION_BACKLOG.md`](./IMPLEMENTATION_BACKLOG.md) — 可直接交給開發 Agent 拆工的 Epic / Ticket backlog
- [`IMPLEMENTATION.md`](./IMPLEMENTATION.md) — **實作對照**：每個 ticket 落在哪個檔案、哪些部分刻意沒有做完、以及為什麼

---

## 8. 成功時 GHOS 應該變成什麼

Media House 不再回答：

> 「這週做了幾支影片？」

而是可以回答：

> 「這週測了哪些 acquisition hypotheses？哪幾個 Persona × Topic × Hook 成為 Winner？Winner 放大後提升多少？每一美元 AIGC / distribution cost 換回多少有效流量、註冊、啟用與營收？下一輪資源應該移去哪裡？」

這就是 Growth Hack OS 的產品邊界。