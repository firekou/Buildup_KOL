---
name: kol-redline-check
description: 對 AI KOL 的人設、內容企劃或腳本執行紅線與警示檢查。當你要建立或修改 KOL 人設（profile.json / topic_affinity.json）、產生內容企劃、寫貼文或影片腳本、或審查既有 KOL 資料時，務必先跑這個檢查。規則涵蓋具身主張、不可能憑證、捏造來源、AI 身分揭露、冒充真人、高風險領域個案指令、仇恨騷擾、絕對化保證、擺拍危險、互動誘餌、外團體對立、人設邊界模糊、以及沒有歷史基準就談時機。規則來自 research/social-influence-theory 的 25 筆已查證文獻。
---

# KOL 紅線檢查

這個 skill 讓紅線在 Dashboard 之外也生效。Dashboard 只在網頁上擋，但大部分 KOL 內容是在對話裡被寫出來的——**這裡才是紅線真正需要在的地方。**

## 什麼時候用

**一定要用：**
- 建立或修改任何 `kols/*/profile.json` 或 `kols/*/topic_affinity.json`
- 產生內容企劃、選題、貼文或影片腳本
- 審查既有 KOL 資料
- 使用者要求「幫這個 KOL 寫⋯⋯」的任何情況

**不用：** 與 KOL 人設或內容無關的一般程式工作。

---

## ⚠️ 這是兩層檢查，只跑第一層不算檢查過

`check.mjs` 是**第一層 lint**，它做的是關鍵字比對。**它不做最終判定。**

規格 review 時，Gemini 與 GPT 都指出純關鍵字比對的兩種失敗：

| 失敗 | 例子 |
|---|---|
| **假陽性**（會誤擋正當用法） | 「我**親身**比對了三份報告」「我**實際測試**了三種提示詞模板」「我**走過**很多彎路才找到這份資料」 |
| **假陰性**（抓不到真問題） | 「上次在營地醒來」「那晚我手指凍到沒感覺」「抵達稜線時」——沒有任何關鍵字，卻全是具身主張 |

所以 `rules.json` v1.1 起：

```
第一層  check.mjs（關鍵字）
        └─ detection:"lint"  → 回傳 needsReview，**不是**否決
        └─ detection:"exact" → 字串本身無歧義，可直接判定

第二層  你（Claude）依 semantic_prompt 做語意判斷   ← 這是這個 skill 存在的意義
```

**`complete: false` 就代表還沒檢查完。** 只看 `passed` 會漏掉整個第二層。

---

## 怎麼用

### 步驟 1 — 跑 lint

```bash
# 檢查一位 KOL 的人設（會自動一併讀同目錄的 profile.json）
node .claude/skills/kol-redline-check/check.mjs --persona kols/rachel-ong/topic_affinity.json

# 檢查一段企劃或腳本
node .claude/skills/kol-redline-check/check.mjs --text "<內容>" --scope script

# 給程式用
node .claude/skills/kol-redline-check/check.mjs --persona <path> --json
```

回傳結構：

| 欄位 | 意義 | 你要做什麼 |
|---|---|---|
| `blocks` | 確定的 block（`exact` 或結構檢查） | 停下來，照 `remedy` 改 |
| `warnings` | 確定的 warn | 唸給使用者聽，讓他決定，記錄決定 |
| `needsReview` | lint 命中，**但需要你判斷** | 進第二層 |
| `pendingSemantic` | lint 抓不到、但**一定要判**的規則 | 進第二層 |
| `complete` | 三者皆空才是 `true` | `false` 就不能宣告通過 |

### 步驟 2 — 逐條做語意判定

對 `needsReview` 與 `pendingSemantic` 的每一條：

1. 讀它的 `semanticPrompt`——裡面有【要擋】與【不要擋】的具體例子
2. 對照被檢查的文字，做出判斷
3. **判定為命中** → 照 `remedy` 改，改完重跑第一層
4. **判定為假陽性** → 明講「這條是 lint 的假陽性，理由是⋯⋯」，不要默默略過

> **不要因為 lint 命中就照單全收，也不要因為 lint 沒命中就放心。** 兩種都會出錯，這正是需要你的原因。

### 步驟 3 — 回報

把結果講給使用者聽時，**block 與 warn 要分開講**，並附上白話理由與具體改法。不要只說「有 3 個問題」。

---

## 規則在哪裡

**`rules.json` 是唯一真實來源。** Dashboard 後端與這個 skill 讀同一份，規則不會漂移。

