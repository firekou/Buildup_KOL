# 91 · 流量體系：知識框架與理論

**範圍：** 只處理「時事流量怎麼被判定」這一題（`README` 的第 2 問）。人設體系與社群帳號體系不在本檔。
**對照對象：** `dashboard/server/lib/topics/apify.js`、`dashboard/server/lib/topics/index.js`，以及它們餵給 `lib/scoring/match.js` 的 `topicHeat`。

## 0 · 引用規則（先講，因為它限制了本檔可以說什麼）

本檔只使用兩個來源層：

| 層 | 出處 | 標記方式 |
|---|---|---|
| **底稿層** | `01-claude-literature.md`——Claude 真實檢索、每筆附可點連結 | 標 `〔01〕` |
| **驗證層** | `99-verification.md` 標記為 ✅ 的引用 | 標 `〔99 ✅〕` |

**不使用：** `02`–`05` 任何未經 `99` 標記 ✅ 的引用；`99` 標為 ❌／⚠️ 的錯誤部分；`99` §F「完全無法追溯」清單裡的所有數字。

被明確排除、且本檔不會出現的東西（列出來是為了讓後續讀者不要再撿回去）：

- Tilman & Wheeler 2006（❌ 查無此文）
- Knoll & Matthes 的「312 個實驗／後 27 百分位／0.58–0.42」（⚠️ 論文在，數字查無出處）
- Cha et al. 的「粉絲數解釋力 <3%」（⚠️ 數字非原文）
- Kelman 1958 的「正當性／專業性／吸引力」（❌ 內容錯誤）
- Gemini 的「50–70 中度不契合甜蜜點」（`99` E1 已判定：Mandler 談的是化解成敗，不是 0–100 尺度上的區間）
- 「>70% 互動來自前 1% 重複用戶」「樣本 <1,200 筆無統計顯著性」「TikTok 65% 轉發在私訊」「話題內互動異質性預測力 3.7 倍」「Kleinberg et al. 2015 專家加權劣於隨機」——全部無法追溯

本檔自己也不製造新數字。凡是出現的數值，要嘛來自上述兩層文獻，要嘛直接來自 repo 的程式碼（可 grep 驗證）。

---

## 1 · 流量體系的理論骨架

### 1.1 影響力測量有三個互不引用的流派，而且它們量的不是同一件事

| 流派 | 影響力＝什麼 | 本檔可用的支撐 |
|---|---|---|
| **結構中心性** | 網絡位置。誰站在橋接位置、誰連結多，誰有影響力 | Burt, R. S. (1992), *Structural Holes: The Social Structure of Competition*, Harvard University Press〔99 ✅ H2〕；Weng, Lim, Jiang & He (2010), *TwitterRank: Finding Topic-Sensitive Influential Twitterers*, WSDM〔01 §1.2〕 |
| **擴散實證** | 反事實增量。你發了之後，多出多少本來不會發生的行為 | Bakshy, Hofman, Mason & Watts (2011), *Everyone's an Influencer: Quantifying Influence on Twitter*, WSDM '11〔99 ✅ B-a〕；Aral, S. & Walker, D. (2012), "Identifying Influential and Susceptible Members of Social Networks", *Science*, 337(6092), 337–341〔99 ✅ D2〕 |
| **心理量表** | 受眾感知。專業性、可信賴度、吸引力、相似性 | Ohanian, R. (1990), *Journal of Advertising*, 19(3), 39–52〔01 §2.1〕；Horton & Wohl (1956), *Psychiatry*, 19(3), 215–229〔01 §2.3〕；Lou, C. & Yuan, S. (2019), *Journal of Interactive Advertising*, 19(1), 58–73〔99 ✅ E4〕 |

三派的分歧不是「哪個指標準」，而是**對「影響力是什麼」這個定義從一開始就沒有共識**。結構派問「有機會觸及誰」，擴散派問「過去實際造成了什麼」，量表派問「未來可能說服誰」。

跨派的共同結論只有一條，而且它是實證的：

> Cha, Haddadi, Benevenuto & Gummadi (2010), *Measuring User Influence in Twitter: The Million Follower Fallacy*, ICWSM〔01 §1.1〕
> 粉絲數（indegree）、轉發（retweets）、提及（mentions）三者**相關性很弱**。它們分別量的是「被訂閱的程度」「內容的擴散力」「這個人本身的話題性」。

**對流量體系的直接含義：不可通約的量不該被加權成一個數。** 這不是風格偏好，是 Cha et al. 的實證結果。任何把 volume、growth、engagement 折成一個 0–100「熱度」的做法，都在做這件被文獻反對的事。

### 1.2 影響力預測的本質限制：這不是資料不夠，是題目本身的性質

四筆已驗證的研究指向同一個方向，而且一筆比一筆狠：

1. **Bakshy et al. (2011)**〔99 ✅ B-a〕——160 萬使用者、7,400 萬次擴散事件。原文最重要的一句：**「預測哪一位使用者或哪一則內容會造成大規模串連，相對不可靠。」** 而且在多數合理假設下，成本效益最高的是「普通影響者」——影響力平均甚至低於平均的人。
2. **Watts, D. J. & Dodds, P. S. (2007), "Influentials, Networks, and Public Opinion Formation", *Journal of Consumer Research*, 34(4), 441–458**〔99 ✅ C1〕——大規模影響串連**不是由影響者驅動**，而是由一群易受影響的個人所構成的臨界量驅動。
3. **Salganik, Dodds & Watts (2006), *Science*, 311(5762), 854–856**（MusicLab，14,341 名參與者）〔99 ✅ E2〕——**社會影響力愈強，成功的不平等與不可預測性同時增加**。「最好的歌很少墊底，最差的很少爬頂，但其他任何結果都可能發生。」
4. **Aral, Muchnik & Sundararajan (2009), *PNAS*, 106(51)**（2,740 萬使用者的即時通訊網絡）〔99 ✅ C2〕——未控制同質性時，影響力被**高估 300–700%**；同質性可解釋 **>50%** 的表面行為傳染。

