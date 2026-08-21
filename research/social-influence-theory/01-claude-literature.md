# 01 · Claude 檢索底稿：社群影響力的評估指標與理論方法

**產出方式：** Claude 真實網路檢索，2026-08-21
**信任等級：** 本檔每一筆引用都附可點開的連結。沒有連結的敘述會明確標示為「背景知識，本次未逐筆查證」。
**用途：** 這是後續四個模型（GPT / Gemini / 千問 / 豆包）的**對照基準**——它們講的東西如果和這裡衝突，以這裡為準；它們講的東西如果這裡沒有，列為待查證線索。

---

## 0. 先界定問題

使用者的問題不是「怎麼做 KOL」，而是三個更難的：

| 代號 | 問題 | 學術上對應的領域 |
|---|---|---|
| **Q1** | KOL 的屬性怎麼被確定？ | 影響力測量（influence measurement）、意見領袖識別 |
| **Q2** | 時事流量怎麼被判定？ | 突發偵測（burst detection）、議題設定、話題生命週期 |
| **Q3** | 什麼創意會產生共鳴／關注／對話？ | 內容擴散（virality）、來源可信度、擬社會互動 |

這三題在文獻上分屬三個幾乎不互相引用的社群：**計算社會科學**（Q1、Q2）、**行銷與消費者行為**（Q3 的前半）、**傳播學**（Q3 的後半）。
這件事本身就是一個發現：**沒有一篇論文同時回答三題**，所以「整合」是我們自己要做的工作，不是可以從文獻抄來的。

---

## 1. Q1 — 影響力怎麼被測量

### 1.1 核心結論：單一指標必然失真（Million Follower Fallacy）

