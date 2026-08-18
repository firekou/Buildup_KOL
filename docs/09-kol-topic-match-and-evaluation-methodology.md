# KOL × 話題 Match 與導流素材前後評估方法論

**版本：** v1.0
**制定日期：** 2026-08-18
**適用範圍：** `dashboard/` 儀表板的所有計算；`kols/*/topic_affinity.json` 的資料標準
**性質：** 可執行規格——本文件的每一條公式都對應 `dashboard/server/lib/scoring/` 裡的一個函式，
改了公式就要改程式，改了程式就要回來改這裡。

> **這份文件回答三個問題：**
> 1. 一個 KOL 「可以發揮的屬性」怎麼被量化？（§1–§2）
> 2. KOL 與話題的 Match 程度怎麼算？（§3）
> 3. 導流素材發布前怎麼預評、發布後怎麼回收、兩者怎麼對照？（§4–§5）
>
> 與 [`06` Part D](06-viral-content-framework-and-four-axis-judgment.md) 的四維判準
> **上下承接、不重複**：四維判準判的是「這支片做得好不好」（製作品質），
> 本文件判的是「這個題目該不該由這個人做」（題材配置）與「做完之後值不值得再做」（成效校準）。
> 預評估階段兩者都要跑：Match 決定要不要開工，四維決定要不要發片。

---

## §0 三個底層原則

### 原則一：KOL 與話題必須用同一套座標

不能用形容詞描述 KOL（「知性」「溫暖」），再用另一套形容詞描述話題（「熱門」「爭議」），
然後靠感覺配對。兩邊必須**投影到同一組軸**上，Match 才能算，也才能被質疑與修正。

本 repo 採用**八軸屬性向量**（`kols/topic-axes.json`）：KOL 的分數是「他能發揮多少」，
話題的分數是「這題目需要多少」。Match 是兩個向量的重疊程度。

### 原則二：分數要能回溯到原始文件

`topic_affinity.json` 的每一軸都附 `axis_evidence`，指出這個分數是從 `profile.json` 的哪一句推出來的。
**沒有 evidence 的分數視為未定義**，不可進入計算。

### 原則三：合規紅線不參與加權，只做否決

紅線不是「扣幾分」的問題。`severity: "veto"` 命中就是 0 分並標記 `blocked`，
不論熱度多高、Match 多好——沿用 `06` Part D 的一票否決慣例。
這對 showgame.live 三位（xiaoxiao-tan / faye-tan / loima-cheung）的博弈合規紅線尤其關鍵。

---

## §1 八軸屬性向量（Attribute Axes）

定義在 `kols/topic-axes.json`，KOL 側資料在 `kols/{id}/topic_affinity.json` 的 `persona_axes`。

| 軸 | key | 這一軸在問什麼 |
|----|-----|--------------|
| 理性拆解 | `analysis` | 能不能把事情拆成規則／機率／設計邏輯來講 |
| 敘事張力 | `narrative` | 能不能把它講成一個有人物與弧線的故事 |
| 情緒共鳴 | `emotion` | 能不能讓觀眾「被說中」 |
| 視覺表現 | `visual` | 場景、光影、空間資訊量撐不撐得起畫面 |
| 專業權威 | `authority` | 有沒有身分／實績／長期積累背書 |
| 生活貼近 | `daily` | 日常感、可複製、隨手記錄的程度 |
| 反直覺衝突 | `contrarian` | 能不能製造認知反差（**不等於製造焦慮**） |
| 嚮往感 | `aspiration` | 有沒有「我也想成為那樣」的牽引力 |

分數範圍 0–100。**不要把每個人都打成 80 分以上**——沒有低分軸的向量無法區分人選，
等於沒有資訊。實務上每位 KOL 應該有 2–3 軸落在 50 以下。

### 1.1 話題側的軸需求（axis_demand）

話題有三種取得軸需求的方式，優先序由上而下：

1. **手動指定**：`topic_hooks[].axis_demand`，用於重點連結點。
2. **領域預設**：套 `topic-axes.json` 的 `domain_axis_demand[domain]`。
3. **Tag 規則微調**：從 Apify 抓回的原始 Tag 只有文字，先分類到 domain，再依關鍵字規則對個別軸加減
   （實作於 `dashboard/server/lib/topics/classify.js`）。

