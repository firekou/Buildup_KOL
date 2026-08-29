# Buildup KOL — Character Database

KOL 角色設定資料庫。每個 KOL 為一個獨立目錄，包含結構化 JSON 資料與完整角色文件。

---

## 目錄結構

```
Buildup_KOL/
├── kols/
│   ├── index.json                  # 所有 KOL 的主索引
│   ├── schema.json                 # 標準欄位定義（JSON Schema）
│   ├── topic-axes.json             # 四軸屬性／領域／地區共用詞彙表
│   ├── topic-affinity.schema.json  # 話題連結屬性的欄位定義
│   └── {kol-id}/
│       ├── profile.json            # 結構化角色資料（符合 schema）
│       ├── topic_affinity.json     # 四軸屬性、支柱關鍵字、話題連結點、紅線
│       ├── character.md            # 完整角色 Bible（中文敘述）
│       └── content_style.md        # 內容方向與風格指南
└── dashboard/                      # 評估儀表板（Node + React，部署於 Railway）
```

---

## 現有 KOL

| ID | 姓名 | 類型 | 族裔 | 狀態 |
|----|------|------|------|------|
| [xiaoxiao-tan](kols/xiaoxiao-tan/) | Tan XiaoXiao（陳曉曉） | 智性數字人 · 規則研究者（A01 / showgame.live） | 馬來西亞華人 | draft |
| [faye-tan](kols/faye-tan/) | Faye Tan（陳曉菲） | 智性數字人 · 世界觀察者（A02 / showgame.live） | 新加坡華人 | draft |
| [loima-cheung](kols/loima-cheung/) | Zhang Qinfeng（張秦峰） | 智性數字人 · 數字體驗觀察者（A03 / showgame.live） | 馬來西亞華人 | draft |
| [rachel-ong](kols/rachel-ong/) | Rachel Ong（王瑞秋） | 邊界感型高海拔登山向導（B01） | 新加坡華裔 | draft |
| [rafael-costa](kols/rafael-costa/) | Rafael Costa / Captain（拉斐爾·科斯塔） | 現役足球運動員 × 長期主義成長陪伴型 IP（B02） | 巴西人 | draft |

### 自 Virtual KOL Studio 匯入（V01–V11）

人設與內容資料原樣複製自 `pennyhuang-oss/Virtual_KOL_Studio`；`topic_affinity.json` 為本 repo
依 `kols/topic-axes.json` 的四軸重新分析後新增。匯入範圍與已知落差見
[`docs/12-virtual-kol-studio-import.md`](docs/12-virtual-kol-studio-import.md)；
身分錨點核對與站上帳號稽核見 [`docs/13`](docs/13-identity-anchor-and-site-account-audit.md)。

| ID | 姓名 | 類型 | 族裔 | 狀態 |
|----|------|------|------|------|
| [iris-chen](kols/iris-chen/) | Iris Chen（陳芯語） | 台北 It Girl／生活風格視覺型（V01） | 台灣人 | active |
| [luna-tanaka](kols/luna-tanaka/) | Luna Tanaka（田中ひな） | 京都慢生活／攝影美學型（V02） | 日本人 | active |
| [ananya-kapoor](kols/ananya-kapoor/) | Ananya Kapoor（अनन्या कपूर） | 孟買瑜伽／身心健康型（V03） | 印度人（旁遮普） | active |
| [yuna-kim](kols/yuna-kim/) | Yuna Kim（김하은） | 首爾 K-beauty／成分保養型（V04） | 韓國人 | active |
| [aaliya-okonkwo](kols/aaliya-okonkwo/) | Aaliya Rivera | 洛杉磯拉丁裔生活風格型（V05） | 拉丁裔（墨西哥裔美國人） | active |
| [camille-dupont](kols/camille-dupont/) | Camille Dupont | 巴黎飲食／風土敘事型（V06） | 法國人 | active |
| [vicky-lin](kols/vicky-lin/) | Vicky Lin（林薇淇） | 高雄重訓／力量成長型（V07） | 台灣人 | active |
| [coco-wu](kols/coco-wu/) | Coco Wu（吳可可） | 台中校園宿舍日常型（V08） | 台灣人 | active |
| [sophia-tseng](kols/sophia-tseng/) | Sophia Tseng（曾詩妃） | 台北信義區 quiet luxury 型（V09） | 台灣人 | active |
| [mia-huang](kols/mia-huang/) | Mia Huang（黃米亞） | 新竹深夜直播／遊戲型（V10） | 台灣人 | active |
| [rainie-hsu](kols/rainie-hsu/) | Rainie Hsu（許雷妮） | 台北夜生活／Glam 造型型（V11） | 台灣人 | active |

