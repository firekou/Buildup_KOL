# 99 · 引用查證與知識邊界

**規則：** `02`–`05`（GPT / Gemini / 千問 / 豆包）給出的引用**預設視為未驗證**。只有在本檔標記為 ✅ 已驗證的，才可以進入 `90-synthesis.md` 並用來支撐設計決策。

**查證方式：** 真實網路檢索，確認「這篇論文存在」且「作者、年份、期刊、卷期與模型所說一致」。
查證的是**存在性與書目正確性**，不是內容正確性——內容是否被正確轉述，是另一件事，在「備註」欄標出。

**標記：**
- ✅ **已驗證** — 論文存在，書目資訊正確
- ⚠️ **部分正確** — 論文存在，但模型講的作者／年份／期刊有誤（已在備註更正）
- ❌ **查無此文** — 檢索不到，高機率為虛構
- ❓ **無法確認** — 檢索環境限制（例如中文資料庫需付費權限），非模型之過

---

## A. GPT（`02-gpt.md`）— 高優先引用

| # | 模型給的引用 | 自評 | 結果 | 查證後的正確書目 |
|---|---|---|---|---|
| A1 | Meyers-Levy & Tybout 1989, *Schema Congruity as a Basis for Product Evaluation* | 高 | ✅ | **Journal of Consumer Research, 16(1), 39–54.** DOI 10.1086/209192。→ [Oxford Academic](https://academic.oup.com/jcr/article-abstract/16/1/39/1791662) |
| A2 | Zulli & Zulli 2022, TikTok 模仿公眾 | 高 | ✅ | **Zulli, D. & Zulli, D. J., "Extending the Internet meme: Conceptualizing technological mimesis and imitation publics on the TikTok platform", *New Media & Society*, 24(8), 1872–1890.** → [SAGE](https://journals.sagepub.com/doi/abs/10.1177/1461444820983603) |
| A3 | Sundar, MAIN model | 高 | ✅ | **Sundar, S. S. (2008), "The MAIN Model: A Heuristic Approach to Understanding Technology Effects on Credibility".** 四個 affordance：Modality／Agency／Interactivity／Navigability。→ [ResearchGate](https://www.researchgate.net/publication/323990996) |
| A4 | Brady et al. 2017, 道德化情緒與擴散 | 高 | ✅ | **Brady, Wills, Jost, Tucker & Van Bavel (2017), "Emotion shapes the diffusion of moralized content in social networks", *PNAS*, 114(28), 7313–7318.** 每多一個道德—情緒詞，擴散增加約 20%；且擴散受群體邊界限制。→ [PNAS](https://www.pnas.org/doi/10.1073/pnas.1618923114) |
| A5 | Kamins & Gupta 1994, spokesperson–product congruence | 高 | ✅ | **Kamins, M. A. & Gupta, K., "Congruence between spokesperson and product type: A matchup hypothesis perspective", *Psychology & Marketing*, 11(6), 569–586.** → [Wiley](https://onlinelibrary.wiley.com/doi/abs/10.1002/mar.4220110605) |
| A6 | Speed & Thompson 2000, sponsor–event fit | 高 | ✅ | **Speed, R. & Thompson, P., "Determinants of sports sponsorship response", *Journal of the Academy of Marketing Science*, 28(2), 226–238.** → [SAGE](https://journals.sagepub.com/doi/10.1177/0092070300282004) |

**小結：GPT 的 6 筆高優先引用全數通過查證，書目資訊全部正確。**
在本次提問設計（強制自評把握程度 + 允許說「我不知道」）下，`gpt-5.5` 的引用可靠度明顯高於預期。它在 Q4 主動說出「若要精確指認短影音留言的因果論文，我不會硬湊」，這個行為與最終的 6/6 命中率一致。

### 內容轉述的準確度（另一個問題）

| # | 備註 |
|---|---|
| A1 | GPT 說「中度不一致若可被解釋，反而可能提高處理深度」——與原文一致。原文的完整形狀是**倒 U**：極端不一致會造成負評，這點 GPT 也講到了。轉述準確。 |
| A4 | GPT 只說「道德憤怒的內容更容易擴散」，**漏掉了原文最重要的邊界條件**：道德傳染受**群體成員身分限制**，在自由派／保守派網絡**內部**放大，跨群體則不然。這個限制對我們很重要——高喚起憤怒帶來的是同溫層內的擴散，不是跨圈觸達。 |

---

## B. GPT — 中優先引用

### 已查證

| # | 引用 | 結果 | 查證後的正確書目與關鍵發現 |
|---|---|---|---|
| B-a | Bakshy, Hofman, Mason & Watts 2011 | ✅ | ***Everyone's an Influencer: Quantifying Influence on Twitter*, WSDM '11.** 追蹤 160 萬使用者、7,400 萬次擴散事件。→ [ACM DL](https://dl.acm.org/doi/10.1145/1935826.1935845)<br>**對我們最重要的一句**：「**預測哪一位使用者或哪一則內容會造成大規模串連，相對不可靠。**」而且在多數合理假設下，**成本效益最高的是「普通影響者」**——影響力平均甚至低於平均的人。<br>→ 這對「用一個 Match 分數挑出最佳 KOL×話題組合」的整個前提是嚴重挑戰：文獻說這件事本質上預測力就有限。 |
| B-b | Romero, Meeder & Kleinberg 2011 | ✅ | ***Differences in the Mechanics of Information Diffusion Across Topics: Idioms, Political Hashtags, and Complex Contagion on Twitter*, WWW '11, 695–704.** → [Cornell PDF](https://www.cs.cornell.edu/home/kleinber/www11-hashtags.pdf)<br>**關鍵發現**：不同題材的擴散機制不同——政治性 hashtag 呈現「複雜傳染」（需要多次重複曝光才會被採用），而慣用語／梗則不需要。<br>→ 含義：`topicHeat` 用同一個公式套用到所有 domain 是錯的。政治／爭議題的熱度曲線與生活題**本質上不同**。 |

### 尚未查證（只在 `90-synthesis.md` 實際引用時才逐筆查）

Aral & Walker 2012、Kempe/Kleinberg/Tardos 2003、Salganik et al. 2006、Hovland & Weiss 1951、McCracken meaning transfer、Till & Busler、Rifon sponsorship congruence、Covington et al. 2016、Teixeira/Wedel/Pieters 2012、Leskovec/Backstrom/Kleinberg 2009、Adcock & Collier 2001、Aaker 1997、Freeman 1978/1979、Saaty AHP、Hwang & Yoon TOPSIS、鄧聚龍 灰色系統、Allan TDT、Blei & Lafferty dynamic topic model、Adams & MacKay BOCPD、TwitterMonitor

GPT 自評為〔中〕：Fleck, Korchia & Le Roy 2012、Cataldi et al.

> 這些多為領域內極知名的工作，虛構風險低。將在 `90-synthesis.md` 實際引用到某一筆時再逐筆查證——只查會被拿來支撐決策的引用，是刻意的取捨。

---

## C. Gemini（`03-gemini.md`）

| # | 模型給的引用 | 自評 | 結果 | 查證後的正確書目 |
|---|---|---|---|---|
| C1 | Watts & Dodds 2007，Influentials Hypothesis 被推翻 | 高 | ✅ | **Watts, D. J. & Dodds, P. S., "Influentials, Networks, and Public Opinion Formation", *Journal of Consumer Research*, 34(4), 441–458.** 原文：「在多數條件下，大規模的影響串連不是由影響者驅動，而是由一群易受影響的個人所構成的臨界量驅動。」→ [Oxford Academic](https://academic.oup.com/jcr/article-abstract/34/4/441/1820236)｜[PDF](https://www.uvm.edu/pdodds/research/papers/others/2007/watts2007a.pdf) |
| C2 | Aral et al. 2009，同質性使影響力被高估 **300–700%** | 高 | ✅ | **Aral, S., Muchnik, L. & Sundararajan, A., "Distinguishing influence-based contagion from homophily-driven diffusion in dynamic networks", *PNAS*, 106(51).** 2,740 萬使用者的即時通訊網絡，動態配對樣本估計。原文數字就是 **300–700%**，且**同質性可解釋 >50% 的表面行為傳染**。→ [PNAS](https://www.pnas.org/doi/10.1073/pnas.0908800106)<br>⚠️ 這一筆我原本假設是模型編的。**查證結果是模型對、我錯。** |
| C3 | Rathje et al. 2021，外團體敵意驅動互動 | 高 | ✅ | **Rathje, S., Van Bavel, J. J. & van der Linden, S., "Out-group animosity drives engagement on social media", *PNAS*, 118(26).** 270 萬則貼文；提到政治外團體的貼文分享／轉發約為提到內團體的**兩倍**，且此效果**強於情緒語言**這個既有預測因子。→ [PNAS](https://www.pnas.org/doi/10.1073/pnas.2024292118) |
| C4 | Abidin，Calibrated Amateurism，年份 **2015** | 中 | ⚠️ **部分正確** | 論文存在，**年份錯誤**。正確為 **Abidin, C. (2017), "#familygoals: Family Influencers, Calibrated Amateurism, and Justifying Young Digital Labor", *Social Media + Society*, 3(2), 1–15.**（源自 Goffman 1956 的排程理論與 MacCannell 1973 的舞台化真實性）→ [SAGE](https://journals.sagepub.com/doi/10.1177/2056305117707191)<br>模型自評為〔中〕，與實際誤差相符——自評機制有效。 |

**Gemini 小結：4 筆查證，3 ✅、1 ⚠️（僅年份誤差，且已自評為中）。**
待查：Fleck et al. 2012〔中〕、Mandler 1982、Reeves & Nass CASA、Lou & Yuan 2019、Crane & Sornette 2008、Loewenstein 資訊落差〔中〕、Salganik et al. 2006、Berger 後期研究〔中〕

---

## D. 千問（`04-qwen.md`）

| # | 模型給的引用 | 自評 | 結果 | 查證結果 |
|---|---|---|---|---|
| D1 | **Tilman & Wheeler (2006)**，對 Meaning Transfer Model 的量化驗證；用來支撐「文獻明確反對將契合度設為 Gate」 | **高** | ❌ **查無此文** | 四輪不同角度檢索（作者＋主題、作者＋年份、meaning transfer 量化驗證、perceived fit scale）**均查無此著作**。該領域確有 McCracken 1989 之後的量化驗證研究，但作者不是這兩位。<br>**嚴重性：這是千問 Q2 唯一的支撐，而其結論與 GPT、Gemini、以及已驗證的 Meyers-Levy & Tybout 1989（A1 ✅）全部相反。** 若按字面採納，會拆掉系統裡唯一有理論支撐的設計（紅線 gate）。**已判定不採用。** |
| D2 | Aral & Walker 2012，*Science* | 高 | ✅ | **Aral, S. & Walker, D., "Identifying Influential and Susceptible Members of Social Networks", *Science*, 337(6092), 337–341.** 1,200 萬 Facebook 使用者的大規模隨機實驗。→ [Science](https://www.science.org/doi/10.1126/science.1215842)<br>千問轉述「高中心性節點未必是高擴散者」與原文相符。原文另有一個千問沒提、但對我們很重要的發現：**有影響力的人本身較不易被影響，且他們在網絡中會群聚；易受影響者則不會。** |
| D3 | Bakshy et al. **2012** | 高 | ⚠️ **年份錯誤** | 正確為 **2011**（WSDM '11），已於 B-a 查證。 |

**千問小結：3 筆查證，1 ✅、1 ⚠️、1 ❌。而唯一那筆 ❌ 剛好是它整段結論的地基。**

待查：Freeman 1978、Borgatti 2005、Katz & Lazarsfeld 1955、Huffaker 2010〔中〕、Green & Brock 2000、Friestad & Wright 1994、Choi et al. 2023〔中〕、Kim & Song 2023〔中〕、Burt 1992、喻國明團隊 ❓

---

## E. 跨模型共用引用（第一批，已查證）

| # | 引用 | 提出者 | 結果 | 查證後的正確書目與關鍵發現 |
|---|---|---|---|---|
| E1 | Mandler 1982，schema congruity 的倒 U 型 | Gemini | ✅ | **Mandler, G. (1982), "The Structure of Value: Accounting for Taste", in Clark, M. S. & Fiske, S. T. (eds.), *Affect and Cognition: The 17th Annual Carnegie Symposium on Cognition*, Erlbaum, 3–36.**<br>倒 U 的機制：一致 → 溫和正面（期待被確認）；**不一致 → 引發更多認知精緻化，若成功化解，產生好奇與興趣等正面情感**；極端不一致 → 無法化解 → 負評。<br>**這正式確立了 Gemini 的 G4 建議在理論上成立**：「完全契合」不是最優解。但注意——Mandler 談的是**化解的成功與否**，不是任何 0–100 尺度上的區間。Gemini 的「50–70」仍屬憑空。 |
| E2 | Salganik, Dodds & Watts 2006，MusicLab | GPT ＋ Gemini | ✅ | ***Science*, 311(5762), 854–856.** 14,341 名參與者的人造音樂市場。**社會影響力愈強，成功的不平等與不可預測性同時增加。**「最好的歌很少墊底，最差的很少爬頂，但**其他任何結果都可能發生**。」→ [Science](https://www.science.org/doi/10.1126/science.1121066)<br>**這是「不要在冷啟動期用一條公式決定內容」最強的單一依據。** |
| E3 | Reeves & Nass，CASA／媒體等式 | Gemini | ✅ | **Reeves, B. & Nass, C. (1996), *The Media Equation: How People Treat Computers, Television, and New Media Like Real People and Places*.**<br>原文：「任何夠接近的媒介都會得到人類式的對待，即使人們知道這很荒謬、事後也可能否認。」<br>→ **支持 Gemini 的 G5：揭露為 AI 並不會讓 PSI 消失。** |
| E4 | Lou & Yuan 2019 | Gemini | ✅ | **Lou, C. & Yuan, S., "Influencer Marketing: How Message Value and Credibility Affect Consumer Trust of Branded Content on Social Media", *Journal of Interactive Advertising*, 19(1), 58–73.** DOI 10.1080/15252019.2018.1533501。<br>PLS 路徑模型：**內容的資訊價值、影響者的可信賴度、吸引力、與追隨者的相似性**，正向影響追隨者的信任。<br>注意：**「相似性（similarity/homophily）」是四個前因之一，而我們的四軸完全沒有這個維度。** |

---

## F. 豆包（`05-doubao.md`）

| # | 模型給的引用 | 自評 | 結果 | 查證結果 |
|---|---|---|---|---|
| F1 | **Kelman 1958**，社會影響力三來源＝正當性／專業性／吸引力 | 高 | ❌ **內容錯誤** | 論文存在（***Journal of Conflict Resolution*, 2(1), 51–60**），但三個歷程是 **compliance（順從）／identification（認同）／internalization（內化）**。豆包把 Ohanian 1990 的來源可信度三軸掛到 Kelman 名下。→ [SAGE](https://journals.sagepub.com/doi/10.1177/002200275800200106) |
| F2 | **Knoll & Matthes「2019」**後設分析：312 個實驗、7 萬受試者、階梯函數門檻在**後 27 百分位**、屬性契合 **0.58**／意義契合 **0.42**（±0.06） | 高 | ⚠️ **論文存在，年份錯誤，數字查無出處** | 正確為 **Knoll, J. & Matthes, J. (2017), *JAMS*, 45(1), 55–75**，DOI 10.1007/s11747-016-0503-8。<br>公開摘要**沒有**「27 百分位階梯門檻」或「0.58／0.42 權重分解」。**這組數字精確到看起來像真的，但查不到出處。** |
| F3 | **Cha et al.「2011」**，1,400 萬用戶，粉絲數解釋力 **<3%** | 高 | ⚠️ **年份與數字皆錯** | 正確為 **2010, ICWSM**（見 A 區與 `01 §1.1`）。原文結論是「三個指標相關性弱」，**無「解釋力不到 3%」此數字**。 |
| F4 | **Zuckerman 1999**，市場分類的邊界清晰度效應 | 高 | ✅ | **Zuckerman, E. W., "The Categorical Imperative: Securities Analysts and the Illegitimacy Discount", *American Journal of Sociology*, 104(5), 1398–1438.** 未被所屬產業專門分析師覆蓋的公司，股價會被折價——**身分歸類不清就會被市場懲罰。** → [JSTOR](https://www.jstor.org/stable/10.1086/210178)｜[PDF](https://gwern.net/doc/economics/1999-zuckerman.pdf)<br>**五份報告中唯一有人提到這條線，而且是對的。** |

**完全無法追溯、一律不採用的斷言：** 「2024 年萊頓大學傳播系對照實驗（人設連續性好感斜率高 37%）」、「2024 年德國媒體研究所追蹤調查（容忍度 +12%／專業立場要求 +41%）」、「2018 年研究：>70% 互動來自前 1% 重複用戶」、「樣本 <1,200 筆時兩倍以內差異無統計顯著性」、「TikTok/Reels >65% 轉發發生在私訊」、「關注率與擴散率跨影片相關係數 0.12」、「話題內互動異質性預測力是總體發文量的 3.7 倍」、「Kleinberg et al. 2015：專家加權顯著劣於均勻隨機」。

**豆包小結：4 筆查證，1 ✅、2 ⚠️、1 ❌。**

---

## G. 兩種不同的失敗模式（方法論上的收穫）

本次研究抓到的兩次失敗，形態完全不同，需要用不同的手段防：

| | 千問（`04` D1） | 豆包（`05` F2） |
|---|---|---|
| 失敗形態 | **憑空造一篇論文**（Tilman & Wheeler 2006） | **在真論文上掛假數字**（Knoll & Matthes 的 312／27%／0.58-0.42） |
| 自評 | 高 | 高 |
| 好不好抓 | 好抓——查一次書目就露餡 | **難抓**——論文在、作者對、期刊對，只有數字是編的 |
| 危險性 | 高（是整段結論的唯一支撐） | **更高**——那些精確數字正是最有說服力、最容易被直接抄進規格的部分 |

**寫進方法論的一條：對 LLM 給的引用，查到「論文存在」只完成了一半，還要查「它說的那個數字在不在論文裡」。**

---

## H. 跨模型共用引用（多個模型都提到，已查證）

| # | 引用 | 提出者 | 結果 | 查證後的正確書目與關鍵發現 |
|---|---|---|---|---|
| H1 | Friestad & Wright 1994，說服知識模型 | 千問 | ✅ | ***Journal of Consumer Research*, 21(1), 1–31.** 人們會發展並運用「說服知識」來應對說服企圖，並據此同時修正對產品與對行銷者本身的態度。→ [Oxford Academic](https://academic.oup.com/jcr/article-abstract/21/1/1/1853712)<br>**含義：受眾看穿意圖時，傷害的不只是這一則內容，是對這個帳號的整體評價。** 這是「刻意留破綻換留言」最直接的反證。 |
| H2 | Burt 1992，結構洞 | 千問 ＋ 豆包 | ✅ | **Burt, R. S., *Structural Holes: The Social Structure of Competition*, Harvard University Press.** 結構洞＝兩個擁有互補資訊的個體之間的缺口；橋接者同時取得**資訊利益**與**控制利益**。與同一群體內的多條連結是冗餘的。<br>**含義：新帳號要找的是「連接互不相通群體」的位置，不是熱度最高的位置。** |

---

## I. 模型可靠度總表（只看已查證的部分）

| 模型 | 已查證 | ✅ | ⚠️ | ❌ | 備註 |
|---|---|---|---|---|---|
| **GPT** `gpt-5.5` | 8 | **8** | 0 | 0 | 全數正確。主動說過一次「若要精確指認…我不會硬湊」 |
| **Gemini** `gemini-3.1-pro-preview` | 8 | **7** | 1 | 0 | 唯一誤差是自評〔中〕的年份（Abidin 2015→2017）。「300–700%」這種看似編造的數字反而完全正確 |
| **千問** `qwen3.8-max` | 5 | 3 | 1 | **1** | ❌ 那筆自評〔高〕，且是核心論點的唯一支撐 |
| **豆包** `dola-seed-2.0-pro` | 4 | 1 | 2 | **1** | 內容錯誤 ＋ 大量無出處的精確數字，全部自評〔高〕 |

**觀察一：自評把握程度是有訊號的，但不完全可靠。**
Gemini 的 ⚠️ 落在自評〔中〕的那筆（自評有效）；千問與豆包的錯誤全部落在自評〔高〕的那筆（自評失效）。
→ **自評可以用來排查證的優先序，不能用來取代查證。**

**觀察二：書目正確率與「模型願不願意說不知道」高度相關。**
GPT 是唯一主動承認知識缺口的模型，也是唯一 8/8 的模型。豆包從頭到尾沒有說過一次「不確定」，錯誤率最高。

**觀察三：中英文語料覆蓋的預期沒有實現。**
原本預期千問與豆包在**中文文獻**（B1 缺口）上會有優勢，實際結果是兩者在中文部分**都沒有給出任何可查證的具體中文書目**——千問只給了「喻國明團隊」這個學者名，豆包給的是「南京大學新聞傳播學院團隊」「中國科學技術大學管理學院」這種無法定位到論文的機構描述。
→ **B1 缺口沒有被填補，而且現在知道它不會被 LLM 填補。**

---

## J. 目前確認的知識邊界

| # | 缺口 | 狀態 |
|---|---|---|
| B1 | 中文學術原文（CNKI／華藝／台灣碩博論文網）不可達 | ❓ 檢索環境限制，非模型問題。千問與豆包的中文引用將特別難查證，這點必須在 `90` 明說。 |
| B2 | 短影音專屬的擴散研究 | ✅ **部分填補**：Zulli & Zulli 2022（模板化／可二創是平台層級的擴散條件）。仍缺完播率與留言的因果研究。 |
| B3 | 擬社會關係在零數據下無法測量 | 仍成立。GPT 補充了為什麼這對 AI KOL 特別嚴重（「受眾很難相信對方真的在乎我」）。 |
| B4 | 虛擬／AI KOL 的可信度理論 | ✅ **部分填補**：Sundar MAIN model 提供了「可信度從人格轉移到系統線索」的理論框架。 |
| B5 | 權重校準 | 仍成立，且**難度上升**：GPT 指出熵權法在小樣本、指標高度相關時會失準，而我們兩者都會踩到。 |