---

## §2 建模素材屬性（Material Attributes）

`topic_affinity.json` 的 `material_attributes` 記錄這位 KOL **實際手上有什麼**：
身分參考圖張數、生成模型、一致性策略、視覺語言、色盤、可用格式。

這一段不進 Match 公式，但進**可執行性檢查（Feasibility Gate）**：
如果一個話題最佳表現形式是「多場景敘事長片」，而該 KOL 只有 3 張身分參考圖、沒有 Reference Element，
Dashboard 會在素材企劃階段標示風險，而不是等生成失敗才發現。

---

## §3 Match 分數（KOL × 話題）

### 3.1 五個維度與權重

```
matchScore = 0.30 · personaFit
           + 0.25 · pillarFit
           + 0.20 · topicHeat
           + 0.15 · regionFit
           + 0.10 · (100 − riskScore)
```

| 維度 | 算什麼 | 資料來源 |
|------|--------|---------|
| `personaFit` 人設契合 | KOL 八軸向量與話題軸需求的加權重疊 | `persona_axes` × `axis_demand` |
| `pillarFit` 支柱覆蓋 | 話題落得進哪個內容支柱，用支柱權重加權 | `profile.json content.pillars` |
| `topicHeat` 話題熱度 | 量體、成長率、互動率的合成分數 | Apify（Threads / TikTok / IG） |
| `regionFit` 地區契合 | 話題地區、語言與 KOL 覆蓋範圍的重疊 | `reach.regions` / `reach.language` |
| `riskScore` 紅線風險 | 紅線關鍵字命中程度（反向計入） | `redlines` |

### 3.2 personaFit：加權餘弦相似度

單純的餘弦相似度會讓「兩邊都低」也算高分。所以採用**需求加權的達成率**：

```
personaFit = Σ_i ( w_i · min(kol_i / max(demand_i, 1), 1) ) / Σ_i w_i × 100
其中 w_i = demand_i / 100      （需求越高的軸，權重越大）
```

語意是：**話題要求越高的軸，越要看 KOL 在那一軸夠不夠**；
KOL 在話題不需要的軸上再高，也不加分。這避免了「全才假象」。

### 3.3 pillarFit：關鍵字覆蓋 × 支柱權重

對 `content.pillars` 的每一根支柱，計算話題與「支柱名稱＋描述＋`pillar_keywords`」的覆蓋率 `cov`，取：

```
pillarFit = max_p ( min(cov_p × 2.5, 1) × (0.6 + 0.4 · normalizedWeight_p) ) × 100
```

支柱權重高（例如 30%）的支柱命中會被放大，因為那是這位 KOL 的主戰場。
若話題已用 `topic_hooks[].pillar` 明確綁定支柱，直接以該支柱計算並給予 `bound: true` 標記
（下限 70——人已經判斷過了，關鍵字漏抓不該推翻編輯決定）。

**三個實作上必須處理的細節：**

1. **簡繁與中英混排。** 支柱名稱與描述多為繁體或英文，話題多為簡體
   （SG／MY／CN 三地人設依 `06` 的規則發簡體）。比對前一律轉成簡體
   （`dashboard/server/lib/text.js`），否則「概率」永遠對不上「機率」。
2. **CJK 沒有詞界。** 整句子字串比對太嚴、單字比對太鬆，一律取**二元字組（bigram）**比對；
   英文取 3 字以上的詞並去停用詞。短英文 tag 必須做詞界比對——否則 `ai` 會命中 `daily`。
3. **`pillar_keywords` 是必要資料，不是加分項。** 支柱描述以英文長句為主時，
   光靠描述的覆蓋率永遠接近 0。每位 KOL 的 `topic_affinity.json` 都要為每根支柱列出
   中英文＋簡繁的比對關鍵字；命中宣告關鍵字時 `cov` 下限拉到 0.7。
   **關鍵字要具體。** 「判斷」「選擇」「故事」「工具」這類泛用詞會讓所有支柱都命中，
   等於沒有支柱——寫進去之前先問「這個詞會不會出現在別人的支柱裡」。