這四筆合起來說的是：**一個公式算出「這題會紅」的能力，有一個文獻上已知的天花板，而且那個天花板很低。** 這不會因為換 actor、加樣本、調權重而消失。

**含義（這條要寫進方法論，不是寫進程式）：** 流量體系的合理目標不是「預測哪題會爆」，而是「**排除明顯不該做的題，並保留足夠的隨機探索**」。前者是過濾，後者是實驗設計。中間那塊「精準排序」是文獻不支持的部分。

### 1.3 突發偵測：burst 的定義本質上需要「跟自己的過去比」

> Kleinberg, J. (2002), *Bursty and Hierarchical Structure in Streams*, KDD '02, 91–101；期刊擴充版 *Data Mining and Knowledge Discovery*, 7, 373–397 (2003)〔01 §3.1〕

方法：一個機率自動機，不同狀態對應不同的詞頻水準；當頻率顯著改變時狀態轉移，**狀態轉移的時點就是 burst 的起訖**。關鍵性質是它有**狀態轉移成本**，所以不會被單次尖峰騙到。

這正是「真的在熱」與「剛好出現很多次」的形式化差別，而它有兩個不可迴避的前提：

- **前提一：要有時間序列。** 沒有 $t_{-1}$，就沒有基線；沒有基線，「異常」這個詞沒有定義。
- **前提二：抽樣框要穩定。** 若每次抓到的樣本母體本身在變（不同的 actor 排序、不同的回傳量），偵測到的狀態轉移可能是抓取行為的轉移，不是話題的轉移。

相關路線（同樣出自〔01 §3.1〕）：*Discovering Emerging Topics in Social Streams via Link Anomaly Detection*——不看詞，看提及／回覆的**連結結構異常**，對「新話題還沒有固定用詞」的情況更有效。

**話題生命週期的操作意義：** burst 是有起訖的。一個已經進入高狀態一段時間的話題，與一個剛剛轉入高狀態的話題，在 Kleinberg 的框架裡是**可區分的兩件事**，但在任何單一時間切片裡是**不可區分的**。這就是為什麼「今天看到很多人在講」既可能是機會，也可能是餘波——沒有序列就無法分辨。

### 1.4 不同題材的擴散機制不同，同一條公式套所有 domain 是錯的

> Romero, Meeder & Kleinberg (2011), *Differences in the Mechanics of Information Diffusion Across Topics: Idioms, Political Hashtags, and Complex Contagion on Twitter*, WWW '11, 695–704〔99 ✅ B-b〕

關鍵發現：**政治性 hashtag 呈現「複雜傳染」——需要多次重複曝光才會被採用；而慣用語／梗則不需要。**

這是本檔對現有實作最直接的一擊：`scoreHeat` 用同一組權重（0.6 volume + 0.4 growth）處理所有 domain，而文獻說政治／爭議題與生活題的熱度曲線**本質上不同**。同一個 volume 數字，在兩個 domain 裡代表的東西不一樣。

對零粉絲新帳號的額外含義：**複雜傳染的題材，對新進者最不友善**——它需要受眾從多個來源反覆看到，而新帳號無法提供「多個來源」中的任何一個。

### 1.5 「熱度」與「機會」不是同一件事

這是整個流量體系最容易被跳過、但代價最大的一條。四筆已驗證文獻各從一個角度說同一件事：

- **Burt 1992 結構洞**〔99 ✅ H2〕——結構洞是兩個擁有互補資訊的個體之間的缺口；橋接者同時取得**資訊利益**與**控制利益**。**與同一群體內的多條連結是冗餘的。** → 新帳號要找的是「連接互不相通群體」的位置，不是熱度最高的位置。
- **Bakshy et al. 2011**〔99 ✅ B-a〕——成本效益最高的是「普通影響者」。 → 資源該押在「多次低成本嘗試」，不是「一次押對最熱的題」。
- **Zuckerman, E. W. (1999), "The Categorical Imperative: Securities Analysts and the Illegitimacy Discount", *American Journal of Sociology*, 104(5), 1398–1438**〔99 ✅ F4〕——未被所屬產業專門分析師覆蓋的公司，股價會被折價。**身分歸類不清就會被市場懲罰。** → 追熱點跨越太多類別，代價不是「這篇失敗」，是「評價者不知道該用哪把尺量這個帳號」。
- **Aral et al. 2009**〔99 ✅ C2〕——同質性可解釋 >50% 的表面傳染。 → 一個話題「很多帳號在講」，可能只是同一群人本來就會講。帳號數多，不等於觸達了新的人。

**合起來的判準：熱度是「有多少人在講」，機會是「這個位置還空著嗎」。現有系統只量了前者，而且把它當成後者用。**

### 1.6 擴散的內容側：喚起、群體邊界、可二創

這一節屬於流量體系與創意體系的交界，但選題時就會用到，所以放這裡。

**（a）決定擴散的是喚起程度，不是正負情緒**
> Berger, J. & Milkman, K. L. (2012), *What Makes Online Content Viral?*, *Journal of Marketing Research*, 49(2), 192–205〔01 §4.1〕

敬畏（高喚起・正）、憤怒與焦慮（高喚起・負）↑ 提升擴散；悲傷（低喚起・負）、滿足（低喚起・正）↓ 降低。實用價值與令人驚訝也提升擴散。
⚠️ **邊界：這篇的樣本是新聞文章的轉寄行為，不是短影音的完播與留言。** 外推到 TikTok 需要說明理由。〔01 §4.1 已標註〕

