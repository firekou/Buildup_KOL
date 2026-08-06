# 對標帳號研究 — 交接執行說明

這份工作是「幫3個 Buildup_KOL 人設，在他們實際會用的6個社群平台上，各找3個經過雙重查證的真人對標帳號」。原本在 Vincent 自己的 session 裡用 Workflow 工具跑，因為觸發 session 用量上限中斷（2026-08-05），現在改成可以交給別人的電腦繼續執行。

## 這是什麼限制，跟 Higgsfield 生成額度是兩回事

這次卡住的是 **Claude 本身的使用額度**（訊息量/session 用量上限），不是 Higgsfield 的圖片/影片生成點數。錯誤訊息是：
> You've hit your session limit · resets 12:10am (Asia/Taipei)

也就是說，只要換一個「額度還沒用完」的 Claude Code session（不管是 Vincent 自己等額度重置後再跑，還是別人用他們自己的帳號/session 跑），這個腳本都可以直接繼續執行，不需要重新設計。

## 交給別人執行的步驟

1. 把這個資料夾（`research/benchmark-accounts-workflow.js` 這個檔案）給對方，或直接把整個 Buildup_KOL repo 的存取權給他。
2. 對方需要一個有 **Workflow 工具**可用的 Claude Code session（桌面版/CLI/網頁版皆可）。Workflow 工具預設需要使用者明確同意才會啟用，所以對方要在對話裡明確講類似這樣的話：
   > 「請用 workflow 幫我跑這個腳本：research/benchmark-accounts-workflow.js」
   或者直接把整個 `.js` 檔案內容貼給 Claude，說「請用 Workflow 工具執行這個腳本」。
3. Claude 會自動讀取腳本、跑完整個研究流程（3人設 × 6平台，每個平台先找5個候選 → 2個獨立查核員交叉驗證 → 沒湊滿3個的自動補件 → 最後每個人設一個審查員檢查有沒有漏掉的知名帳號）。
4. **這是全新的一次執行**，不是接續 Vincent 這邊中斷的那次——因為 Vincent 這邊那次21個 agent 全部都是「還沒開始就因為額度打回票」，等於一個字都還沒查，沒有任何進度會被浪費，重新跑一次就是完整結果，不會漏掉東西。
5. 執行完成後，Claude 會回傳一個 JSON 結果（結構是 `{units: [...], critics: [...], stats: {...}}`）。把這個完整的 JSON 結果存成檔案（例如 `research/result-YYYYMMDD.json`），或是直接請對方回報給 Vincent。
6. Vincent 拿到這個 JSON 結果後，只要說一聲，我就能直接把它整理成最終的 `BENCHMARK_ACCOUNTS.md`（Buildup_KOL 跟 showgame-kol 兩邊都會同步更新），不需要對方自己排版。

## 如果不想麻煩別人，也可以就等額度重置

錯誤訊息裡寫的重置時間是**今晚 12:10am（台北時間）**。等重置後，Vincent 自己回來這個對話，直接說「繼續跑 research」，我可以用同一個 run id 恢復（`resumeFromRunId`）——不過因為這次21個 agent 全部失敗、沒有任何一個完成，恢復執行實際上等同於全部重新跑一次，跟找別人跑的結果不會有任何差異，純粹差在「現在找人跑」還是「等到半夜自己跑」而已。
