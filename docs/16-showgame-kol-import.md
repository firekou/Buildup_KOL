# 16 · showgame-kol 匯入紀錄

**來源：** `pennyhuang-oss/showgame-kol` — `kols/`
**匯入日期：** 2026-09-05
**範圍：** 10 位 KOL——5 位重新同步（`Project A01`–`A03`、`B01`–`B02`）＋ 5 位新增（`Project B03`–`B07`）
**index 版本：** `1.1.0` → `1.2.0`（16 → 21 位）

---

## §1 為什麼這次是「同步」不是「第一次匯入」

`A01`–`A03` 與 `B01`–`B02` 這 5 位本來就在本 repo，因為它們最初就是從
`showgame-kol` 過來的。來源 repo 是它們的**生產現場**（每天在排程、發布、被客戶退稿），
所以那邊的 `profile.json` 與 `character.md` 一直在往前走，本 repo 的副本停在匯入當天。

實際落差就是這個形狀——來源全部比較新，而且新的是同一類東西：

| 檔案 | 5 位都變了嗎 | 變的是什麼 |
|---|---|---|
| `profile.json` | 5/5 | `updated_at` 一律推到 2026-08-18；`handle` 換成真實帳號；`meta.status` 改成客戶自己的講法 |
| `character.md` | 5/5 | 實跑之後補進去的判斷與教訓 |
| `content_style.md` | 5/5 | 同上 |
| `character-card.md` | 2/5（xiaoxiao-tan、loima-cheung） | — |
| `visual_prompts.md` | 1/5（rafael-costa） | — |

最有代表性的一筆：`rachel-ong` 的臉部特徵原本寫「左眉一道淡疤」，來源 repo 在 2026-08-24
改成「右側髮際線附近一道紅褐色細疤」，理由直接寫在欄位裡——**因為實際的參考照就是那樣**。
本 repo 的舊值會讓後續生成的圖跟已經鎖定的三張參考照對不上。

---

## §2 匯入了什麼、沒匯入什麼

| 項目 | 處理方式 |
|---|---|
| `profile.json` | **原樣複製**（唯一例外見 §5） |
| `character.md` / `content_style.md` / `character-card.md` / `visual_prompts.md` | **原樣複製** |
| `character-v0-客戶原始版-已作廢.md`（kai-luo、leon-lim） | **原樣複製**——它是改版授權的憑據，不是可用的人設 |
| `貼文文案-修訂紀錄.md`（leon-lim） | 原樣複製 |
| `topic_affinity.json` | **本 repo 新增**——來源沒有這個檔案，四軸分析是依 `kols/topic-axes.json` 重新做的（見 §3） |
| `images/ref/`（kai-luo、leon-lim 各 3 張鎖臉照） | 匯入 |
| `images/生活照/`（kai-luo 5 張、leon-lim 5 張） | 匯入——這兩位在本 repo 原本一張圖都沒有，沒有它們 Dashboard 連頭像都給不出來 |
| `images/生活照/`（rachel-ong 7 張、rafael-costa 7 張，共 109 MB） | **未匯入**——兩位的 `images/ref/` 三張鎖臉照本 repo 已有且與來源逐位元相同，這 14 張是場景照不是身分錨點 |
| `cathy-v1-提燈軍綠版-未採用.png` / `cathy-v2-高馬尾版-未採用.png` | **未匯入**——標示未採用的設計稿，進了 `images/` 會被 Dashboard 當成場景圖顯示 |
| 影片、`social media/<日期>/`、`prompt list/`、`圖文/` | **未匯入** |

沒匯入媒體的理由跟 `docs/12` 那次一樣，但這次的數字要講清楚：來源 repo 這 10 位的
git 追蹤檔案合計約 1.5 GB，其中絕大多數是影片與逐日素材。本 repo 的 `kols/` 已經是
797 MB，全量複製會讓 clone 與部署成本翻倍，而 Dashboard 只需要少量參考圖就能顯示頭像
與 identity_ref 完整度。需要完整素材時回來源 repo 取，路徑記在每筆 index 的 `source` 欄位。

---

## §3 四軸分析怎麼做的

5 位新人設的 `topic_affinity.json` 都是 schema v3。依 `docs/09` §0 原則二，
**每個分數都附 `why`，而且 `why` 必須指得出是從來源檔案的哪一句推出來的**——沒有 why
的分數 Dashboard 會直接判為未定義並排除該軸，所以這裡沒有任何一個數字是「看起來差不多」
填上去的。

### 分數總表

| KOL | 拆解 | 敘事 | 視覺 | 可信 | 日常適配 | 相似性 | 可信度型態 |
|---|---|---|---|---|---|---|---|
| kai-luo（羅凱西） | 55 | 78 | **92** | 62 | **22** | **34** | database |
| leon-lim（林曜） | 62 | **92** | 80 | 78 | 28 | 38 | database |
| nova-lin（林諾） | 72 | 74 | 58 | **40** | **80** | 74 | database |
| rhea-chou（周嵐） | **84** | 74 | 88 | 82 | 38 | 55 | **embodied** |
| zane-chen（陳崢） | 80 | 88 | **28** | 74 | 48 | **82** | **embodied** |

