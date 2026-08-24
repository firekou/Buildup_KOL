# 13 · 身分錨點核對與站上帳號稽核

**日期：** 2026-08-24
**範圍：** 自 Virtual KOL Studio 匯入的 11 位（`Project V01`–`V11`）
**起因：** 使用者指出 Dashboard 上「有一些選的照片是錯的」，要求對照 Higgsfield Soul ID 做最後確認。

---

## §1 照片為什麼會選錯

`docs/12` 的匯入是用「檔案較小者優先」挑參考圖的。這個規則在 5 位 Higgsfield Soul 型
KOL 身上剛好沒事——她們的 `face_reference/` 只有 `ref_01`–`ref_04` 四張 webp，就是訓練
Soul 用的那一組。

但在 6 位 Seedream + Reference Element 型 KOL 身上，這個規則**系統性地挑錯**：

| 檔名 | 是什麼 |
|---|---|
| `candidate_01`–`04.png` | **使用者已核准的最終選角批次**，錨點就從這裡選 |
| `round1_` / `round2_` / `round3_candidate_*.png` | **早期輪次，已被使用者否決** |

早期輪次的檔案比較小，所以「挑小的」等於「挑被否決的」。

最嚴重的是 **rainie-hsu**。她的 `generation_notes.md` 2026-08-05 明寫：v1 錨點
`candidate_01` 身材不符 94-59-92 設定，改用 `candidate_02`，並且——

> **⚠️ 換錨點＝換臉**：`candidate_01`–`04` 是各自獨立生成的 4 個人，換錨點不只換身材，
> 五官也會跟著換成 `candidate_02` 的臉。

也就是說，先前顯示的 `round1_candidate_01/03/04` 不只是舊版本，**是不同的人**。

---

## §2 核對後的身分錨點對照表

Soul ID 與 Reference Element 逐一取自來源 repo 的 `generation_notes.md`。
**其中 6 位的 `soul_id` 根本沒有寫進 `profile.json`**，只存在於 notes 裡。

| KOL | Higgsfield soul_id | Reference Element | 錨點圖 | 先前顯示的圖 |
|---|---|---|---|---|
| aaliya-okonkwo | `97f5c6cd…` | — | `ref_01`–`04`（Soul 訓練集） | ✅ 本來就對 |
| ananya-kapoor | `fac82296…` | — | `ref_01`–`04` | ✅ 本來就對 |
| camille-dupont | 未記錄（僅註明 soul_2） | — | `ref_01`–`04` | ✅ 本來就對 |
| luna-tanaka | `a3dc13ec…`（v2，取代 `1bfab2ce…`） | — | `ref_01`–`04` | ✅ 本來就對 |
| yuna-kim | `235794a5…` | — | `ref_01`–`04` | ✅ 本來就對 |
| **coco-wu** | `cf7045dc…` | `4b6c659c…` | `candidate_01.png` | ❌ `round1_candidate_02/04` |
| **mia-huang** | `e2f562ba…` | `92ffbd80…` | `candidate_02.png` | ❌ `round1_candidate_01/02/04` |
| **rainie-hsu** | `a4a000fe…`（v2） | `a469f98d…`（v2） | `candidate_02.png` | ❌ `round1_candidate_01/03/04`（**不同人**） |
| **sophia-tseng** | `192562bb…` | `980f8414…` | `candidate_01.png` | ❌ `round2_candidate_02/04`、`round1_candidate_04` |
| **vicky-lin** | `bdb1d879…` | `9f076fab…` | `v3_06_3q_fullbody.png` | ❌ 取了 `v3_04/05/07`，**唯獨漏掉錨點本身** |
| **iris-chen** | `5fe3b6ba…` | — | 無 face_reference，Soul 直接以 `training_v1` 訓練 | ⚠️ 四張全是同一個場景（cafe_window） |

### 逐張目視核對

五張錨點都用 Read 工具實際看過，對照 `profile.identity.appearance` 的設定：

- **rainie-hsu** — 沙漏身形明確（v2 換錨點的目的），長直黑髮、金色耳環。✅
- **sophia-tseng** — 柔圓臉、無顴骨稜角、淺內雙、暖栗棕低盤髮、**左眼尾下方小痣**、
  奶油色喀什米爾針織。與設定逐項吻合。✅
- **mia-huang** — 灰棕波浪髮 + **粉色 money-piece 挑染**、RGB 直播間、寬鬆黑帽 T、
  耳機、貓玩偶。✅
- **coco-wu** — 娃娃臉、笑起來有梨渦、蓬鬆落散劉海、開襟針織外套、宿舍軟木塞板。✅
- **vicky-lin** — 練出來的沙漏身形（非健美選手線條）、高馬尾、運動內衣＋高腰緊身褲、
  運動手錶、黃金時段戶外。✅

---

## §3 修法：不再靠檔名排序

Dashboard 的 `collectImages()` 本來就有確定化機制——優先讀 `ai_assets.seed_images` 與
`ai_assets.avatar_image`，其餘才掃目錄並依檔名排序。先前沒有寫這兩個欄位，頭像就是
「檔名排序第一張」，這正是選錯照片的機制原因。

現在 11 位的 `profile.json` 都補上：

