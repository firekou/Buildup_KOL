# 90 · 要把這套做法接進 Growth OS，需要改什麼

## 狀態（2026-08-30）

| | 項目 | 狀態 |
|---|---|---|
| 0 | **公開檔案庫**（研究之後才發現這是缺的第一塊） | ✅ 已實作 |
| 1 | 新增素材形狀 `reply` | ❌ 未做 |
| 2 | 回覆素材綁定父貼文 | ❌ 未做 |
| 3 | 回覆相關性 gate | ❌ 未做 |
| 4 | engagement bait gate | ❌ 未做 |
| 5 | 圖片 provenance 與 AI 標籤警告 | ❌ 未做（等接上生圖） |
| 6 | 追蹤連結位置 | ⚠️ 檔案庫端已做（per-article，`direct` 歸因）；社群端的 bio link 未做 |

第 0 項不在原本的六項裡。它是在跟使用者對過一輪之後才浮出來的——原本的研究把個人頁當成一張名片，
但真正讓人產生興趣的是**可以回頭搜尋的整理**，而那個東西在 Threads / X 的個人頁上蓋不出來。
詳見下面 §0。

---


現有系統的形狀是「一則自有貼文」：`generation.js` 產出開場句 ＋ 內文，`gates.js` 檢查，`publish.js` 以 `manual_log` 記錄。
回覆型素材是另一種東西，它的差別不在長短，在於**它有一個外部的父貼文，而平台的紅線正是綁在那個父貼文上**。

---

## 0. 公開檔案庫 ✅ 已實作

**檔案：** `dashboard/server/growth/archive.js`、`dashboard/server/routes/public-archive.js`、
`dashboard/server/lib/gate-console.js`

回覆是廣告，檔案庫是商品。Threads 與 X 的個人頁是倒序流水帳，撐不起「回頭搜尋過往整理」這個行為，
所以這個東西只能蓋在我們自己的頁面上，而 bio 連結是唯一的門。

- 公開網址：`/notes`（索引）、`/notes/:slug`（單篇）、`/notes/topic/:topic`（分類）
- 伺服器端渲染、無前端 bundle、關掉 JavaScript 也能讀——它是 bio 連結的落地點，讀者只投資了一次點擊
- **預設私有**：文章建立時 `status: 'draft'`，公開路由只走 `listPublic()` / `getPublicBySlug()`，
  這兩個函式在實作上就只回傳 `published`。route 層沒有任何路徑碰得到草稿
- **揭露是結構，不是文案**：作者是 AI 人設時，揭露文字由人設記錄推導並在發布當下凍結在該筆資料上。
  它不是一句可能忘記寫的話，也不是文章內文能覆蓋的欄位（R-AI-DISCLOSURE）
- **紅線檢查在發布前跑**：第一層未判定完就不能發布；要覆寫必須寫理由，理由進 audit log
- **per-article 追蹤連結**：發布時鑄一個綁定該篇的連結。這是整條路徑上唯一的 `direct` 歸因點——
  回覆→個人頁那一段兩個平台都量不到，只能是 `modeled`；我們自己的頁面到我們自己鑄的網址則是實測

### 一起處理的一個副作用

把檔案庫掛在同一個服務上，代表 bio 連結一旦上線，任何人都可以把網址砍到 `/` 直接看到 Growth OS
的操作台（產品資料、成本帳、audit log）。在沒有公開入口之前這無所謂，上線那天就不是了。

`lib/gate-console.js` 是一個**選用**的密碼閘：設了 `DASHBOARD_PASSWORD` 才生效，沒設就完全不改變行為。
公開的部分是白名單而不是前綴猜測——只有 `/notes`、追蹤轉址、healthcheck 是開的，之後新增的任何路由
預設都是關的。這是 HTTP Basic，目的是讓操作台不要出現在搜尋結果和陌生讀者的螢幕上，不是一套帳號系統。

---

## 1. 新增素材形狀：`reply`

**檔案：** `dashboard/server/growth/narrative.js`、`generation.js`

現有的四個敘事形狀（`rebuttal` / `framework` / `demo` / `evidence`）描述的都是完整貼文的節奏。回覆需要第五種，或是 `framework` 的一個壓縮變體。