幾件值得先講清楚的事：

- **這 5 位跟既有 16 位互補，不是重疊。** `V01`–`V11` 那批是視覺軸高、拆解軸低的生活風格型；
  這一批的重心在敘事與拆解，`zane-chen` 的視覺軸 28 是全 repo 最低——而那是刻意的，
  他的文件直接禁止展示豪車、現金與奢華場所。
- **`nova-lin` 的可信度軸 40 是設計決定不是缺陷。** 她公開自己是 AI，等於主動放棄職業權威；
  她能站的位置只剩「我把方法演給你看」。
- **`kai-luo` 的日常適配 22 是全 repo 最低。** 她的三根支柱全部在書裡的世界，
  而且與旅遊姊的分界寫死「不做現實城市題材」——隨手記錄的切角在她身上不成立。

### 支柱名稱怎麼取的

`kai-luo` 有 `profile.json`，`pillar_keywords` 的鍵直接對上它的 `content.pillars[].name`
（Match 引擎就是這樣查的）。另外 4 位來源沒有 `profile.json`，鍵取自各自 `character.md`
的支柱／欄目名稱——**這是為了以後補上 `profile.json` 時鍵能直接對上**，不是現在就能用（見 §4）。

---

## §4 三個已知落差（不修，但要知道）

### 4.1 四位沒有 `profile.json`，Dashboard 的支柱維度會回 0

`leon-lim`、`nova-lin`、`zane-chen`、`rhea-chou` 在來源 repo 就沒有 `profile.json`。
Match 引擎的 `pillarFit()` 讀的是 `profile.content.pillars`，讀不到就回
`score: 0, needsBinding: true`。

**那個 0 的意思是「還沒有可讀的支柱定義」，不是「這個人設跟這個題目不合」——
兩者在畫面上長得一模一樣。** 這是這次匯入最容易被誤讀的一個數字。

沒有代寫是刻意的：`profile.json` 是來源端的資產，本 repo 憑空生一份出來，
下次比對就不再是一次直接複製，而且會有人拿它當真相。四軸分析可以由本 repo 做
（它本來就是本 repo 的分析層），支柱定義不行。

### 4.2 `meta.status` 的值不在本 repo 的 schema 值域內

來源的 5 份 `profile.json` 都把 `meta.status` 寫成 `"正在經營中"`，而
`kols/schema.json` 的值域是 `active` / `draft` / `archived`。

**不改，因為 Dashboard 不讀 `profile.meta.status`，它讀 `index.json` 的 `status`**，
那一欄已經照來源 repo 的 index 校正過（含 `rafael-costa` 的 `retired`）。改了反而
讓兩邊的比對變成一次翻譯而不是一次複製。同樣道理沿用 `docs/12` §1 對
`aaliya-okonkwo` 的處理。

⚠ 順帶一個時間差：`rafael-costa` 的 `profile.json`（08-18）還寫著「正在經營中」，
但來源 index 在 **08-19 把他停用**。**以 index 為準**。

### 4.3 `nova-lin` / `zane-chen` / `rhea-chou` 沒有任何參考圖

來源 repo 的 `images/` 只有 `.gitkeep`。Dashboard 會顯示 `identityRefs: 0`、沒有頭像。
這是誠實的空白，不是漏匯。

---

## §5 唯一改過的一筆來源資料：kai-luo 的 `content.pillars`

來源的 `kai-luo/profile.json` 把 `content.pillars` 寫成**字串陣列**，而本 repo 其他
16 份 `profile.json` 全部是 `{name, description, weight}` 的物件陣列——Match 引擎
`pillarFit()` 讀的是 `p.name`，拿到字串會讀到 `undefined`，不會報錯，只會安靜地算出
一組沒有意義的分數。

處置：把三根支柱正規化成 `{name, description}`，**原字串一字不動地保留在 `description`**，
`name` 取原字串 `——` 之前的那一段。**`weight` 沒有補**——來源沒有百分比，
本 repo 不編一個出來（`docs/09` §0 原則二的同一條理由）。

---

## §6 紅線檢查跑了，第二層判定寫在這裡

`.claude/skills/kol-redline-check/check.mjs` 對 5 份新 `topic_affinity.json` 逐一跑過。
第一層 lint 現在 **0 block / 0 warn**，但那個 skill 自己說得很清楚：**只跑第一層不算檢查過。**
第二層是語意判定，結論如下：

