# 對標帳號研究 — Rachel Ong (B01) + Rafael Costa (B02)，執行結果（2026-08-07）

用 `research/benchmark-accounts-workflow-b01-b02.js` 跑出來的結果，為 2 個新人設在 6 個平台上各找 3 個以上經雙重查證的真人對標帳號。

- **結果**：`results.json` — 12 個單位全部達標（每單位 ≥3 個），共 **77 個帳號**（主研究 61 ＋ 審查員補充 16）。
- **重新產生文件**：`node research/benchmark-accounts-b01-b02/render_md.js` 可由 results.json 重新產生 `kols/BENCHMARK_ACCOUNTS.md` 的第 4～5 節。
- **執行規模**：40 個 agent、0 錯誤、2,629,430 subagent tokens、1,591 次工具呼叫、耗時約 43 分鐘。Run ID `wf_34c61f44-552`。

## 這次跟 2026-08-06 那次（前三位角色）的差別

### 1. 這次 Workflow 真的跑起來了

上一次（`research/benchmark-accounts/README.md`）記錄的是：harness 的 permission handler 把 subagent 每一個工具呼叫的參數清空，21 個 agent 全部在開始研究前就失敗，只好由主迴圈親自執行。這次 40 個 agent 全部正常完成、0 錯誤，那個環境問題已經不存在。

### 2. 「Instagram／Threads／Facebook 抓不到」是錯的結論，已更正

上次的結論是這三個平台無法匿名抓取（Instagram 回 401 require_login、Threads／Facebook 只給 JS 殼），因此 8 個單位回報數量不足，其中旅遊姊與遊戲哥的 Threads 是 **0 個**，並建議「請由有登入該平台的人在站內直接搜尋補件」。

**這個結論是工具造成的，不是平台造成的。** 上次用的是本機 curl；這次的 agent 改用 WebFetch，可以正常讀到 Instagram 與 Threads 的個人頁內容。已獨立驗證：

| 帳號 | WebFetch 讀到的內容 | 與 agent 回報是否一致 |
|---|---|---|
| `threads.com/@snowap` | 顯示名「Cher \| 雪兒」、bio「工程師x登山嚮導 日常隨性的地方～～」、8,585 followers | 完全一致 |
| `instagram.com/david_goettler` | bio「Professional mountaineer mountain guide public speaker @thenorthface」、116K followers、verified | 完全一致 |

反過來，**X（Twitter）用 WebFetch 會回 HTTP 402**，這次 agent 是改用瀏覽器分頁載入才讀到，並保守地標成 `cross-reference`。所以各平台的可讀路徑是：

| 平台 | WebFetch | 瀏覽器分頁 | 本機 curl |
|---|---|---|---|
| YouTube | ✅ | ✅ | ✅ |
| TikTok | ✅ | ✅ | ✅ |
| Instagram | ✅ | ❌（政策封鎖） | ❌ 401 |
| Threads | ✅ | ❌（政策封鎖） | ❌ JS 殼 |
| X | ❌ 402 | ✅ | ✅ |
| Facebook | 部分 | — | ❌ |

**後續建議**：前三位角色（賭博哥／旅遊姊／遊戲哥）在 Instagram／Threads／Facebook 上的 8 個缺口單位，可以直接重跑一次研究補齊，不需要人工登入站內搜尋。

### 3. 新增了圖文風格判準（本次的重點）

依 2026-08-07 定案的圖文文案風格，研究員在圖文平台（IG／X／Threads／FB）要額外評估四件事，並寫進結果欄位：

| 欄位 | 判準 | 可能值 |
|---|---|---|
| `caption_style` | 貼文是否短（3~4 個碎片短句，不是起承轉合的小故事） | short-fragments / medium / long-form / n/a |
| `concreteness` | 是否直接點名真實數字、地名、產品、當季物 | names-specifics / mostly-abstract / n/a |
| `question_ending_habit` | 是否**不**每篇都用問句收尾 | rarely / sometimes / almost-always / n/a |
| `image_approach` | 配圖手法，特別是有沒有混用「完全沒有本人入鏡」的物件／場景照 | 自由文字 |

## 通過率為什麼比上次高很多

上次 41 個通過、淘汰一大堆冒名帳號；這次 66 個候選裡只淘汰 5 個。原因是這次在研究員的 prompt 裡就先寫進了上次的實測經驗（哪些平台用什麼方式讀得到、以及上次攔下的假帳號長什麼樣——例如「知名創作者的同名 handle 在別的平台只有 1~3 個粉絲，是被佔用的空帳號」），研究員在提交前就先自己排除掉了這類陷阱，而不是等查核員來殺。

雙重查核仍然有作用，這次攔下的 5 個包括：Rafael 的 YouTube 有 2 個、Facebook 1 個，Rachel 的 Facebook 2 個。

## 抽驗紀錄（2026-08-07，由主迴圈獨立執行，非 agent 自述）

除了上表兩筆之外，另抽驗 `x.com/Gilwad`：瀏覽器分頁標題為「Will Gadd (@Gilwad) / X」，與 agent 回報一致。三筆抽驗（Threads／Instagram／X 各一）全部吻合。

## 已知的小瑕疵

`results.json` 裡曾有兩處模型輸出的字元雜訊（`抒情формул`、`репо` 混入西里爾字母），已修正為 `抒情公式`、`repo`。除此之外掃過全文沒有其他非中英文的雜訊字元。
