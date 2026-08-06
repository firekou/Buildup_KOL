# 對標帳號研究 — 執行結果（2026-08-06）

依 `research/HOW_TO_RUN.md` 執行 `research/benchmark-accounts-workflow.js` 的研究任務：
為 3 個人設（賭博哥／旅遊姊／遊戲哥）在 6 個平台上各找 3 個經查證的真人對標帳號。

- **結果**：`results.json` — 18 個單位全部覆蓋，41 個帳號通過查證。
- **查證工具**：`vf.py` — 直接抓取 YouTube／X／TikTok 個人頁並解析真實資料。
- **累積工具**：`results.py` — 寫入與統計。

## 這次沒有用 Workflow 跑

腳本原設計是用 Workflow 工具開 60+ 個 agent（研究員 → 2 個獨立查核員 → 補件 → 審查員）。
在這個 session 裡跑不動：harness 的 permission handler 會把 subagent 每一個工具呼叫的參數清空，
錯誤訊息為

```
The permission handler returned updatedInput for <Tool> that failed schema validation:
The required parameter `query` is missing
This is a configuration issue in your canUseTool callback, PermissionRequest hook,
or permission-prompt tool — The tool input from the model was valid.
```

影響 ToolSearch、WebSearch、WebFetch、Bash、Glob、Read，連 `StructuredOutput` 本身都被清空。
21 個 agent 全部在真正開始研究前就失敗（它們正確地拒絕編造、回報 0 個帳號）。
主迴圈的工具不受影響，因此改由主迴圈親自執行研究與查證。

**這是環境端的問題，不是腳本的問題。** 換一個正常的 session 重跑
`research/benchmark-accounts-workflow.js` 仍可得到原設計的雙查核員交叉驗證結果。

## 查證強度分兩級

| tier | 帳號數 | 說明 |
|---|---|---|
| `direct-fetch` | 25 | 實際抓取該平台個人頁並解析，身分與粉絲數直接讀自頁面。適用 YouTube／X／TikTok。 |
| `cross-reference` | 16 | 該平台拒絕本機匿名請求（Instagram 回 401 require_login；Threads／Facebook 只給 JS 殼）。改以創作者自家網站／Linktree、或搜尋索引項目佐證，並盡量用同 handle 在可直接抓取平台上的帳號互相印證。 |

每一筆的 `verified_how` 都寫明實際做了什麼、看到什麼。**沒有任何一筆是憑印象寫的。**

## 未湊滿 3 個的單位

依腳本規則 4「寧可少報，也絕對不要湊數編造」，以下單位誠實回報不足：

| 單位 | 數量 | 原因 |
|---|---|---|
| 旅遊姊／Threads | 0 | Threads 無法抓取且搜尋索引極稀疏 |
| 遊戲哥／Threads | 0 | 同上 |
| 旅遊姊／Facebook | 1 | 僅 Drew Binsky 找到可確認的官方頁面 |
| 賭博哥／Threads | 2 | 僅 2 個可經索引確認 |
| 旅遊姊／TikTok | 2 | 多數旅遊 YouTuber 的同名 TikTok handle 屬他人 |
| 遊戲哥／X | 2 | 影像論文創作者的 X handle 多被佔用或已停用 |
| 遊戲哥／Instagram | 2 | 該領域創作者主場在 YouTube |
| 遊戲哥／Facebook | 2 | 同上 |

刻意**不**用「Threads handle 通常等於 Instagram handle」這類推論補足——那是未經查證的推測，
正是這次研究要防的張冠李戴。

## 查證過程攔下的假帳號

雙重查核的價值在這裡最明顯。以下都是「handle 看起來合理、實際上不是本人」的例子：

- TikTok `@baldandbankrupt` — 175 粉，簡介自承 *"I'm Bald And Bankrupt But Not The Original Version"*
- X `@JacobGeller` — 是一位西班牙語執業律師，與遊戲評論者同名不同人
- X `@ExtraCredits` — 顯示名稱為 "lindsay lohan"，0 追蹤者
- YouTube `@LiYongLe` — 實際是「小宝翡翠」翡翠賣家，不是李永乐老师
- TikTok `@numberphile` — 暱稱 Pranjal6MS，2 粉
- TikTok `@thomasflight` / `@gmtk` / `@nerdwriter` / `@extracredits` — 全是 1–3 粉的空帳號
- YouTube `@karlwatson` 441 訂閱、`@Noclip` 1.79K 訂閱 — 皆非本尊
- X `@IndigoTraveller` — 簡介與 YouTube 頻道創作者身分不符，疑為同名不同人

## 建議的後續

1. Threads 與 Facebook 的缺口，請由有登入該平台的人在站內直接搜尋補件。
2. 標記 `everyday_feel: false` 但落在圖文平台（IG／X／Threads／FB）的帳號，
   日後可替換成日常感更強的創作者——原腳本的審查員階段就是為了抓這件事。