---

## 製作標準文件（`docs/`）

| 文件 | 內容 |
|------|------|
| [01-video-generation-quick-ref](docs/01-video-generation-quick-ref.md) | 影片生成資產清單、後製管線、故障排除 |
| [02-kol-image-photography-standard](docs/02-kol-image-photography-standard.md) | 靜態圖像預設風格 Film Candid、生活化動作準則 |
| [03-kol-male-real-ip-standard](docs/03-kol-male-real-ip-standard.md) | 男性 KOL 專屬：身分錨點、造型母題、三種場域 |
| [04-kol-dance-video-generation-techniques](docs/04-kol-dance-video-generation-techniques.md) | 舞蹈原型庫、5 種打光原型、卡拍與 QA 清單 |
| [05-kol-dance-inhouse-method-and-tuning](docs/05-kol-dance-inhouse-method-and-tuning.md) | 自研舞蹈法差距分析、五維調優、取材與動作驅動 |
| [06-viral-content-framework-and-four-axis-judgment](docs/06-viral-content-framework-and-four-axis-judgment.md) | **爆款方法論**（雷達／七欄拆解／五大母公式）與**娛樂性・音樂性・真實性・動作流暢性**四維判準 |
| [09-kol-topic-match-and-evaluation-methodology](docs/09-kol-topic-match-and-evaluation-methodology.md) | **KOL × 話題 Match 公式**（四軸向量／四維加權／紅線與支柱兩道 gate）與**導流素材前後評估**、對照歸因 |
| [10-dashboard-simplification-proposal](docs/10-dashboard-simplification-proposal.md) | 把 09 從八軸五維簡化成四軸四維的八刀提案，含外部 review 推翻的判斷紀錄 |
| [11-system-redesign-spec](docs/11-system-redesign-spec.md) | **現行系統的上位規格 v1.2**（取代 09 §3 與 10 全部）：三區架構、gate 取代線性加權、維度備註、引導式流程、校準判準。§0 的五條紀律適用於之後所有規格 |
| [12-virtual-kol-studio-import](docs/12-virtual-kol-studio-import.md) | **Virtual KOL Studio 11 位匯入紀錄**：四軸分數總表、三個結構性風險（具身主張／場景型支柱／相似性跨度）、schema v2→v3 與 fixture 補題 |
| [13-identity-anchor-and-site-account-audit](docs/13-identity-anchor-and-site-account-audit.md) | **身分錨點核對**：對照 Higgsfield soul_id／Reference Element 修正選錯的參考圖（含「換錨點＝換臉」案例），與 demo.sofa-partner.com 站上 10 個帳號的稽核 |
| [14-outlier-scan-spec](docs/14-outlier-scan-spec.md) | **每週兩次離峰值掃描規格 v1.3**：人設方向層、影片離峰（頻道相對 × log-median/MAD × 序位證據）、主題身分層、地區時事（Google／Yahoo News，報導覆蓋度≠需求）、兩軌 2×2 檢視切面、scan-topic adapter 契約、durable runner、Railway 排程。§13 是 GPT-5.6 review 的逐條回應 |
| [15-outlier-scan-rewrite-plan](docs/15-outlier-scan-rewrite-plan.md) | **上述規格的改寫計畫 v1.3**：R0/R1/R2 三階段（R0、R1 已完成）、批次 0 的十項實測結果、檔案清單、成本、風險表，以及六件需要裁示的事 |
| [reviews/2026-08-24-gpt56-on-outlier-scan-spec](docs/reviews/2026-08-24-gpt56-on-outlier-scan-spec.md) | 對 docs/14 v1.0 的外部 review：6 個 P0、6 個 P1、5 個 P2，判定 NEEDS REVISION |
| [reviews/2026-08-25-scan-source-probe](docs/reviews/2026-08-25-scan-source-probe.md) ＋ [-part2](docs/reviews/2026-08-25-scan-source-probe-part2.md) | **Batch 0 來源探測實測紀錄**（十項）：半年窗只在 TikTok、profile actor 通過、新聞要走 `rss/search`、單次抽樣只有 48% 重疊 |

