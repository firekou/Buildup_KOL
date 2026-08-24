# 15 · 離峰值掃描改寫計畫

**規格：** `docs/14-outlier-scan-spec.md` v1.0
**上位規格：** `docs/11-system-redesign-spec.md` v1.2（§0 紀律不變）
**狀態：** 📋 **計畫已定，尚未實作。** 這份文件是「要動哪些檔案、分幾批、每批完成的判準是什麼」。
**建立於：** 2026-08-24

---

## §0 這次改寫的形狀

一句話：**在既有系統前面接一段「發現」，不動既有的「評分」。**

```
                    ┌──────────── 這次新增 ────────────┐
人設方向  →  Track A 影片離峰值  ┐
（新的一層）  Track B 地區時事    ┘→ 2×2 交叉 → 主題清單
                                                  │
                    └──────────────────────────────┼── 既有系統，不改 ──┐
                                                   ▼                     │
                              makeAdHocTopic → matchKolToTopic → generatePlans
                                             （gate → 分數 → 企劃）      │
                                                                         ┘
```

**不做的事（明文寫下來，避免實作時滑過去）：**

- ❌ 不新增第二套評分模型。離峰倍數、報導覆蓋度**都不進 `screeningScore`、都不是 gate**。
- ❌ 不改 `gates.js` / `match.js` / `notes.js` 的評分邏輯。這三個檔案是兩輪 review 的產物，這次只讀不寫。
- ❌ 不引入資料庫。沿用 `store.js` 的檔案落地，唯一偏離是 `videoSamples` 依 `runId` 分檔（量級問題，`docs/14` §9.2）。
- ❌ 不做語意相似度模型來對接兩軌。用可解釋的規則（`docs/14` §5.3）。

---

## §1 已完成（本次 commit）

| 檔案 | 內容 |
|---|---|
| `docs/14-outlier-scan-spec.md` | 完整規格，12 節 |
| `docs/15-outlier-scan-rewrite-plan.md` | 本文件 |
| `kols/persona-directions.json` | 7 個人設方向、9 個地區的時事來源設定、各方向的紅線風險輪廓、16 位 KOL 全數歸屬 |
| `kols/scoring-config.json` | 新增 `outlierScan` 區塊（10 個常數，全部標了 calibration 性質）＋ `calibration.outlierScan` |

驗證：`npm run test:redlines` 58 項通過；`npm run smoke` 16 項通過（`scoringConfig.version` 1.1、`/api/meta` 帶得出 `outlierScan`）。新增的設定沒有動到既有路徑。

---

## §2 批次 0 · 先把不確定的事實查清楚（半天）

**這一批不寫功能，只回答三個「不知道就沒辦法設計下去」的問題。** 全部在 Railway 上跑，因為本地開發環境的 agent proxy 對 `news.google.com` 與 `tw.news.yahoo.com` 的 CONNECT 一律回 403（已確認為政策阻擋，非 TLS 問題）。

| # | 要查什麼 | 怎麼查 | 影響到什麼 |
|---|---|---|---|
| 0-1 | Google News RSS 各地區參數是否可用、單次回幾筆、有沒有速率限制 | Railway 上一支 one-shot 腳本，打 `docs/14` §4.1 表列的 7 組參數 | Track B 能不能做；`persona-directions.json` 的 `regionSources` 要不要改 |
| 0-2 | Yahoo 各地區 RSS 的實際路徑與分類 | 同上 | `hasRss: "unverified"` 這 5 個欄位要改成真值 |
| 0-3 | TikTok actor 的 `profiles` 輸入是否能列出某帳號的近期影片、回不回 `playCount` | 用現有 `APIFY_TOKEN` 跑一次 `clockworks~tiktok-scraper` | **整份規格的主判準能不能成立**（`docs/14` §3.7） |

**批次 0 的產出是一份 `docs/reviews/2026-XX-XX-scan-source-probe.md`，記錄真實回應。** 沒有這份，後面每一批都是在猜。

**0-3 若失敗，這裡就要停下來裁示。** 沒有頻道近期影片列表就沒有頻道中位數，沒有中位數就沒有離峰值——`docs/14` §3.1 的主判準跑不起來。備案有三個，都需要使用者決定：

