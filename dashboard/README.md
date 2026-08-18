# Buildup KOL Dashboard

KOL 屬性評估、地區話題交叉查詢與導流素材前後評估的儀表板。
資料直接讀 repo 裡的 `kols/`，不另外維護一份資料庫。

計算方法論見 [`docs/09-kol-topic-match-and-evaluation-methodology.md`](../docs/09-kol-topic-match-and-evaluation-methodology.md)——
**這裡的每一條公式在那份文件裡都有對應的章節編號，改程式前先改文件。**

---

## 三個頁簽

| 頁簽 | 內容 |
|------|------|
| ① KOL 屬性與人設 | 單一 KOL 的身分、建模素材圖像、八軸屬性向量（附分數依據）、3–5 個時事話題連結點與各自的完整 Match 分數、內容支柱、紅線、導流基準值 |
| ② 地區話題與作業流程 | 各地區前十大話題（Apify：Threads / TikTok / Instagram）、Tag 交叉查詢，以及三個方向的作業流程：(a) 從 KOL 找話題、(b) 從話題找 KOL、(c) 組合產出素材企劃＋預先評估 |
| ③ 導流素材前後評估 | 預評記錄清單、從 Match 庫回填實際成效、前後對照分析與歸因分流、校準迴圈讀數 |

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

## 部署到 Railway

1. 建立 service，來源指向這個 repo，**Root Directory 保持在 repo 根目錄**——
   後端要能讀到 `kols/`，把 root 設成 `dashboard/` 會讓資料消失。
2. Build / Start 指令由 [`railway.json`](../railway.json) 提供（`npm run build` / `npm start`），
   健康檢查為 `/api/health`。
3. 在 Variables 設定 [`.env.example`](../.env.example) 列出的變數。最低限度可以什麼都不設就跑起來
   （話題會使用範例資料），但正式使用至少要設：
   - `APIFY_TOKEN` — 沒有它，地區話題是手寫的範例資料，畫面上會標示。
   - `DATA_DIR` — 掛一個 Railway Volume 並指過去，否則評估記錄會在每次部署時消失
     （右上角的「資料為暫存」標籤就是在講這件事）。

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
│       └── scoring/          match.js（§3）、evaluation.js（§4–§5）
└── client/                   React + Vite，三個頁簽
```

---

## 資料相依

Dashboard 讀這些檔案，缺了會在畫面上明說而不是靜默降級：

| 檔案 | 用途 |
|------|------|
| `kols/index.json` | KOL 主索引 |
| `kols/{id}/profile.json` | 身分、人設、內容支柱、場景 prompt |
| `kols/{id}/topic_affinity.json` | 八軸屬性、支柱關鍵字、話題連結點、紅線、導流基準 |
| `kols/topic-axes.json` | 八軸與領域詞彙表、領域預設軸需求、地區清單 |
| `kols/{id}/images/**` | 建模素材圖像（只服務圖片副檔名） |

新增 KOL 時，除了既有流程外要多做一件事：依
[`kols/topic-affinity.schema.json`](../kols/topic-affinity.schema.json) 建立 `topic_affinity.json`，
否則該 KOL 進不了 Match 計算。
