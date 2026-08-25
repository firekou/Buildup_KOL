# Batch 0 來源探測 · 0-1／0-2／0-3／0-6／0-7／0-8／0-9／0-10

**日期：** 2026-08-25
**範圍：** `docs/15` §2.1 剩下的八項。0-4／0-5 見 `2026-08-25-scan-source-probe.md`。
**執行環境：** Railway `buildup-kol-dashboard` / `dashboard`，commit `0b1d248`
**spec：** `news:TW,HK,SG,JP,US,KR,MY;profile:tiktok:5:30;stability:tiktok:100`
**地區：** TW（actor 部分）／七區（新聞部分）
**判準：** 在看到任何數字之前寫定，見 §1。

---

## §0 結論

| # | 項目 | 判定 |
|---|---|---|
| **0-1** | Google News RSS | ✅ 七區全通，短期無速率限制 |
| **0-2** | Yahoo RSS | ⚠️ TW／HK 可用，SG／JP 太薄，US 403 |
| **0-3** | profile actor 能否列出帳號影片 | ✅ **通過。主判準成立** |
| **0-6** | 每帳號深度 | ⚠️ 是「最近 N 篇」不是「最近 180 天」 |
| **0-7** | 上游排序 | ✅ **不是 popularity 排序**，截斷偏誤比預期輕 |
| **0-8** | 私人／已刪除的標記 | ⚠️ 本批沒遇到，無法判定 |
| **0-9** | 重跑穩定度 | ⚠️ **recallOfA 0.48——一半的樣本會換掉** |
| **0-10** | 成本與耗時 | ⚠️ 100 個作者投影 36 分鐘 |

**Batch 0 到此全部跑完。最重要的三件事：**

1. **0-3 通過，整份規格的主判準站得住。** 頻道中位數算得出來。
2. **0-9 是這一輪最重的發現。** 兩次背對背、完全相同的查詢，只有 48% 的貼文重疊。這不是時間造成的變化——兩次相隔幾十秒。**一次掃描是一個大池子的一份抽樣，不是那個池子。**
3. **0-1 發現新聞要走 search feed 不是主題 feed**，兩者差 30 倍的時間觸及。

---

## §1 判準（先寫，後看數字）

| 項目 | ✅ | ⚠️ | ❌ |
|---|---|---|---|
| 0-1 | 200 + isXml + items≥20 | items<5 | 4xx/5xx |
| 0-2 | 200 + isXml + items>0 | — | 404／非 XML |
| 0-3 | posts≥8 且 viewsCoverage≥0.9 且 staysOnProfile | posts<8 或 staysOnProfile=false | viewsCoverage<0.5 |
| 0-6 | spanDays≥180 | — | — |
| 0-7 | 前段中位觀看無明顯高於後段 | — | 有明顯遞減趨勢 |
| 0-8 | flagKeys 非空 | 全空且 rawItems<requested | — |
| 0-9 | recallOfA≥0.7 | 0.3–0.7 | <0.3 |
| 0-10 | — | projectedMinutesFor>30 → 必須分階段 | — |

上一輪的教訓（`oldestAgeDays` 被 8 則釘選貼文騙過）已內化：這一輪凡是下判定的地方都避開單一極值，0-9 用 `recallOfA` 而不是 `jaccard`（兩次樣本大小可能不同時 jaccard 會低估）。

---

## §2 原始數據

### 0-1 Google News（七區）

| region | items | dated | oldestAgeDays | outletFromLink | outletFromSource | ms |
|---|---:|---:|---:|---:|---:|---:|
| TW | 34 | 34 | 0.7 | 1 | 19 | 119 |
| HK | 30 | 30 | 1.5 | 1 | 16 | 408 |
| SG | 38 | 38 | 1.5 | 1 | 20 | 70 |
| JP | 30 | 30 | 1.5 | 1 | 23 | 370 |
| US | 38 | 38 | 1.2 | 1 | 30 | 8 |
| KR | 34 | 34 | 0.7 | 1 | 23 | 7 |
| MY | 38 | 38 | 2.0 | 1 | 17 | 128 |

**TW search feed（`q=健康`）：** 102 則、`oldestAgeDays 30.4`、**51 家媒體**。
**速率：** 同一 feed 連打 5 次 → `[200,200,200,200,200]`。

### 0-2 Yahoo

| region | path | status | items | outletFromSource |
|---|---|---:|---:|---:|
| TW | `tw.news.yahoo.com/rss/` | 200 | 100 | 0 |
| TW | `tw.news.yahoo.com/rss/health` | 200 | 30 | 0 |
| HK | `hk.news.yahoo.com/rss/` | 200 | 100 | 0 |
| SG | `sg.news.yahoo.com/rss/` | 200 | **5** | 2 |
| JP | `news.yahoo.co.jp/rss/topics/top-picks.xml` | 200 | **8** | 0 |
| US | `www.yahoo.com/news/rss` | **403** | — | — |

