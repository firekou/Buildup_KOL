# 本地端互動 AI 伴侶 — 技術研究

> Status: **exploratory research** — 本資料夾建立基礎框架與初步架構探索，尚未進入實作。
> 後續細部設計交由三個專責 subagent（見下）展開。

## 目標

在使用者自己的電腦（本地端，不依賴雲端 API）上，實現一個可以**用文字互動、具備固定 AI 人格**的
AI 伴侶（概念上類似「AI 女友」）：使用者輸入文字，AI 以角色人格產生對話回應。

這與本 repo 既有的 KOL 角色資料庫（`kols/`）是同一條路的延伸：現有資料庫把人格「寫成靜態文件」
（`profile.json` / `character.md`），這個研究則是探索如何把同一份人格資料變成一個「可以即時對話」
的本地系統 —— 讓 KOL 從純內容創作者，進化為可互動的虛擬角色。

## 範圍與分期（Phases）

| Phase | 範圍 | 狀態 |
|---|---|---|
| **Phase 1** | 純文字本地聊天：文字輸入 → 本地 LLM → 人格化文字回應 | **本次任務範圍**，架構探索見 `02-architecture-exploration.md` |
| Phase 2（預留） | 語音輸入輸出（ASR/TTS）、自然打斷、即時語音對話 | 尚未設計，僅在架構中預留介面 |
| Phase 3（預留） | 即時虛擬形象（Live2D/VRM）+ 直播串流，讓 AI 伴侶可被「看見」甚至公開直播 | 尚未設計，僅在架構中預留介面 |

刻意先只做 Phase 1，但架構必須讓 Phase 2、3 是「新增模組」而不是「重寫」。這也是為什麼本研究
一開始就找了解直播/即時互動技術的角色加入 —— 避免 Phase 1 的設計決策堵死之後語音與直播的路。

## 文件結構

```
research/local-ai-companion/
├── README.md                          # 本文件：目標、分期、角色分工
├── 01-landscape-existing-solutions.md # 現成方案調查（frontend / 推論後端 / 語音 / 虛擬形象）
├── 02-architecture-exploration.md     # 針對本案的初始模組化架構草案
└── 03-phase1-detailed-design.md       # Phase 1 詳細設計（可直接動手實作）：目錄結構、persona
                                        # 轉換演算法、session/context 演算法、API 契約、預設模型
```

## 三個新增的專責角色（`.claude/agents/`）

本次任務新增三個 subagent 定義，供後續設計工作呼叫：

1. **`local-ai-companion-architect`** — 系統架構師。負責模組邊界、資料流、技術選型取捨、
   跨 Phase 的介面設計。當你要規劃整體架構或做「這一塊該怎麼接」的決策時呼叫它。
2. **`livestream-tech-specialist`** — 直播／即時互動技術專家。負責 Phase 2/3 會用到的
   低延遲音視訊、串流 ASR/TTS、Live2D/VRM 虛擬形象、WebRTC/RTMP 等領域知識。當問題聚焦在
   「語音、打斷、虛擬形象、直播」時呼叫它。
3. **`local-llm-engineer`** — 本地 LLM 部署工程師。負責推論後端／模型選型、量化、人格
   （character card）綁定、記憶體/上下文策略。當問題聚焦在「跑哪個模型、用哪個推論引擎、
   人格怎麼綁進 prompt」時呼叫它。

架構師負責整合，另外兩個是領域專家；三者的 `description` 已寫明何時該用哪一個，避免職責重疊。

## 現況與下一步

- ✅ 研究框架建立（本資料夾）
- ✅ 現成方案調查（`01-landscape-existing-solutions.md`）
- ✅ 初始架構探索（`02-architecture-exploration.md`）
- ✅ Phase 1 詳細設計（`03-phase1-detailed-design.md`）—— 目錄結構、persona → system prompt
  轉換演算法（含真實 KOL 渲染範例）、session/context 組裝與裁剪/摘要演算法、Orchestrator API
  契約、預設模型建議（暫定，待硬體資訊確認）
- ⬜ 由 `local-llm-engineer` 依實際硬體核定/調整 `03-phase1-detailed-design.md` 第 4.2 節的
  模型選型，並視需要展開更細的推論效能調校
- ⬜ 選一個既有 KOL（例如 `kols/chloe-lin` 或 `kols/sienna-lai`）作為第一個試跑角色，驗證 Phase 1 端到端可行性
