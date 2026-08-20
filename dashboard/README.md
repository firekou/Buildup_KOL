# Buildup KOL Dashboard

KOL 屬性評估、地區話題交叉查詢與導流素材前後評估的儀表板。
資料直接讀 repo 裡的 `kols/`，不另外維護一份資料庫。

計算方法論見 [`docs/09-kol-topic-match-and-evaluation-methodology.md`](../docs/09-kol-topic-match-and-evaluation-methodology.md)——
**這裡的每一條公式在那份文件裡都有對應的章節編號，改程式前先改文件。**

---

## 三個頁簽

| 頁簽 | 內容 |
|------|------|
| ① KOL 屬性與人設 | 單一 KOL 的身分、建模素材圖像、四軸屬性向量（分數依據收在 hover）、3–5 個時事話題連結點與各自的完整 Match 拆解、紅線 |
| ② 地區話題與作業流程 | 各地區前十大話題（Apify：Threads / TikTok / Instagram）、Tag 交叉查詢，以及三個方向的作業流程：(a) 從 KOL 找話題、(b) 從話題找 KOL、(c) 組合產出素材企劃＋預先評估 |
| ③ 導流素材前後評估 | 預評記錄清單（Match 快照＋企劃者填的兩個目標）、從 Match 庫回填實際成效、目標 vs 實際的三列對照與歸因 |

---

## 本機開發

```bash
npm install
npm run dev          # API 於 :8080，Vite 於 :5173（/api 自動代理）
```

只跑後端（前端用已建置的靜態檔）：

```bash
npm run build
npm start            # http://localhost:8080
```

煙霧測試（需要伺服器已在跑）：

```bash
npm run smoke              # 預設打 http://localhost:8080
BASE=https://… npm run smoke   # 打已部署的環境
```

---

## Railway 部署

**已部署：** https://dashboard-production-010e.up.railway.app
（project `buildup-kol-dashboard` / service `dashboard` / production；
source 為本 repo 的 `claude/kol-evaluation-dashboard-7e7hxh` 分支）

### 重新部署或另建一份時要注意的

1. **Root Directory 必須留在 repo 根目錄。** 後端要讀 `kols/`，
   把 root 設成 `dashboard/` 會讓整個資料層消失。
2. **建立 service 時第一次 build 可能抓錯分支。** 實際遇過：service 剛建立時的第一個 build
   用了 `main`（那裡沒有 `package.json` 與 `dashboard/`），build 直接失敗；
   branch 設定其實已經寫進 source，補推一個 commit 觸發重建就正常了。
   看到 `Railpack could not determine how to build the app` 且列出的檔案樹裡沒有 `package.json`，
   就是這個情況——不是設定錯，是搶跑。
3. Build / Start 指令由 [`railway.json`](../railway.json) 提供（`npm run build` / `npm start`），
   健康檢查 `/api/health`。**不指定 builder**，用 Railway 預設的 Railpack。

### 已設定

| 項目 | 值 | 說明 |
|------|-----|------|
| Volume `dashboard-data` | 掛載於 `/data` | 評估記錄與 Match 庫的持久化位置。已實測：寫入一筆記錄後強制重新部署，記錄存活 |
| `DATA_DIR` | `/data` | 指向上面的掛載點。**沒設它的話 Volume 等於白掛**——app 會寫到 `/app/data`，那是容器內的暫存目錄 |

> **踩過的坑：** Railway MCP 的 `railway-agent` 回報「DATA_DIR 已設 ✓」，但 `list-variables`
> 查不到這個變數，容器裡的 `dataDir` 仍是 `/app/data`。**agent 的回報不能當驗證**——
> 用 `list-variables` 確認變數存在，再用「寫一筆 → 重新部署 → 看還在不在」確認 Volume 真的生效。
> 這兩步都做過才算數。

### 其他變數

| 變數 | 值 | 說明 |
|------|-----|------|
| `APIFY_TOKEN` | 已設 | 地區話題改用真實抓取，畫面標示「Apify 即時資料」 |
| `TOPIC_CACHE_TTL_SECONDS` | `3600` | 每個地區 × 平台組合一小時內只抓一次。**這直接關係到 Apify 用量**——三個 actor 每次查詢都要跑 |
| `APIFY_TIMEOUT_MS` | `180000` | 首次抓取一個地區約 40–90 秒（三個 actor 併行），逾時會退回範例資料並在畫面標示 |

**用量提醒：** 每個「地區 × 平台組合」的首次查詢會跑三個 actor、抓約 300 則貼文。
切地區、按「重新抓取」都會觸發。快取一小時是主要的節流手段——
如果覺得跑太兇，把 `TOPIC_CACHE_TTL_SECONDS` 調大。

### 驗證部署

```bash
BASE=https://dashboard-production-010e.up.railway.app npm run smoke
```

---

## 目錄

```
dashboard/
├── server/
│   ├── index.js              Express app、靜態檔、錯誤處理
│   ├── config.js             路徑與環境變數
│   ├── smoke.js              端對端煙霧測試
│   ├── routes/               kols / topics / workflow / evaluations
│   └── lib/
│       ├── kols.js           讀 kols/ 目錄（profile、topic_affinity、圖像）
│       ├── text.js           簡繁轉換 + CJK bigram 比對
│       ├── store.js          評估記錄的 JSON 持久化（可換成 Postgres）
│       ├── workflow.js       三個方向的作業流程
│       ├── topics/           Apify 連接器、話題分類、熱度計算、範例資料
│       └── scoring/          match.js（§3）、evaluation.js（§4）
└── client/                   React + Vite，三個頁簽
```

---

## 資料相依

Dashboard 讀這些檔案，缺了會在畫面上明說而不是靜默降級：

| 檔案 | 用途 |
|------|------|
| `kols/index.json` | KOL 主索引 |
| `kols/{id}/profile.json` | 身分、人設、內容支柱、場景 prompt |
| `kols/{id}/topic_affinity.json` | 四軸屬性＋`format_fit`、支柱關鍵字、話題連結點、紅線 |
| `kols/topic-axes.json` | 四軸與領域詞彙表、領域預設軸需求、地區清單 |
| `kols/{id}/images/**` | 建模素材圖像（只服務圖片副檔名） |

新增 KOL 時，除了既有流程外要多做一件事：依
[`kols/topic-affinity.schema.json`](../kols/topic-affinity.schema.json) 建立 `topic_affinity.json`，
否則該 KOL 進不了 Match 計算。
