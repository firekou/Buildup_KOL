# Brooke Sinclair — Soul v1 訓練圖批次清單（第一批）

**KOL：** `brooke-sinclair`
**模型：** `soul_2`（Higgsfield Soul 2.0）
**規格：** `3:4` / `2k`（≈1536×2048 PNG）
**成本：** ≈0.12 credit / 張（已 preflight）
**建立日期：** 2026-06-28
**狀態：** ⚠️ **未完成** — 僅第 01 張（hero）已送出生成；其餘 7 張被 MCP 審批限制擋下（見文末）。

> 一致性錨點（每張必含）：鉑金至金色長波浪髮、藍綠色杏眼、小麥膚色、沙漏身材、
> soft-glam clean-girl 妝、自然皮膚質感、SFW（性感靠時尚與氣場，不露點 / 不成人內容）。
>
> 共用 prompt 前綴（base appearance prompt）：
> `A 25-year-old white American woman, long platinum-to-golden blonde hair in soft loose waves, blue-green almond-shaped eyes, sun-kissed golden tan skin, naturally fit hourglass figure, soft-glam 'clean girl' makeup with nude and rosy tones, high cheekbones, photorealistic, natural skin texture, shot on 35mm`
>
> 共用 negative prompt：
> `heavy facetune, plastic skin, over-smoothed, extra fingers, distorted body proportions, explicit nudity, lowres, watermark, text overlay`

---

## 批次清單

| # | 檔名 | 角度 / 場景 | 場景 modifier（接在 base prompt 後） | job_id | 狀態 |
|---|------|-------------|--------------------------------------|--------|------|
| 01 | `01_portrait_frontal.png` | 正臉特寫（hero / 一致性錨點） | `close-up frontal portrait facing camera, neutral confident expression, clean soft neutral background, soft natural light` | `30c5ffa0-0b07-4cfb-8cab-44165e58e892` | submitted（待驗證） |
| 02 | `02_threequarter_right.png` | 3/4 右側臉 | `three-quarter angle portrait facing right, subtle confident smile, clean soft neutral background, soft natural light` | — | 待生成 |
| 03 | `03_threequarter_left.png` | 3/4 左側臉 | `three-quarter angle portrait facing left, looking slightly away, warm golden hour light, soft bokeh background` | — | 待生成 |
| 04 | `04_fullbody_street_ootd.png` | 全身街拍 OOTD | `full body shot, LA luxe-casual streetwear outfit, dainty gold jewelry, walking on a West Hollywood street, daytime, candid` | — | 待生成 |
| 05 | `05_home_mirror_selfie.png` | 居家鏡子自拍 | `full-length mirror selfie, oversized hoodie and biker shorts, holding an iced coffee, cozy modern LA apartment, golden window light` | — | 待生成 |
| 06 | `06_pilates_activewear.png` | 健身 / 普拉提 | `matching activewear set, hair in a ponytail, athletic confident posture in a bright airy pilates studio` | — | 待生成 |
| 07 | `07_gaming_setup.png` | 遊戲 / 直播 | `seated at a gaming setup with RGB lighting, headset around her neck, oversized t-shirt, focused playful expression, monitor glow` | — | 待生成 |
| 08 | `08_night_glam.png` | 夜間出門 glam | `chic bodycon mini dress, delicate gold jewelry, full glam evening makeup, West Hollywood at night, cinematic lighting` | — | 待生成 |

---

## 生成方式備註

- **一致性策略**：先產第 01 張 hero，再把其 `job_id` 當 reference media（`role: "image"`，
  `soul_2` 支援 1 張）餵給 02–08，以鎖定臉部一致。若 reference 路徑受限，退而以共用 base
  prompt + 一致性錨點純文字生成，再人工挑選臉型最一致者。
- **後續**：8 張產齊並驗證後 →（a）下載 PNG 至 `kols/brooke-sinclair/images/soul_v1_training/`
  並回填本表 job_id；（b）以這批訓練 Soul 模型（5–20 張），取得 `soul_id` 回填
  `profile.json` → `ai_assets.soul_v1`。

---

## ⚠️ 本次中斷原因

第 01 張（hero）送出後，後續所有 Higgsfield 生成 / 檢視呼叫
（`generate_image`、`job_display`、`show_generations`）皆回傳
`MCP tool call requires approval`，且該審批在目前的遠端 session 無法被回應，
因此批次在第 01 張後中斷。本檔已完整記錄 8 張的 prompt 與參數，待審批放行（或在可互動授權的
session）即可一次跑完並回填 job_id。