### 0-3／0-6／0-7／0-8 profile actor

discovery：`requested 100` → `rawItems 300`（×3 再次確認）、`distinctAuthors 216`、`postsMissingId 0`。

| rank | profile | posts | viewsCoverage | medianViews | spanDays | ageP50 | staysOnProfile | flagKeys |
|---:|---|---:|---:|---:|---:|---:|---|---|
| 1 | aapolxmo | 30 | 1.0 | 1,577 | 231.9 | 39.1 | ✅ | — |
| 2 | aze.sg | 30 | 1.0 | 30,800 | 70.1 | 42.2 | ✅ | — |
| 3 | okxhtx | 30 | 1.0 | 156 | 61.1 | 0.1 | ✅ | — |
| 4 | karlenegilmore0 | 23 | 1.0 | 8,549 | 173.0 | 224.5 | ✅ | — |
| 5 | __lee1003 | 30 | 1.0 | 7,141 | 297.0 | 17.3 | ✅ | — |

`fellBackToMinimal: false`——完整輸入（含 `profileScrapeSections` / `profileSorting`）全部被接受。

0-7 的 `medianViewsInSample` 對 `upstreamRank`（前 20 名節錄）：

```
rank  1: 624        rank  8: 20         rank 15: 34
rank  2: 642,200    rank  9: 132,400    rank 16: 1,507
rank  3: 95,600     rank 10: 2,320      rank 17: 242,850
rank  4: 1,200,000  rank 11: 722        rank 18: 98
rank  5: 72,500     rank 12: 59,300     rank 19: 5,093
rank  6: 104,300    rank 13: 19         rank 20: 670
rank  7: 37,146     rank 14: 5,048
```

### 0-9 重跑穩定度

```
runA  rawItems 300  distinctAuthors 224  ids 300  missingId 0
runB  rawItems 300  distinctAuthors 218  ids 300  missingId 0

貼文  sizeA 273  sizeB 267  overlap 130  jaccard 0.317  recallOfA 0.476
作者  sizeA 224  sizeB 218  overlap 109  jaccard 0.327  recallOfA 0.487
```

### 0-10 成本

```
authorsFetched 5  perAuthorMs 21,642  projectedMinutesFor(100) 36.1
```

---

## §3 判讀

### 3.1 新聞：主題 feed 撐不起 Track B，search feed 可以

TW 主題 feed 34 則、觸及 **0.7 天**；TW search feed 102 則、觸及 **30.4 天**、51 家媒體。差了三十倍。

主題 feed 是「今天的頭條」。它撐不起 `newsWindowDays = 7` 的視窗，更撐不起縱斷面基準。

**→ Track B 走 `rss/search` + `persona-directions.json` 的 `newsQueries`，不走主題 feed。** 30 天的觸及對 7 天視窗綽綽有餘，也留得下累積歷史的空間。

### 3.2 `outletCount` 一定要從 `<source url>` 取

七區的 `outletCountFromLink` 全部是 **1**——Google 的 `<link>` 是 `news.google.com` 轉址。真正的媒體在 `<source url="…">`，那裡是 16–51 家。

`docs/14` §4.4-3 的「以媒體網域去重」從「應該這樣做」變成「不這樣做就是錯的」：只看 `<link>`，每一區的媒體覆蓋度都會是 1。

### 3.3 Yahoo 是「一家媒體」，不是聚合來源

所有 Yahoo feed 的 `outletCountFromSourceTag` 都是 0，連結全落在 Yahoo 自己的網域（`tw.news` / `tw.stock` / `tw.sports`）。

**→ Yahoo 不能貢獻媒體多樣性。** 100 則 Yahoo 文章是 1 家媒體，不是 100 家。把它併進 `outletCount` 會虛報覆蓋度。

它的價值是另一種東西：**「Yahoo 自己選了什麼」是一個獨立於 Google 的編輯訊號**。兩者要分開計，不能相加。

US 的 403 與 SG／JP 的稀薄代表 Yahoo 軌**只在 TW／HK 成立**。

### 3.4 0-3 通過——主判準站得住

五個帳號全部：`viewsCoverage 1.0`、`staysOnProfile true`、`posts 23–30`（全部高於 `minBaselineVideos = 8`）。

而且 `medianViews` 橫跨 **156 到 30,800**——正好證明頻道相對是對的選擇。用全域平均比，`okxhtx`（中位 156）的每一支影片都會被判成失敗，而 `aze.sg`（中位 30,800）的每一支都會被判成成功。那量到的是頻道規模，不是題目。

### 3.5 0-6：基準是「最近 N 篇」，不是「最近 180 天」

五個帳號的 `spanDays`：231.9 / 70.1 / 61.1 / 173.0 / 297.0。

同樣要 30 篇，發文頻繁的帳號（`okxhtx`，本月 28 篇）只覆蓋 61 天；發文稀疏的（`__lee1003`）覆蓋 297 天。

