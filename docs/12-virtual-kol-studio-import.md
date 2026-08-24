# 12 · Virtual KOL Studio 匯入紀錄

**來源：** `pennyhuang-oss/Virtual_KOL_Studio` — `kols/`
**匯入日期：** 2026-08-24
**範圍：** 11 位 KOL（`Project V01`–`V11`），index 版本 `1.0.0` → `1.1.0`

---

## §1 匯入了什麼、沒匯入什麼

| 項目 | 處理方式 |
|---|---|
| `profile.json` | **原樣複製**，未修改任何欄位 |
| `character.md` / `content_style.md` / `generation_notes.md` | **原樣複製** |
| `topic_affinity.json` | **本 repo 新增**——來源沒有這個檔案，四軸分析是依 `kols/topic-axes.json` 重新做的 |
| 身分參考圖 | 每位 2–4 張，放進 `images/ref/`（Dashboard 視為 identity_ref） |
| 影片、完整訓練圖集、dance_clone 系列 | **未匯入** |

未匯入媒體是刻意的：來源的 `kols/` 共約 1.7 GB，其中 872 MB 是圖、其餘是影片。本 repo 的
`kols/` 原本已有 791 MB，全量複製會讓 clone 與 CI 的成本翻倍，而 Dashboard 只需要少量參考圖
就能顯示頭像與 identity_ref 完整度。需要完整素材時回來源 repo 取，路徑記在每筆 index 的
`source` 欄位。

**已知不一致（沿用來源，未修正）：** `aaliya-okonkwo/profile.json` 的 `id` 欄位是
`aaliya-rivera`，與目錄名不同。Dashboard 讀的是 `index.json` 的 id 與目錄名，不讀
`profile.id`，所以不影響運作；保留原值是為了讓日後與來源 repo 的比對仍然是一次直接複製。

---

## §2 四軸分析怎麼做的

每一位的 `topic_affinity.json` 都是 schema v3：`credibility_mode`、`credibility_basis`、
`homophily`、四軸 `axes`、`format_fit`、`pillar_keywords`、`topic_hooks`、`redlines`、`reach`。

依 `docs/09` §0 原則二，**每個分數都附 `why`，而且 `why` 必須指得出是從 `profile.json` 的哪一句
推出來的**。沒有 why 的分數 Dashboard 會直接判為未定義並排除該軸——所以這裡沒有任何一個數字是
「看起來差不多」填上去的。

### 分數總表

| KOL | 拆解 | 敘事 | 視覺 | 可信 | 日常適配 | 相似性 | 可信度型態 |
|---|---|---|---|---|---|---|---|
| iris-chen | 15 | 42 | 90 | 28 | 90 | 74 | embodied |
| luna-tanaka | 38 | 70 | **95** | 45 | 62 | 48 | embodied |
| ananya-kapoor | 48 | 68 | 85 | 62 | 72 | 66 | hybrid |
| yuna-kim | 55 | 48 | 84 | 58 | 80 | 68 | hybrid |
| aaliya-okonkwo | 22 | 62 | 88 | 38 | 88 | 72 | embodied |
| camille-dupont | 45 | 78 | 86 | 55 | 70 | 58 | hybrid |
| vicky-lin | **60** | 72 | 80 | **70** | 78 | 70 | embodied |
| coco-wu | 18 | 55 | 68 | 22 | **95** | **88** | embodied |
| sophia-tseng | 52 | 60 | 90 | 66 | **45** | **38** | embodied |
| mia-huang | 58 | 60 | 72 | 48 | 82 | 78 | embodied |
| rainie-hsu | 32 | 58 | 92 | 52 | 66 | 54 | embodied |

讀法上有幾件事值得先講清楚：

- **視覺軸整體偏高（68–95），拆解軸整體偏低（15–60）。** 這不是評價，是這批人設的設計本來就
  以畫面為主體。與本 repo 原有的 5 位（知識文化型，拆解軸偏高）互補而非重疊。
- **`credibility` 最高的是 vicky-lin（70）與 sophia-tseng（66）**，因為兩人的人設裡有可指名的
  職業身分（私人教練副業／自營工作室）。這也正是 §3 的風險所在。
- **`format_fit` 與 `homophily` 呈現同向**：coco-wu（95／88）在光譜的一端，sophia-tseng
  （45／38）在另一端。這兩位是這批裡定位最極端的一對。

---

## §3 這批人設的三個結構性風險

這一節不是形式上的免責，是匯入後跑過引擎才看得到的東西。

### 3.1 八位宣告 `embodied`，全部會落在 G2 的「需人工覆核」

`credibility_mode` 為 `embodied` 或 `hybrid` 時，只要題目需要第一人稱親身經驗，
`credibilityModeGate` 就會標成 `undecided`——不是擋下，是要求逐題人工確認。

這批 11 位有 8 位是 `embodied`、3 位是 `hybrid`，**沒有任何一位是 `database`**。原因很直接：
她們的內容本體就是「我的早晨／我的宿舍／我的訓練／我住的飯店」。這不是可以靠改寫措辭繞開的
分類問題，是人設本身的形狀。

其中兩位風險特別高，已寫進各自的 `credibility_risk`：

- **mia-huang** — 人設是每週開台 5–6 晚的直播主。直播是即時、雙向、可被驗證的行為，一個 AI
  人設在結構上無法履行。要經營就必須把「正在直播」改成預錄內容的明示定位，否則整個人設不成立。
- **vicky-lin** — PR（個人紀錄）數字是可被量化追問、甚至可被要求現場重現的主張，加上私人教練
  身分同時命中不可能憑證（R-CREDENTIAL）。建議改寫為動作原理與課表結構的角度，不主張本人成績。

