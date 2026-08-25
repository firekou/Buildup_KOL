# 15 · 離峰值掃描改寫計畫 v1.2

**規格：** `docs/14-outlier-scan-spec.md` **v1.2**
**上位規格：** `docs/11-system-redesign-spec.md` v1.2（§0 紀律不變）
**Review：** `docs/reviews/2026-08-24-gpt56-on-outlier-scan-spec.md` — NEEDS REVISION，Batch 0 可做、Batch 1–5 暫停
**狀態：** ✅ **R0 已完成** → 🔄 **R1 進行中：0-4／0-5 已跑完（`docs/reviews/2026-08-25-scan-source-probe.md`），0-1～0-3、0-6～0-10 待跑** → ⏸ **Batch 1–5 待 R1 完成**
**建立於：** 2026-08-24（v1.0）／**修訂於：** 2026-08-24（v1.1）、2026-08-25（v1.2，Batch 0-4／0-5 實測回填）

---

## §-1 v1.0 → v1.1 變更摘要

Review 給的順序是 **R0 修規格 → R1 擴充 Batch 0 → R2 再進 Batch 1**。

| 階段 | 內容 | 狀態 |
|---|---|---|
| **R0** | 修完 6 個 P0：週期算術、age matching 命名、Top-K vs 二元、topic identity、scan adapter、durable runner | ✅ **已完成**（見 §1） |
| **R1** | Batch 0 擴充成 10 項硬驗收，重點是**半年窗到底抓不抓得到** | 🔄 **0-4／0-5 已跑完**（§2.1），其餘 8 項待跑 |
| **R2** | Batch 1 起的實作，且**不順帶新增 `health` scoring domain** | ⏸ 待 R1 |

**批次表的三處結構性改動：**

1. **`health` domain 從批次 1 移除**，改列為獨立 migration（§3.1）。它是 scoring 變更，不是 discovery。
2. **批次 0 從 3 項擴充為 10 項**，並升級為硬驗收——其中「180 天覆蓋能力」比原本的「抓不到頻道基準」更根本：前者是連樣本範圍都不對，後者只是算不出分數。
3. **新增批次 1.5（主題身分層）**，因為 §3A 是 Track A 與 Track B 都依賴的前置，不能塞在任一軌裡面做。

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

## §1 已完成

### 1.1 第一次 commit（`57754ba`）

| 檔案 | 內容 |
|---|---|
| `docs/14-outlier-scan-spec.md` | 規格 v1.0，12 節 |
| `docs/15-outlier-scan-rewrite-plan.md` | 本文件 |
| `kols/persona-directions.json` | 7 個人設方向、9 個地區的時事來源設定、各方向的紅線風險輪廓、16 位 KOL 全數歸屬 |
| `kols/scoring-config.json` | 新增 `outlierScan` 區塊 |

### 1.2 R0 · 依 review 修訂（本次 commit）

**規格：**

| 檔案 | 內容 |
|---|---|
| `docs/14` → **v1.1** | §-1 變更摘要、§1.1.1 週期跨度規則、§1.3.1 時區換算、§1.3.2 runKey、§1.5 durable runner、§2.3 拆掉 health domain、§3.2 重寫、§3.4.1–3.4.2 解矛盾、§3.5 序位證據、**§3A 主題身分（新）**、§4.3 批准旗標分離、§4.4 四項偏誤、§5.2 2×2 改檢視切面、§5.3.1 時間基準、**§7A adapter 契約（新）**、§7.3.1 overflow、§8.2.1 截斷帳目、§9 資料模型、§11 常數搬家、§12 已知問題、**§13 逐條回應（新）** |
| `kols/discovery-config.json` | **新檔**。discovery 常數從 `scoring-config.json` 搬出來；批准旗標拆成 `topicHeat` / `newsCoverage`；`calibration` 逐項；`requiredWeeklyCycles` 單一來源 |
| `kols/scoring-config.json` | v1.1 → **v1.2**：移除 `outlierScan`，`timeSeries` 加註批准範圍與 single source of truth |