```json
"ai_assets": {
  "identity_anchor": { "platform": "Higgsfield", "soul_id": "…", "reference_element_id": "…",
                       "anchor_image": "images/ref/anchor__candidate_02.webp",
                       "anchor_source_in_studio": "images/face_reference/candidate_02.png",
                       "verified_at": "2026-08-24", "verified_how": "…", "note": "…" },
  "avatar_image": { "file": "images/ref/anchor__candidate_02.webp" },
  "seed_images": [ { "file": "…", "role": "anchor" }, … ]
}
```

錨點永遠排在 `seed_images` 第一位，且直接指定為 `avatar_image`。

**順帶解決了檔案大小問題。** `docs/12` §1 曾記錄 coco-wu 只有 2 張參考圖，因為她的
`face_reference` 檔案都超過大小上限而無法縮圖。現已改用 Pillow 統一縮到長邊 1600px、
WebP q88：**每張從 3–5MB 降到約 100KB**，11 位全部都有 4 張，而且是正確的那 4 張。

---

## §4 站上帳號稽核（demo.sofa-partner.com）

該站是 SPA，內容由 API 提供（`POST /api/search/artist-list`、`POST /api/artist/info`）。
本環境的瀏覽器無法連外（Chromium 連 example.com 都 `ERR_CONNECTION_RESET`），改以
HTTP 直接呼叫其 API 取得資料。逐筆結果見
[`kols/site-accounts.sofa-partner.json`](../kols/site-accounts.sofa-partner.json)。

### 4.1 對應關係

新人頁共 **10 個帳號，全部對應到本 repo 的 11 位匯入 KOL**。頭像已逐一下載並與我們的
錨點並排目視比對——**10 張的人都對，沒有張冠李戴**。

`iris-chen` 的 `profile.social.account_username` 是 `Iris520520`，與站上帳號名完全相同，
證實這批帳號就是依這些人設開的。

### 4.2 三個缺口

**(a) 只有 1 個帳號有內容。** 10 個裡有 9 個的 `about_us`、`album_name`、封面圖全是空的，
`title` 還停在預設的「{帳號名} 的直播間」。只有 `Iris520520` 填了簡介（「醒了拍，沒醒也拍」）、
相簿名與 1 張封面。

這件事有現成解法：**11 位的 `profile.json` 裡本來就備好了 `social.display_name`、
`social.bio`、`social.creator_category`**，可以直接套用。已整理進上述 JSON 的
`should_be` 欄位，例如：

| 站上帳號 | KOL | 應填 title | 應填 about_us |
|---|---|---|---|
| `linlinlin111` | vicky-lin | Vicky Lin 💪 高雄練咖 的直播間 | 今天練了，所以今天算贏。💪 |
| `rainie24` | rainie-hsu | Rainie Hsu 🍸 的直播間 | 今晚，看我的。🍸 |
| `cocowu5` | coco-wu | 可可Coco 🧋✨💕 的直播間 | 早八前五分鐘，還在棉被裡🛏️ |
| `mia9188` | mia-huang | Mia 黃米亞 🎮🌙 的直播間 | chat, don't look at me like that 👀 |
| `sophia-tseng` 等其餘 | … | 見 JSON | 見 JSON |

**(b) 10 個帳號的 `is_ai_creator` 全部是 `"0"`。** 這 10 位**全部**是 AI 生成人設，
而該站有 `is_ai_creator` 欄位、前端也有 `AiBadge.vue` 元件——標示機制是現成的，只是沒開。

這一條直接命中本 repo 紅線規則的 **R-AI-DISCLOSURE**。這不是技術缺失，是揭露問題，
應該由使用者決定要不要開，而不是預設不開。

**(c) 兩筆身分錯置。**

- `stseng07`（帳號名對應 sophia-tseng 的 `s.tseng07`、頭像也確實是 sophia）的
  **`title` 卻寫著「ananyakapoor9 的直播間」**。
- **`ananya-kapoor` 在站上完全沒有帳號。**

看起來是開 sophia 帳號時沿用了 ananya 的樣板沒改乾淨，而 ananya 本人的帳號從未建立。
兩件事要一起處理，否則補建 ananya 帳號時會跟 `stseng07` 的 title 打架。

**(d) 9 個帳號名與人設不符。** 站上是 `linlinlin111`、`mia9188`、`luna855687` 這類
隨手取的名字，人設裡寫的是 `vlin1225`、`mia_gg`、`lunahina22`。只有 iris 一致。
改不改是商業決定（帳號名通常不可逆），但至少要記錄下來，否則之後沒有人對得起來。

### 4.3 未執行的部分

**沒有對該站做任何寫入。** 我沒有它的帳號憑證，而且那是一個對外的線上系統——
補內容、開 AI 標示、建 ananya 帳號都需要你授權後才能動。上述 JSON 的 `should_be`
就是為了讓這件事變成複製貼上，或之後接 API 批次套用。

---

## §5 對 `docs/12` 的更正

`docs/12` §1 說人設資料是「原樣複製，未修改任何欄位」。在補上 `ai_assets` 的
`identity_anchor` / `avatar_image` / `seed_images` 之後，**這句話對 `profile.json` 已不再
成立**——其餘欄位仍是原樣，新增的三個欄位是本 repo 為了讓 Dashboard 選圖確定化而加的，
並非來源資料。

`docs/12` §1 關於 coco-wu 只有 2 張參考圖的記載，已由 §3 解決。