**（b）道德—情緒的擴散受群體邊界限制**
> Brady, Wills, Jost, Tucker & Van Bavel (2017), "Emotion shapes the diffusion of moralized content in social networks", *PNAS*, 114(28), 7313–7318〔99 ✅ A4〕
> 每多一個道德—情緒詞，擴散增加約 **20%**；**且擴散受群體成員身分限制**——在自由派／保守派網絡**內部**放大，跨群體則不然。

> Rathje, Van Bavel & van der Linden (2021), "Out-group animosity drives engagement on social media", *PNAS*, 118(26)〔99 ✅ C3〕
> 270 萬則貼文；提到政治外團體的貼文，分享／轉發約為提到內團體的**兩倍**，且此效果**強於情緒語言**這個既有預測因子。

**這兩筆合起來的結論對選題是決定性的：靠爭議與群際對立換來的是同溫層內的擴散，不是跨圈觸達。** 也就是說，對一個要建立新受眾的零粉絲帳號，爭議題的擴散增益**打不到我們要打的地方**。

**（c）短影音的平台層級擴散條件是「可被複製」**
> Zulli, D. & Zulli, D. J. (2022), "Extending the Internet meme: Conceptualizing technological mimesis and imitation publics on the TikTok platform", *New Media & Society*, 24(8), 1872–1890〔99 ✅ A2〕

模板化、可模仿、可二創本身就是擴散條件。這是 `01` B2 缺口（沒有短影音專屬研究）目前唯一被填補的部分。

**（d）受眾會看穿意圖，而且傷害是帳號層級的**
> Friestad, M. & Wright, P. (1994), *Journal of Consumer Research*, 21(1), 1–31〔99 ✅ H1〕
> 人們會發展並運用「說服知識」來應對說服企圖，並據此**同時修正對產品與對行銷者本身的態度**。

→ 蹭一個明顯不屬於自己的熱點，成本不只是那一則的表現，是對這個帳號的整體評價。這也是「刻意留破綻換留言」那類戰術最直接的反證。

**（e）契合度的非線性**
> Meyers-Levy, J. & Tybout, A. M. (1989), *Schema Congruity as a Basis for Product Evaluation*, *Journal of Consumer Research*, 16(1), 39–54〔99 ✅ A1〕
> Mandler, G. (1982), "The Structure of Value: Accounting for Taste", in Clark & Fiske (eds.), *Affect and Cognition: The 17th Annual Carnegie Symposium on Cognition*, Erlbaum, 3–36〔99 ✅ E1〕

倒 U：一致 → 溫和正面；**不一致 → 引發更多認知精緻化，若成功化解，產生好奇與興趣**；極端不一致 → 無法化解 → 負評。
⚠️ **只能用到「形狀」，不能用到「數字」。** 原文談的是化解的成敗，不是任何 0–100 尺度上的區間。

### 1.7 熱度部分是被生產的，不是純粹被偵測的

議題設定理論指出媒體透過報導的顯著性決定公眾認為什麼重要；在平台時代這個過程變成去中心化、持續進行、個人化的〔01 §3.2〕。

⚠️ **本條的引用強度低於前六條**——`01 §3.2` 給的是概覽與 ResearchGate／arXiv 連結，不是逐筆查證過的核心文獻。所以本檔把它當成**待補的層次**，不當成可以支撐設計決策的依據。

它的價值在於提出一個現有工具完全沒有的方向：現在 Tab 2 的三個功能全部是**反應式**的（從 KOL 找題／從題找 KOL／組合產素材）。若熱度部分是被生產的，那還有第四個方向——**連續在同一角度發聲，讓討論收攏到你定義的框架上**。這在現有工具裡沒有對應功能，也不該在文獻補齊前就開始做。

---

## 2 · 可操作判準：每週選題實際會看的規則

以下每條都寫成「可以放進 checklist 或程式」的形式。標 `[code]` 的是可以直接實作的，標 `[human]` 的是選題會議上的紀律。

### R1 `[code]` Gate 先於排序，熱度不得補償契合

任何話題先過紅線與支柱綁定，通過之後才進入熱度排序。熱度**不進入**決定「做不做」的那個計算。

- 依據：Friestad & Wright 1994〔99 ✅ H1〕——說服意圖被看穿時，傷害是帳號層級的；Meyers-Levy & Tybout 1989〔99 ✅ A1〕——極端不一致造成負評，不是低分而已。
- 現況：`match.js` 的 `WEIGHTS.topicHeat = 0.2` 是線性加權，熱度**可以**補償契合。`redlines` 與 `needsBinding` 已經是 gate，但總分仍是加權和。

### R2 `[human]` 不看單一「熱度」數字

選題會議上，一個話題必須同時看四欄才可以討論：**不重複帳號數 / 48h 佔比 / 作者集中度 / domain**。禁止只報「熱度 78」。

- 依據：Cha et al. 2010〔01 §1.1〕——三個指標相關性弱，量的是不同的東西。
- 現況：`scoreHeat` 已經回傳 `heatParts`（volume 與 growth 分項），但 `getRegionTopics` 用 `.sort((a, b) => b.heat - a.heat)` 排序，UI 拿到的順序來自單一總分。作者集中度目前不存在。

### R3 `[human]` 沒有 $t_{-1}$ 就不准說「在升溫」

話術紀律，寫進選題文件模板：

- 有 ≥7 天序列 → 可以寫「升溫」「趨勢」「動能」。
- 沒有序列 → 只能寫「本次樣本中可見度較高」。