**程式（review 指出的三處是既有系統當下就在犯的錯，不是掃描才引進的）：**

| 檔案 | 改動 | 對應 |
|---|---|---|
| `lib/time-series.js` | **新檔**。`measureSpan()` / `baselineStatus()`——「有多少歷史」只有這一份實作 | P0-1 |
| `lib/discovery-config.js` | **新檔**。獨立 loader，不經過 `getConfig()`（評分引擎入口） | P1-2 |
| `lib/topics/index.js` | `heatConfidenceOf()` 改用共用函式；`REQUIRED_WEEKLY_CYCLES` 讀 discovery-config；`isTopicHeatApproved()`；**`makeAdHocTopic()` 的 `heat ?? 50` 移除**並加上 adapter 契約欄位 | P0-1 / P0-5 / P1-2 |
| `lib/scoring/match.js` | **`hookToTopic()` 的 `heat = 50` 預設移除**（review 沒提到，是修 P0-5 時一併發現的同一個缺陷）；`buildTiming()` 新增 `applicable` | P0-5 |
| `lib/store.js` | `writeAll()` 改 temp file + `rename` 原子寫入 | P0-6 |
| `routes/kols.js` | hook 的 `match` 補上 `timing` | 見下 |
| `client/tabs/PlansTab.jsx`、`KolProfileTab.jsx` | `applicable === false` 顯示「不適用」而不是 `—` | P0-5 |

**三個順帶發現、一併修掉的既有缺陷：**

1. **`hookToTopic()` 的 `heat = 50`。** Review 只點名 `makeAdHocTopic()`，但同一個缺陷在 `match.js:444`。一個 KOL 自己宣告的常青題目沒有任何平台樣本，顯示 50 是同一種憑空。
2. **`KolProfileTab.jsx:221` 一直在渲染 `時機（undefined）：—`。** `routes/kols.js` 從來沒把 `timing` 放進 hook 的 payload，所以那一行是死的。既然這個欄位現在講的是真話（「不適用」），把它補上比刪掉好。
3. **`getRegionTopics` 快取回傳被 `limit` 汙染。** `docs/12` §5 記錄過但沒修：cache key 是 `(region, platforms)` 不含 `limit`，而 `topics` 是預切好存進快取的——先以 `limit=1` 呼叫過的地區，之後帶 `limit=10` 會拿到 1 筆。**驗證這次的改動時真的被它咬到了**（smoke 出現 `expected 10 topics, got 1`），所以順手修：命中快取時從 `allTopics` 重切。

**驗證：**

```
npm run smoke          16 項全過
npm run test:redlines  58 項全過
npm run build          成功
```

外加三項針對性驗證：

- **週期算術** — `baselineStatus()` 對第 6 次回 `span=17天 cycles=2 ready=false`、第 7 次回 `span=21天 cycles=3 ready=true`，與 review 的表格逐格相符
- **hook 的假 50 已消失** — `/api/kols/rachel-ong` 的 hook `timing` 現在是 `{value: null, applicable: false, caveat: "…這一欄不適用，不是「低」。"}`
- **地區話題的真實 heat 不受影響** — `/api/topics?region=SG` 仍回 `heat 60`；且先 `limit=1` 再 `limit=10` 現在正確回 10 筆

---

## §2 批次 0 · 先把不確定的事實查清楚（1 天，v1.1 從半天擴充）

**這一批不寫功能，只回答「不知道就沒辦法設計下去」的問題。** 全部在 Railway 上跑，因為本地開發環境的 agent proxy 對 `news.google.com` 與 `tw.news.yahoo.com` 的 CONNECT 一律回 403（已確認為政策阻擋，非 TLS 問題）。

**v1.1 從 3 項擴充為 10 項，而且全部是硬驗收。** Review P1-3 指出 v1.0 漏掉了最根本的一題：**半年窗到底抓不抓得到？**

