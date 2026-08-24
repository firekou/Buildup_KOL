# docs/14–15 離峰值掃描規格 Review · GPT-5.6 Sol

**日期：** 2026-08-24  
**Review 範圍：** `docs/14-outlier-scan-spec.md` v1.0、`docs/15-outlier-scan-rewrite-plan.md`、`kols/persona-directions.json`、`kols/scoring-config.json`，並對照目前 `main` 的 `topics/index.js`、`topics/classify.js`、`scoring/match.js`、`store.js`。  
**Review 基準 commit：** `57754ba265a3a73e82b80d233048f96f127c5938`  
**問法：** 這份最新改版規劃是否已經足以直接開工？它和現有 Dashboard 的評分、資料、排程與證據鏈是否真的接得起來？

---

## A. 結論

**目前不建議直接進 Batch 1。可以做 Batch 0 的來源探測，但 docs/14 v1.0 需要先修成 v1.1。**

整體方向是對的，而且比舊的「熱度直接混進 Match 分數」乾淨很多：

- 「發現」與「評分」分離是正確架構。
- 頻道相對基準優於全域平均，方向正確。
- 新聞明確叫 `coverage`、不冒充受眾需求，正確。
- 保留完整分母、原始排名、來源範圍與 prior 狀態，正確。
- Batch 0 先驗證資料源再開工，正確。

但目前有 **6 個 P0 阻擋條件**。其中幾個不是實作細節，而是會讓「離峰值」本身失去可計算定義。

**開工判定：**

- ✅ Batch 0 source probe：可以做，但探測項目要擴充（見 P1-3）。
- ❌ Batch 1–5：先不要做。
- ✅ 修完本文件 P0-1～P0-6，再進 Batch 1。

---

## B. P0 · 不修會讓結果錯、證據鏈斷掉，或系統無法可靠執行

### P0-1 · 「第 6 次掃描 = 3 個完整週週期」是算錯的，而且和現有程式衝突

`docs/14 §1.1` 與 `scoring-config.json > outlierScan.requiredWeeklyCycles.note` 寫：

> 每週兩次 × 3 週 = 6 次快照、21 天、3 個完整週週期。

但現有 `dashboard/server/lib/topics/index.js > heatConfidenceOf()` 明確不是看筆數，而是：

```js
spanDays = lastSnapshot - firstSnapshot
weeklyCycles = Math.floor(spanDays / 7)
```

如果固定週一／週四掃描：

| 掃描 | 距第 1 次 |
|---|---:|
| 週一 W1 | 0 天 |
| 週四 W1 | 3 天 |
| 週一 W2 | 7 天 |
| 週四 W2 | 10 天 |
| 週一 W3 | 14 天 |
| 週四 W3 | 17 天 |
| **週一 W4** | **21 天 = 第 3 個完整週週期** |

所以正常情況下是 **第 7 次掃描** 才第一次達到 21 天，而不是第 6 次。

**必改：**

1. 所有成熟判斷一律只讀實際 `spanDays / weeklyCycles`，禁止用 `snapshotCount >= 6` 之類的捷徑。
2. `docs/14`、`docs/15`、`scoring-config.json` 的「第 6 次」全部修掉。
3. `/api/scan/baseline-status` 回傳 `firstCapturedAt / lastCapturedAt / spanDays / weeklyCycles / requiredWeeklyCycles`，UI 不自行推算。
4. Track B 的成熟條件應重用同一個「週期跨度函式」，不要複製第二份算法。

---

### P0-2 · 規格宣稱「頻道相對 × 年齡匹配」，但實際設計只有「成熟期過濾」，沒有年齡匹配

`docs/14 §3.1` 把主判準定義為：

> 頻道相對 × 年齡匹配

但 `§3.2` 的實際方法只是：

1. 未滿 `maturityDays` 不算；
2. 滿了之後，全部丟進同一個頻道中位數。

這不能解決累積觀看問題。**15 天的影片和 170 天的影片即使都「成熟」，曝光時間仍差 11 倍以上。** 直接比 cumulative views，仍會系統性偏向舊影片。