- 依據：Kleinberg 2002/2003〔01 §3.1〕——burst 的定義是相對於自身歷史基線的狀態轉移。
- 現況：`aggregatePostsToTopics` 的欄位叫 `growth7d`，值是 48 小時佔比。**欄位名稱本身就在違反這條規則。**

### R4 `[code]` 熱度只在同 domain 內比較

`scoreHeat` 的 min–max normalize 必須**分 domain 進行**，跨 domain 的熱度數字不並列排序。

- 依據：Romero, Meeder & Kleinberg 2011〔99 ✅ B-b〕——政治 hashtag 是複雜傳染，梗／慣用語不是。
- 現況：`classifyDomain` 已經存在且能算出 domain，但它在 `enrich()` 裡跑，而 `enrich` 在 `scoreHeat` **之後**。domain 資訊在打分時是可得的，只是沒被用。

### R5 `[human]` 爭議與群際對立題：只有在「我們真心持有且能長期重複」時才做

一次性蹭爭議題不成立。判準二選一：
（a）這個立場是該 KOL 的既有支柱，我們願意在未來三個月重複同一立場；或
（b）不做。

- 依據：Brady et al. 2017〔99 ✅ A4〕——道德—情緒擴散受**群體成員身分限制**，在同溫層內放大，跨群體則不然；Rathje et al. 2021〔99 ✅ C3〕——外團體敵意驅動的互動同樣是群內現象。合起來：爭議換到的擴散打不到我們要開發的新受眾。
- 補充：Romero et al. 2011〔99 ✅ B-b〕——這類題是複雜傳染，需要多次重複曝光才會被採用，零粉絲帳號提供不了「多個來源」。

### R6 `[human]` 素材企劃必須先宣告任務：擴散 / 完播 / 留言，只能選一個主任務

同一則內容不同時追三個目標。企劃表上必填一欄「本則的主任務」。

- 依據：Cha et al. 2010〔01 §1.1〕——三個指標不可通約，是三種不同的東西；Berger & Milkman 2012〔01 §4.1〕只解釋了其中的「分享」，且樣本是新聞轉寄。
- ⚠️ 注意：「三者互斥」這個更強的主張在四份 LLM 報告裡高度收斂，但**沒有任何一筆已驗證引用直接支持互斥**。本檔只主張「不可通約、不該合成一個數」，不主張互斥。

### R7 `[human]` 高喚起檢查（含我們刻意不走的路）

素材企劃必填：「這則想引發的高喚起情緒是哪一種：敬畏／憤怒／焦慮／驚訝？若答案是溫暖或療癒，請說明為什麼在低喚起下仍值得做。」

- 依據：Berger & Milkman 2012〔01 §4.1〕。
- **同時必須記錄的張力**（`01 §4.2` 已寫，這裡重申）：文獻說憤怒與焦慮提升擴散，我們的紅線說不做。**這是一個經過計算的商業決策，代價是擴散速度。** 這句話寫下來，紅線才不是一句好聽的話。

### R8 `[human]` 短影音題必填：可被模仿／二創的點是什麼

如果答不出來，這題在短影音上的擴散條件不成立，改做別的形式或換題。

- 依據：Zulli & Zulli 2022〔99 ✅ A2〕——模板化與可二創是平台層級的擴散條件。

### R9 `[human]` 每題必答：這題有沒有一個沒人站的位置

不是「這題熱不熱」，是「這題有沒有一個我們可以獨佔的角度」。同時檢查跨類別數：這一題會不會讓帳號的身分歸類變模糊。

- 依據：Burt 1992〔99 ✅ H2〕——資訊利益來自連接互不相通的群體，同群體內的連結是冗餘的；Zuckerman 1999〔99 ✅ F4〕——身分歸類不清會被市場折價。
- ⚠️ 目前**沒有可自動計算的指標**支撐這條。它是人工判斷，不要假裝它是分數。

### R10 `[code]`+`[human]` 保留隨機配額

每週選題保留一部分名額，**不由任何分數決定**，用來取得能推翻現有權重的資料。

- 依據：Salganik et al. 2006〔99 ✅ E2〕——社會影響力下成功的不可預測性上升；Bakshy et al. 2011〔99 ✅ B-a〕——預測誰會造成大規模串連相對不可靠，且普通影響者成本效益最高。
- ⚠️ **具體比例不寫。** 「70/30」「前 40 篇」都是模型建議，沒有文獻依據。文獻只支持「必須有一個非分數決定的探索通道」，不支持任何特定數字。

---

## 3 · 現有實作的逐條對照

標記沿用 `README` 的三分法：**有支撐** / **無支撐**（工程方便，文獻沒說對也沒說錯）/ **被推翻**（文獻明確指出會錯）。

### 3.1 `apify.js`