> 如果 actor 只能回「近期熱門結果」，就沒有半年分母，也不能把這件事叫「半年內離峰值掃描」。

這比原本列為第一風險的「抓不到頻道基準」更根本——後者是**算不出分數**，前者是**連樣本範圍都不是使用者要的**。

### 2.1 十項硬驗收

| # | 要查什麼 | 影響到什麼 |
|---|---|---|
| **0-1** | Google News RSS 各地區參數是否可用、單次回幾筆、有沒有速率限制 | Track B 能不能做；`persona-directions.json` 的 `regionSources` |
| **0-2** | Yahoo 各地區 RSS 的實際路徑與分類 | `hasRss: "unverified"` 這 5 個欄位改成真值 |
| **0-3** | TikTok actor 的 `profiles` 輸入能否列出某帳號近期影片、回不回 `playCount` | **主判準能不能成立**（`docs/14` §3.7） |
| **0-4** ✅ | ~~hashtag / keyword actor 真的能覆蓋 180 天嗎？~~ **已跑。TikTok ✅ 觸及數年；Instagram ❌ 實際只有 ~25 天；Threads ❌ 時間戳解析失敗** | 半年窗成立，**但只在 TikTok** |
| **0-5** ✅ | ~~分頁可控嗎？~~ **已跑。加大 limit 增加密度不增加觸及——TikTok tier 100 與 300 的最舊貼文完全相同** | 要更舊只能換種子詞；`resultsPerPage` 是每個 hashtag 各自計數，成本乘數 ×3 |
| **0-6** 🆕 | profile actor 每帳號最多回幾支？日期跨度多大？ | `minBaselineVideos = 8` 在真實資料上撐不撐得住 |
| **0-7** 🆕 | 排序是 recent / popular / relevance 還是 actor 自己的 ranking？ | **決定 §8.2.1 的截斷偏誤有多嚴重**——如果上游是 popularity 排序，前 100 位就是平台挑過的頭部 |
| **0-8** 🆕 | 私人／已刪除／限區影片怎麼標？ | 分母的正確性。被靜默略過的影片會讓 `channelsRepresented` 偏低 |
| **0-9** 🆕 | 同一次 query 重跑，樣本集合的穩定度如何？ | 如果重跑就換一批，跨週比較就沒有意義——這會直接推翻 Track A 的可重現性 |
| **0-10** 🆕 | 每 100 個候選作者的實際 Apify 成本與耗時 | `maxChannelFetches` 的值；`APIFY_TIMEOUT_MS` 要不要改；整體可行性 |

**批次 0 的產出是一份記錄真實回應的探測報告。** 0-4／0-5 的已經寫好：`docs/reviews/2026-08-25-scan-source-probe.md`。沒有這份，後面每一批都是在猜。

### 2.2 兩個會讓計畫停下來的結果

**~~0-4 / 0-5 失敗~~【v1.2 · 已跑，未失敗】** TikTok 撐得住 180 天，「半年內」這個名字保留。**代價是 Track A 只剩 TikTok 一個平台**——Instagram 實際只覆蓋約 25 天（`descRatio 0.96`，是「最近 N 筆」的簽名），Threads 的時間戳原本全部解析失敗。這與先前基於觀看數的判斷獨立地指向同一個結論。

當時寫的擔憂仍然值得留著：**不得沿用「半年」這個名字去跑一個實際只有 30 天的窗**——那是本 repo 反覆在修的同一類錯（`growth7d` 其實是 48 小時、`volume` 其實是樣本共現次數）。這次沒有犯，是因為先驗了才寫。

**0-3 失敗（抓不到頻道基準）：** 沒有頻道近期影片列表就沒有頻道中位數，`docs/14` §3.1 的主判準跑不起來。備案有三個，都需要使用者決定：

