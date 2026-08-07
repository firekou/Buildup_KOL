# 參考 Demo（跨專案）

本資料夾存放用來驗證 [`docs/07`](../07-kol-performance-realism-standard.md) 表演擬真標準的示範片，
**角色不一定屬於本 repo**，僅作為方法驗證用途。

| 檔案 | 角色 | 出處 | 用途 |
|------|------|------|------|
| `iris-chen_dance_v2_nofilter.mp4` | Iris Chen（陳芯語） | [`pennyhuang-oss/Virtual_KOL_Studio`](https://github.com/pennyhuang-oss/Virtual_KOL_Studio) | 驗證 §H.1–H.3：不上濾鏡保留 R1、三分身取景保留軀幹抖動、音樂需配合驅動片 |

## `iris-chen_dance_v2_nofilter.mp4` 生成配方

| 項目 | 設定 |
|------|------|
| 角色圖 | Higgsfield `soul_2` + Iris 已訓練的 `soul_id`（來源 repo 提供），三分身 mid-thigh up，身材依其 `profile.json` 規格（87cm bust / 58cm waist 沙漏） |
| 服裝 | 白色羅紋平口上衣 + 薄紗黑色和服外套（寬版鐘形袖＝R1 載體）+ 黑色短褲 |
| 打光 | 大面積窗光，45° 前側 |
| 動作驅動 | 真人 TikTok 參考片，裁成接近全幅 9:16（**保留軀幹**，非腰上緊裁） |
| 生成 | Kling 3.0 Motion Control，`scene_control=image`，1080p |
| **濾鏡** | **無**（依 §H.1：舞蹈片不上濾鏡） |
| 音樂 | 驅動片原曲，起點對齊驅動片裁切點（§H.3） |

## ⚠️ 權利聲明

- Iris Chen 角色與其 `soul_id`、音樂素材屬於來源 repo 擁有者。
- 驅動動作與音樂源自第三方 TikTok 創作者。
- **本檔僅供內部方法驗證，不得對外發佈。** 對外需改用自有／已授權的動作與配樂。
