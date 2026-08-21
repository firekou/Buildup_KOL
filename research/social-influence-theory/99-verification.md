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

## C. Gemini（`03`）／千問（`04`）／豆包（`05`）

⏳ 待這三份報告產出後填入。

---

## D. 目前確認的知識邊界

| # | 缺口 | 狀態 |
|---|---|---|
| B1 | 中文學術原文（CNKI／華藝／台灣碩博論文網）不可達 | ❓ 檢索環境限制，非模型問題。千問與豆包的中文引用將特別難查證，這點必須在 `90` 明說。 |
| B2 | 短影音專屬的擴散研究 | ✅ **部分填補**：Zulli & Zulli 2022（模板化／可二創是平台層級的擴散條件）。仍缺完播率與留言的因果研究。 |
| B3 | 擬社會關係在零數據下無法測量 | 仍成立。GPT 補充了為什麼這對 AI KOL 特別嚴重（「受眾很難相信對方真的在乎我」）。 |
| B4 | 虛擬／AI KOL 的可信度理論 | ✅ **部分填補**：Sundar MAIN model 提供了「可信度從人格轉移到系統線索」的理論框架。 |
| B5 | 權重校準 | 仍成立，且**難度上升**：GPT 指出熵權法在小樣本、指標高度相關時會失準，而我們兩者都會踩到。 |