| 備案 | 代價 |
|---|---|
| **A. 接 YouTube** | 觀看數公開、頻道影片列表可列舉、影片長度足以承載主題——離峰值分析在 YouTube 上最容易成立。代價是新平台、新 actor、新成本，且與現有三個平台的 KOL 佈局不完全重疊 |
| **B. 換 TikTok profile actor** | 成本較低，但只剩一個平台有離峰值能力，IG/Threads 只能貢獻 Track B |
| **C. 退成「類別相對」** | 不需要新資料源，但 `docs/14` §3.1 已判定它會選出大頻道而不是好題目。**不建議**——這等於把規格的核心換掉還沿用同一個名字 |

---

## §3 批次 1 · 資料層與抓取（2–3 天）

| 檔案 | 動作 |
|---|---|
| `dashboard/server/lib/directions.js` | **新**：讀 `persona-directions.json`，提供查詢與驗證 |
| `dashboard/server/lib/topics/apify.js` | **改**：`buildInput` 支援 `profiles` 輸入；新增 `fetchChannelVideos(platform, author, opts)` |
| `dashboard/server/lib/scan/outlier.js` | **新**：log10 → median → MAD → robustZ → percentileInScan；`insufficient` / `degenerate` 兩種退化狀態 |
| `dashboard/server/lib/store.js` | **改**：`FILES` 新增 store（含 `canonicalTopics` / `newsArticles` / `videoObservations`）；大表走 `runId` 分檔 |

### 3.1【v1.1 移除】`health` scoring domain 不在這一批

v1.0 把「新增 `health` domain」列在批次 1，並自己承認它會改變既有 16 位的比對結果。

**Review P1-1 指出這違反本計畫 §0 的承諾（「不改既有評分」），而且是對的。** 新增一個 scoring domain 會改 `domain_axis_demand` → `axisDemand` → `fit`——那是一次 **scoring migration**，不是 discovery。

**改為：**

- 健康型仍是一個 discovery direction（`persona-directions.json` 已有），只決定去哪裡找題目。
- 找到的題目**仍由既有 `classifyDomain()`** 落到 `life` / `sports` / `news` / `tech`，回應帶 `domainFallback: true`。
- **代價明講：** 健康題落進 `life` 的 `axisDemand`，那組數字不是為健康題設計的，所以健康型方向的 `fit` 會比其他方向粗。這是已知的精度損失，寫在回應裡，不是隱藏的錯誤。

**要真的新增 `health` domain 的話**，另開獨立 spec、獨立 commit、附既有 16 位的 regression 對照表（做法比照 `docs/12` §4.2）。它值得做，但不該搭這班車。

### 3.2 `outlier.js` 的驗收

用手寫的固定資料（不打網路）測五種情況：

1. 正常分布 → `robustZ` 與 `percentileInScan` 算得出來且方向正確
2. 樣本數 < `minBaselineVideos` → `baseline: 'insufficient'`，**不回傳任何排名**
3. MAD = 0 → `baseline: 'degenerate'`，**不回傳 Infinity**
4. 重尾分布（一支吃掉八成觀看）→ 中位數不被那一支拉走（這是選 median/MAD 而不選 mean/SD 的全部理由，要有測試證明它真的成立）
5. **【v1.1 新增】輸出不含任何 `isOutlier` 布林值。** `docs/14` §3.4.2——切點是檢視參數，存進資料就變成資料的性質了。這一條用 grep 驗收：`scan/` 底下不得出現 `isOutlier`

### 3.3【v1.1 新增】年齡偏斜要在這一批就量出來

`docs/14` §3.2 選了「承認做不到年齡匹配、但把偏誤攤開」。攤開的那一半也要實作，不能只寫在文件裡：

- `ageSkew: { selectedMedianDays, sampleMedianDays, direction }`
- `videoObservations` 的寫入——沒有它，`maturityDays = 14` 永遠不會被推翻

**驗收：** 拿一批刻意偏舊的假資料跑，`ageSkew.direction` 要回 `'older'`，而且回應裡找不到「已做年齡校正」這類字樣。

---

## §3A【v1.1 新增】批次 1.5 · 主題身分層（1–2 天）