**所以 `baselineLookbackDays = 180` 描述的不是實際發生的事。** 實際發生的是「這個頻道最近 30 篇」。

這反而**更適合**頻道相對中位數——它是該頻道近期行為的固定 N 抽樣，不受發文頻率影響。但規格必須改口徑：常數要從「回看幾天」改成「回看幾篇」，否則文件說的和程式做的又對不上（這正是 `growth7d` 其實是 48 小時的那一類錯）。

### 3.6 0-7：上游不是 popularity 排序

`medianViewsInSample` 對 `upstreamRank` 沒有任何單調趨勢：rank 4 是 120 萬，rank 8 是 20，rank 13 是 19，rank 17 是 24 萬。

**→ 取前 N 個作者不會系統性地取到最大的那些。** `docs/14` §8.2.1 擔心的截斷偏誤比預期輕。

但帳目仍然要記——「這一次不是 popularity 排序」不等於「永遠不是」，actor 換版本就可能變。

### 3.7 0-8：本批沒遇到，無法判定

`flaggedItems` 全部是 0、`flagKeys` 全空。五個帳號都是公開且正常的。

**這不是「actor 不標記」，是「這批沒有可標記的」。** 誠實的答案是未觀測到。要判定得刻意找一個已知的私人／已刪除帳號來打，這一輪沒做。

### 3.8 0-9：一半的樣本會換掉——這一輪最重的發現

兩次背對背、參數完全相同的查詢：

- 貼文 `recallOfA 0.476`
- 作者 `recallOfA 0.487`

兩次相隔幾十秒，所以**這不是世界變了，是抽樣變了**。

依判準落在 ⚠️（0.3–0.7）。實際意義：

> **一次掃描是一個大池子的一份抽樣，不是那個池子。**

三個後果，都要寫進規格：

1. **跨週比較要非常保守。** 某個主題這週有、上週沒有，很可能只是抽樣——在 48% 的重疊率下，這種事會經常發生。單憑「上週沒看到」不能說它是新的。
2. **`channelsAboveCut / channelsRepresented`（單次掃描內的跨頻道重現）比跨週比較可靠。** 它在同一份抽樣內比較，不受兩次抽樣的差異影響。這強化了 `docs/14` §3.5 已經選的主判準。
3. **每週兩次的節奏有第二個理由。** 原本只寫「累積週週期給時間序列」。實測顯示它同時在做**覆蓋度累積**——每次掃描看到不同的一半，多次掃描的聯集才逼近母體。這不是缺陷的補償，是這個節奏本來就該有的效果。

另外：單次 300 筆裡有 27 筆重複 id（`sizeA 273`）。去重是必要的。

### 3.9 0-10：36 分鐘，所以不能是單一請求

`perAuthorMs 21,642` × 100 = **36.1 分鐘**。

判準預先寫的是「超過 30 分鐘就必須是分階段 durable job」。結果落在該邊——**`docs/14` §1.5 的設計是必要的，不是預防性的**。

也代表 `maxChannelFetches` 必須真的設一個值。若一次掃描要對 100 個作者建基準，那是 36 分鐘的背景工作，中間任何一次 Railway redeploy 都會打斷它。

---

## §4 對規格的影響

| # | 影響 |
|---|---|
| 1 | **Track B 改走 `rss/search`**，主題 feed 只當備援。`newsQueries` 從設定資料升格為必要輸入 |
| 2 | **`outletCount` 必須從 `<source url>` 取**，不能從 `<link>` |
| 3 | **Yahoo 與 Google 分開計**，Yahoo 是單一媒體的編輯訊號；Yahoo 軌只在 TW／HK 成立 |
| 4 | **`baselineLookbackDays` 改為 `baselineRecentPosts`**（回看幾篇，不是幾天） |
| 5 | **`maxChannelFetches` 要真的設值**；36 分鐘的投影讓 §1.5 的 durable runner 從「該做」變成「非做不可」 |
| 6 | **新增偏誤：單次掃描抽樣不穩定（~48% churn）**。跨週差異不得逕自解讀為真實變化 |
| 7 | **每週兩次的第二個理由寫進 §1.1**：覆蓋度累積，不只時間序列 |
| 8 | **0-8 標為未觀測**，不是通過也不是失敗 |

---

## §5 這次不宣稱的事

- **actor 部分只跑 TW**，其他地區的種子詞不同，不外推。
- **profile 只抓了 5 個帳號**，而且是照 actor 順序取的前 5 個（刻意，見 0-7）。五個帳號不足以描述母體。
- **0-9 只跑了一組對照**。48% 是一次觀測，不是穩定估計。
- **成本只有耗時。** 實際 Apify 計費要看 console，這裡拿不到。
- **0-8 未觀測**，見 §3.7。
- **新聞只驗這一次的可用性**，不宣稱長期穩定；Google 的速率限制只測了連續 5 次。
