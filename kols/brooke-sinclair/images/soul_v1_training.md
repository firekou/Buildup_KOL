# Brooke Sinclair — Soul v1 訓練圖批次清單（第一批）

**KOL：** `brooke-sinclair`
**模型：** `soul_2`（Higgsfield Soul 2.0），style `General`
**規格：** `3:4` / 1536×2048 PNG
**成本：** ≈0.12 credit / 張
**建立日期：** 2026-06-28
**狀態：** ✅ **完成** — 8 張全數產生並已下載至 `soul_v1_training/`。

> 一致性錨點（每張必含）：鉑金至金色長波浪髮、藍綠色杏眼、小麥膚色、沙漏身材、
> soft-glam clean-girl 妝、自然皮膚質感、SFW（性感靠時尚與氣場，不露點 / 不成人內容）。

---

## 最終批次（已下載）

| # | 檔名 | 角度 / 場景 | job_id | seed | 狀態 |
|---|------|-------------|--------|------|------|
| 01 | `01_portrait_frontal.png` | 正臉特寫（hero / 錨點） | `30c5ffa0-0b07-4cfb-8cab-44165e58e892` | 294030 | ✅ |
| 02 | `02_threequarter_right.png` | 3/4 右側臉，head & shoulders | `122eba90-c507-459c-9f65-8ab11fd38237` | 38819 | ✅ |
| 03 | `03_threequarter_left.png` | 3/4 左側臉，golden hour | `9db231ff-5d5b-4b5d-b525-d06990fef037` | 646755 | ✅ |
| 04 | `04_fullbody_street_ootd.png` | 全身街拍 OOTD，West Hollywood | `3bf3e6ab-e3c0-440f-b3f6-4051fbb5e19b` | 733806 | ✅ |
| 05 | `05_home_mirror_selfie.png` | 居家全身鏡子自拍 | `4d367964-8501-4fff-ac5a-df1fa1d55957` | 55068 | ✅ |
| 06 | `06_pilates_activewear.png` | 普拉提 / 運動套裝，3/4 身 | `14a97563-5d43-45e6-bdae-4b6f5758300f` | 11343 | ✅ |
| 07 | `07_gaming_setup.png` | 遊戲椅 + 耳機，medium shot | `914c1f57-9aa5-4521-86c7-b385bfc86231` | 107029 | ✅ |
| 08 | `08_night_glam.png` | 夜間 glam，黑色 bodycon | `b3f0503f-356b-4fa5-b178-7204d54fded4` | 221126 | ✅ |

共用 base prompt 前綴：
`A 25-year-old white American woman, long platinum-to-golden blonde hair in soft loose waves, blue-green almond-shaped eyes, sun-kissed golden tan skin, naturally fit hourglass figure, soft-glam 'clean girl' makeup, high cheekbones, photorealistic, natural skin texture, shot on 35mm`

---

## 生成方式與一致性備註（重要）

- **採純文字（text-only）生成**：每張以 base prompt + 場景 modifier 直出，未使用 reference image。
- **為何不用 reference image**：先前測試把 hero 當 reference media 餵入時，Higgsfield 會自動開啟
  `enhance_prompt` 並把所有 prompt 改寫成「正面特寫」，導致 8 張變成幾乎相同的大頭照、場景全失。
  純文字生成才能保住全身 / 場景 / 角度的多樣性（這正是 Soul 訓練集需要的）。
- **一致性現況**：純文字導致跨張臉部略有差異（hero 偏 golden girl-next-door；夜間 glam / 全身
  偏 platinum supermodel）。對「先定調」的第一批可接受；若要訓練出穩定 Soul，建議下一步擇一：
  1. 以本批挑出臉最一致的數張先訓練 Soul v1，再用 `soul_id` 重生不一致者；或
  2. 先選定一張 canonical 臉，重抽其餘張以收斂一致性，再訓練。
- **小瑕疵**：第 07 張（gaming）椅背有 AI 生成的假 logo 文字，不影響訓練；如要乾淨版可重抽。

---

## 後續步驟
1. 由本批挑選訓練張 → 訓練 Higgsfield Soul（5–20 張）。
2. 取得 `soul_id` 回填 `profile.json` → `ai_assets.soul_v1.higgsfield_soul_id`，狀態改 `ready`。
3. 之後所有內容圖一律帶 `soul_id` 生成，確保跨鏡頭人物一致。
