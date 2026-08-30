# 01 · 兩個平台實際怎麼決定「誰被看到」

先講白話：**「被看到」不是一件事，是三件不同的事**，各自由不同的機制決定。混在一起想，就會做出無效的動作。

1. **你的回覆在那個討論串裡排第幾** —— 決定有多少原本就在看那個串的人會滑到你。
2. **你自己的貼文有沒有被推給不追蹤你的人** —— 這跟那個討論串沒有關係，是另一套系統。
3. **看到你的人會不會點進你的個人頁** —— 這一段幾乎完全由你自己控制，卻最常被忽略。

「劫持流量」只發生在第 1 段。第 3 段才是它真正能換到東西的地方。

---

## 1. X：排序系統的公開結構

X 在 2023 年 3 月把推薦演算法開源，程式庫仍在線上。

→ [github.com/twitter/the-algorithm](https://github.com/twitter/the-algorithm)

### 1.1 首頁時間軸的候選來源

README 描述的流程是三段：**候選抓取（Candidate Sourcing）→ 排序（Light Ranker + Heavy Ranker）→ 混合與過濾（Mixing & Filtering）**。

候選分成兩類：
- **In-Network**（你追蹤的人）：README 寫「~50% of posts come from this candidate source」，由 `search-index` 提供。
- **Out-of-Network**（你沒追蹤的人）：由 `tweet-mixer`、`user-tweet-entity-graph`（UTEG）、`follow-recommendation-service`（FRS）提供，剩下約 50%。

支撐 out-of-network 的模型：
- `SimClusters` —— README 描述為「Community detection and sparse embeddings into those communities」。白話：系統會先把每個帳號歸到一個或多個「社群」裡，再用社群相似度去找內容。
- `TwHIN` —— 使用者與貼文的稠密向量表示。
- `RealGraph` —— 「Model to predict the likelihood of an X User interacting with another User」。
- `GraphJet` —— UTEG 等服務的底層圖引擎。

> **對本研究的意義：**
> `SimClusters` 這一條是新帳號最重要的一件事。系統要能把你推給陌生人，前提是它**先能把你歸進某個社群**。
> 一個什麼題目都碰的新帳號，在這個結構下不是「涵蓋比較廣」，是「歸不進任何一群」，因此拿不到 out-of-network 的位置。
> 這直接推出後面 `03-playbook.md` 的第一條規劃原則：**一個帳號一個題目領域**，而且理由是機制上的，不是品味上的。

### 1.2 排序後還有一層硬規則

`home-mixer` 的 README 列出排序完成後仍會套用的啟發式規則：

- **Author Diversity** —— 壓低單一作者連續佔版面。
- **Content Balance** —— 維持 in-network 與 out-of-network 的比例。
- **Feedback fatigue** —— 降低重複類型內容的重複曝光。
- **Deduplication / previously seen Tweets removal**。
- **Visibility Filtering** —— 封鎖、靜音、NSFW 設定等。

→ [github.com/twitter/the-algorithm/tree/main/home-mixer](https://github.com/twitter/the-algorithm/tree/main/home-mixer)

> **對本研究的意義：** Author Diversity 與 Feedback fatigue 表示「同一個帳號用同一種形狀狂發」會被系統自己壓下去，不需要別人檢舉。這是「量」策略在 X 上失效的機制性理由。

### 1.3 這份程式碼的時效限制（重要）

這是 **2023 年 3 月的快照**。X 之後公開表示排序模型已經更換。所以：
- 上面的**結構**（分兩類候選、兩段排序、排序後過濾）可以當作理解框架。
- 上面的**權重**不能當作現況。網路上流傳的權重表為什麼不採用，見 `99-unverified.md`。
- 更關鍵的是：**這份程式碼講的是首頁時間軸（Home Timeline），不是討論串內的回覆排序。** X 沒有開源回覆排序。我們對第 1 段（回覆排第幾）唯一的官方資訊，是下一節。

---

## 2. X：回覆的位置，X 自己承認可以買

X 在 X Premium 的官方說明頁裡，把「reply prioritization」列為訂閱功能，而且分三個等級：

- **Basic**：「essential Premium features like editing posts, longer posts and longer video uploads, **reply prioritization**…」
- **Premium**：「…**larger reply prioritization**…」
- **Premium+**：「…**largest reply prioritization**…」

X 對這個功能的解釋原文：

> 「We strive to show you the content that we think you'd be most interested in and contributes to the conversation in a meaningful way, such as content that is relevant, credible, and safe. Now, people on X will see a **slight preference for replies from verified accounts** over other replies. We're **currently testing the levels** at which we prioritize content from Premium subscribers relative to the other factors we consider in conversation rankings.」

→ 來源：X 官方說明頁 About X Premium，經存檔取得（`help.x.com` 對自動抓取回 403）
　[archive.ph/AqTHt](https://archive.ph/AqTHt)（2025-03 存檔）｜[archive.ph/5A4Hm](https://archive.ph/5A4Hm)（2023-12 存檔）
→ 早期報導佐證：[The Verge, 2022-12-23](https://www.theverge.com/2022/12/23/23523845/twitter-blue-paying-priority-replies-conversations)

> **對本研究的意義：這是整份研究裡最直接可執行的一條。**
> 「在別人的大串裡拿到看得見的位置」，在 X 上是**唯一有官方文件、可以合法用錢買的變因**。它不是操縱，它是平台自己賣的功能。
> 但要誠實看兩件事：X 自己的用詞是「slight preference（輕微偏好）」，而且「currently testing the levels（幅度還在測）」。所以它是**加分項，不是決定項**——回覆本身沒東西，買到前排也只是被更多人看到你沒東西。

---

## 3. Threads：回覆是一等公民，這是它的設計前提

Threads 負責人 Adam Mosseri 對成長方式的直接陳述：

> 「My advice is — and I think what a lot of people don't realize… they don't realize how important the reply game is. **If you're really trying to grow your presence, you should reply much more than you post. And the sum of all your replies is about as valuable as the sum of all the value of all your posts.**」
>
> 「…we built it so that **the reply was as important as the original post** — so that you could facilitate, when you're lucky, these great conversations, **which by the way helps with discovery**.」

→ [Platformer 專訪，2024-07-03](https://www.platformer.news/threads-175-million-users-adam-mosseri-interview/)

> **對本研究的意義：** 這是兩個平台之間最大的結構差異。
> 在 X，回覆基本上是「借別人的版面站一下」；在 Threads，平台負責人親口說回覆的總價值約等於貼文的總價值，而且說回覆有助於 discovery。
> 所以**如果只能選一個平台先做，選 Threads**——不是因為它人多，是因為它的設計把我們要做的動作放在中心，而不是邊緣。
> 但要注意本研究查不到的部分：Meta **沒有**公開文件說明「回覆會不會單獨出現在 For You feed」。Mosseri 只說 helps with discovery。這一條列在 `99-unverified.md`。

## 4. Threads：tag 只能放一個，這是刻意設計

Threads 的 topic tag 規則（Instagram 官方說明中心）：

> 「Tagging a topic in your post allows others on Threads to discover your post and other posts associated with that topic in real time. **You can include up to one topic per post.**」
> tag「Can be up to 50 characters long. May contain spaces and other special characters. Doesn't need to include the # symbol」，且點擊 tag 會進到該 topic 的搜尋結果頁。

→ [Instagram 說明中心：Tag a topic in your post on Threads](https://www.facebook.com/help/instagram/1356090605000312)

Mosseri 說明這個設計的意圖：

> 「With tags we're trying something simple and slightly new. No # marks, support for multiple words, **only one tag per post**, and the tag view *is* the search view. The hope is this design **focuses tags more on communities and less on engagement hacking**…」

→ [@mosseri 的 Threads 貼文](https://www.threads.com/@mosseri/post/C0j7sSWvXTF)

Meta 對 tag 效果的自陳（2025-03 官方新聞稿）：

> 「According to our internal data, **posts with tagged topics generally receive more views than those without one**, making them an effective way to help you reach more people.」
> 同一篇也說明：撰寫貼文時會出現「suggested trending topic」提示；trending topics 起初只在美國與日本，之後擴張。

→ [about.fb.com，2025-03-20](https://about.fb.com/news/2025/03/new-threads-features-more-personalized-experience-you-control/)

> **對本研究的意義：**
> 一則只能一個 tag，等於 Threads 從產品層直接封死了「堆一排 hashtag 蹭流量」這個做法。剩下的操作空間是**選對那唯一的一個**。
> 而且 Meta 自己說有 tag 的貼文 views 較高——這是少數有官方數據支持、成本為零、風險為零的動作。**該做。**

## 5. Threads API：能發多少、能量到什麼

官方文件的發布額度（每 24 小時）：

| 動作 | 額度 |
|---|---|
| 發文 | 250 |
| 回覆 | 1000 |
| 刪除 | 100 |
| 地點搜尋 | 500 |

可用 `threads_publishing_limit` 端點查目前用量。
→ [Threads API Troubleshooting](https://developers.facebook.com/docs/threads/troubleshooting)

可取得的成效數據：
- **單則貼文層級**：views、likes、replies、reposts、quotes、shares。文件明說「Returned metrics do not capture nested replies' metrics」。
- **帳號層級**：views（時間序列）、likes、replies、reposts、quotes、**clicks**、followers_count、follower_demographics（需 ≥100 追蹤者）。
- 資料最早只到 2024-04-13。
→ [Threads API Insights](https://developers.facebook.com/docs/threads/insights)

> **對本研究的意義（這是一個壞消息，要先講）：**
> Threads API **沒有**提供「這一則回覆帶來多少 profile click」。帳號層級有 `clicks`，但那是連結點擊的總數，不是某則回覆的貢獻。
> 所以整條路徑裡「回覆 → 個人頁」這一段，在資料上是黑箱。我們只能用時間相關性去推估。
> 對照本 repo 既有的歸因階梯（`direct` → `modeled` → `unknown`）：**這一段永遠只能記成 `modeled`，不能記成 `direct`。** 這條限制要寫進系統，不是寫進備忘錄。
>
> 另外，1000 則回覆／24 小時是**技術上限，不是安全上限**。用到接近這個數字必然觸發 `02` 裡的 spam 條款。把它當成 API 的物理極限看待，不是操作目標。
