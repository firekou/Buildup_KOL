# Growth Hack OS — 實作對照

> **狀態：** P0 閉環已實作並可執行。
> 本文件把 [`IMPLEMENTATION_BACKLOG.md`](./IMPLEMENTATION_BACKLOG.md) 的每個 ticket 對應到實際檔案，
> 以及說明哪些部分是刻意沒有做完的，避免規格與程式碼之間出現看不見的落差。

---

## 1. 怎麼跑起來

```bash
npm install
npm run seed:growth   # 建立一個示範產品，走完整條閉環（可省略）
npm run dev           # server :8080 + vite :5173
npm test              # redlines + probe + growth（23 個 Growth OS 測試）
npm run smoke         # 對執行中的 server 做端到端檢查
```

Dashboard 的「⑦ Growth OS」分頁進入 GHOS 專區。資料寫在 `${DATA_DIR}/growth/`。

---

## 2. 架構落點

GHOS 與既有 Dashboard 共用同一個 Node service，理由如 SYSTEM_ARCHITECTURE.md §7：
在 generation / telemetry 量真正長起來之前，過早拆 microservice 只會增加維運面積。

```text
dashboard/server/growth/
├─ ids.js              前綴 ID 與 lineage 型別檢查
├─ store.js            25 個集合，control / data plane 分開標注
├─ events.js           事件信封 + 冪等
├─ audit.js            稽核紀錄
├─ validate.js         欄位驗證（錯誤訊息與 UI 同語言）
├─ policy.js           policy profile（有版本）、事故
├─ platforms.js        平台目錄：格式、揭露、速率、自動化狀態
│
├─ products.js         產品／Campaign／conversion 定義
├─ product-analysis.js 產品特性分析
├─ signals.js          事件查找、去重、時效
├─ opportunities.js    議題（why_now / 對立 / 產品相關性）
├─ personas.js         kols/ 的 registry adapter + growth overlay
├─ router.js           人設路由（證據 + 注意事項，無總分）
├─ experiments.js      實驗契約、arms、單因子守則
├─ generation.js       AIGC orchestrator、prompt template、asset registry
├─ gates.js            檢查鏈
├─ review.js           審查佇列與人工 override
├─ completeness.js     資料完整度（evaluator 的守門人）
├─ evaluator.js        Winner / Loser / Inconclusive / Needs more data
├─ evolution.js        變異、clone、lineage、clone lift
├─ cost-model.js       單價目錄與成本階梯
├─ cost.js             Cost ledger
├─ tracking.js         Tracking link
├─ publish.js          帳號、發布、事故
├─ telemetry.js        raw snapshot / normalized metric 兩層
├─ conversions.js      產品事件與歸因
├─ portfolio.js        單位經濟與資源配置建議
├─ pipeline.js         產品階段推導 + Dashboard read model
├─ jobs.js             Job 紀錄、重試、dead letter
├─ adapters/           generation / publish / signal-sources
├─ bootstrap.js        開機時的 idempotent seeding
├─ seed.mjs            示範資料
└─ growth.test.mjs     23 個測試（含完整閉環 fixture）

dashboard/server/routes/growth.js   /api/growth/* 全部端點
dashboard/client/growth/            Dashboard 11 個分頁
```

---

## 3. Backlog 對照

### Epic 0 — Measurement Spine

| ID | 落點 | 備註 |
|---|---|---|
| GHOS-001 | `products.js` | 兩個不同商業模式的產品共用同一 schema，差異靠 policy profile 與 conversion 定義 |
| GHOS-002 | `experiments.js` | 契約缺欄位時直接擋下，不給預設值 |
| GHOS-003 | `ids.js` | 前綴 ID + `assertId()` 在每個寫入邊界檢查外鍵型別 |
| GHOS-004 | `events.js` | 22 個事件名，未知名稱視為 bug |
| GHOS-005 | `tracking.js` | 排程時簽發，同時寫入 UTM 與內部 code（兩條路可對帳） |
| GHOS-006 | `conversions.js` | 以產品端 event id 冪等 |
| GHOS-007 | `cost.js` + `cost-model.js` | 單價來自 `costs/video-generation-costs.md` 實際帳單 |
| GHOS-008 | `telemetry.js` | snapshot 與 normalized event 分層，normalizer 有版本 |
| GHOS-009 | `conversions.js` | direct / modeled / unknown 三級，永不向上推斷 |
| GHOS-010 | `pipeline.js` + `portfolio.js` | Dashboard read model |

### Epic 1 — Opportunity × Persona Experiment Factory

| ID | 落點 |
|---|---|
| GHOS-020 / 021 | `opportunities.js` / `signals.js` + `adapters/signal-sources.js` |
| GHOS-022 / 023 | `personas.js`（`kols/` 為唯一真實來源，只加 overlay） |
| GHOS-024 | `router.js` |
| GHOS-025 / 026 | `experiments.js` / `generation.js buildBrief()` |
| GHOS-027 / 028 / 029 | `adapters/generation.js` / `generation.js` |
| GHOS-030 | `gates.js` + `review.js` |
| GHOS-031 | `publish.js` + `adapters/publish.js` |

### Epic 2 — Dashboard Control Plane