| 位置 | 現在的做法 | 判定 | 依據 |
|---|---|---|---|
| `REGION_SEEDS` | 每區 2–3 個 tag ＋ 2 個 keyword，全部是地名或泛用流量字（`台灣`／`taiwan`／`台北`；GLOBAL 是 `trending`／`viral`） | **被推翻** | Kleinberg 2002〔01 §3.1〕的前提之一是**穩定的抽樣框**。種子詞決定發現空間，而這組種子詞是地理／泛用的，不是題材的——召回的是「提到台北的人還會用什麼 tag」，不是「台灣正在熱什麼」。額外問題：`GLOBAL` 的種子 `trending`／`viral` 同時也在 `JUNK_TAGS` 裡，等於用平台雜訊層當入口去撈題材。 |
| `JUNK_TAGS` | 硬編碼的平台泛用字黑名單，含中英雙語 | **無支撐（但工程上正確）** | 沒有文獻直接支持或反對。它做的是雜訊移除，在小樣本下必要。維護成本是永久的（新流量字會不斷出現）。 |
| `toPost()` | 把 like＋comment＋share＋collect 加總成單一 `engagement` | **被推翻（但目前無害）** | Cha et al. 2010〔01 §1.1〕：轉發與提及量的是不同的東西，相關性弱。**但**：`aggregatePostsToTopics` 回傳的 `engagementRate: null`，而 `scoreHeat` 只用 volume 與 growth——所以這個合成數目前**沒有進入評分**，只當 `sampleEngagement` 展示。**現在是無害的，一旦有人把它接進 heat 就變成錯的。** |
| `aggregatePostsToTopics()` — 用**不重複帳號數**當 `volume` | `authorCount = e.authors.size \|\| e.postCount` | **有支撐** | Cha et al. 2010〔01 §1.1〕的 mentions 概念：量的是「多少人真的在講」。優於單純貼文數。`01 §3.1` 已認定這個選擇是好的。 |
| `aggregatePostsToTopics()` — `growth7d` | `recentCount / postCount`，`RECENT_WINDOW_MS = 48h` | **被推翻** | Kleinberg 2002〔01 §3.1〕：burst 是相對於**自身歷史**的狀態轉移。這裡的分母是**同一批樣本**，不是過去。而且 actor 傾向回傳最新的，這個比例部分反映的是爬蟲排序。程式註解已誠實承認（「not a real week-over-week growth figure」），**但欄位名稱仍叫 `growth7d`，且一路傳到 `enrich()`、`makeAdHocTopic()`、UI**。誠實的註解沒有阻止不誠實的欄位名擴散出去。 |
| `MIN_POSTS_FOR_GROWTH = 3` | 少於 3 則貼文時 `growth7d` 回傳 `null`，`normalize()` 視為中性 50 | **無支撐（方向對，數字是編的）** | 方向對應 Kleinberg 的**狀態轉移成本**——不要被單次尖峰騙到。但 `3` 這個數字沒有任何依據；而且即使 postCount 是 30，那個比例**仍然不是成長率**。這條門檻擋掉的是最誇張的雜訊，不是這個指標的根本問題。 |
| `minAuthors = 2`，失敗時 fallback 到 `1` | `fetchRegionTopics` 在聚不出話題時重跑一次 `minAuthors: 1`，並 push 一則 error 訊息 | **無支撐，且是主動的風險** | `minAuthors ≥ 2` 的註解（「a tag used 14 times by one account is that account's habit」）是對的。但 fallback 到 1 **直接違反自己剛寫的理由**——單一帳號的口頭禪會被當成話題。目前唯一的防護是一則 `errors` 訊息，而 `errors` 不影響 `topics` 的內容或排序。 |
| `exclude`（種子詞排除） | 把種子 tag 與 keyword 拆詞後從結果中排除 | **有支撐（工程上正確）** | 註解「Leaving them in makes the top of the list a mirror of the query」正確。這是必要的，但**不能解決**種子詞決定發現空間的問題——排除了種子詞，剩下的仍然只是種子詞的鄰居。 |
| 樣本量 | `getRegionTopics` 預設 `limit = 10` → `limit: Math.max(10 * 4, 40) = 40`；IG `resultsLimit: 40`、TikTok `resultsPerPage: 40`、Threads `maxItemsPerKeyword: 20`（2 keywords） | **被推翻** | `01 §3.1` 已判定「樣本量遠低於 burst detection 的適用範圍」。**而且實際設定比 `01`／`02` 討論時假設的「~300 則」更小**——設定上限是每平台 40。這一點值得在方法論裡更正。 |

### 3.2 `index.js`