`docs/14` §3A。**這一批必須在兩軌之前完成**，因為 Track A 的跨頻道重現與 Track B 的跨週基準都建立在「同一個主題」之上。塞進任一軌去做，另一軌就會長出第二套身分邏輯。

| 檔案 | 動作 |
|---|---|
| `dashboard/server/lib/scan/identity.js` | **新**：四條決定性規則、alias 查表、候選合併佇列 |
| `dashboard/server/routes/scan.js` | `GET /api/topics/canonical`、人工覆核的合併／拆分端點 |
| `store.js` `canonicalTopics` | 完整契約含 `mergeHistory` / `splitHistory` |

**驗收：**

1. 「Ozempic 減重副作用」／「GLP-1 減肥藥風險」／「瘦瘦針副作用」**不會自動被合併**，而是進候選佇列標 `needsReview`
2. 人工確認合併後，寫入 `aliases`；**下一次掃描自動走規則 2**，不再進佇列
3. **merge 之後仍能重建合併前的兩條數列**（`docs/14` §3A.4）——沒有這一條，Track B 的「覆蓋度突然翻倍」就無法區分是真的有事，還是合併造成的
4. 不得出現 embedding / LLM clustering

---

## §4 批次 2 · 兩軌掃描與交叉驗證（3–4 天）

| 檔案 | 動作 |
|---|---|
| `dashboard/server/lib/scan/trackA.js` | **新**：三階段（發現 → 基準 → 判定），逐階段落地、可續跑 |
| `dashboard/server/lib/scan/trackB.js` | **新**：RSS 抓取、媒體網域去重、`coverage*` 指標 |
| `dashboard/server/lib/scan/crosscheck.js` | **新**：2×2 象限、關鍵字重疊 / 命名實體 / 時間鄰近三條各自輸出 |
| `dashboard/server/lib/scan/runner.js` | **新**：lease / heartbeat / recovery / checkpoint（`docs/14` §1.5）、`runKey` 冪等、階段狀態機 |
| `dashboard/server/routes/scan.js` | **新**：`docs/14` §10.1 的 6 個端點 |

### 4.1 五個容易在實作時滑掉的點

1. **Track B 的欄位一律叫 `coverage*`，不准出現 `heat`。** 新聞沒有觀看數，Google News 的排序是編輯與演算法選擇，`outletCount` 量的是**媒體供給**不是**閱聽需求**。把它叫熱度，就是重蹈系統早就修過的錯（`volume` 之於 `volumeMeaning: 'sample_frequency'`）。要有對應的 `coverageMeaning: 'media_supply'`。
2. **`outletCount` 以媒體網域去重，不是數文章。** 與 `aggregatePostsToTopics` 用 distinct authors 而非 post count 是同一個道理。
3. **2×2 的四格都要回傳，包含第④格（兩者皆在切點之下）。** 它是①②③的分母。只回傳①會讓②③永遠不被觀察到，那是 `docs/11` §0 紀律 5 禁止的事。而且②在實務上很可能是最有用的一格——`docs/12` 匯入的 11 位生活風格型人設，好題大多不會出現在新聞裡。
4. **【v1.1】Track B 存 article-level，不存聚合值。** `publishedAt` / `outletDomain` / `canonicalTopicId` / `title`，日聚合在讀取時算。存聚合值會把 `newsWindowDays = 7` 烤進歷史資料，之後就無法回頭換視窗長度去檢驗「每週兩次 × 7 天窗重疊 3–4 天」造成的自相關（`docs/14` §4.4-2）。
5. **【v1.1】`weekday` 用地區當地時區，不是 server 時區。** 存 `localWeekday` / `localCapturedAt`。這是 `docs/14` §1.3.1 的直接後果：同一個 UTC cron 在美東是週日。

### 4.2 主題排序的驗收