另外 `scoring-config.json > maturityDays.cost` 寫「每週兩次把延遲上限壓在 3–4 天」也不精確。若 `maturityDays = 14`，總等待時間是 **至少 14 天，再加最多約 3–4 天到下一次掃描**；不是總共只延遲 3–4 天。

**必改：**

- v1.1 要在兩個選項裡選一個，不能維持現在的模糊狀態：
  - **A. 真正做 age-matched baseline**：同頻道、相近 post age 的影片才互相比；匹配品質不足時回 `ageBaseline: insufficient`。
  - **B. 暫時承認做不到**：V1 只叫「頻道相對候選」，不得宣稱已做 age matching，也不得把它當正式離峰值；等有多次快照後再用固定 post-age 的觀看值校正。
- 不建議用簡單 `views / days` 取代，因為那等於假設觀看線性累積，又引入一個未驗證模型。

這一點沒有修，半年窗會天然偏向較舊內容，與使用者要找「異常突出」的目的相反。

---

### P0-3 · 「不設門檻、只取 Top-K」和「有／無影片離峰」的 2×2 定義互相矛盾

`docs/14 §3.4` 明確說：

> 不設倍數門檻，只排序取 top-K。

這個選擇本身可以接受；它代表系統只做**相對排序**，不宣稱有一條「爆款線」。

但 `§3.5`、`§5.2` 又需要一個二元事實：

- 哪些影片「是離峰值」？
- 哪個主題「有影片離峰」？
- 哪個主題「無影片離峰」？

沒有 binary rule，就無法計算 `distinctChannels` 的「有幾個頻道因這個題目出現離峰」，也無法填 2×2 的「有／無影片離峰」。Top-K 永遠會有前幾名，即使這批資料全部只是正常波動。

這是目前最核心的定義衝突之一。

**必改：** 二選一：

1. **維持「不設門檻」哲學**：把 Track A 改成 ordinal evidence，不再稱「有／無離峰」。例如回傳 `videoEvidenceRank / distinctChannels / multiplierDistribution`，2×2 改成非二元證據表。
2. **保留 2×2**：那就必須明文定義一條 binary candidate rule，並老實標成 prior、可校準；不能一邊說沒有門檻，一邊又在資料模型裡偷偷需要門檻。

我比較建議 **選 1**。它比較符合這個 repo 已建立的紀律：資料還不夠時，不為了讓 UI 好畫就編一條切點。

---

### P0-4 · 「同一個主題」沒有穩定 ID；Track A 跨頻道重現、Track B 跨週基準目前都不可重現

整份設計非常依賴「同一個 topic」：

- Track A：同一題在多個頻道出現 → `distinctChannels`。
- Track B：同一議題今天的 coverage vs. 它自己的歷史。
- Cross-check：影片題與新聞題是不是同一件事。

但目前只在 `§5.3` 定義「兩軌怎麼對上」：關鍵字／命名實體／時間鄰近。

**沒有定義 Track A 內部怎麼把不同影片歸成同一題，也沒有定義 Track B 跨週如何維持同一個議題 ID。**

例如：

- 「Ozempic 減重副作用」
- 「GLP-1 減肥藥風險」
- 「瘦瘦針副作用」

可能是同一題，也可能是不同題。只用 hashtag 會碎裂；只用 seed term 又會把整個「健康」混成一題。

沒有 canonical identity，`distinctChannels`、`newsSnapshots`、2×2 都可能只是字串分組的幻覺。

**必改：新增 `canonicalTopic` 資料契約**，至少要有：

```text
canonicalTopicId
displayTitle
region
language
aliases[]
entities[]
sourceTerms[]
firstSeenAt
lastSeenAt
mergeHistory[] / splitHistory[]
identityMethod
identityConfidence 或 needsReview
```

可以先用 deterministic rule + 人工覆核，不需要立刻做 embedding/LLM clustering；但**一定要有一個可重播、可審查的 identity layer**。

---

### P0-5 · 掃描證據接進現有 Match 時會被丟掉，而且會憑空產生 `heat = 50`

`docs/14 §7.2` 說掃描證據要掛在：

```text
topic.discoveryEvidence
```

然後經：