| 位置 | 現在的做法 | 判定 | 依據 |
|---|---|---|---|
| `normalize()` | min–max 到 0–100，全平時回傳 `() => 50` | **被推翻（作為熱度用途）** | 這是**組內相對**，不是相對於自身歷史。Kleinberg 2002〔01 §3.1〕要的是後者。實際後果：同一個話題在不同批次抓取中會拿到完全不同的 heat，只因為同批的其他話題變了。跨區域、跨週的 heat 數字**不可比**，而 UI 沒有阻止使用者這樣比。 |
| `normalize()` 的平局行為 | 若所有值相同（小樣本下很常見），全部回傳 50 | **無支撐，且產生假排序** | 此時所有話題 `heat = 0.6*50 + 0.4*50 = 50`，`.sort((a, b) => b.heat - a.heat)` 對全等值排序 → 順序退化為 `mergeByTag` 的插入順序（即 Map 的插入序）。**UI 會顯示一個看起來有意義、實際上是任意的排名。** |
| `scoreHeat()` 的 `0.6 / 0.4` | `heat = 0.6 * volume + 0.4 * growth` | **無支撐** | 與 `match.js` 的 `WEIGHTS`（0.35/0.3/0.2/0.15）同性質：這是我們自己編的。`01 §1.3` 對 `WEIGHTS` 的判定「應該被誠實標記為專家先驗」，同樣適用於這裡——而且這一組**連在文件裡被標記過都沒有**。 |
| `scoreHeat()` 不分 domain | 所有話題共用同一組 normalize 與同一組權重 | **被推翻** | Romero, Meeder & Kleinberg 2011〔99 ✅ B-b〕：政治 hashtag 是複雜傳染，梗／慣用語不是。同一公式跨 domain 比較，比較的不是同一個東西。**修正成本極低**——`classifyDomain()` 已存在，只是在 `enrich()` 裡、跑在 `scoreHeat()` 之後。 |
| `scoreHeat()` 用 `log10(volume)` | 壓縮 volume 的變異 | **無支撐（中性）** | 沒有文獻依據，但在長尾分布上是合理的工程選擇。 |
| `mergeByTag()` 的跨平台合併 | 累加 volume、加權平均 growth、記錄 per-platform 歸屬 | **在 apify 路徑上是死碼，且產生錯誤歸屬** | `aggregatePostsToTopics` 是對**所有平台的貼文一次性**聚合的，`byTag` 是全域的 → 每個 tag 只產生一列。所以 `mergeByTag` 的合併分支在 apify 路徑上**永遠不會執行**（只在 fixtures 路徑執行）。後果：`platforms` 欄位被設成 `[{ platform: <e.platforms 的任意第一個>, volume: <跨全平台的帳號數> }]`——**把三個平台加總的帳號數，全部歸給一個任意選出的平台**。而真正的多平台資訊 `platformsSeen` 在 `enrich()` 裡沒有被複製，直接丟失。註解宣稱的「a tag that is hot on all three platforms should outrank one that is hot on a single platform」這個機制，實際上沒有以宣稱的方式運作。 |
| `enrich()` | 組出對外的 topic 物件 | **無支撐（中性）** | 但它是 `platformsSeen` 遺失的地方，見上一列。 |
| `source` / `volumeMeaning` 欄位 | 明確標示資料來自 apify / apify_partial / fixtures / fixtures_fallback，以及 volume 的語意 | **有支撐（這是現有實作最好的一段）** | Cha et al. 2010〔01 §1.1〕的教訓是「不要把不同的東西叫同一個名字」。這兩個欄位正是在做這件事。**但它只在 API 層誠實**——只要 UI 沒有據此改標籤，誠實就沒有到達使用者。 |
| `fixtures_fallback` | Apify 失敗時退回手寫範例資料，仍然走完整套 `scoreHeat` 並排序 | **無支撐，且是最高風險的一條** | 虛構資料會被計算出一個看起來完全正常的 `heat` 分數並排序輸出。`source` 欄位是唯一的護欄。`01 §3.1` 的精神（不要對假資料評分）在這裡沒有被執行。 |
| `crossQuery()` | 在 `allTopics` 內做子字串交集／聯集 | **無支撐（但它不是熱度主張）** | 需要注意的是：交集是在「**已被種子詞召回的集合**」內做的，不會擴大發現空間。三個以上 tag 通常無結果，這一點程式已經誠實回報。 |
| `makeAdHocTopic()` | 手動話題 `heat` 預設 50 | **無支撐（但預設值選得對）** | 50 是 `normalize()` 的中性值，語意一致——「不知道」而不是「零」。 |
| **整個 `topics/` 模組沒有任何持久化** | `store.js` 的 `FILES` 只有 `pre` / `post` / `matchRecords`；topics 只進 in-memory `cache`，TTL 到期即消失 | **被推翻——這是流量體系最根本的缺陷** | Kleinberg 2002/2003〔01 §3.1〕：沒有時間序列就沒有 burst。而 `DATA_DIR=/data` 的 Railway volume **已經掛好了**（`config.js:17`、`store.js:22`）。**我們每天都在丟掉唯一能讓這個體系成立的資料。** |

### 3.3 跨檔：`topicHeat` 進入 `match.js`

`match.js:224-227` 把 `heat` 以 `WEIGHTS.topicHeat = 0.2` 線性加進總分。

- **被推翻**，兩重：
  1. Cha et al. 2010〔01 §1.1〕——不可通約的量不該加權成一個數。
  2. Bakshy et al. 2011〔99 ✅ B-a〕＋ Salganik et al. 2006〔99 ✅ E2〕——「用一個分數挑出最佳組合」這件事本身，文獻說預測力有天花板。
- **緩解現況：** `match.js` 已回傳 `dimensions` 逐維分數與 `rationale`，方向正確（`01 §1.1` 已認可）。缺的是 UI 不以總分排序。

---

## 4 · 最小可行的修正路徑（成本由低到高）

每條寫明：**改什麼 / 為什麼 / 依據哪一筆已驗證文獻 / 成本**。

### F1 · 開始存時間序列 ★ 最高優先

- **改什麼：** `store.js` 的 `FILES` 加一個 `topicSnapshots: 'topic-snapshots.json'`；`getRegionTopics()` 在每次非 cache 命中的 apify 成功回傳後，append 一筆 `{ capturedAt, region, platforms, source, postsScraped, rows: [{ tag, volume, postCount, recentCount, domain }] }`。**不改任何評分邏輯**，只是開始寫。
- **為什麼：** 這是唯一能讓突發偵測從「不可能」變成「可能」的改動。所有其他的熱度修正都依賴它。今天不存，兩週後我們仍然在原地。
- **依據：** Kleinberg, J. (2002), *Bursty and Hierarchical Structure in Streams*, KDD '02, 91–101；擴充版 *DMKD*, 7, 373–397 (2003)〔01 §3.1〕——burst 定義為相對於自身歷史基線的狀態轉移。
- **成本：極低。** `DATA_DIR=/data` 的 Railway volume 已經掛好（`config.js:17`、`store.js:22`、`server/index.js:81` 會印出 persistent 狀態）。append-only JSON store 的讀寫函式已經寫好了。這是「加一個 FILES entry ＋ 一次 `insert()` 呼叫」等級的改動。
- **注意：** 抽樣框仍然不穩定（每次抓到的是不同的樣本）。所以要**同時記錄 `postsScraped` 與 `source`**，讓未來能把「抓取量變化」從「話題變化」裡分離出來。沒記這兩欄的序列，未來仍然無法用。

### F2 · 把 `growth7d` 改名為 `recencyRatio48h`