**無支柱對應的封頂規則：** 若所有支柱的覆蓋率皆為 0，`pillar` 回傳 `null`，
且總分封頂在 C 級上緣（`min(raw, 54 + 0.1 · raw)`，最高 64）。
一個在這個帳號上找不到家的題目，再熱都不該排進製作；封頂用的是淺曲線而非硬切，
被封頂的題目彼此之間仍然可以排序。

### 3.4 topicHeat：三個訊號的合成

```
topicHeat = 0.45 · log 標準化(volume)
          + 0.35 · 標準化(growth_7d)
          + 0.20 · 標準化(engagement_rate)
```

- `volume` 用對數標準化，因為社群量體是長尾分布，線性標準化會讓前一兩名吃光分數。
- `growth_7d` 是七日成長率，**它比絕對量體更重要於選題**——量體大但已見頂的題目導流效率差。
- 三個訊號都取當次查詢結果集內的相對位置（min–max），所以 `topicHeat` 永遠是「在這批話題裡的相對熱度」。

### 3.5 regionFit

```
regionFit = 60 · regionOverlap + 40 · languageMatch
```

`regionOverlap` 依 KOL `reach.regions` 的排序給遞減權重（第一順位地區命中 = 1.0，第二 = 0.85，依此類推）；
`languageMatch` 為 1 / 0.5（同語系不同字體，如 zh-Hans vs zh-Hant）/ 0。

### 3.6 riskScore 與一票否決

對每條 `redlines` 做關鍵字比對（話題標題 + tags + 樣本貼文文字）：

| severity | 命中效果 |
|----------|---------|
| `veto` | `matchScore = 0`，狀態 `blocked`，並回傳命中的規則與關鍵字 |
| `high` | riskScore += 40 |
| `medium` | riskScore += 20 |

riskScore 上限 100。**`blocked` 的組合不會出現在任何推薦清單裡**，但仍會被列在
「已排除」區塊並附原因——被擋掉的理由本身是有價值的資訊，不該被隱藏。

### 3.7 分級

| matchScore | 等級 | 建議動作 |
|-----------|------|---------|
| ≥ 80 | A｜強配 | 直接排進製作 |
| 65–79 | B｜可做 | 需要一個明確的切角才開工 |
| 50–64 | C｜勉強 | 只在缺題時使用，且要補足最弱的那一軸 |
| < 50 | D｜不建議 | 換人或換題 |
| blocked | ✕｜否決 | 紅線命中，不論分數 |

---

## §4 導流素材前後評估

### 4.1 預先評估（Pre-evaluation）

在素材**生成之前**跑，由三塊組成：

**(1) 配置分數** — §3 的 `matchScore`，決定「該不該由這個人做這題」。

**(2) 四維預估** — `06` Part D 的娛樂性／音樂性／真實性／動作流暢性，1–5 分。
預評階段是**企劃者對這份腳本的自評**，門檻同樣是各軸 ≥ 4；
`動作流暢性 ≤ 2` 或 `娛樂性 ≤ 2` → 直接退回改腳本，不進生成佇列。

**(3) 導流漏斗預測** — 從 KOL 的 `baseline_funnel` 出發，用 Match 分數做乘數：

```
lift          = 0.7 + 0.6 · (matchScore / 100)          # Match 50 分 ≈ 1.0 倍，100 分 ≈ 1.3 倍
predViews     = avg_views · lift · heatMultiplier        # heatMultiplier = 0.85 + 0.3 · (topicHeat/100)
predEngage    = predViews · engagement_rate · lift
predVisits    = predViews · profile_visit_rate · lift
predClicks    = predVisits · link_ctr
predConv      = predClicks · conversion_rate
```

> **這組乘數是初始假設，不是事實。** `baseline_funnel.assumed = true` 代表這位 KOL 還沒有實績，
> 預測值只能當**相對排序**用（A 案比 B 案好），不可當絕對承諾。
> §5 的校準流程存在的意義就是把它逐步變成事實。

預評結果存成一筆 `pre_evaluation` 記錄，欄位包含 `matchSnapshot`（當下的五維分數）——
**必須存快照**，否則之後話題熱度變了，就無法做誠實的對照。

### 4.2 後續評估（Post-evaluation）

素材發布後，從 **Match 庫**（`match_records`：由 Apify／平台回傳的實際成效資料表）抓回實績：