---

## 每週兩次的離峰值掃描（規格已定、來源已驗，尚未實作）

作業流程：**① 定義人設方向 → ② 挑出半年內國內外的離峰值影片主題 → ③ 提出人設 × 主題的結合建議**。

要點四句話：

- **「相較於一般平均值」指的是頻道自己的中位數**，不是全域平均——全域平均只會選出大頻道（[`docs/14` §3.1](docs/14-outlier-scan-spec.md)）。V1 的正式名稱是**「頻道相對候選」**：年齡偏誤還沒解決，所以不宣稱做了年齡校正，改成每次掃描把偏斜量出來（§3.2）。
- **系統不宣稱哪支影片「是離峰值」。** 排名是連續的、切點是使用者可移動的檢視參數，永遠跟結果一起顯示（§3.4.2）。
- **時事分地區查**：台灣查 Google 新聞與 Yahoo 新聞，香港／新加坡／日本各有各自的來源與查詢字串。但新聞量的是**媒體供給**，不是閱聽需求，所以欄位一律叫「報導覆蓋度」。
- **順利的話約三週後、第七次掃描前後**，才會累積到 3 個完整週週期——那是本系統第一次能合法離開 `heatConfidence: 'none'` 的條件。在那之前禁止任何「升溫／爆紅」語意。（v1.0 曾寫成「第六次」，那是算錯的：六次掃描只跨 17 天。）
- **一次掃描是一份抽樣，不是母體。** 實測：兩次背對背、參數完全相同的查詢只有 **48%** 的貼文重疊。所以跨週的差異有相當一部分是抽樣而不是世界變了——單次掃描內的跨頻道重現比跨週比較可靠。

**Batch 0 十項來源探測已全部跑完**（`docs/reviews/2026-08-25-scan-source-probe*.md`）：主判準的 profile actor 通過，Batch 1 可開工。

方向定義在 [`kols/persona-directions.json`](kols/persona-directions.json)，常數在 [`kols/discovery-config.json`](kols/discovery-config.json)（全部標了 `prior`／`user_setting`／`verified`／`view_default`）。**discovery 常數刻意不放在 `scoring-config.json`**——那是評分引擎的入口，混進去語意上就開始耦合了。

---

## 評估儀表板（`dashboard/`）

七個頁簽：**① 引導式建立 KOL · ② KOL 屬性與人設 · ③ 話題探索 · ④ 內容企劃 ·
⑤ 交叉查詢與作業流程 · ⑥ 前後評估 · ⑦ Growth OS**。
①–⑥ 的計算全部依 [`docs/09`](docs/09-kol-topic-match-and-evaluation-methodology.md)，
資料直接讀 `kols/`；⑦ 見下一節。

```bash
npm install
npm run dev        # API :8080 + Vite :5173
npm run build && npm start   # 單一服務，http://localhost:8080
```

**已部署：** https://dashboard-production-010e.up.railway.app
（Apify 已接上，地區話題為真實抓取；Volume 尚未掛載，評估記錄仍為暫存——見
[`dashboard/README.md`](dashboard/README.md)）

部署與環境變數說明見 [`dashboard/README.md`](dashboard/README.md) 與 [`.env.example`](.env.example)。
**Root Directory 要留在 repo 根目錄**，否則後端讀不到 `kols/`。

---

## Growth Hack OS（`projects/growth-hack-os/` + Dashboard ⑦）

把 Media House 從「AIGC 內容製作」升級成可量測的獲客基礎建設：
每一則內容都是某個假設的實驗 arm，帶著 `experiment_id` 一路走到產品端轉換與成本。