規格差異：
| | 自有貼文 | 回覆 |
|---|---|---|
| 開場 | 從新聞長出來的 hook | 直接接原串的爭點 |
| 主體 | 序號列點 | 一個判準，不列點 |
| 收尾 | 一個帶得走的觀念 | 同左，但更短 |
| 連結 | 可以有 | **一定不能有**（`02` §1.1） |
| CTA | 可以有 | **不能有**（Meta engagement bait，`02` §2.2） |

## 2. 回覆素材必須綁定父貼文

**檔案：** `dashboard/server/growth/generation.js`（素材欄位）、`publish.js`（`schedulePublication` 輸入）

新欄位：
- `parentPostUrl` —— 要回的那則貼文的網址
- `parentPostSummary` —— 原貼文在講什麼（給相關性檢查用）
- `parentAuthorHandle`

沒有這三個欄位，第 3 項的檢查無法執行，而且事後也無法回推「這則回覆是在哪個串發的」。

## 3. 新 gate：回覆相關性

**檔案：** `dashboard/server/growth/gates.js`

X 唯一一條可判定的紅線是「promoting content by replying with content that is irrelevant to the topic of the original post」。所以要有一道 gate 問：**這則回覆跟 `parentPostSummary` 是同一個題目嗎？**

實作原則（沿用本 repo 既有規範，見 `gates.js` 檔頭註解）：
- 關鍵字／token 重疊只能當第一層。`relevance.js` 已經有 `overlap()` 可以重用。
- **重疊率低不等於不相關，重疊率高也不等於相關。** 所以這道 gate 的輸出只有兩種：明顯相關 → `pass`；其餘一律 `needs_human`。
- **不可以有 `blocking` 之外的自動放行路徑。** 這條線的代價是帳號永久停權（`02` §1.4），不值得為了省一次人工檢查而賭。

## 4. 新 gate：engagement bait

**檔案：** `dashboard/server/growth/gates.js`

偵測要求互動的句型（「同意的按讚」「留言告訴我」「+1」「轉發給需要的人」）。

這一項比第 3 項單純——它是句型比對，誤判成本低（頂多要求改一句話），所以可以是 `warning` 而不是 `needs_human`。

值得做的理由是：**模型很容易自己把這種句子寫進收尾**，而它是 Meta 有明確定義的降觸及訊號。這是一個廉價的自動防呆。

## 5. 圖片素材要記錄 provenance 並在發布前警告

**檔案：** `dashboard/server/growth/adapters/generation.js`、發布前的 UI

目前生圖 adapter 回 `not_configured`，所以這一項是「接上生圖時要一起做」，不是現在的缺口。要做的是：
- 資產記錄 `provenance: 'ai_generated' | 'original' | 'third_party'`
- `ai_generated` 的圖在發布步驟顯示一行警告：**Meta 會自動掛上「AI info」標籤**（依據見 `02` §2.4）
- `third_party` 直接 `blocking` —— Meta 非原創內容規則（`02` §2.3）

這不是擋，是讓操作者知道代價。

## 6. 追蹤連結的位置改變：從 per-asset 變成 per-account

**檔案：** `dashboard/server/growth/tracking.js`

`createTrackingLink()` 現在接受 `armId` / `publicationId`，設計前提是「一則素材一個連結」。
但回覆裡不能放連結（`03` 問題 3），連結只在個人頁 bio。所以：

- 需要支援 `accountId` 層級的 tracking link（一個帳號一個 bio link）。
- **歸因粒度因此下降**：從「哪一則回覆帶來這次點擊」變成「這段期間帶來幾次點擊」。
- 這個下降必須在 UI 上明講。按本 repo 既有的歸因階梯，回覆帶來的轉換只能標 `modeled`，**不能標 `direct`**。
- 對應地，`conversions.js` 的歸因邏輯要能接受「沒有 armId 的點擊」，而不是把它當成資料缺漏。

---

## 不要做的事

以下每一項在技術上都做得到，但都是本 repo 的明文非目標（`ROADMAP.md` Epic 8、`PRODUCT_SPEC.md` §12），同時也是兩個平台的可停權違規（`02`）：

- 多帳號互相回覆、按讚、轉發
- 自動化大量回覆（即使內容是模型生的、即使每則都不同）
- 依 X 的條文，「compensating others to engage in artificial engagement」即使對方各只用一個帳號也算違規
- 隱藏 AI 生成的事實以避開 Meta 的 AI info 標籤——Meta 明說未依規揭露「we may apply penalties」

**發布仍然全部走 `manual_log`。** 系統不代發、不假裝已經發出去。這條沒有因為這份研究而改變。
