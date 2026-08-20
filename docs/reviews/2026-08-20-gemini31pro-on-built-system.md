# gemini-3.1-pro-preview 對「已上線系統」的 Review

**審查標的：** `docs/09` 規格 + `match.js` / `evaluation.js` / `apify.js` / `text.js` 實作 + 一份實際 KOL 資料檔
**日期：** 2026-08-20

## 規格與實作的落差

它不進 Match 公式
        *   Code `match.js`: `matchKolToTopic` ignores `affinity.format_fit`. Matches spec.

    *   **What about `apify.js` exclude logic?**
        *   Code:
            ```javascript
            const exclude = new Set(
              [...seeds.tags, ...seeds.keywords.flatMap((k) => k.split(/\s+/))]
                .map((t) => t.replace(/^#/, '').trim().toLowerCase())
                .filter(Boolean),
            )
            ```
        *   Wait, `REGION_SEEDS.TW` keywords: `['台灣 熱門話題', '台灣 討論']`.
        *   Split by space: `'台灣', '熱門話題', '台灣', '討論'`.
        *   So tags like `#台灣`, `#熱門話題`, `#討論` will be excluded.

## 程式的正確性問題

在審查規格與實際程式碼後，發現以下幾個會導致錯誤或行為異常的具體問題：

1. **多字元英文 Keyword 會發生子字串誤判（破壞 §3.3 詞界比對規格）**
`text.js` 的 `containsKeyword` 中，正則 `/^[a-z0-9]+$/` 會因為遇到空格而回傳 false（例如 sample data 裡的 `"turn back"` 或 `"into thin air"`）。這會導致它退化成沒有詞界檢查的 `hay.includes(k)`，使得 "return background" 這種不相關的字串錯誤命中 "turn back"。

2. **`buildPreEvaluation` 缺乏 `topics` 空值防護**
`evaluation.js` 的 `buildPreEvaluation` 函式簽章中沒有給 `topics` 預設值，且內部直接呼

## Apify 聚合方法論是否站得住腳

這套基於「種子詞搜尋 → 統計共現 hashtag → 計算帳號數與新舊比」的實作，在統計與實務上有以下致命問題：

1. **種子詞完全限制了話題的探索邊界**
`fetchRegionTopics` 依賴 `REGION_SEEDS`（如「台灣」、「台北」）作為搜尋起點，這會產生嚴重的倖存者偏差。真正爆紅但沒有加上地理 tag 的在地話題（例如 #地震、#黑白大廚）根本不會被爬到，這份榜單實際上只是「與台灣一詞共現的標籤榜」，而非真正的地區熱門榜。

2. **300 則樣本數在千萬級平台中毫無統計意義**
程式預設 `limit = 40`，即使放寬到 300 則貼文，在長尾分佈的 hashtag 海中必然導致高度碎片化。這會讓演算法淪為隨機雜訊的放大器，例如 2 個帳號與 3 個帳號提及的些微差異，就能造成排行榜冠亞軍的劇烈變動。

3. **極小樣本下的 `authorCount` 失去鑑別度**
`aggregatePostsToTopics` 用 `authorCount` 取代貼文數來防洗版邏輯正確，但建立在錯誤的樣本量上。在 300 則樣本切分給數百個 tag 後，絕大多數入榜話題的 `authorCount` 都會在 2 到 5 之間，這會產生大量同分死胡同，讓後續的 `topicHeat` 對數標準化失去意義。

4. **`growth7d` 的公式在邏輯上不是成長率**
用 `recentCount / postCount` 來定義 `growth7d` 完全不合理。因為爬蟲拿回的貼文分佈受制於各平台的搜尋預設排序（通常偏向最新），這個比例反映的只是「這批搜尋結果有多新」，而非該話題在全站發布動能的真實斜率變化。

5. **`JUNK_TAGS` 靜態名單無法應付多語系雜訊**
寫死英文為主的無意義標籤過濾，會漏掉各地區特有的流量密碼（如馬來西亞的 #berandafyp 或台灣的 #流量密碼）。在極小的樣本空間下，這些區域型無意義字眼會輕易佔據榜單頭部，把真正帶有題材資訊的 hashtag 擠出結果外。

## 總評與優先修補順序

**(1) 如果只能修三件事，優先順序如下：**

1. **`topicHeat` 演算法整段遺失（`apify.js` / `match.js`）**：規格 §3.4 要求取對數與全集 min-max 標準化，但 `apify.js` 只回傳原始 `volume`，`match.js` 每次只算單一話題無從取得極值；實務上所有話題的熱度都會退化成預設常數 50，權重完全失效。
2. **預評門檻與後評歸因自相矛盾（`evaluation.js`）**：`compare()` 嚴格要求有觀看與點擊

---

生成模型：`gemini-3.1-pro-preview`（AI Token King MCP · chat_completion）｜總 tokens：84926