- **【v1.1 改】** 第一鍵是 `channelsAboveCut`，第二鍵是 `medianPercentile`（`docs/14` §3.5）
- **【v1.1】`channelsAboveCut` 必與 `channelsRepresented` 並排顯示。** 「5 個頻道中有 4 個」和「40 個頻道中有 4 個」是完全不同的證據
- **【v1.1】切點必與 2×2 一起顯示，且可移動並即時重算**（`docs/14` §5.2）
- **【v1.1】grep 驗收：`scan/` 底下不得出現 `isOutlier`**，回應裡不得出現「是離峰值」這種二元宣稱
- top-K 的 domain 分層有作用，**且未分層的原始排名同時可見**；**domain 數 > K 時列出超額的那些，不靜默丟掉**（`docs/14` §7.3.1）
- 回應帶 `crossRegionComparable: false` 與 `crossDomainComparable: false`
- **【v1.1 改】達到 `requiredWeeklyCycles` 之前**（依實際跨度判定，不是次數），Track B 一律 `spikeBaseline: 'none'`，回應裡找不到任何升溫語意

---

## §5 批次 3 · Railway 排程與觸發（半天）

| 項目 | 動作 |
|---|---|
| 新 service `scanner-cron` | 同一個 repo、同一個分支；**不掛 volume**；亞洲區 cron `0 22 * * 0,3`（UTC）＝台北週一、週四 06:00 |
| **【v1.1】美洲區 cron** | **另一組**。同一個 UTC 時段在美東是**週日 18:00**，落在週末——與「兩次都採平日」的理由相反（`docs/14` §1.3.1） |
| `tools/scan-trigger.mjs` | **新**：約 30 行。POST 到 `dashboard` 的私有網域，帶 `SCAN_TRIGGER_TOKEN`，收到 `202` 就 exit |
| `railway.json` | 不改。`scanner-cron` 用自己的 start command，設在 service 層 |
| 變數 | `dashboard` 新增 `SCAN_TRIGGER_TOKEN`；`scanner-cron` 新增同一個值 ＋ `DASHBOARD_URL` |

**為什麼要多一個 service 而不是在 dashboard 裡跑排程器：** Railway 的 volume 一個只能掛一個 service，而且掛了 volume 的 service「同一時間只允許一個 deployment 掛載」。`dashboard` 已經掛著 volume 當 `DATA_DIR`。所以會寫資料的那一端必須留在 `dashboard`，排程那一端只能是一個不掛 volume、觸發完就結束的小 service。這不是設計偏好，是平台規格推出來的唯一解。

**為什麼是兩組 cron 而不是找一個折衷時段：** 亞洲的平日早晨就是美洲的前一天下午。**沒有一個 UTC 時段能讓兩邊同時落在平日早晨**，所以折衷不存在，只能分開排。

**驗收：**
- cron 時區換算正確（UTC vs. 台北，日欄位挪了一天——這一格最容易寫錯）
- **【v1.1】美洲區那一組驗到當地確實是平日**；在它上線前，US / GLOBAL 的 Track B 結果要標明採樣日落在週末
- **【v1.1】`scheduledRunKey` 含 `configHash`**：改完種子詞後按「立刻掃描」要拿到**新結果**，不是快取的舊 run（`docs/14` §1.3.2）
- **【v1.1】手動掃描用 UUID**，不共用排程鍵；`retryOf` 指得出它在重試哪一次
- 同一個 `scheduledRunKey` 觸發兩次，第二次回既有結果、不重跑
- **【v1.1】durable runner 的四項**（`docs/14` §1.5）：
  - 掃描進行中 kill 掉 process，重啟後那筆 run 從 `running` 被回收成 `queued`，**不是永久卡住**
  - `maxActiveRuns` 生效，手動與 cron 不會堆疊
  - 每個 stage 完成有 checkpoint，續跑不從頭來
  - **原子寫入**：寫到一半中斷，store 檔仍可讀（本次 commit 已完成，這裡是回歸驗收）
- `dashboard` 的 healthcheck `/api/health` 在掃描進行中仍然正常（掃描是背景工作，不能卡住 healthcheck）

