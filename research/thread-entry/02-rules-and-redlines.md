# 02 · 明文禁止的行為

這一份不是「建議」，是**兩個平台自己寫下來、違反了會被降觸及或停權的條文**。策略的形狀由它決定，所以放在 playbook 前面。

先給結論表——「劫持流量」最直覺的六個動作，五個是明文違規：

| 直覺動作 | 判定 | 依據 |
|---|---|---|
| 在很紅的串下面貼一則跟原題無關的內容來曝光 | ❌ **明文違規** | X 平台操縱政策 |
| 回覆裡放連結導流 | ❌ **明文違規**（當它構成你活動的主體時） | X 平台操縱政策 |
| 同一句話複製到很多串下面 | ❌ **明文違規**（Copypasta） | X 平台操縱政策 |
| 掛一排熱門 hashtag 蹭曝光 | ❌ **明文違規**；Threads 產品層也只給一個 tag | X 平台操縱政策 ＋ Threads tag 規則 |
| 寫「同意的按讚」「留言 +1」 | ❌ **不推薦內容**（engagement bait） | Meta 內容分發準則 |
| 搬別人的迷因圖來發 | ⚠️ **降觸及**（unoriginal content） | Meta 2025-07 公告（目前公告範圍是 Facebook） |
| 在原題目裡，用自己的話把事情講清楚 | ✅ 合規 | —— |

---

## 1. X：平台操縱與垃圾訊息政策

政策定義：

> 「You may not use X's services in a manner intended to artificially amplify or suppress information or engage in behavior that manipulates or disrupts people's experience or platform manipulation defenses on X.」
> 「We define platform manipulation as using X to engage in **bulk, aggressive, or deceptive activity** that misleads others and/or disrupts their experience.」

政策開頭列舉的違規型態中，第一條就直接命中我們的使用情境：

> 「**commercially-motivated spam, that typically aims to drive traffic or attention from a conversation on X to accounts, websites, products, services, or initiatives**」