| 規則 | 判定 |
|---|---|
| **R-EMBODIMENT** | **`rhea-chou` 與 `zane-chen` 確實是具身型人設，沒有辦法改寫掉。** 兩人的 `credibility_mode` 已如實填 `embodied`，風險逐條寫進 `credibility_risk`，不粉飾。`kai-luo` 與 `leon-lim` 的來源文件本身就有硬規則在擋（見下），`nova-lin` 公開是 AI，不成立。 |
| **R-CREDENTIAL** | 5 份都沒有把機構憑證掛在角色身上。`rhea-chou` 的紀錄片攝影訓練寫在 `credibility_basis` 且 `verifiable: false`。 |
| **R-AI-DISCLOSURE** | `nova-lin` 與 `rhea-chou` 的來源文件明文要求揭露 AI 身分，已寫進紅線。⚠ `leon-lim` 的 `character.md` 反而寫「本專案目前對外未揭露 AI 身分」——那是來源端的營運決定，本 repo 只記錄不改，但它是談品牌合作前要先解掉的東西。 |
| **W-BLURRED-PILLAR** | 初版被抓到兩個泛用關鍵字（`nova-lin` 的「内耗」、`zane-chen` 的「边界」）——這種詞在任何帳號上都會命中，等於那根支柱沒有邊界。已改成「情绪内耗」「资金边界」。 |

**還修掉一個假陽性**：`leon-lim` 的 `credibility_risk` 原本直接引用了他文件裡那句被禁止的
在場句，結果被 lint 當成具身主張抓下來。已改寫成描述那條規則而不複述那句話——
**一個每次都會誤報的 lint，會訓練所有人忽略它。**

---

## §7 這批人設裡風險最高的那一個

`zane-chen` 的紅線密度是全 repo 最高的（8 條，7 條 block），而理由不是題材敏感，
是**做壞了不是掉粉是傷人**：他的受眾是賭博成癮者與替他們還錢的家屬。

他的來源文件已經把三種公眾爭議自己寫出來了（利用過去洗白／地下經歷被傳奇化／
沒有專業資格），處理方式全部是「更誠實」而不是「更多證明」。所以有一條要特別記住：
**任何一句把地下賭場經歷寫成能力或身份資本的文案，會同時打掉他的可信度與合規。**
動筆前先讀 `kols/zane-chen/character.md` 第十一章。

另外一條要盯的界線：`zane-chen` 與 `xiaoxiao-tan`（賭博哥）題材相鄰但軸不同——
**賭博哥拆機率與期望值，陳崢拆「那個人為什麼還坐在那裡」。** 兩人的
`topic_hooks` 都寫了這條界線。

---

## §8 一個程式面的修正

`dashboard/server/lib/kols.js` 原本寫 `profile ? collectImages(...) : []`——
沒有 `profile.json` 就連圖都不收。但 `collectImages()` 本來就能吃 `null` profile
（它對 `profile?.ai_assets` 用的是選擇性存取），而圖是從磁碟掃出來的、跟 profile 無關。

這個 gate 的實際後果是：`leon-lim` 的三張鎖臉照與五張生活照明明在 repo 裡，
Dashboard 卻一張都不顯示，只因為來源 repo 從來沒有給過他 `profile.json`。已移除該 gate。

---

## §9 匯入後的狀態

```
kols/index.json  version 1.2.0 · 21 位
  A01–A03  xiaoxiao-tan / faye-tan / loima-cheung   active   已同步
  B01      rachel-ong                                active   已同步
  B02      rafael-costa                              retired  已同步（來源 08-19 停用）
  B03      nova-lin                                  draft    新增
  B04      kai-luo                                   active   新增
  B05      leon-lim                                  active   新增
  B06      zane-chen                                 draft    新增
  B07      rhea-chou                                 draft    新增
  V01–V11  Virtual KOL Studio 那批                   active   未動
```

| 人設 | profile | affinity | 鎖臉照 | 總圖數 | topic hooks |
|---|---|---|---|---|---|
| kai-luo | ✅ | ✅ | 3 | 8 | 5 |
| leon-lim | ❌ | ✅ | 3 | 8 | 6 |
| nova-lin | ❌ | ✅ | 0 | 0 | 5 |
| rhea-chou | ❌ | ✅ | 0 | 0 | 5 |
| zane-chen | ❌ | ✅ | 0 | 0 | 5 |

**驗證：** `npm run test:redlines` 與 `npm run test:probe` 全過；21 位透過
`dashboard/server/lib/kols.js` 實際載入成功，`axisIssues` 全部為 0。
⚠ `npm run test:growth` 在這個環境跑不起來——缺 `opencc-js`，而這台機器裝不了套件
（npm registry 被出站政策擋掉，回 403）。**那不是這次改動造成的，是這台機器沒有
`node_modules`**；有網路的環境請補跑一次。

---

## §10 下一步（不做就會慢慢失真）

1. **`leon-lim` 的 `profile.json`** ——他是 `active`、六平台都在發，卻是這批裡唯一
   有完整內容規則但沒有結構化資料的。**應該由來源 repo 補，本 repo 再同步**，
   不要在這邊生。
2. **`nova-lin` / `zane-chen` / `rhea-chou` 的參考圖與 `content_style.md`** ——
   來源那三位還停在客戶原始版，本 repo 只能跟著停。
3. **下次同步先跑一次逐檔 md5 比對**——這次 5 位的落差全部集中在 4 個檔名，
   比對成本很低，沒有必要靠記憶判斷誰比較新。