每一條規則都帶：

| 欄位 | 用途 |
|---|---|
| `severity` | `block`（否決）／ `warn`（警示） |
| `detection` | `lint`（需第二層）／ `exact`（可直接判定） |
| `category` | `redline`（內容紅線）／ `validation`（資料驗證） |
| `why_plain` | 國高中生聽得懂的白話，**不准出現術語** |
| `semantic_prompt` | 第二層的判定指引，含【要擋】【不要擋】 |
| `evidence` | 論文＋連結，且必須是 `99-verification.md` 標 ✅ 的 |
| `remedy` | 具體怎麼改，不是「請注意」這種空話 |

### 分級判準（`grading_criteria`）

v1.0 曾用「哪個模型推薦、哪個模型反對」決定等級——**兩位審查者都指出這違反了「只有已查證文獻可以影響決策」的紀律，而他們是對的。** v1.1 改為四條客觀判準：

1. 傷害是否**不可逆**
2. 是否構成**欺騙**
3. 是否**違法或危害人身**
4. 文獻證據是否**一致**

---

## 目前的規則（9 block ＋ 4 warn ＋ 1 validation）

**Block**

| ID | 擋什麼 |
|---|---|
| `R-EMBODIMENT` | 不可查證的親身在場／經歷／身體感受 |
| `R-CREDENTIAL` | AI 結構上不可能取得的憑證 |
| `R-FABRICATED-SOURCE` | 捏造研究、報告、統計數字、新聞事件 |
| `R-AI-DISCLOSURE` | 假裝是真人，或隱瞞 AI 身分來支撐可信度 |
| `R-REAL-PERSON-IMPERSONATION` | 冒充真實人物或機構職位 |
| `R-HIGH-STAKES-ADVICE` | 醫療／金融／法律／人身安全的確定性個案指令 |
| `R-HATE-HARASSMENT` | 貶低受保護或易受害群體 |
| `R-FAKE-CERTAINTY` | 絕對安全／零風險／保證成功／百分百 |
| `R-STAGED-DANGER` | 為互動率擺拍危險動作 |

**Warn**

| ID | 提醒什麼 |
|---|---|
| `W-ENGAGEMENT-BAIT` | 刻意留破綻換留言（若涉及安全／醫療／金融的錯誤資訊，改判 block） |
| `W-OUTGROUP` | 以立場對立換互動（買到的是同溫層深度，不是跨圈觸達） |
| `W-BLURRED-PILLAR` | 支柱 > 3 根，或靠泛用關鍵字命中任何題目 |
| `W-NO-BASELINE` | 沒有時間序列快照時談「正在紅／新趨勢」 |

**Validation**

| ID | 檢查什麼 |
|---|---|
| `R-NO-WHY` | 軸分數必須有 ≥10 字的理由，否則該軸視為未定義（不得當成 0） |

---

## 命中之後怎麼辦

1. **`block`：停下來，照 `remedy` 改，再跑一次。** 不要繞過，不要在旁邊加註解說明為什麼這次可以例外。
2. **`warn`：把 `why_plain` 和 `remedy` 唸給使用者聽，讓他決定。** 決定要記錄下來——特別是 `W-OUTGROUP`，做與不做都合理，但要知道自己在買什麼。
3. **規則本身有問題：** 改 `rules.json`，並在 `docs/11-system-redesign-spec.md` §5 同步更新。**不要在程式裡開特例。**

## 一個實際會命中的例子

`kols/rachel-ong/topic_affinity.json` 的 `credibility` 軸，`why` 寫的是「IFMGA/UIAGM 國際認證嚮導」——lint 會把它列進 `needsReview`，而語意判定的結論是**確實命中 `R-CREDENTIAL`**：那是一個 AI 在結構上不可能取得的憑證。

現行 Dashboard 的 `validateAxes()` 只檢查 `why` 的**長度**，完全抓不到內容的問題。這就是這個 skill 存在的理由。

## 相關文件

- `docs/11-system-redesign-spec.md` §5 — 規則的設計理由與三區架構
- `docs/reviews/2026-08-22-spec-v1.0-gemini.md` / `-gpt.md` — 兩層架構的由來
- `research/social-influence-theory/99-verification.md` — 25 筆引用查證，`evidence` 只能引標 ✅ 的
- `research/social-influence-theory/92-persona-system.md` — 具身型 vs 資料庫型的完整論證