```text
makeAdHocTopic() → matchKolToTopic() → generatePlans()
```

但現在的 `dashboard/server/lib/topics/index.js > makeAdHocTopic()` 只挑固定欄位建立新物件，**沒有把 `discoveryEvidence` 帶過去**。

更嚴重的是：

```js
heat: input.heat ?? 50
```

所以一個完全沒有既有「樣本共現密度」資料的掃描題，進 `matchKolToTopic()` 後，`buildTiming()` 會顯示一個 **50 的「樣本共現密度」**。這和 docs/14 一直強調「不要把不同證據混成同一種數字」直接衝突。

**必改：**

- 新增 scan-topic adapter contract；至少保留：
  - `discoveryEvidence`
  - `source = 'scan'`
  - `region / language`
  - `canonicalTopicId`
  - `heat = null`（若沒有既有 heat）
  - `timingCaveat` 或等價欄位
- `makeAdHocTopic()` 對 scan input 不得 default 50。
- 不需要改 `gates.js / match.js / notes.js` 的評分公式，但**必須修 adapter**，否則「掃描不污染評分」只存在文件裡，資料一進現有引擎就已經被污染。

---

### P0-6 · `202 + dashboard 背景跑` 目前不是 durable job；服務重啟就可能留下半套 run

`docs/14 §1.4` 的設計是：

- `/api/scan/run` 立刻回 `202 {runId}`
- dashboard process 在背景繼續跑 stage
- 每階段落地、可續跑

方向合理，但**「怎麼續跑」目前沒有觸發機制**。

Node web process 在 Railway redeploy、crash、OOM、service restart 時，detached background task 會直接消失。`scanRuns` 雖然能記 `stage = partial`，但如果沒有下一個 durable worker / lease owner / recovery trigger，它只會變成一筆永久卡住的紀錄。

此外 `store.js` 現在是整檔 `readFileSync → JSON.parse → writeFileSync`，不是 atomic temp-write + rename。掃描新增大量狀態更新後，process 中斷時的檔案風險也會放大。

**必改：** 至少定義：

1. `scanRun` lease：`status / stage / leaseOwner / leaseUntil / heartbeatAt / retryCount / lastError`。
2. 啟動時 recovery：找到 `running` 但 lease 過期的 run → 回 `queued`。
3. 同時只能有明確數量的 active run；手動與 cron 不得無限堆疊。
4. stage 完成後先持久化 checkpoint，再進下一 stage。
5. 關鍵 JSON store 採 temp file + atomic rename，或把 scan store 提前換成真正 durable storage。

可以不立刻上 Postgres，但不能只靠「背景 Promise 還活著」當 job system。

---

## C. P1 · 不一定會立刻算錯，但現在的規格會造成漂移、偏誤或不必要耦合

### P1-1 · `health` direction 不應順手變成 scoring domain；這違反「只新增發現、不動評分」

規格前面說：

> 這次新增 discovery，不改既有 scoring。

但 Batch 1 又要新增 `health` domain，且文件自己承認這會改既有 16 位 KOL 對既有題目的 `axisDemand → fit`。

這不是 discovery-only；這是一個 scoring migration。

**建議：**

- `persona direction` 與 `scoring domain` 分開。
- 健康型可以是 discovery direction，但找到題目後，仍依既有 classifier 落到 `life / sports / news / tech...`。
- 如果真的要新增 `health` scoring domain，另開一個獨立 spec / commit / regression review，不要綁在 outlier scan 裡一起上。

這樣才真正守住「新功能前接發現、後段評分不動」的架構承諾。

---

### P1-2 · discovery 常數不應繼續塞在 `scoring-config.json`，而且 approval 不該共用

現在 `outlierScan` 被放進 `kols/scoring-config.json`，但 docs/14 又反覆說「這不是評分」。語意上已經開始耦合。

更危險的是 Track B 打算「與 `heatConfidence` 同一套 `timeSeries.approved`」。**同樣的 3 個週週期可以共用，人工批准不應共用。**

批准「hashtag sample frequency 的歷史可以離開 sandbox」不等於批准「news coverage baseline 也已經可靠」。兩種資料源、偏誤、窗長都不同。