Cha, Haddadi, Benevenuto & Gummadi (2010), *Measuring User Influence in Twitter: The Million Follower Fallacy*, ICWSM.
→ [AAAI 全文](https://ojs.aaai.org/index.php/ICWSM/article/view/14033)｜[PDF](https://snap.stanford.edu/class/cs224w-readings/cha10influence.pdf)

三個指標——**indegree（粉絲數）、retweets（轉發）、mentions（提及）**——彼此相關性很弱。粉絲數高的帳號**不一定**能引發轉發或討論。
論文的白話結論：粉絲數量測的是「被訂閱的程度」，轉發量測的是「內容的擴散力」，提及量測的是「這個人本身的話題性」，**三者是三種不同的東西**，把任何一個叫做「影響力」都是簡化。

進一步的實證：Riquelme 等人與後續一系列比較研究反覆得到同一結果。2024 年一篇跨指標比較研究更明確指出，不同的影響力指標**不具調和性（non-harmonic）且對時間敏感**，各自捕捉到的是不同類型的使用者，因此研究者**必須同時使用一個以上的指標**。
→ [PMC 全文](https://pmc.ncbi.nlm.nih.gov/articles/PMC11580628/)

> **→ 對照現有系統：有支撐（但用法要修正）**
> `docs/09` 目前把 `reach` 當成一個靜態欄位（regions + language），沒有任何影響力量測。
> 文獻的意思不是「要加更多指標」，而是「**不要有單一總分**」。這對我們最直接的衝擊是：`match.js` 產出的那個 0–100 總分，在文獻立場下是有問題的——它把四個不可通約的維度加權成一個數。
> 目前的緩解做法（回傳 `dimensions` 逐維分數 + `rationale` 白話理由）方向正確，但 UI 仍以總分排序。

### 1.2 影響力是「分話題」的，不是全域的

Weng, Lim, Jiang & He (2010), *TwitterRank: Finding Topic-Sensitive Influential Twitterers*, WSDM.
→ [論文](https://www.researchgate.net/publication/221520147_Twitterrank_Finding_Topic-Sensitive_Influential_Twitterers)

TwitterRank 是 PageRank 的延伸，關鍵改動是：**隨機遊走的轉移機率同時考慮連結結構與主題相似度**。
換句話說，一個人「在登山題上的影響力」和「在職場題上的影響力」是兩個數字，不是一個。

> **→ 對照現有系統：有支撐，而且是現有設計最強的理論靠山**
> 這正是 `personaFit()` 用「需求加權達成率」而非「餘弦相似度」的理由：
> 一個 KOL 在某個軸上很強，若該話題不需要那個軸，**不應該得分**。這條設計在 TwitterRank 的立場下是對的。
> `match.js:27-61` 的 `attainment = min(have/demand, 1)` 就是這個想法的實作。

### 1.3 中文文獻：意見領袖識別的指標體系

中文圈（CNKI 一系）對這題的處理方式和英文圈明顯不同：英文圈算圖，中文圈**建指標體系再賦權**。

常見的維度切法有兩種：
- **二維**：影響力 + 活躍度
- **三維**：影響力 + 活躍度 + 認同度

賦權方法上，**熵權法（entropy weighting method）** 是主流——依各指標數值的離散程度自動決定權重，目的是消除人為主觀賦值造成的偏差。
→ [微博意見領袖識別方法整理](https://zhuanlan.zhihu.com/p/38093580)｜[基於觀點挖掘的突發事件微博意見領袖識別方法](https://html.rhhz.net/GDGYDXXB/html/1621904023844-886170678.htm)

⚠️ **檢索限制**：CNKI / 華藝的原文在本次檢索環境下不可達，上述兩筆屬於二次整理與可公開存取的期刊 HTML。**確切的作者、期刊、年份需要在有資料庫權限的環境下補齊。** 這是本報告已知的最大缺口之一。

> **→ 對照現有系統：無支撐 → 這是一個可以馬上補的洞**
> `WEIGHTS = { personaFit: 0.35, pillarFit: 0.3, topicHeat: 0.2, regionFit: 0.15 }`（`match.js:11-16`）
> 這組數字是**我們自己編的**。文獻上有現成、客觀、可辯護的替代方案：**熵權法**——等有足夠筆數的實際成效資料後，由資料本身決定權重。
> 在那之前，這組權重應該被誠實標記為「專家先驗」，而不是被當成校準過的參數。

### 1.4 產業界的做法（非學術，但值得知道）

台灣的 KOL Radar 用四個指標算 PR 值排名：全平台總粉絲數、全平台粉絲成長數、全平台總互動聲量、全平台互動聲量成長數。
→ [2023 台灣百大影響力網紅洞察報告](https://www.kolr.ai/trend-sharing/top100-taiwan-influencers-report-kol-radar/)

值得注意的是產業界自己的結論已經和學術一致：**粉絲數不再是關鍵依據，社群黏著度才是。**
→ [Social Lab 網紅影響力洞察](https://www.social-lab.cc/2023/04/industry-report/)

---

## 2. Q3a — 人設與話題的契合，怎麼被測量

這一段是整個 Dashboard 的核心（`pillarFit` + `personaFit`），也是文獻最扎實的一段。

### 2.1 來源可信度三因子：專業性、可信賴度、吸引力

Ohanian, R. (1990), *Construction and Validation of a Scale to Measure Celebrity Endorsers' Perceived Expertise, Trustworthiness, and Attractiveness*, **Journal of Advertising, 19(3), 39–52**.
→ [Taylor & Francis](https://www.tandfonline.com/doi/abs/10.1080/00913367.1990.10673191)｜[Semantic Scholar](https://www.semanticscholar.org/paper/be0f68b0ff1420844ceec6a3790eb6959d5c5bf1)

15 題語意差異量表，三個構面。被引超過 3,200 次，是這個領域事實上的標準量表。
一個代言人要有說服力，需要同時具備**專業性（expertise）、可信賴度（trustworthiness）、吸引力（attractiveness）**。

> **→ 對照現有系統：部分有支撐，但軸的定義沒對齊**
> `kols/topic-axes.json` 的四軸是：`analysis`（理性拆解）、`story`（敘事情緒）、`visual`（視覺張力）、`credibility`（身分可信）。
> 對照 Ohanian：
> - `credibility` ≈ expertise + trustworthiness（**我們把兩個構面壓成一軸了**）
> - `visual` ≈ attractiveness（勉強對得上）
> - `analysis` / `story` — **Ohanian 沒有這兩軸**，它們是內容形式維度，不是來源可信度維度
>
> 也就是說我們的四軸**混合了兩種不同性質的東西**：兩軸講「這個人是誰」（來源特質），兩軸講「這個內容長什麼樣」（內容形式）。這在理論上不乾淨。
> 修正方向不是砍軸，而是**明確分成兩組**，因為它們在文獻上作用機制不同：來源特質影響「信不信」，內容形式影響「看不看得下去」。

### 2.2 契合假說（Match-Up Hypothesis）：這是我們整個 Match 分數的理論來源

Kamins (1990) 提出的 match-up hypothesis：代言人與被代言對象**愈契合，說服效果愈好**。後續大量研究把它延伸到 influencer–brand congruence。

近年的整合研究：
- [Influencer credibility and consumer behavior: the mediating role of self-brand congruity（*Cogent Business & Management*, 2025）](https://www.tandfonline.com/doi/full/10.1080/23311975.2025.2541040)
- [Sustainability 期刊上的 influencer–brand congruence 研究（2024）](https://www.mdpi.com/2071-1050/16/5/1761)
- [arXiv 上的 influencer–brand 契合計算框架](https://arxiv.org/pdf/2208.02453)

關鍵發現（對我們特別重要）：**高涉入度的受眾對契合度更敏感**——他們會更用力地檢查內容與該 KOL 個人價值觀、身分的一致性，並據此調整對來源可信度的評價。
換句話說，**愈死忠的粉絲，愈不能亂接題**。

> **→ 對照現有系統：有支撐，這是 `pillarFit` 存在的正當理由**
> `pillarFit()` 在做的事，就是計算「這個話題」與「這個 KOL 已宣告的內容支柱」的契合度。這在文獻上有名字，叫 congruence，而且有三十年的實證。
> 更重要的：`needsBinding`（找不到任何支柱對應時不給分、要求人工綁定）這個設計，在 match-up hypothesis 的立場下**是對的**——不契合就是不契合，不該用其他維度的高分補回來。
> **紅線（redlines）作為 gate 而非扣分項**，同樣有支撐：契合度是門檻，不是可交易的權重。

### 2.3 擬社會互動：為什麼「關係」比「內容」更能解釋轉換

Horton, D. & Wohl, R. R. (1956), *Mass Communication and Para-Social Interaction: Observations on Intimacy at a Distance*, **Psychiatry, 19(3), 215–229**.
→ [Taylor & Francis](https://www.tandfonline.com/doi/abs/10.1080/00332747.1956.11023049)｜[PubMed](https://pubmed.ncbi.nlm.nih.gov/13359569/)

「隔著距離的親密感」——觀眾對媒體人物形成單向的友誼感。這篇是 1956 年寫廣播與電視的，被引 3,400+ 次，在 KOL 時代反而更貼切。

現代實證：
- Sokolova & Kefi, *Instagram and YouTube bloggers promote it, why should I buy? How credibility and parasocial interaction influence purchase intentions*, **Journal of Retailing and Consumer Services**。→ [ScienceDirect](https://www.sciencedirect.com/science/article/abs/pii/S0969698918307963)
- [The persuasive power of social media influencers in brand credibility and purchase intention（*Humanities and Social Sciences Communications*, 2023）](https://www.nature.com/articles/s41599-023-02512-1)
- [Influencers' Persuasive Power and Parasocial Relationships in Digital Consumption: Insights from Instagram and TikTok（2026）](https://www.mdpi.com/0718-1876/21/4/112)

一致的發現：**內容的資訊價值、真實性（authenticity）、同質性（homophily）→ 擬社會關係 → 購買意圖與品牌可信度評價。** 擬社會關係是中介變項，不是自變項。

> **→ 對照現有系統：完全無支撐 —— 這是最大的理論缺口**
> 現有的四軸完全沒有測量「這個 KOL 與受眾之間的關係強度」。
> 而文獻說這是**中介變項**——也就是說，人設再契合、話題再熱，如果沒有擬社會關係，轉換不會發生。
> 對一個**還沒有任何真實發布數據**的系統，這條暫時無法測量（PSI 需要受眾問卷或互動行為資料）。但它必須被寫進方法論，作為「我們知道自己漏了什麼」。
> 可操作的近似：留言／觀看比、回訪率、留言中第二人稱的比例——這些都要等到有真實帳號資料之後。

### 2.4 真實性（Authenticity）：有現成的五構面量表可以直接用

Lee, J. A. & Eastin, M. S. (2021), *Perceived Authenticity of Social Media Influencers: Scale Development and Validation*, **Journal of Research in Interactive Marketing, 15(4), 822–841**, DOI: 10.1108/JRIM-12-2020-0253.
→ [Emerald](https://www.emerald.com/jrim/article-abstract/15/4/822/451011/Perceived-authenticity-of-social-media-influencers)

**PASMI 量表五構面：** 真誠（sincerity）、透明揭露（transparent endorsement）、可見性（visibility）、專業性（expertise）、獨特性（uniqueness）。

相關發現：影響者**主動揭露自己的失敗**反而提升真實性感知。→ [PMC 全文](https://pmc.ncbi.nlm.nih.gov/articles/PMC12292181/)

> **→ 對照現有系統：意外地有支撐，而且解釋了一個我們憑直覺做對的設計**
> `rachel-ong` 的紅線包含「**美化、省略或包裝她 27 歲那次真實事故，把她塑造成零失誤傳奇**」（severity: block）。
> 這條紅線在 PASMI 的立場下是**有理論根據的**——proactive disclosure of failure 提升真實性。我們當初是憑人設直覺寫的，文獻剛好站在同一邊。
> 缺口是：`transparent endorsement`（業配揭露）在現有資料結構裡完全沒有位置。這是可以直接補的一欄。

---

## 3. Q2 — 話題熱度怎麼被判定

### 3.1 突發偵測的標準方法：Kleinberg 狀態機

Kleinberg, J. (2002), *Bursty and Hierarchical Structure in Streams*, KDD '02, 91–101。期刊擴充版：*Data Mining and Knowledge Discovery* 7, 373–397 (2003)。
→ [Cornell 原始 PDF](https://www.cs.cornell.edu/home/kleinber/bhs.pdf)｜[ACM DL](https://dl.acm.org/doi/10.1145/775047.775061)｜[R 套件 `bursts`](https://cran.r-project.org/web/packages/bursts/bursts.pdf)

方法：用一個**機率自動機**，不同狀態對應不同的詞頻水準；當頻率顯著改變時狀態轉移，狀態轉移的時點就是 burst 的起訖。
關鍵性質：它有**狀態轉移成本**，所以不會被單次尖峰騙到——這正是「真的在熱」與「剛好出現很多次」的差別。

相關路線：
- [Discovering Emerging Topics in Social Streams via Link Anomaly Detection](https://arxiv.org/pdf/1110.2899) — 不看詞，看**提及／回覆的連結結構異常**。對「新話題還沒有固定用詞」的情況更有效。
- [Burst Detection in Social Media Streams for Tracking Interest Profiles in Real Time（SIGIR 2016）](https://dl.acm.org/doi/10.1145/2911451.2914733)

> **→ 對照現有系統：被推翻 —— 現在的做法在方法論上撐不住**
> `apify.js` 現在的熱度是：抓種子詞的貼文 → 統計其中的 hashtag → 用**不重複帳號數**當 volume、用**48 小時內佔比**當 growth。
> 對照 Kleinberg：
> 1. **沒有時間序列。** 我們只有一個時間切片，而 burst 的定義本質上需要「跟自己的過去比」。48h 佔比不是成長率，`apify.js` 的註解也已經誠實承認這點。
> 2. **樣本量（~300 則）遠低於 burst detection 的適用範圍**，而且 actor 傾向回傳最新的，48h 佔比部分反映的是爬蟲的排序而非話題動能。
> 3. **種子詞決定了發現空間**（`docs/09 §3.4` 已記錄此限制）。
>
> **最小可行的修正**：把每次抓取的結果按日期存進 volume（`DATA_DIR=/data` 已經有了），累積 7–14 天後就能算真正的時間序列 z-score。這不需要換 actor，只需要開始存。
> 「不重複帳號數」這個選擇本身是好的——它接近 Cha et al. 的 mentions 概念（多少人真的在講），優於單純的貼文數。

### 3.2 議題設定：話題熱度不是自然現象，是被生產出來的

議題設定理論（agenda-setting）指媒體透過報導的顯著性，決定公眾認為什麼重要。在平台時代，這個過程變成**去中心化、持續進行、個人化**的——內容曝光來自演算法策展、使用者互動模式、平台設計三者的交互作用。
→ [Agenda-setting theory on social media: Does the algorithm control information?](https://www.researchgate.net/publication/399649003)｜[ScienceDirect 概覽](https://www.sciencedirect.com/topics/social-sciences/agenda-setting-theory)｜[Quantifying time-dependent Media Agenda and Public Opinion by topic modeling](https://arxiv.org/pdf/1807.05184)

> **→ 對照現有系統：這是一個尚未被納入的層次**
> 我們現在把「熱度」當成外生的、要去偵測的自然現象。議題設定的立場是：**熱度部分是被生產的**，而我們自己（五個 KOL 帳號）也是生產者之一。
> 對操作的意義：Tab 2 的三個方向（從 KOL 找題／從題找 KOL／組合產素材）全部是**反應式**的。文獻指出還有第四個方向——**主動設定議題**（連續在同一角度發聲，讓討論收攏到你定義的框架上）。這在現有工具裡沒有對應功能。

---

## 4. Q3b — 什麼創意會擴散

### 4.1 核心機制：生理喚起（arousal），不是正負情緒

Berger, J. & Milkman, K. L. (2012), *What Makes Online Content Viral?*, **Journal of Marketing Research, 49(2), 192–205**.
→ [SAGE](https://journals.sagepub.com/doi/abs/10.1509/jmr.10.0353)｜[作者公開 PDF](http://jonahberger.com/wp-content/uploads/2013/02/ViralityB.pdf)

分析《紐約時報》近三個月的最多轉寄文章清單。結論反直覺且非常可操作：

| 情緒 | 喚起水準 | 對擴散的影響 |
|---|---|---|
| 敬畏（awe） | 高喚起・正向 | **↑ 提升** |
| 憤怒（anger）、焦慮（anxiety） | 高喚起・負向 | **↑ 提升** |
| 悲傷（sadness） | 低喚起・負向 | **↓ 降低** |
| 滿足（contentment） | 低喚起・正向 | **↓ 降低** |

也就是說：**決定擴散的是「喚起程度」，不是「內容讓人開心或難過」。** 正面內容平均比負面內容更容易被分享，但一旦控制了喚起水準，真正的驅動因子就是喚起本身。同時，實用價值（practically useful）與令人驚訝（surprising）的內容也更容易被分享。

> **→ 對照現有系統：完全無支撐 —— 而這是使用者問題的正中心**
> 使用者問的是「怎麼產出**能引起共鳴、關注或對話**的好創意」。這篇論文是目前為止最直接的答案，而現有系統對它**零實作**。
> `evaluation.js` 的預評估目前評的是：紅線、支柱綁定、目標數字。**沒有任何一欄在問「這個素材的喚起水準是多少」。**
>
> 這是最高價值的可補項目，而且成本低：在素材企劃（material brief）加一個必填欄位——
> **「這則內容想引發的高喚起情緒是哪一種：敬畏／憤怒／焦慮／驚訝？如果答案是『溫暖』或『療癒』，請說明為什麼在低喚起下仍值得做。」**
> 這一問不需要任何資料，就能把 Berger & Milkman 的發現變成一道製作紀律。
>
> ⚠️ 但要注意邊界：這篇研究的樣本是**新聞文章的轉寄行為**，不是短影音的完播與留言。把它外推到 TikTok 需要說明理由，不能直接套用。

### 4.2 一個必須記錄的張力

Berger & Milkman 說「憤怒與焦慮提升擴散」。
`rachel-ong` 的紅線說「為互動率擺拍危險動作或誇大難度」是 block。

**這兩件事是衝突的，而且這個衝突是設計的核心，不是 bug。**
文獻描述的是「什麼會擴散」，紅線描述的是「什麼我們不做」。一個是描述性的，一個是規範性的。
**方法論文件必須明說：我們知道走高喚起負向情緒會更快，我們選擇不走，代價是擴散速度。** 這句話寫下來，紅線才是一個經過計算的商業決策，而不是一句好聽的話。

---

## 5. 本次檢索的知識邊界（明確列出沒回答到的）

| # | 缺口 | 為什麼重要 | 打算怎麼補 |
|---|---|---|---|
| B1 | **中文學術原文不可達**（CNKI / 華藝 / 台灣碩博論文網） | 熵權法指標體系那一整條線只有二次來源 | 交給千問與豆包（它們的中文語料覆蓋較好），但引用一律待驗證 |
| B2 | **沒有短影音（TikTok / Reels）專屬的擴散研究** | Berger & Milkman 是文字新聞，外推到短影音有風險 | 列入四模型題綱 Q4 |
| B3 | **擬社會關係無法在零數據下測量** | 它是文獻上的中介變項，卻是系統的盲區 | 需要真實帳號運營資料，短期無解，只能記錄 |
| B4 | **虛擬／AI KOL 的可信度是否適用同一套理論** | 我們的五位 KOL 全部是 AI 生成的 | 已找到一筆線索（[human vs virtual influencers 的 congruence 交互作用](https://www.tandfonline.com/doi/full/10.1080/21639159.2026.2667771)），但尚未細讀；列入題綱 Q5 |
| B5 | **權重要怎麼校準** | 現行 0.35/0.3/0.2/0.15 無依據 | 熵權法是候選解，但需要 N 筆真實成效資料才能跑 |

---

## 附錄 A · 五個模型的共同題綱

以下六題會原樣送給 GPT、Gemini、千問、豆包，讓四份報告可以橫向比較。

1. **影響力測量**：社群影響力的評估指標有哪些理論流派？各自的核心論文是什麼？彼此的分歧在哪裡？
2. **人設—話題契合**：「代言人／KOL 與題材的契合度」在文獻上怎麼被形式化與量測？有哪些現成量表？
3. **話題熱度判定**：怎麼從資料上區分「真的在升溫的話題」與「只是剛好出現很多次的字」？主流演算法與它們的失效條件？
4. **內容擴散**：什麼樣的內容特徵會提升分享／留言／對話？短影音時代的研究結論與文字時代有何不同？
5. **AI／虛擬 KOL**：既有的來源可信度與擬社會互動理論，套用在虛擬人身上時哪些成立、哪些失效？
6. **中文文獻**：中文學術圈（含台灣、大陸）在「網路意見領袖影響力評價指標體系」上有哪些代表性研究與方法（例如熵權法、TOPSIS、灰關聯）？

附加要求（四個模型都會收到）：
> 對每一筆引用，請標明你對它存在性的把握程度（高／中／低）。**寧可說「我不確定這篇是否存在」，也不要給出看起來完整但可能虛構的引用。** 你的價值在於理論框架與視角，不在於書目。