| 備案 | 代價 |
|---|---|
| **A. 接 YouTube** | 觀看數公開、頻道影片列表可列舉、影片長度足以承載主題——離峰值分析在 YouTube 上最容易成立。代價是新平台、新 actor、新成本，且與現有三個平台的 KOL 佈局不完全重疊 |
| **B. 換 TikTok profile actor** | 成本較低，但只剩一個平台有離峰值能力，IG/Threads 只能貢獻 Track B |
| **C. 退成「類別相對」** | 不需要新資料源，但 `docs/14` §3.1 已判定它會選出大頻道而不是好題目。**不建議**——這等於把規格的核心換掉還沿用同一個名字 |

---

## §3 批次 1 · 資料層與抓取（2–3 天）

| 檔案 | 動作 |
|---|---|
| `kols/topic-axes.json` | **改**：新增 `health` domain（`DOMAIN_KEYWORDS` 與 `domain_axis_demand`） |
| `dashboard/server/lib/topics/classify.js` | **改**：`DOMAIN_KEYWORDS` 補 `health` 的關鍵字 |
| `dashboard/server/lib/directions.js` | **新**：讀 `persona-directions.json`，提供查詢與驗證 |
| `dashboard/server/lib/topics/apify.js` | **改**：`buildInput` 支援 `profiles` 輸入；新增 `fetchChannelVideos(platform, author, opts)` |
| `dashboard/server/lib/scan/outlier.js` | **新**：log10 → median → MAD → robustZ → multiplier；`insufficient` / `degenerate` 兩種退化狀態 |
| `dashboard/server/lib/store.js` | **改**：`FILES` 新增 5 個 store；`videoSamples` 走 `runId` 分檔 |

### 3.1 `health` domain 是一個會改變既有輸出的修改

原本落在 `life` 或 `sports` 的健康題會改落 `health`，而 domain 決定 `axisDemand`，`axisDemand` 決定 `fit`——**既有 16 位對既有 fixture 題目的分數會變**。

**驗收條件：同一個 commit 裡必須附改動前後的對照表**，做法比照 `docs/12` §4.2 補 fixtures 時的處理。沒有對照表就不合格——不是流程潔癖，是因為分數變了而沒人知道，正是這個系統反覆在修的那種錯。

### 3.2 `outlier.js` 的驗收

用手寫的固定資料（不打網路）測四種情況：

1. 正常分布 → multiplier 與 robustZ 算得出來且方向正確
2. 樣本數 < `minBaselineVideos` → `baseline: 'insufficient'`，**不回傳倍數**
3. MAD = 0 → `baseline: 'degenerate'`，**不回傳 Infinity**
4. 重尾分布（一支吃掉八成觀看）→ 中位數不被那一支拉走（這是選 median/MAD 而不選 mean/SD 的全部理由，要有測試證明它真的成立）

---

## §4 批次 2 · 兩軌掃描與交叉驗證（3–4 天）

| 檔案 | 動作 |
|---|---|
| `dashboard/server/lib/scan/trackA.js` | **新**：三階段（發現 → 基準 → 判定），逐階段落地、可續跑 |
| `dashboard/server/lib/scan/trackB.js` | **新**：RSS 抓取、媒體網域去重、`coverage*` 指標 |
| `dashboard/server/lib/scan/crosscheck.js` | **新**：2×2 象限、關鍵字重疊 / 命名實體 / 時間鄰近三條各自輸出 |
| `dashboard/server/lib/scan/runner.js` | **新**：`runKey` 冪等、階段狀態機、逾時與續跑 |
| `dashboard/server/routes/scan.js` | **新**：`docs/14` §10.1 的 6 個端點 |

### 4.1 三個容易在實作時滑掉的點

1. **Track B 的欄位一律叫 `coverage*`，不准出現 `heat`。** 新聞沒有觀看數，Google News 的排序是編輯與演算法選擇，`outletCount` 量的是**媒體供給**不是**閱聽需求**。把它叫熱度，就是重蹈系統早就修過的錯（`volume` 之於 `volumeMeaning: 'sample_frequency'`）。要有對應的 `coverageMeaning: 'media_supply'`。
2. **`outletCount` 以媒體網域去重，不是數文章。** 與 `aggregatePostsToTopics` 用 distinct authors 而非 post count 是同一個道理。
3. **2×2 的四格都要回傳，包含第④格（兩者皆無）。** 它是①②③的分母。只回傳①會讓②③永遠不被觀察到，那是 `docs/11` §0 紀律 5 禁止的事。而且②（只有影片離峰、沒有新聞熱議）在實務上很可能是最有用的一格——`docs/12` 匯入的 11 位生活風格型人設，好題大多不會出現在新聞裡。