→ 來源：X 官方政策頁，經存檔取得（`help.x.com` 對自動抓取與 Exa 皆回 403 / SOURCE_NOT_AVAILABLE）
　[archive.ph/Ga9ef](https://archive.ph/Ga9ef)（2025-01 存檔）
　[OpenTermsArchive 版本紀錄](https://github.com/OpenTermsArchive/contrib-versions/commit/64c0e5b0f5812f8a641bd45d688c12b630f9d1fa)
　[changewatch.co.uk 歷史版本](https://changewatch.co.uk/twitter/platform-manipulation-and-spam-policy/2023-08-04/)

### 1.1 內容垃圾訊息（Content Spam）—— 逐條

政策原文列出的禁止行為（節錄與本研究相關者）：

- 「Sending **bulk, aggressive, high-volume unsolicited replies**, mentions, or direct messages」
- 「using **trending or popular hashtags with an intent to subvert or manipulate a conversation** or to drive traffic or attention to accounts, websites, products, services, or initiatives」
- 「posting with **excessive, unrelated hashtags** in a single post or across multiple posts」
- 「repeatedly posting or sending direct messages **consisting of links shared without commentary**, so that this comprises the bulk of your post/direct message activity」
- 「**promoting content by replying with content that is irrelevant to the topic of the original post**」
- 「posting and deleting the same content repeatedly」
- 「repeatedly posting **identical or nearly identical posts** in a duplicative manner popularly known as "**Copypasta**"」

> **「promoting content by replying with content that is irrelevant to the topic of the original post」這一條，就是「劫持流量」這個念頭最原始版本的白紙黑字禁令。**
>
> 白話：**你可以進別人的串，但你必須是在講那個串在講的事。** 不是在那裡講你的事。
> 這條界線非常清楚，而且是可判定的——不是模糊地帶，是有無之分。
> 好消息是：這條線並沒有禁掉我們真正想做的事。我們的方法論本來就是「針對這則事件給出一個完整論述」（見 `dashboard/server/growth/narrative.js` 的 `framework` 敘事形狀）。**題目相關，本來就是我們內容的前提。**

### 1.2 互動垃圾訊息（Engagement Spam）

- 「engaging in **indiscriminate following** – following and/or unfollowing a large number of unrelated accounts in a short time period, particularly by automated means」
- 「engaging with posts **aggressively or through the use of automation** to drive traffic or attention to accounts, websites, products, services, or initiatives」
- 「follow churn」、「duplicating another account's followers, particularly using automation」

### 1.3 多帳號協同

- 「**overlapping accounts** – operating multiple accounts with overlapping use cases, such as identical or similar personas or substantially similar content」
- 「**mutually interacting accounts** – operating multiple accounts that interact with one another in order to inflate or manipulate the prominence of specific posts or accounts」
- 「**coordination** – creating multiple accounts to post duplicative content or create fake engagement」
- 「coordinating with or **compensating others** to engage in artificial engagement or amplification, **even if the people involved use only one account**」

政策同時說明帳號數量上限：X「allows users to create and/or operate up to ten (10) accounts for **different, non-duplicative purposes**」。

> **對本 repo 的意義：** 這幾條和 `ROADMAP.md` Epic 8 的明文非目標完全一致（不做假互動、不做協同造假）。研究不改變這個立場，只是把它從「我們的原則」升級成「平台的規則」——現在它有第二個理由。

### 1.4 處分階梯

> 「If the platform manipulation or spam offense is an isolated incident or first offense, we may take a number of actions ranging from requiring deletion of one or more posts to temporarily locking account(s). **Any subsequent platform manipulation offenses will result in permanent suspension.**」
> 嚴重違規（例如買賣帳號）**第一次偵測到即永久停權**。

> **這對新帳號特別要命。** 老帳號違規一次是損失，新帳號違規一次可能就是整個資產歸零，而且沒有申訴籌碼。
> 所以新帳號階段的正確心態不是「試探邊界在哪」，是**離邊界遠一點**。

### 1.5 其他相關 X 政策

由 X 提交給美國州檢察長的法遵報告可交叉確認以下政策存在與其措辭：

- **Misleading and Deceptive Identities**：「You may not impersonate individuals, groups, or organizations to mislead, confuse, or deceive others, nor use a fake identity in a manner that disrupts the experience of others on X.」
- **Synthetic and Manipulated Media**：「You may not deceptively share synthetic or manipulated media that are likely to cause harm. In addition, **we may label posts containing synthetic and manipulated media**.」

→ [X Corp. — H1 2025 California TOS Report](https://oag.ca.gov/sites/default/files/X%20Corp.%20%E2%80%94%20H1%202025%20California%20TOS%20Report.pdf/X%20Corp.%20%E2%80%94%20H1%202025%20California%20TOS%20Report.pdf)
→ [X Corp. — Q3 2025 New York TOS Report](https://ag.ny.gov/sites/default/files/social-media-policy-report/2025-q3-x-corp-policy.pdf)

> **對迷因素材的意義：** X 的合成媒體條款門檻是「deceptively… likely to cause harm」。
> 一張明顯是玩笑的圖不會踩到；**一張做成「某人真的發過這則貼文」樣子的假截圖會**。這是製作素材時唯一要嚴守的線。

---

## 2. Meta（Instagram / Threads）：不推薦內容與內容分發準則

### 2.1 推薦準則的標準高於社群守則

> 「Our Recommendations Guidelines are designed to **maintain a higher standard than our Community Standards**, because recommended content and connections are from accounts that you haven't chosen to follow. Therefore, **not all content allowed on our platform will be eligible for recommendation.**」

→ [Recommendations on Instagram（Instagram 說明中心）](https://www.facebook.com/help/313829416281232)
→ [What are recommendations on Facebook?](https://en-gb.facebook.com/help/1257205004624246)（Instagram 適用一組類似準則）

白話：**「沒有被刪掉」不等於「會被推薦」。** 對一個沒有追蹤者的新帳號來說，不被推薦 ≈ 不存在。所以我們該對齊的標準是推薦準則，不是社群守則。

不被推薦的內容類別中，與本研究相關的是：

- 「Content that users broadly tell us they dislike, such as… **clickbait, engagement bait**, or which promotes a contest or giveaway」
- 「Content that includes **links to low-quality or deceptive landing pages or domains**」
- 「Content that is associated with **low-quality publishing**」
- 「False or misleading content」

帳號層級的後果：

> 「if you **repeatedly** post content that goes against our Recommendation Guidelines or have something in your profile (like your profile photo or bio) that goes against our Recommendation Guidelines, **your entire account may become ineligible for recommendation, and none of your content will be recommended for a period of time.**」

→ [Recommendations on Instagram: What Creators Need to Know](https://creators.instagram.com/blog/instagram-recommendations-eligibility-tips-creators)

> **注意「profile photo or bio」這一句。** 個人頁不只是轉換頁，它本身會影響整個帳號能不能被推薦。這是為什麼 `03-playbook.md` 把個人頁放在第一步做完，而不是最後補。

### 2.2 Engagement bait 的定義

Meta 的定義原文：

> 「Posts that **explicitly request engagement** (such as votes, shares, comments, tags, likes or other reactions) **for purposes other than a specific call to action**」（例外如協尋、募款、連署）
> 理由：「people dislike spammy posts… that ask them to interact by liking, sharing, commenting and taking other actions on posts.」

→ [Meta Transparency Centre — Engagement bait](https://transparency.meta.com/en-gb/features/approach-to-ranking/content-distribution-guidelines/engagement-bait)

> **對文案的意義：** 「同意的請按讚」「你覺得呢？留言告訴我」這類收尾句，在 Meta 的定義下是明確的降觸及訊號。
> 這跟很多社群操作教學講的完全相反。我們的收尾要收在**一個觀念**，不是收在**一個要求**。（現有 `framework` 敘事形狀的第三拍已經是這樣寫的，方向一致。）

### 2.3 非原創內容（unoriginal content）

Meta 2025-07-14 公告：

> 「Unoriginal content **reuses or repurposes another creator's content repeatedly without crediting them**… What we want to combat is the repeated reposting of content from other creators without permission or meaningful enhancements.」
> 「Accounts that improperly reuse someone else's videos, photos or text posts repeatedly will not only **lose access to Facebook monetisation programmes** for a period of time, but will also **receive reduced distribution on everything that they share**.」
> 「These enhancements must be meaningful – **simply stitching together clips or adding your watermark does not qualify as meaningful enhancement**.」
> 同一篇提到 2025 上半年已對約 50 萬個涉及垃圾行為或假互動的帳號採取行動，並移除約 1000 萬個冒充內容產製者的個人檔案。

→ [Combating unoriginal content（Facebook for Creators，2025-07-14）](https://creators.facebook.com/blog/combating-unoriginal-content/)

**範圍限定（要誠實）：** 這篇公告寫的是 Facebook。Meta **沒有**在該公告說明它同時適用於 Threads。但同一集團的推薦準則已經把「low-quality publishing」列為不推薦，且 Instagram 早前已將轉貼型聚合帳號移出推薦。方向一致，範圍不確定——列入 `99-unverified.md`。

> **對迷因素材的直接意義：** 「去網路上找一張現成的迷因圖來貼」這個做法，是這條規則正對著打的東西。
> 而且第三方浮水印是被點名的負面訊號。**要用迷因，就得是我們自己做的迷因。**

### 2.4 AI 生成素材會被自動標記

Meta 2024-02 公告：

> Meta 正在建置可大規模辨識隱形標記的工具，具體是「the "AI generated" information in the **C2PA** and **IPTC** technical standards」，用以在 Facebook、Instagram 與 Threads 上標記 AI 生成圖片。
> Meta「require people to use this disclosure and label tool when they post organic content with a photorealistic video or realistic-sounding audio that was digitally created or altered」，且「**we may apply penalties if they fail to do so**」。

→ [Labeling AI-Generated Images on Facebook, Instagram and Threads（about.fb.com, 2024-02）](https://about.fb.com/news/2024/02/labeling-ai-generated-images-on-facebook-instagram-and-threads/)
→ [IPTC 對此的說明](https://iptc.org/news/meta-announces-support-for-iptc-metadata-in-generative-ai-images/)

> **這是第 4 個問題（對素材製作的影響）最重要的一條事實。**
> 我們的 Growth OS 是 AIGC 系統。如果用主流生圖工具產出迷因圖，圖檔裡會帶 C2PA / IPTC 標記，Meta 會自動掛上「AI info」標籤。
> 這**不是違規**，不會被刪，但它會改變讀者看到的第一印象——一個沒有追蹤者的新帳號 ＋ 一張標著 AI 的圖，可信度是負的。
> 所以這條不是合規問題，是**策略問題**：見 `03-playbook.md` 的素材排序。
