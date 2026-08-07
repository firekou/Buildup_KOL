# Buildup KOL — Character Database

KOL 角色設定資料庫。每個 KOL 為一個獨立目錄，包含結構化 JSON 資料與完整角色文件。

---

## 目錄結構

```
Buildup_KOL/
├── kols/
│   ├── index.json          # 所有 KOL 的主索引
│   ├── schema.json         # 標準欄位定義（JSON Schema）
│   └── {kol-id}/
│       ├── profile.json    # 結構化角色資料（符合 schema）
│       ├── character.md    # 完整角色 Bible（中文敘述）
│       └── content_style.md # 內容方向與風格指南
```

---

## 現有 KOL

| ID | 姓名 | 類型 | 族裔 | 狀態 |
|----|------|------|------|------|
| [xiaoxiao-tan](kols/xiaoxiao-tan/) | Tan XiaoXiao（陳曉曉） | 智性數字人 · 規則研究者（A01 / showgame.live） | 馬來西亞華人 | draft |
| [faye-tan](kols/faye-tan/) | Faye Tan（陳曉菲） | 智性數字人 · 世界觀察者（A02 / showgame.live） | 新加坡華人 | draft |
| [loima-cheung](kols/loima-cheung/) | Zhang Qinfeng（張秦峰） | 智性數字人 · 數字體驗觀察者（A03 / showgame.live） | 馬來西亞華人 | draft |
| [rachel-ong](kols/rachel-ong/) | Rachel Ong（王瑞秋） | 邊界感型高海拔登山向導（B01） | 新加坡華裔 | draft |
| [rafael-costa](kols/rafael-costa/) | Rafael Costa / Captain（拉斐爾·科斯塔） | 現役足球運動員 × 長期主義成長陪伴型 IP（B02） | 巴西人 | draft |

---

## 製作標準文件（`docs/`）

| 文件 | 內容 |
|------|------|
| [01-video-generation-quick-ref](docs/01-video-generation-quick-ref.md) | 影片生成資產清單、後製管線、故障排除 |
| [02-kol-image-photography-standard](docs/02-kol-image-photography-standard.md) | 靜態圖像預設風格 Film Candid、生活化動作準則 |
| [03-kol-male-real-ip-standard](docs/03-kol-male-real-ip-standard.md) | 男性 KOL 專屬：身分錨點、造型母題、三種場域 |
| [04-kol-dance-video-generation-techniques](docs/04-kol-dance-video-generation-techniques.md) | 舞蹈原型庫、5 種打光原型、卡拍與 QA 清單 |
| [05-kol-dance-inhouse-method-and-tuning](docs/05-kol-dance-inhouse-method-and-tuning.md) | 自研舞蹈法差距分析、五維調優、取材與動作驅動 |
| [06-viral-content-framework-and-four-axis-judgment](docs/06-viral-content-framework-and-four-axis-judgment.md) | **爆款方法論**（雷達／七欄拆解／五大母公式）與**娛樂性・音樂性・真實性・動作流暢性**四維判準 |

---

## 新增 KOL 流程

1. 在 `kols/` 下建立新目錄，命名規則：`{firstname}-{lastname}`（kebab-case）
2. 按照 `kols/schema.json` 建立 `profile.json`
3. 撰寫 `character.md`（角色 Bible）與 `content_style.md`（內容指南）
4. 在 `kols/index.json` 新增對應紀錄

---

## Schema

所有 `profile.json` 須符合 [`kols/schema.json`](kols/schema.json) 定義的結構，主要欄位：

- `meta`：建立時間、狀態、分類、參考帳號
- `identity`：姓名、年齡、族裔、現居地、語言、外型
- `persona`：人物原型、個性、價值觀、背景故事、語氣風格
- `content`：內容支柱、格式、發文頻率、視覺美學、品牌合作原則
- `social`：各平台帳號資訊、互動風格、粉絲社群名稱

---

## 延伸研究：本地端互動 AI 伴侶

`research/local-ai-companion/` 是一條探索中的延伸研究：如何把 `kols/` 裡的靜態人格資料，變成一個
可在本地端即時對話的 AI 伴侶（文字互動優先，語音/虛擬形象/直播為預留擴充）。詳見該資料夾的
`README.md`，以及新增的三個專責 subagent：`local-ai-companion-architect`、
`livestream-tech-specialist`、`local-llm-engineer`（定義於 `.claude/agents/`）。