### 4.2 主題排序的驗收

- 第一鍵是 `distinctChannels`，第二鍵才是倍數（`docs/14` §3.5）
- top-K 的 domain 分層有作用，**且未分層的原始排名同時可見**（`docs/14` §7.3）
- 回應帶 `crossRegionComparable: false` 與 `crossDomainComparable: false`
- 前 6 次掃描，Track B 一律 `spikeBaseline: 'none'`，回應裡找不到任何升溫語意

---

## §5 批次 3 · Railway 排程與觸發（半天）

| 項目 | 動作 |
|---|---|
| 新 service `scanner-cron` | 同一個 repo、同一個分支；**不掛 volume**；cron `0 22 * * 0,3`（UTC）＝台北週一、週四 06:00 |
| `tools/scan-trigger.mjs` | **新**：約 30 行。POST 到 `dashboard` 的私有網域，帶 `SCAN_TRIGGER_TOKEN`，收到 `202` 就 exit |
| `railway.json` | 不改。`scanner-cron` 用自己的 start command，設在 service 層 |
| 變數 | `dashboard` 新增 `SCAN_TRIGGER_TOKEN`；`scanner-cron` 新增同一個值 ＋ `DASHBOARD_URL` |

**為什麼要多一個 service 而不是在 dashboard 裡跑排程器：** Railway 的 volume 一個只能掛一個 service，而且掛了 volume 的 service「同一時間只允許一個 deployment 掛載」。`dashboard` 已經掛著 volume 當 `DATA_DIR`。所以會寫資料的那一端必須留在 `dashboard`，排程那一端只能是一個不掛 volume、觸發完就結束的小 service。這不是設計偏好，是平台規格推出來的唯一解。

**驗收：**
- cron 時區換算正確（UTC vs. 台北，日欄位挪了一天——這一格最容易寫錯）
- 同一個 `runKey` 觸發兩次，第二次回既有結果、不重跑
- 手動「立刻掃描」走同一支程式、同一套冪等鍵
- `dashboard` 的 healthcheck `/api/health` 在掃描進行中仍然正常（掃描是背景工作，不能卡住 healthcheck）

---

## §6 批次 4 · 畫面（2–3 天）

新增第 7 個頁簽「掃描」。四塊，順序即閱讀順序（`docs/14` §10.2）：

1. **這次掃了什麼** — 方向、地區、平台、種子詞、新聞查詢、樣本數、耗時。**先講範圍再講結論**，因為範圍決定了結論的效力。
2. **證據四象限** — 2×2，四格都可點開
3. **主題清單** — K 個主題，每個展開完整證據鏈；旁邊並列未分層的原始排名
4. **結合建議** — 方向層簡報（`scored: false`）＋ 該方向 KOL 的既有引擎評分

沿用既有元件：`components/notes.jsx` 的 `ScoreRow` / `DimensionNote` / `ExpertPanel` / `RedlinePanel` / `CalibrationTag`。**不新做一套視覺語言**——同一個系統裡兩套講法，會讓人以為掃描的數字和評分的數字是同一種東西。它們不是。

**用詞檢查是驗收項，不是建議**（`docs/14` §10.3）：全域 grep「熱度／爆紅／升溫／新趨勢／潛力／預測」，掃描頁面一個都不能有。

---

## §7 批次 5 · 紅線補強（半天）

| 檔案 | 動作 |
|---|---|
| `.claude/skills/kol-redline-check/rules.json` | **改**：v1.1 → v1.2，新增 `W-POLITICAL-OUTLIER`（warn） |
| `.claude/skills/kol-redline-check/testcases/` | **改**：新增該規則的正例與反例 |
| `.claude/skills/kol-redline-check/SKILL.md` | **改**：說明新規則 |

`W-POLITICAL-OUTLIER` 的分級依 `docs/11` §5 的四項客觀判準，完整推導寫在 `docs/14` §8.1。關鍵是第 4 點：**這條警示指向的是方法，不是題材。**

警示文案的方向：

> 這個題目排在前面，有一部分是排序方式造成的——離峰值機制系統性地偏好衝突與道德情緒強的題材（Brady et al. 2017）。它不代表這個題目不好，但也不代表它比後面幾個更適合這個人設。