**建議：**

- 拆 `kols/discovery-config.json` 或 `scan-config.json`。
- `requiredWeeklyCycles` 只留一份 source of truth，其他地方引用，不複製值。
- approval 拆成至少：
  - `topicHeatTimeSeries.approved`
  - `newsCoverageTimeSeries.approved`
- `calibration.outlierScan` 不要只有一個總 status；`maturityDays / minBaselineVideos / newsWindowDays` 的校準證據不同，應各自有狀態。

---

### P1-3 · Batch 0 probe 還不夠；必須驗證「半年窗是否真的抓得到」

現在 Batch 0 只問：

- RSS 能不能打？
- Yahoo 路徑是什麼？
- TikTok profile input 能不能回 playCount？

但使用者的需求是**半年內**。

所以 source probe 必須再回答：

1. hashtag / keyword actor 是否真的能覆蓋 180 天？還是只回 recent / top N？
2. pagination 是否可控？最多能翻到多舊？
3. profile actor 每帳號最多回幾支、日期跨度多大？
4. 排序是 recent、popular、relevance 還是 actor 自己的 ranking？
5. 私人／刪除／限區影片怎麼標？
6. 同一次 query 重跑，樣本集合穩定度如何？
7. 每 100 個候選作者的實際 Apify 成本與耗時。

**如果只能抓「近期熱門結果」，就沒有半年分母，也不能把結果叫「半年內離峰值掃描」。**

這些應列為 Batch 0 的硬驗收，而不是做到 Batch 2 才發現。

---

### P1-4 · Track B 的 7 天 rolling window 每週掃兩次，高度重疊；而 US/GLOBAL 的「平日採樣」假設其實不成立

`newsWindowDays = 7`，掃描 Mon/Thu，兩次窗口會重疊 3–4 天。這會造成很強的 autocorrelation；今天的 spike 很可能只是上一個窗口同一批文章還在裡面。

另外 cron 是 `22:00 UTC`：

- 台灣／香港／新加坡／日本：確實落在週一／週四附近的平日。
- **US：週日 17–18 點／週三 17–18 點（依 DST）**。

所以文件「兩次採樣都落在平日，避免週末媒體量」對 US 與以 US 為 proxy 的 GLOBAL 不成立。

**建議：**

- 儲存 article-level `publishedAt / outletDomain / canonicalTopicId`，後續再依需求聚合 daily coverage；不要只存一個重疊 7 天總數。
- `weekday` 要以 region local timezone 計算，不是 server / Taipei timezone。
- 排程改成 region-aware，或至少選一個 Asia + US 都落平日的 UTC 時段。

---

### P1-5 · `runKey` 需要包含 config revision；手動「立刻掃描」不能和 scheduled run 完全共用同一個 key

目前：

```text
runKey = direction:region:ISOweek:slot
```

有兩個問題：

1. 同一週同一 slot 如果剛改 seed terms / actor / code，再按「立刻掃描」，會拿回舊結果。
2. 手動掃描若完全共用 scheduled key，就不是「立刻重抓」，只是「把舊 run 打開」。

**建議：**

```text
scheduledRunKey = direction:region:slot:configHash
manualRunKey    = UUID
retryOf         = optional previousRunId
```

scheduled 仍防重複；manual 則是真正的一等公民，而且可追蹤它是在重試哪一次。

---

### P1-6 · candidate author 的截斷會產生選擇偏誤；`maxChannelFetches` 不能只記數量

規格說為了省成本：

- 只抓「進入候選」的作者 baseline
- 超過 `maxChannelFetches` 就截斷

但「誰先進候選」通常又是由 hashtag actor 的 relevance / popularity 排序決定。這會讓 baseline 只覆蓋平台先幫你選過的一群帳號。

只記「有 37 個作者因上限沒抓」還不夠；系統仍不知道被漏掉的是什麼類型。

**建議至少記：**

- `authorsDiscovered`
- `authorsEligibleForBaseline`
- `authorsFetched`
- `authorsSkippedByCap`
- `selectionOrder / upstreamRank`
- 被截斷作者的 region/domain/初始 signal 分布摘要