---

## §6 批次 4 · 畫面（2–3 天）

新增第 7 個頁簽「掃描」。四塊，順序即閱讀順序（`docs/14` §10.2）：

1. **這次掃了什麼** — 方向、地區、平台、種子詞、新聞查詢、樣本數、耗時，**加上作者帳目**（`docs/14` §8.2.1）：「本次發現 420 位作者，只對前 100 位建立了頻道基準」。**先講範圍再講結論**，因為範圍決定了結論的效力。
2. **證據四象限** — 2×2，四格都可點開，**上方是兩個可移動的切點**（`docs/14` §5.2）
3. **主題清單** — K 個主題，每個展開完整證據鏈；`channelsAboveCut / channelsRepresented` 並排；旁邊並列未分層的原始排名；下方是超出名額的 domain
4. **結合建議** — 方向層簡報（`scored: false`）＋ 該方向 KOL 的既有引擎評分

沿用既有元件：`components/notes.jsx` 的 `ScoreRow` / `DimensionNote` / `ExpertPanel` / `RedlinePanel` / `CalibrationTag`。**不新做一套視覺語言**——同一個系統裡兩套講法，會讓人以為掃描的數字和評分的數字是同一種東西。它們不是。

**用詞檢查是驗收項，不是建議**（`docs/14` §10.3）：全域 grep「熱度／爆紅／升溫／新趨勢／潛力／預測」，掃描頁面一個都不能有。**【v1.1】另加三項**：不得出現「這是離峰值」這種二元宣稱、不得出現「已做年齡校正」、`GLOBAL` 的標籤要是「英語圈（US 為主）」而不是「全球」。

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

**成本無法在紙上估準，因為它取決於「一次掃描會碰到幾個不同的作者」，而那要抓過才知道。** 批次 0 的 **0-10** 就會給出第一個真實數字。

先寫下控制手段（實作時一併做，不要等到帳單來）：

- 頻道基準**跨掃描快取**——同一個頻道 7 天內不重抓（存在 `channelBaselines`）
- 只對**進入候選的**作者抓基準，不對全部作者抓
- 每次掃描設 `maxChannelFetches` 上限，**超過時記錄的不只是數量**——`docs/14` §8.2.1 的六個帳目欄位加上被截斷者的分布摘要。只記「有 37 個沒抓」說不出漏掉的是什麼類型，而誰先進候選是由 actor 的 relevance 排序決定的，那不是隨機抽樣

---

## §9 風險

| 風險 | 嚴重度 | 處理 |
|---|---|---|
| ~~半年窗抓不到~~ **【v1.2 已解除】** | — | 已實測：TikTok 撐得住。**但代價是 Track A 只剩 TikTok**——IG 只覆蓋 ~25 天、Threads 時間戳解析失敗 |
| **抓不到頻道基準**（`docs/14` §3.7） | 🔴 **會讓主判準失效** | 批次 0-3 先驗；三個備案已列，需使用者裁示 |
| **【v1.1 新增】重跑就換一批樣本** | 🔴 **會推翻可重現性** | 批次 0-9。如果同一個 query 重跑得到不同集合，跨週比較就沒有意義 |
| RSS 端點與預期不符 | 🟡 Track B 延後 | 批次 0 先驗；Track A 不依賴它，可先上 |
| 抓取成本失控 | 🟡 | §8 的三個控制手段；上限要記錄完整帳目而非只記數量 |
| 政治題洗版整份清單 | 🟡 | domain 分層 ＋ `W-POLITICAL-OUTLIER` ＋ 原始排名同時可見 |
| **【v1.1 新增】主題身分碎裂** | 🟡 但會讓主證據失效 | 碎裂時 `channelsAboveCut` 永遠是 1，跨頻道重現形同虛設。批次 1.5 的人工佇列**要有人看**——這是流程依賴，不是技術問題 |
| **【v1.1 改】年齡偏誤** | 🟡 已知未解 | §3.2 選了承認做不到＋量測 `ageSkew`。清單確實會偏舊，只是偏多少看得見 |
| 使用者把單次橫斷面讀成時間趨勢 | 🔴 **是這類工具最常見的誤用** | `/api/scan/baseline-status`（回跨度不回次數）＋ 用詞禁令 ＋ 達標前強制 `spikeBaseline: 'none'` |
| 掃描卡住 healthcheck | 🟡 | 掃描是背景工作；觸發端點立刻回 `202` |
| **【v1.1 新增】run 卡在 `running` 永遠不動** | 🟡 每次 redeploy 都可能 | `docs/14` §1.5 的 lease + 啟動時 recovery |

