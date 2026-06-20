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
| [sofia-vargas](kols/sofia-vargas/) | Sofia Vargas | 生活風格 | 哥倫比亞裔拉丁美洲人 | active |

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