- **改什麼：** `apify.js` 的欄位名、`index.js` 的 `mergeByTag`／`enrich`／`makeAdHocTopic`、以及 UI 標籤。
- **為什麼：** 這個名字宣稱的是 7 天成長率，值是 48 小時佔比。程式註解已經承認，但註解只有寫程式的人會讀，欄位名是所有人都會讀的。`01 §3.1` 與 `02` Q3 的一致結論是「現在的 topicHeat 不是時事流量」——那就不要用「growth」這個字。
- **依據：** Cha et al. 2010〔01 §1.1〕的核心教訓：把三個不同的東西叫同一個名字，就會被當成同一個東西用。
- **成本：極低**（純改名 ＋ UI 字串）。

### F3 · 熱度分 domain normalize

- **改什麼：** 把 `classifyDomain()` 從 `enrich()` 提前到 `scoreHeat()` 之前（或在 `scoreHeat` 內呼叫），`normalize()` 改為每個 domain 建一組；UI 上熱度只在同 domain 內排序，跨 domain 並列時不顯示排名。
- **為什麼：** 同一個 volume 數字在政治題與生活題裡代表的東西不一樣。
- **依據：** Romero, Meeder & Kleinberg (2011), *Differences in the Mechanics of Information Diffusion Across Topics: Idioms, Political Hashtags, and Complex Contagion on Twitter*, WWW '11, 695–704〔99 ✅ B-b〕——政治 hashtag 呈現複雜傳染，慣用語／梗不需要重複曝光。
- **成本：低。** `classifyDomain()` 已存在且已被呼叫，只是順序不對。

### F4 · 修掉 `platformsSeen` 遺失與平台歸屬錯誤

- **改什麼：** `enrich()` 保留 `platformsSeen`；`platforms` 欄位在 apify 路徑上改為由 `platformsSeen` 建構，不要把跨平台的帳號數歸給任意一個平台。
- **為什麼：** 現在 UI 收到的 per-platform 歸屬是錯的（見 §3.2）。這不是理論問題，是 bug——但它會讓人對「這題在哪個平台熱」做出錯誤判斷。
- **依據：** 不需要文獻，這是正確性問題。但它與 Cha et al. 2010〔01 §1.1〕同一精神：不要宣稱資料裡沒有的精確度。
- **成本：低。**

### F5 · 加「作者集中度」欄位，並列顯示

- **改什麼：** `aggregatePostsToTopics` 在 row 上加 `topAuthorShare`（該 tag 下貼文數最多的帳號佔比）。**只顯示，不進 heat 公式。**
- **為什麼：** 現在的 `volume`（不重複帳號數）無法區分「20 個互不相識的帳號」與「20 個同一圈子的互推帳號」。集中度是從**現有資料**就能算出來的最粗略代理。
- **依據（強度中等，要誠實標註）：** Aral, Muchnik & Sundararajan (2009), *PNAS*, 106(51)〔99 ✅ C2〕證明的是「未控制同質性會把影響力高估 300–700%，同質性可解釋 >50% 的表面傳染」。**它沒有說「作者集中度」是同質性的有效測量。** 集中度只是我們能算的東西，不能宣稱它測到了同質性。這一欄應標為「輔助觀察」，不是指標。
- **成本：低。**

### F6 · 累積 7–14 天後，改用自身基線的 z-score

- **改什麼：** 有了 F1 的序列後，`growth` 分項改為「當期 volume 相對於該 tag 過去 N 天分布的 z-score」，取代 48 小時佔比。同時保留兩者並列一段時間，用來檢查兩個訊號有沒有相關。
- **為什麼：** 這才是「跟自己的過去比」，才是 burst 的定義。
- **依據：** Kleinberg 2002/2003〔01 §3.1〕。
- **成本：中。** 依賴 F1，且需要處理抽樣框不穩定（用 `postsScraped` 做分母正規化）。
- **注意：** z-score 是 Kleinberg 的簡化替代，不是 Kleinberg 本人的方法。狀態機的「轉移成本」性質（不被單次尖峰騙到）在 z-score 裡沒有。要用完整的兩狀態機，成本再高一級。

### F7 · 把 `topicHeat` 移出 Match 總分

- **改什麼：** `match.js` 的 `WEIGHTS` 拿掉 `topicHeat`，總分只由契合面向構成；熱度改為**獨立顯示的第二欄**與**排序的 tie-breaker**，不進加權和。
- **為什麼：** 熱度與契合度不可通約；而且熱度目前的可信度最低，卻在總分裡佔 0.2，等於用最不可信的訊號去擾動最有支撐的訊號（`pillarFit`／`personaFit` 有 match-up hypothesis 三十年實證，`01 §2.2`）。
- **依據：** Cha et al. 2010〔01 §1.1〕（不可通約）；Bakshy et al. 2011〔99 ✅ B-a〕（預測大規模串連相對不可靠）；Salganik et al. 2006, *Science*, 311(5762), 854–856〔99 ✅ E2〕（社會影響力下不可預測性上升）。
- **成本：中—高。** 跨到人設體系，會動到 UI、`rationale`、以及已存的 `matchRecords`（歷史紀錄的分數語意會改變，需要版本欄位）。

### F8 · 種子詞從「地理／泛用」改為「題材」

- **改什麼：** `REGION_SEEDS` 改為 `REGION × DOMAIN` 的二維結構，種子詞來自各 KOL 的 `pillar_keywords`，而非 `台灣`／`trending` 這類詞。
- **為什麼：** 現在的種子詞召回的是「提到台北的人還會用什麼 tag」。改成題材種子後，召回的至少是我們真的會做的題材鄰域。
- **依據：** 這條**只有間接支撐**——Kleinberg 2002〔01 §3.1〕要求穩定抽樣框，題材種子比地理種子穩定；Burt 1992〔99 ✅ H2〕說要找的是特定位置而非最熱位置。但**沒有任何已驗證文獻直接說「種子詞該怎麼選」**。標為工程判斷。
- **成本：高。** 抓取次數會乘上 domain 數，Apify 費用與延遲同步上升；`GLOBAL` fallback 也要重新設計。
- **代價要說清楚：** 這個改動會讓系統更難發現「我們沒想到的題」——它把 `01 §3.2`（議題設定）與 `04` Q3 指出的「只能驗證已知假設」這個缺陷**加深**，換取抽樣框的穩定。這是一個 trade-off，不是純粹的改善。