**反例測試不可省。** 「立法院三讀通過」這種中性事實陳述不該被標，否則這條規則會變成「任何提到政治的內容都亮黃燈」，一週內就沒人看它了。

---

## §8 外部相依與成本

| 項目 | 現況 | 這次的變化 | 成本性質 |
|---|---|---|---|
| Apify — hashtag 搜尋 | 已有 | 不變 | 既有 |
| Apify — **頻道近期影片** | **無** | **新增，是主要成本項** | 每次掃描 = 出現過的作者數 × 一次 actor run |
| Google News / Yahoo RSS | 無 | 新增 | **免費、免 key**——比 Apify 便宜一個數量級 |
| YouTube | 無 | 批次 0 的裁示點 | 未估 |
| Railway service | 1 個 | 2 個 | `scanner-cron` 每週跑兩次、每次數秒，接近零 |
| Volume | 已有 | 用量成長 | `videoSamples` 是成長最快的，已規劃分檔 |

**成本無法在紙上估準，因為它取決於「一次掃描會碰到幾個不同的作者」，而那要抓過才知道。** 批次 0 的 0-3 就會給出第一個真實數字。

先寫下控制手段（實作時一併做，不要等到帳單來）：

- 頻道基準**跨掃描快取**——同一個頻道 7 天內不重抓（存在 `channelBaselines`）
- 只對**進入候選的**作者抓基準，不對全部作者抓
- 每次掃描設 `maxChannelFetches` 上限，**超過時記錄「因上限而未評估的作者數」**——`docs/11` §0 紀律 5：靜默截斷會讓人以為覆蓋完整

---

## §9 風險

| 風險 | 嚴重度 | 處理 |
|---|---|---|
| **抓不到頻道基準**（`docs/14` §3.7） | 🔴 **會讓主判準失效** | 批次 0 先驗；三個備案已列，需使用者裁示 |
| RSS 端點與預期不符 | 🟡 Track B 延後 | 批次 0 先驗；Track A 不依賴它，可先上 |
| 抓取成本失控 | 🟡 | §8 的三個控制手段；上限要記錄而非靜默截斷 |
| 政治題洗版整份清單 | 🟡 | domain 分層 ＋ `W-POLITICAL-OUTLIER` ＋ 原始排名同時可見 |
| `health` domain 改變既有分數 | 🟡 | 強制附改動前後對照表 |
| 使用者把單次橫斷面讀成時間趨勢 | 🔴 **是這類工具最常見的誤用** | `/api/scan/baseline-status` ＋ 用詞禁令 ＋ 前 6 次強制 `spikeBaseline: 'none'` |
| 掃描卡住 healthcheck | 🟡 | 掃描是背景工作；觸發端點立刻回 `202` |

---

## §10 順序、判準與需要裁示的事

**順序：** 批次 0 → 1 → 2 → 3 → 4 → 5。0 是硬前置。1 與 2 之間可以部分重疊，2 之後才有東西可以畫。

**每一批的完成判準都是「跑得起來而且測得到」，不是「寫完了」：** `npm run smoke` 與 `npm run test:redlines` 全過，加上該批自己的驗收項。

**需要使用者裁示的三件事（不裁示會卡住）：**

1. **批次 0-3 若失敗，走 A / B / C 哪個備案？** 這決定整份規格的主判準能不能成立。
2. **政治型方向要不要做人設？** 目前 16 位沒有任何一位落在這裡。不做的話，這個方向的掃描永遠只能是題目盤點。
3. **`mia-huang` 的直播定位。** `docs/12` §3.1 已判定 AI 人設在結構上無法履行即時雙向的直播。遊戲型方向的掃描結果送到她身上之前，這件事要先解決。

**另有兩件 `docs/11` §15 留下、本次未處理也未惡化的：** `rachel-ong` / `rafael-costa` / `faye-tan` 的可信度型態；`personaFit` 常態性回傳 100 導致 EXPERIMENT 帶樣本稀少。

---

## §11 一句話總結

這次改寫要加的是**發現**，不是**評分**。評分那一段已經被兩輪 review 打磨過，這次連碰都不碰——新的東西全部走「產出題目 → 題目進既有引擎」這條路。真正的技術風險只有一個：**目前的抓取設定拿不到頻道基準**，而沒有頻道基準，「相較於一般平均值特別突出」就沒有定義。所以批次 0 排在最前面。