三位 `hybrid`（ananya-kapoor、camille-dupont、yuna-kim）的共同點是：**有一半內容是可查證的公開
知識**（體式解剖、產區風土、保養成分），另一半是不可查證的個人經驗。把重心壓在可查證的那一半，
是這三位唯一能同時保住可信度與產量的路。

### 3.2 全部 11 位都會觸發 `W-BLURRED-PILLAR`

來源的六大支柱是一套共用模板：**早晨／穿搭／浴室／居家／飯店／健身**。這是為圖像生成流程設計的
「場景清單」，不是內容主題。而 `W-BLURRED-PILLAR` 的建議上限是 3 根。

這是 `warn` 不是 `block`，不影響 gate，但它指出一個真實的後果：

> 場景型支柱撐不起主題型比對。camille-dupont 的飲食與風土是她的全部識別，但六根支柱裡沒有一根
> 叫「飲食」——只能掛在「在家」底下。

實務上的處理是把主題詞塞進 `pillar_keywords`（schema 本來就是為跨語言、跨用詞比對而設的）。這能
救回比對，但救不回「這個帳號的支柱是什麼」這個問題。**若這批人設要長期經營，支柱需要從場景清單
改寫成主題清單**——那是人設層的工作，不是匯入能代勞的。

### 3.3 相似性（homophily）跨度極大，不應該用同一套標準看

38（sophia-tseng）到 88（coco-wu）。sophia-tseng 的社群名稱直接叫「懂的人自然懂」，且不做抽獎、
不做互動——人設**刻意**設計成有距離感。低分在這裡不是缺陷，是設計意圖。這正是 `docs/11` 把總分
降格為分帶、並把三根長條並列顯示的理由：短板要看得見，不能被平均掉。

---

## §4 為了讓分析跑得動，順帶改的兩件事

### 4.1 `kols/topic-affinity.schema.json`：v2 → v3

這個檔案原本宣告 `schema_version` 為 `const: 2`、`additionalProperties: false`，但 repo 內**所有**
`topic_affinity.json`（含原有 5 位）早就是 v3，帶著 `credibility_mode`、`credibility_basis`、
`homophily`、`credibility_risk` 四個 v2 沒有定義的欄位。也就是說：任何人照這份 schema 驗證現有
資料，全部會失敗。

schema 落後於資料，本身就是一條沒有被執行的規格。已補上四個欄位的定義，並把
`credibility_mode` 與 `homophily` 列入 `required`——因為 Dashboard 確實會因為缺這兩者而擋下
（`validate` 的 V2）或少算一維。

### 4.2 `dashboard/server/lib/topics/fixtures.js`：補話題與地區

原本的 fixture 話題集是為知識文化型人設寫的（登山事故、概率誤區、建築保存、AI 工具）。用它跑這
11 位的結果是：**支柱比對幾乎全部得 0**。那不代表「她們不適合任何題目」，而是這份清單裡沒有她們
的題目——把它當成分析結論會是錯的。

同時 `FIXTURE_TOPICS` 缺 `KR` 與 `US` 兩區，而 yuna-kim 的 reach 是 KR、aaliya-okonkwo 是 US，
兩人都會靜默掉回 `GLOBAL`，等於拿英文語境的題目去比對首爾與洛杉磯的人設。

已補：TW +8 則生活風格題、JP +4、GLOBAL +8，並新增 KR（8 則，韓文）與 US（8 則，英文）。這些
與原有的一樣，都是**手寫佔位資料**，回應一律帶 `source: "fixtures"`，不得當成真實平台數據。

補完後的比對結果（各自 reach 的第一名）：

| KOL | 地區 | 最高分話題 | 分帶 |
|---|---|---|---|
| aaliya-okonkwo | US | `#grwm` 86.6 | 高 |
| yuna-kim | KR | `#데일리룩` 86.6 | 高 |
| camille-dupont | GLOBAL | `#slowliving` / `#frenchtable` 86 | 高 |
| rainie-hsu | TW | `#GRWM` 82.6 | 高 |
| ananya-kapoor | GLOBAL | `#yogapractice` 82 | 高 |
| luna-tanaka | JP | `#スキンケア` 78.7 | 高 |
| coco-wu | TW | `#GRWM` 77.4 | 高 |
| vicky-lin | TW | `#GRWM` 69.9 | 中 |
| mia-huang | TW | `#韓系穿搭` 67.6 | 中 |
| iris-chen | TW | `#咖啡廳巡禮` 65.4 | 中 |
| sophia-tseng | TW | `#GRWM` 63.4 | 中 |

---

## §5 已知但未處理

- **`getRegionTopics` 的快取以 `(region, platforms)` 為 key，不含 `limit`。** 先以 `limit=10`
  呼叫過的地區，之後帶 `limit=20` 會拿到快取裡那 10 筆。這是既有行為，與本次匯入無關，也不影響
  預設路徑；記在這裡是因為驗證過程中踩到過，下一個人不必再踩一次。
- **支柱比對存在描述覆蓋率造成的誤命中**（例如 `#worldcup` 命中 ananya-kapoor 的「在家」支柱，
  `keywordHits` 為空、純靠支柱描述文字的 20% 覆蓋率）。這是引擎既有的寬鬆度，對原有 5 位同樣
  適用，未在本次改動。
- **來源 repo 的影片與完整訓練圖集未同步**，見 §1。

---

## §6 驗證

```
npm ci
npm start                    # 或 PORT=8097 node dashboard/server/index.js
BASE=http://localhost:8097 npm run smoke
npm run test:redlines
```

匯入後的結果：`/api/health` 回報 16 位 KOL，smoke test 16 項全過，紅線測試第一層無誤擋。
11 位新 KOL 的 `axisIssues` 全部為 0、`pillarKeywords` 全部為 6、identity_ref 2–4 張。