### F9 · 「機會」欄位（結構洞佔位）

- **改什麼：** 在話題上加一個人工欄位「這題有沒有一個沒人站的角度」。
- **為什麼：** 熱度與機會是兩件事（§1.5）。
- **依據：** Burt 1992〔99 ✅ H2〕；Zuckerman 1999, *AJS*, 104(5), 1398–1438〔99 ✅ F4〕。
- **成本：高，而且目前無法自動化。** 已驗證文獻提供的是**概念**，不是可從 Apify 資料算出的指標。任何自動化的「結構洞分數」都會是我們自己編的。**建議先做成人工欄位，不要做成分數。**

### 不做的事（明確記錄）

- **不採用 `05` 的「互動前 10% 與中位數倍率」。** 機制方向有道理（§1.5），但它引用的「3.7 倍」在 `99` §F 的無法追溯清單裡，而且現有資料也算不出可靠的分位數（樣本每平台 40 則）。
- **不採用「50–70 中度不契合區間」的任何數字實作**（`99` E1 已判定）。
- **不採用「刻意留破綻換留言」**：Friestad & Wright 1994〔99 ✅ H1〕直接反對；且 Brady 2017〔99 ✅ A4〕與 Rathje 2021〔99 ✅ C3〕顯示換來的擴散在群體邊界內，不是我們要的跨圈觸達。
- **不做主動議題設定功能**（§1.7）：引用強度不足，等 `01 §3.2` 那條線補到逐筆查證的等級再說。

---

## 5 · 這個體系目前的知識邊界

| # | 缺口 | 狀態 |
|---|---|---|
| T1 | **抽樣框不穩定** | F1 存序列之後仍然存在。要真正解決需要固定的抽樣協定（每次相同的種子、相同的 limit、相同的時間點），這在 Apify actor 的行為不透明時做不到。 |
| T2 | **「機會」沒有可計算的指標** | Burt 1992 與 Zuckerman 1999 提供的是概念。要變成分數，我們必須自己定義——而那就是新的一組編出來的數字。目前的立場是：保持人工判斷，不要偽裝成分數。 |
| T3 | **短影音的完播與留言仍無因果研究** | `01` B2 只被 Zulli & Zulli 2022 部分填補（可二創性）。`02` 的 GPT 在這一題上主動說了「我不會硬湊」——這個缺口目前確認無法由 LLM 填補。 |
| T4 | **中文文獻（熵權法／TOPSIS／灰關聯）不可達** | `99` J-B1：CNKI／華藝需付費權限。且 `99` 觀察三已確認：**千問與豆包都沒有給出任何可查證的中文書目，這個缺口不會被 LLM 填補。** 需要有資料庫權限的人去補。 |
| T5 | **不同 domain 的熱度該用什麼不同公式** | Romero et al. 2011〔99 ✅ B-b〕證明機制不同，但**沒有提供「該用什麼公式」**。F3 只能做到「分開比較」，做不到「用不同模型」。 |

---

## 附錄 · Claude 對本檔兩項實作指控的獨立覆核

本檔指出兩個實作 bug。我不接受未經覆核的 agent 報告，因此逐條驗證：

| 指控 | 覆核結果 |
|---|---|
| **`mergeByTag` 的跨平台合併分支在 apify 路徑上永不執行** | ✅ **成立。** `fetchRegionTopics()` 把三個平台的貼文**攤平成一個陣列**後才呼叫 `aggregatePostsToTopics(posts, …)`（`apify.js:248`），所以輸出的每個 tag 已經是唯一的，`mergeByTag` 的 `existing` 分支拿不到第二筆同名 tag。<br>連帶後果也成立：`platform` 欄位取的是 `[...e.platforms][0]`（**任意一個**平台），卻掛著三平台加總的帳號數；真正的 `platformsSeen` 在 `enrich()` 裡沒有被複製出去。<br>**已用 grep 確認 `platformsSeen` 全 repo 只出現在 `apify.js:205` 一處，從未被任何地方讀取。** |
| **小樣本下所有話題 heat 都是 50，排序退化** | ✅ **成立，但本檔的措辭略微過頭。** `normalize()` 在 `max === min` 時回傳 `() => 50`（`index.js:19`），volume 全同（例如全部都是 2 個不重複帳號）＋ `growth7d` 全 null 時，heat 確實全為 50。<br>但此時 `.sort()` 在 V8 是穩定排序，**退化後的順序是 `aggregatePostsToTopics` 的 `volume desc → postCount desc` 排序，不是完全任意**。只有在 volume 與 postCount 都相同的那一批之間，順序才等於 Map 插入序（即第一次被遇到的順序）。<br>**結論不變：UI 呈現的是一個看起來有意義、實際上沒有區辨力的排名。** |

另外校正本檔一處數字：`getRegionTopics()` 傳給 actor 的是 `limit: Math.max(limit * 4, 40)`，**設定值確實是 40**；但 IG／TikTok 的 actor 是把它當成「每個 hashtag 的筆數」而非總數，所以實測 `postsScraped` 曾達 ~300（見 `01 §5` B 區與 `docs/09 §3.4`）。
**兩個數字都對，指的是不同的東西——但無論 40 還是 300，都遠低於本檔 §1.3 引用的方法所需的樣本量。**