| 分類 | 欄位 |
|------|------|
| 觸及 | `views`, `reach`, `avg_watch_time`, `completion_rate` |
| 互動 | `likes`, `comments`, `shares`, `saves` |
| 導流 | `profile_visits`, `link_clicks`, `conversions` |
| 品質 | 四維實測分數（發片後由審片者回填，或以完播率／重看率推估） |

實測互動率 = `(likes + comments + shares + saves) / views`。

### 4.3 對照分析（Delta Analysis）

逐項計算：

```
delta_x   = actual_x − predicted_x
variance  = (actual_x − predicted_x) / max(predicted_x, 1)
```

判讀規則：

| variance | 判讀 | 動作 |
|----------|------|------|
| > +30% | 低估 | 該題材／該軸被低估，提高對應權重 |
| −15% ~ +30% | 命中 | 模型可用，不動 |
| < −15% | 高估 | 檢查是預測乘數太樂觀，還是製作品質沒到（看四維實測） |

**歸因分流**：漏斗要逐層看，不能只看最後的轉換數。

- `views` 準、`link_clicks` 差 → 題選對了，**素材的導流設計（CTA／結尾）有問題**。
- `views` 差、後續各層轉換率正常 → **選題或發布時機問題**，不是素材問題。
- 各層都差且四維實測低 → 製作品質問題，回 `06` Part D 逐軸修。

---

## §5 校準迴圈（Calibration Loop）

每累積 **10 筆**完成後評估的記錄，跑一次校準：

1. 對每位 KOL，用實際 `views / engagement / visits / clicks / conversions` 的中位數
   回寫 `baseline_funnel`，並把 `assumed` 設為 `false`。
2. 檢查 `matchScore` 與實際互動率的相關性。若相關係數低於 0.3，代表五維權重配錯了——
   優先檢討 `topicHeat` 的權重（社群熱度與導流成效的關係最不穩定）。
3. 若某位 KOL 的某一軸持續高估（該軸需求高的題目一律表現不如預期），
   下修 `persona_axes` 該軸分數，並在 `axis_evidence` 註記校準日期與依據。

> 校準只改資料（`topic_affinity.json`），不改公式。公式要改，得先改本文件。

---

## §6 三條作業流程（Workflow Directions）

Dashboard 頁簽二提供三個方向的交叉查詢，三者共用同一個 §3 的引擎：

| 方向 | 輸入 | 輸出 | 使用時機 |
|------|------|------|---------|
| **(a) KOL → 話題** | 一位 KOL | 該地區前十大話題依 matchScore 排序 | 這個人這週該做什麼 |
| **(b) 話題 → KOL** | 一個話題／Tag | 全部 KOL 依 matchScore 排序 | 這個熱點該派誰上 |
| **(c) 組合 → 素材** | KOL × 1–3 個話題 | 素材企劃草案 + 預評分數卡 | 決定了人與題，要開工 |

**交叉查詢（Cross-query）** 是 (a)(b) 的共同底層：多個 Tag 之間做交集／聯集，
再把結果丟回同一個引擎。實務上最有價值的用法是**兩個 Tag 的交集**——
單一 Tag 太大（人人都能做），三個以上通常無資料。

方向 (c) 產出的素材企劃草案包含：綁定支柱、開場鉤子方向、建議格式、
可用場景（取自 `profile.json ai_prompts.scenes`）、四維預估欄位、以及可執行性風險提示（§2）。
**它是給企劃者填的骨架，不是自動生成的成品文案。**

---

## §7 資料流總覽

```
kols/{id}/profile.json ─┐
kols/{id}/topic_affinity.json ─┼─→ KOL Repository ─┐
kols/topic-axes.json ───┘                          │
                                                   ├─→ Match Engine (§3) ─┬─→ (a) KOL→話題
Apify (Threads / TikTok / IG) ─→ Topic Source ─────┘                      ├─→ (b) 話題→KOL
                                                                          └─→ (c) 組合→素材企劃
                                                                                     │
                                                          預評 (§4.1) ←──────────────┘
                                                              │
                                                          [ 生成 → 發布 ]
                                                              │
                                       Match 庫 ─→ 後評 (§4.2) ─→ 對照分析 (§4.3) ─→ 校準 (§5)
                                                                                       │
                                                                                       └─→ 回寫 topic_affinity.json
```
