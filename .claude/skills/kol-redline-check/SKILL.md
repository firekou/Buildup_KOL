---
name: kol-redline-check
description: 對 AI KOL 的人設、內容企劃或腳本執行 rule-based 紅線與警示檢查。當你要建立或修改 KOL 人設（profile.json / topic_affinity.json）、產生內容企劃、寫貼文或影片腳本、或審查既有 KOL 資料時，務必先跑這個檢查。規則涵蓋具身主張、不可能憑證、沒有理由的分數、絕對化保證、擺拍危險、互動誘餌、外團體敵意、人設邊界模糊、以及沒有歷史基準就談時機。規則來自 research/social-influence-theory 的 25 筆已查證文獻。
---

# KOL 紅線檢查

這個 skill 讓紅線在 Dashboard 之外也生效。Dashboard 只在網頁上擋，但大部分 KOL 內容是在對話裡被寫出來的——這裡才是紅線真正需要在的地方。

## 什麼時候用

**一定要用：**
- 建立或修改任何 `kols/*/profile.json` 或 `kols/*/topic_affinity.json`
- 產生內容企劃、選題、貼文或影片腳本
- 審查既有 KOL 資料
- 使用者要求「幫這個 KOL 寫⋯⋯」的任何情況

**不用：** 與 KOL 人設或內容無關的一般程式工作。

## 怎麼用

```bash
# 檢查一位 KOL 的人設（會自動一併讀同目錄的 profile.json）
node .claude/skills/kol-redline-check/check.mjs --persona kols/rachel-ong/topic_affinity.json

# 檢查一段企劃或腳本
node .claude/skills/kol-redline-check/check.mjs --text "我親身走過那條路線，當時風很大" --scope script

# 給程式用
node .claude/skills/kol-redline-check/check.mjs --persona <path> --json
```

離開碼：`0` = 沒有 block，`1` = 有 block。可直接掛進 CI 或 pre-commit。

也可以直接 import：

```js
import { check } from './.claude/skills/kol-redline-check/check.mjs'
const result = check({ scope: 'script', text: '...', persona })
```

## 規則在哪裡

**`rules.json` 是唯一真實來源。** Dashboard 後端與這個 skill 讀同一份，所以規則只有一份，不會漂移。要改規則就改那個檔，兩邊會同步變化。

每一條規則都帶四樣東西，缺一不可：

| 欄位 | 用途 |
|---|---|
| `why_plain` | 國高中生聽得懂的白話解釋，**不准出現術語** |
| `evidence` | 論文＋連結＋一句話結論，且必須是 `research/social-influence-theory/99-verification.md` 標記 ✅ 的 |
| `remedy` | 具體怎麼改，不是「請注意」這種空話 |
| `model_disagreement` | 若五個模型之間對這條有分歧，寫清楚誰主張什麼 |

## 兩種嚴重度

| 級別 | 意義 | 行為 |
|---|---|---|
| `block` | 一致認為不能做 | **命中即否決，不論其他維度分數多高。不得存檔或發布。** |
| `warn` | 有爭議或有明確代價 | 顯示警告，不阻擋，但必須被看見並把決定記錄下來 |

## 目前的規則

**Block（5 條）**

| ID | 擋什麼 |
|---|---|
| `R-EMBODIMENT` | AI KOL 主張「我親身在場／親身經歷」且不可查證 |
| `R-CREDENTIAL` | 宣稱 AI 結構上不可能取得的憑證（執照、國際認證、實地資歷） |
| `R-NO-WHY` | 沒有理由（< 10 字）的軸分數進入計算 |
| `R-FAKE-CERTAINTY` | 絕對安全／零風險／保證成功／百分百 |
| `R-STAGED-DANGER` | 為互動率擺拍危險動作或誇大難度 |

**Warn（4 條）**

| ID | 提醒什麼 |
|---|---|
| `W-ENGAGEMENT-BAIT` | 刻意留破綻換留言（Gemini 推薦、GPT 與 Claude 反對——因此是 warn 不是 block） |
| `W-OUTGROUP` | 以外團體敵意換互動（有效約兩倍，但買到的是同溫層深度不是跨圈觸達） |
| `W-BLURRED-PILLAR` | 支柱 > 3 根，或靠泛用關鍵字命中任何題目 |
| `W-NO-BASELINE` | 沒有時間序列快照時談「正在紅／新趨勢」 |

## 命中之後怎麼辦

1. **`block`：停下來，照 `remedy` 改，再跑一次。** 不要繞過，不要在旁邊加註解說明為什麼這次可以例外。
2. **`warn`：把 `why_plain` 和 `remedy` 唸給使用者聽，讓他決定。** 決定要記錄下來——特別是 `W-OUTGROUP`，做與不做都是合理的，但要知道自己在買什麼。
3. **規則本身有問題：** 改 `rules.json`，並在 `docs/11-system-redesign-spec.md` §5 同步更新。不要在程式裡開特例。

## 一個實際會命中的例子

`kols/rachel-ong/topic_affinity.json` 的 `credibility` 軸，`why` 寫的是「IFMGA/UIAGM 國際認證嚮導」——這會命中 `R-CREDENTIAL`，因為那是一個 AI 在結構上不可能取得的憑證。

這正是這個 skill 存在的理由：現行的 `validateAxes()` 只檢查 `why` 的**長度**，完全抓不到內容的問題。

## 相關文件

- `docs/11-system-redesign-spec.md` §5 — 規則的設計理由與三區架構
- `research/social-influence-theory/99-verification.md` — 25 筆引用查證，`evidence` 只能引這裡標 ✅ 的
- `research/social-influence-theory/92-persona-system.md` — 具身型 vs 資料庫型的完整論證