UI 的 coverage scope 要能說：「本次發現 420 位作者，只對前 100 位建立頻道基準」，而不是只顯示 100 位像完整母體。

---

## D. P2 · 可以在實作時一起修，但現在先寫進規格會更乾淨

1. **`pillarKeywords` 在 direction 層的「粗篩」語意不夠清楚。** 如果它會排除 topic，就等於 discovery 前面多了一個未校準 gate。建議只能做 query expansion / label，不得 blocking。
2. **domain 保底 1 名 vs. Top-K 有容量衝突。** 若有離峰 evidence 的 domain 數量 > K，「每個 domain 保底 1」不可能同時成立；需定義 overflow 行為。
3. **`GLOBAL` 明知其實是英語／US proxy，API/UI 應優先改 label。** 不能只靠 note，否則使用者仍會把它讀成世界樣本。
4. **RSS「免費、免 key」目前仍是 unverified。** 在 Batch 0 完成前，文件應寫「預期免 key／待驗證」，不要先當已確認事實。
5. **cross-track 三條規則不合成分數是好事，但 time proximity 必須定義時間基準。** 是 publishAt、firstSeenAt、coverage peak date，還是 scan time？現在仍未定義。

---

## E. 這份 v1.0 哪些設計應該保留，不要因為 review 又整套推翻

以下我建議**保留**：

1. **Discovery 與 Match 分離。** 離峰／新聞證據不進 `screeningScore`，這是正確的大方向。
2. **頻道相對而不是全域平均。** 問題在 age adjustment 尚未完成，不在 channel-relative 這個核心選擇。
3. **MAD / median 的穩健基準。** `MAD = 0` 明確退化為 `degenerate` 也正確。
4. **不把新聞 coverage 叫 audience heat。** `coverageMeaning: media_supply` 應保留。
5. **完整分母留存。** 不只存成功案例，這是後續能否校準的關鍵。
6. **原始排名與分層推薦並列。** 使用者看得到 selection layer 做了什麼，不會把編輯策略誤認為資料本身。
7. **prior 全部集中並寫可推翻路徑。** 這個 repo 已經建立得很好，繼續維持。
8. **先做 source probe。** 這次最大的外部不確定性確實應該先驗，而不是直接寫 actor adapter。

這次 review 的目的不是把架構推翻，而是把「概念上對」補成「資料上真的可算、程式上真的接得起來」。

---

## F. 建議的 v1.1 修正順序

### R0 · 先修規格，不寫功能

`docs/14 / docs/15 / config` 先改完以下六件：

1. baseline maturity 改成**實際時間跨度**，修正「第 6 次」錯誤。
2. 明確決定 age matching 的 V1 方法；做不到就降級命名，不得假裝有做。
3. 解開 Top-K vs. binary outlier 的矛盾，重新定義 2×2。
4. 新增 canonical topic identity layer。
5. 定義 scan-topic adapter，保證 `discoveryEvidence` 不丟、`heat=50` 不憑空出現。
6. 定義 durable runner / lease / recovery。

### R1 · 擴充 Batch 0

除了原本 0-1～0-3，再驗：

- 180 天覆蓋能力
- pagination / ordering
- profile history depth
- repeated-run stability
- 實際 cost / latency
- region-local news availability

探測結果回填後，才決定 TikTok / YouTube / fallback。

### R2 · 再進 Batch 1

這時 Batch 1 才開始資料層與 actor adapter，而且建議**先不順帶新增 `health` scoring domain**，把那件事拆成獨立 migration。

---

## G. 最終判定

**Verdict：NEEDS REVISION — Batch 0 可做；Batch 1–5 暫停。**

不是因為整個方向錯。相反，這一版最大的進步就是終於把「題目怎麼被發現」和「KOL 適不適合」拆開了。

現在真正要補的是四個可計算性的缺口：

> **時間跨度、影片年齡、離峰二元定義、主題 identity。**

以及兩個工程接口缺口：

> **scan evidence adapter、durable runner。**

這六件修完，這份規格就有資格從「思路完整」升級成「可以可靠開工」。