`dashboard/client/growth/sections/` 對應 DASHBOARD_SPEC.md 的 01–10，另加 `00 產品狀態`（GHOS-040…049）。

### Epic 3 — Winner Evolution

`completeness.js`（060）、`evaluator.js`（061 / 062）、`evolution.js`（063–067）、`portfolio.js`（068）。

### Cross-cutting

| ID | 落點 |
|---|---|
| GHOS-X01 稽核 | `audit.js`，人工 override 另有 `actorType: 'human'` 標記 |
| GHOS-X02 冪等 | `store.upsert()` + `events.dedupeKey()` + `jobs.createJob({idempotencyKey})` |
| GHOS-X03 重試 | `jobs.js`，用盡次數進 `dead_letter` |
| GHOS-X04 版本 | policy / evaluator / normalizer / attribution model / prompt template 皆有版本並寫入決定 |
| GHOS-X05 新鮮度 | `store.lastWriteAt()` → System Ops |
| GHOS-X06 憑證 | `social_accounts` 只存 `credentialRef`；含 `=` 或 `:` 的值會被拒絕 |
| GHOS-X08 fixture | `growth.test.mjs` 的完整閉環測試 |

---

## 4. 刻意沒有做的事，以及為什麼

這一節比上面那些表更重要。以下每一項都是「可以做但選擇不做」，不是遺漏。

### 4.1 影片／圖片 adapter 沒有接上

`adapters/generation.js` 裡的 `higgsfield` 與 `gpt-image` 回傳 `not_configured`，
而不是回一個假的 storage ref。理由：假素材會同時污染審查佇列、成本帳與 Winner 判定，
而這三者正好是本系統存在的理由。

目前可用的路徑有兩條，都完整：

- `template` adapter：離線組稿、成本 0，用來跑通與測試整條流程。
- 外部生成後用 `POST /api/growth/arms/:id/assets` 登錄素材與實際成本。

### 4.2 所有平台都是「人工發布後登錄」

`adapters/publish.js` 全部是 `manual_log`。自動發布需要各平台的 OAuth app 與
publishing scope；在那之前，記錄人工發布的結果是完整的閉環（identity、成本、
成效、歸因、判定全都在），只是沒有自動化。換成真 API 時只改一個 adapter。

### 4.3 沒有 Winner 分數，也沒有 Viral Score

`router.js` 只輸出證據種類與注意事項；`evaluator.js` 只做雙比例 z 檢定加上
一個公開的最低採用門檻（15% 相對提升）。README.md §6 原則 7 與
DASHBOARD_SPEC.md §4 都明文禁止在沒有校準資料前製造精準感。

### 4.4 紅線檢查的第一層永遠不宣告通過

`gates.js` 委派 `.claude/skills/kol-redline-check`。該 checker 的規則多為
semantic-only，lint 命中只是候選。所以 gate 會把 `pendingSemantic` 一律轉成
`needs_human`，不會因為「關鍵字沒中」就放行。

### 4.5 沒有自動調整預算或產量

`portfolio.js` 只輸出 SCALE / HOLD / REDUCE / STOP / RETEST 建議。
ROADMAP.md Gate 4：自動化要等 evaluator 與事故率經足夠 Pilot 實測後才擴大。

### 4.6 沒有、也不會有的功能

假互動、未揭露的真人冒充、astroturfing、規避平台 moderation 或封鎖。
ROADMAP.md Epic 8 明列為 non-task。維持這一點的方法是不建立那些接縫：
`publish.js` 沒有跨帳號協同排程，`social_accounts` 強制角色帳號登記人設，
發布時強制確認平台的 AI 揭露。

---

## 5. Release Gate Checklist 現況

對照 `IMPLEMENTATION_BACKLOG.md` 最後一節：

- [x] Product conversion contract 已建立
- [x] Experiment / arm / publication identity 全程存在
- [x] Generation cost 可追
- [x] Social telemetry 可追
- [x] Product conversion 可追
- [x] Attribution coverage 可顯示
- [x] Data completeness 可判斷
- [x] Winner / Loser / Inconclusive 可解釋
- [x] Winner 可 clone 成 child experiment
- [x] Parent / child lineage 可視化
- [x] Dashboard 可按 Persona / Topic / Platform 查看 unit economics
- [x] Review / policy / incident 有 audit

這十二項由 `npm run test:growth` 的閉環測試涵蓋。

**但要說清楚：** 通過這份 checklist 代表「系統可以承載一個真實的 Pilot」，
不代表 Pilot 已經做過。PRODUCT_SPEC.md §14 的 MVP 定義要求在真實產品上跑完一輪，
那需要真實的發布、真實的成效與真實的產品轉換事件——那是下一步，不是這次交付的內容。

---

## 6. 下一步

1. 選一個 Pilot 產品，接上真實的 conversion event（`POST /api/growth/conversions`）。
2. 用 `template` adapter 或外部生成跑第一輪探針層實驗（文案／圖，約 $0.26/arm）。
3. 真實資料回來後，再決定 `MIN_RELATIVE_LIFT`（目前 15%）與最低樣本門檻是否要調。
4. 那之後才考慮接影片 adapter 與平台發布 API。
