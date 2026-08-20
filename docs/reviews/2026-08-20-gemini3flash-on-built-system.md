# gemini-3-flash-preview 對「已上線系統」的 Review

**審查標的：** `docs/09` 規格 + `match.js` / `evaluation.js` / `apify.js` / `text.js` 實作 + 一份實際 KOL 資料檔
**日期：** 2026-08-20

## 規格與實作的落差

根據規格文件（docs/09）與實際程式碼的對照，該系統在執行面上存在以下不一致之處：

1. **違反「無 `why` 不計算」原則（§0 原則二 vs `match.js`）**
規格明確要求 `topic_affinity.json` 中若分數沒有附帶 `why` 敘述應視為未定義且不可進入計算，但 `personaFit` 函式僅讀取 `score` 欄位並在缺失時直接預設為 `0`。程式碼完全未對 `why` 屬性進行驗證，導致這條「可執行規格」的約束在實作中失效。

2. **軸需求預設值邏輯錯誤（§1.2 vs `match.js`）**
規格指定話題軸需求優先序為「領域預設」後「手動覆寫」，但 `personaFit` 內部對缺失軸直接 hardcode `?? 50` 作為 fallback。這導致若手動設定只提供部分軸（如單一覆寫 `story`），其餘軸會被強制設為 50，而非回退到領域預設值，這與規格要求的優先序衝突。

3. **其餘計分與文字處理邏輯一致（§3, §4 與 `text.js`, `match.js`）**
其餘核心邏輯如 `personaFit` 的達成率公式、`pillarFit` 的關鍵字權重下限（0.7）、`text.js` 的 CJK 二元字組（bigram）切分與簡繁轉換，以及後評評估的目標對照歸因，皆與規格敘述與公式完全吻合。

## 程式的正確性問題

這是我對目前系統程式碼的審查意見，針對可能導致系統崩潰或邏輯錯誤的具體位置：

1. **`text.js` 的 `containsKeyword` 函式存在正則表達式注入漏洞**
   該函式直接將 `keyword` 字串傳入 `new RegExp` 而未經過轉義（Escape）。若 `topic_affinity.json` 中的 `pillar_keywords` 或紅線關鍵字包含正則表達式特殊字元（如 `[`、`(` 或 `*`），系統將拋出 `SyntaxError` 並導致該次 Match 計算或整個 Request 崩潰。

2. **`index.js` 的 `normalize` 函式在大數據量下會引發堆疊溢位**
   該函式使用 `Math.max(...finite)` 展開運算子處理話題數值。當 Apify 抓回的話題數量過多（超過數千筆時），將觸發 Node.js 的 `RangeError: Maximum call stack size exceeded` 導致程序異常終止。

3. **`index.js` 的 `mergeByTag` 存在統計邏輯錯誤**
   在合併跨平台話題時，直接將 `growth7d` 與 `engagementRate` 取算術平均值。這無視了不同平台間 `postCount` 或 `volume` 的量體差異，應改用加權平均，否則會導致最終的 `topicHeat` 排序嚴重偏離真實熱度。

4. **`apify.js` 的 `toPost` 函式缺乏對實例 `item` 的空值檢查**
   在各平台的 `map` 處理中，直接存取 `item.caption` 或 `item.text` 等屬性。若 Apify 回傳的 Dataset 中包含 `null` 項目，程式會因嘗試讀取 null 的屬性而立即拋錯（TypeError），中斷整個話題抓取流程。

5. **`evaluation.js` 的 `buildPreEvaluation` 參數設計與實際調用不一致**
   該函式接收 `topics` 為陣列並執行 `.map()`，但系統核心邏輯 `matchKolToTopic` 是針對單一話題進行配對快照。若傳入的是非陣列物件（例如單一 topic 物件），系統會崩潰；若陣列為空，則產生的決策狀態（Decision）將因缺乏資料而失效。

## Apify 聚合方法論是否站得住腳

1. `REGION_SEEDS` 採用的種子詞（如 #taiwan, #hongkong）過於寬泛且帶有強烈地理屬性，導致抓取結果會被旅遊、風景等長效標籤統治，無法捕捉即時的「社會熱點」或「爆紅事件」。
2. `fetchRegionTopics` 每次請求的樣本量（約 300 則）對地區趨勢而言極小，統計上無法代表平台真實現狀，極易受到少數幾個高頻發文帳號的標籤偏好干擾而產生嚴重偏差。
3. `volume` 以樣本內的不重複帳號數作為熱度代理指標，在小樣本下反映的是「抓取到的帳號多樣性」而非「平台級量體」，以此作為 §3.4 權重會誤導選題決策。
4. `growth7d` 實質為「48 小時內新鮮度」而非「成長趨勢」；這會導致僅出現兩次且剛好都在近期的冷門標籤獲得 100% 滿分成長率，將雜訊排在真正有量體的熱題之前。
5. `aggregatePostsToTopics` 雖然排除了種子字，但未能處理「話題偏移」問題，當爬蟲抓到一位剛去完日本的台灣 KOL 時，#新加坡 地區榜首可能會出現 #北海道，導致地區篩選失去實質意義。

## 總評與優先修補順序

(1) 如果我只能修三件事，是哪三件？

1.  **擴充 `apify.js` 的 `REGION_SEEDS` 與採樣邏輯**：目前各地區僅靠 2-3 個種子字抓取，導致 `aggregatePostsToTopics` 產出的 `volume` 只是「極小樣本下的出現頻率」而非真實熱度，會造成嚴重的選題偏誤。
2.  **修正 `match.js` 函式 `pillarFit` 的保底邏輯**：`keywordHit` 直接將分數拉高至 0.7 的作法過於生硬，若 `pillar_keywords` 包含「風險、決定」等泛用詞，會導致所有話題都被誤判為強相關。
3.  **優化 `text.js` 的 `grams` 語義擷取**：僅靠二元字組（bigram）與簡體轉換會損失專業領域（如登山專業術語）的長詞組精確度，建議針對英文術語與專有名詞保留原始分詞。

(2) 一句話總評：
這是一套架構完整的**半成品**，在缺乏真實成效數據校準係數且 Apify 採樣過窄的情況下，產出的 Match 分數僅能參考，不足以支持自動化決策。

---

生成模型：`gemini-3-flash-preview`（AI Token King MCP · chat_completion）｜總 tokens：92019
