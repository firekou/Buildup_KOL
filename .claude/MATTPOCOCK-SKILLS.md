# Matt Pocock Skills（簡體中文版）— 已內建於本 repo

`.claude/skills/` 底下有 29 個 skill 來自第三方 skill 集合，不是本 repo 自己寫的。
這份文件說明它們是什麼、從哪來、怎麼更新，以及跟本 repo 既有 skill 的界線。

## 來源

| 項目 | 內容 |
|---|---|
| 上游 repo | https://github.com/vinvcn/mattpocock-skills-zh-CN |
| 原始作者 | Matt Pocock（https://www.aihero.dev） · 原 repo `mattpocock/skills` |
| 版本 | plugin `mattpocock-skills` v1.2.3 |
| 同步 commit | `9fb0161ac2be0c45c59cbea0878eb77d92cc24b5`（2026-08-12） |
| 授權 | MIT（全文見 `.claude/LICENSE-mattpocock.txt`） |
| 語言 | **簡體中文**（上游翻譯版；本 repo 未做繁簡轉換，以便與上游比對更新） |

## 為什麼是複製進 repo，不是裝成 plugin

Claude Code 的 plugin 裝在使用者機器的 `~/.claude/`，**不會跟著 repo 走**——換一台機器、
或在 claude.ai/code 的雲端 session（容器每次重建）就沒有了。複製進 `.claude/skills/`
之後，任何人 clone 這個 repo、任何 session 開起來就直接可用，不需要網路、不需要安裝。

如果你要在**自己的電腦上**讓它變成跨所有專案的全域 skill，另外跑一次這個（兩者可並存）：

```
/plugin marketplace add vinvcn/mattpocock-skills-zh-CN
/plugin install mattpocock-skills@mattpocock
```

## 29 個 skill

**Engineering（18）**

| Skill | 用途 |
|---|---|
| `ask-matt` | **路由器**——不確定該用哪個 skill 時先問它 |
| `setup-matt-pocock-skills` | **第一次使用前先跑這個**：設定 issue tracker、triage labels、docs 目錄 |
| `code-review` | 從某個定點（commit / branch / tag / merge-base）起，分 Standards 與 Spec 兩軸並行審查 |
| `codebase-design` | 深模組（deep module）設計的共用詞彙 |
| `diagnosing-bugs` | 棘手 bug 與效能回退的診斷迴圈 |
| `domain-modeling` | 建立與打磨領域模型、通用語言、ADR |
| `grill-with-docs` | 邊追問邊產出 ADR 與詞彙表 |
| `implement` | 依 spec / ticket 實作一段工作 |
| `improve-codebase-architecture` | 掃描深化機會，產出 HTML 報告後逐項追問 |
| `prototype` | 一次性原型，用來回答一個設計問題 |
| `research` | 對照一手來源做調研，結果存成 repo 內的 Markdown |
| `resolving-merge-conflicts` | 處理進行中的 merge / rebase 衝突 |
| `tdd` | 測試驅動開發：red-green-refactor |
| `to-spec` | 把當前對話綜合成 spec 並發到 issue tracker |
| `to-tickets` | 把 plan / spec 拆成帶 blocking edges 的 tracer-bullet tickets |
| `triage` | issue 與外部 PR 的分流狀態機 |
| `wayfinder` | 一個 session 裝不下的大工作 → decision tickets 地圖 |
| `wizard` | 產生互動式 bash wizard，引導人做只有人能做的手動流程 |

**Productivity（7）**

| Skill | 用途 |
|---|---|
| `grilling` | 對一個計畫 / 決策 / 想法持續追問，做壓力測試 |
| `grill-me` | 反過來讓它拷問你 |
| `handoff` | 把當前對話交接出去 |
| `teach` | 教學模式（含 mission / glossary / learning record 格式） |
| `to-questionnaire` | 把討論轉成問卷 |
| `wait-what` | 抓出你沒聽懂但假裝聽懂的地方 |
| `writing-for-agents` | 寫給 agent 讀的文件該怎麼寫 |

**Misc（4）**

| Skill | 用途 |
|---|---|
| `git-guardrails-claude-code` | 裝 hook 擋掉危險 git 指令（push / reset --hard / clean / branch -D） |
| `setup-pre-commit` | 設定 pre-commit |
| `migrate-to-shoehorn` | 測試檔的 `as` 斷言遷移到 @total-typescript/shoehorn |
| `scaffold-exercises` | 產生練習題骨架 |

## ⚠️ 兩件要知道的事

1. **`code-review` 與 Claude Code 內建的 `code-review` 同名。** 打 `/code-review` 時可能出現
   兩個候選；要用這一套請講明「用 Matt Pocock 的 code-review」，或直接用 `ask-matt` 路由。
2. **這些是通用軟體工程 skill，不覆蓋本 repo 既有的治理規則。** 衝突時一律以本 repo 根目錄
   `CLAUDE.md` 與既有 skill 為準——它們是後加的工具，不是新的最高準則。

## 怎麼更新

上游發新版時，重跑一次：

```bash
git clone --depth 1 https://github.com/vinvcn/mattpocock-skills-zh-CN /tmp/mp
python3 - <<'PY'
import json, shutil, os
src = '/tmp/mp'
for s in json.load(open(f'{src}/.claude-plugin/plugin.json'))['skills']:
    name = os.path.basename(s)
    dst = f'.claude/skills/{name}'
    shutil.rmtree(dst, ignore_errors=True)
    shutil.copytree(os.path.join(src, s.lstrip('./')), dst)
PY
```

然後更新本文件上方的版本與 commit SHA。