```text
產品特性分析 → 事件查找 → 議題 → 人設路由 → 實驗規劃 → AIGC 生成
→ 檢查鏈 → 下發 → 成效 → 轉換與歸因 → 成本 → 判定 → Winner 變異 ↺
```

Dashboard 的「⑦ Growth OS」有 11 個分頁，第一頁 **00 產品狀態**
就是這個系統的主看板：每個產品走到閉環的哪一格、卡在哪、下一步是什麼。

```bash
npm run seed:growth   # 建立一個示範產品並走完整條閉環
npm run test:growth   # 23 個測試，含完整閉環 fixture
```

規格見 [`projects/growth-hack-os/`](projects/growth-hack-os/)，
實作對照與**刻意沒有做的事**見
[`IMPLEMENTATION.md`](projects/growth-hack-os/IMPLEMENTATION.md)。

三件事值得先知道，因為它們決定了你會在畫面上看到什麼：

- **沒有綜合分數。** 人設路由給的是證據與注意事項，evaluator 給的是雙比例
  z 檢定加一個公開的最低採用門檻。在有校準資料前不製造精準感。
- **影片／圖片 adapter 尚未接上，所有平台都是「人工發布後登錄」。**
  內建的 `template` adapter 可離線跑完整條閉環（成本 0），外部生成的素材
  用 API 登錄。假素材與假發布會同時污染審查、成本與判定，所以寧可留空。
- **「—」不等於 0。** 平台沒回報的指標顯示為「—」，成本為 0 時 ROAS 顯示
  「無定義」而不是無限大。

---

## 第三方服務：AI Token King MCP

`.mcp.json` 已接上 [AI Token King](https://www.aitokenking.com.tw/) 的 HTTP MCP server
（`https://api.aitokenking.com.tw/mcp`），提供 14 個工具：模型查詢（`list_models` / `get_model`）、
文字生成（`chat_completion` / `create_message` / `create_response`）、
圖像與影片生成（`create_image_generation` / `create_video_generation` 及對應的輪詢工具）、
餘額與用量（`get_balance` / `list_usage` / `list_transactions`）。

**API key 不進 repo。** `.mcp.json` 寫的是 `${AITOKENKING_API_KEY}`，用前先在環境設好：

```bash
export AITOKENKING_API_KEY=sk-...   # 從 aitokenking 後台取得
claude                              # 啟動時會提示批准這個 MCP server
```

用途範例：把設計文件交給第三方模型做交叉 review，結果收在 [`docs/reviews/`](docs/reviews/)。

---

## 新增 KOL 流程

1. 在 `kols/` 下建立新目錄，命名規則：`{firstname}-{lastname}`（kebab-case）
2. 按照 `kols/schema.json` 建立 `profile.json`
3. 按照 `kols/topic-affinity.schema.json` 建立 `topic_affinity.json`（四軸屬性＋`format_fit`、
   支柱關鍵字、3–5 個話題連結點、紅線）——沒有這一份，該 KOL 進不了儀表板的 Match 計算。
   每軸都要寫 `why`：**沒有依據的分數視為未定義，不進計算**
4. 撰寫 `character.md`（角色 Bible）與 `content_style.md`（內容指南）
5. 在 `kols/index.json` 新增對應紀錄

---

## Schema

所有 `profile.json` 須符合 [`kols/schema.json`](kols/schema.json) 定義的結構，主要欄位：

- `meta`：建立時間、狀態、分類、參考帳號
- `identity`：姓名、年齡、族裔、現居地、語言、外型
- `persona`：人物原型、個性、價值觀、背景故事、語氣風格
- `content`：內容支柱、格式、發文頻率、視覺美學、品牌合作原則
- `social`：各平台帳號資訊、互動風格、粉絲社群名稱

---

## 延伸研究：本地端互動 AI 伴侶

`research/local-ai-companion/` 是一條探索中的延伸研究：如何把 `kols/` 裡的靜態人格資料，變成一個
可在本地端即時對話的 AI 伴侶（文字互動優先，語音/虛擬形象/直播為預留擴充）。詳見該資料夾的
`README.md`，以及新增的三個專責 subagent：`local-ai-companion-architect`、
`livestream-tech-specialist`、`local-llm-engineer`（定義於 `.claude/agents/`）。