**已從風險表移除：** 「`health` domain 改變既有分數」——因為那件事已經不在這個計畫裡了（§3.1）。

---

## §10 順序、判準與需要裁示的事

**順序：** ~~批次 0 → 1 → 2 → 3 → 4 → 5~~ **改為 R0 → R1（批次 0）→ R2（批次 1 → 1.5 → 2 → 3 → 4 → 5）**。

- **R0 已完成**（§1.2）。
- **批次 0 是硬前置**，而且它的 0-4 / 0-5 有權讓整個計畫改名或停下來。
- **批次 1.5（主題身分）必須在批次 2 之前**，因為兩軌都依賴它。
- 批次 1 與 1.5 可以部分重疊，2 之後才有東西可以畫。

**每一批的完成判準都是「跑得起來而且測得到」，不是「寫完了」：** `npm run smoke` 與 `npm run test:redlines` 全過，加上該批自己的驗收項。

**需要使用者裁示的五件事（不裁示會卡住）：**

1. **批次 0-3 若失敗，走 A / B / C 哪個備案？** 這決定整份規格的主判準能不能成立。
2. ~~批次 0-4 / 0-5 若失敗，窗長改成多少？~~ **【v1.2 · 不需裁示了】** TikTok 撐得住 180 天。但衍生出一個新的：**Track A 只剩 TikTok，這樣夠嗎？** 若要多平台，就回到 0-3 的備案 A（接 YouTube）。
3. **【v1.1 新增】要不要另開一個 `health` scoring domain 的 migration？** 不開的話，健康型方向的 `fit` 會一直比其他方向粗（§3.1）。這件事現在**不擋**掃描開發，但值得排進待辦。
4. **政治型方向要不要做人設？** 目前 16 位沒有任何一位落在這裡。不做的話，這個方向的掃描永遠只能是題目盤點。
5. **`mia-huang` 的直播定位。** `docs/12` §3.1 已判定 AI 人設在結構上無法履行即時雙向的直播。遊戲型方向的掃描結果送到她身上之前，這件事要先解決。

**另有兩件 `docs/11` §15 留下、本次未處理也未惡化的：** `rachel-ong` / `rafael-costa` / `faye-tan` 的可信度型態；`personaFit` 常態性回傳 100 導致 EXPERIMENT 帶樣本稀少。

---

## §11 一句話總結

這次改寫要加的是**發現**，不是**評分**。評分那一段已經被兩輪 review 打磨過，新的東西全部走「產出題目 → 題目進既有引擎」這條路。

**v1.1 之後，最前面的風險換了位置。** v1.0 說「真正的技術風險只有一個：拿不到頻道基準」——那句話仍然成立，但 review 找到一個更前面的：**半年窗到底抓不抓得到。** 拿不到基準是算不出分數；抓不到半年是連樣本範圍都不是使用者要的。兩者都在批次 0 驗，而批次 0 有權讓這個計畫改名或停下來。

還有一件 v1.0 沒看到的：**說「不污染評分」是不夠的，要去讀那條路徑上的程式。** `makeAdHocTopic()` 的 `heat ?? 50` 就在那裡，而且已經在生產環境跑了一段時間——文件寫得再清楚，資料一進引擎就已經被污染。這次連同 `hookToTopic()` 的同一個缺陷一起修掉了。
