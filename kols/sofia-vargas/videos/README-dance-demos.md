# Sofia Vargas — 跳舞影片 Demo（動作驅動法）

依 [`docs/04`](../../../docs/04-kol-dance-video-generation-techniques.md) 與
[`docs/05`](../../../docs/05-kol-dance-inhouse-method-and-tuning.md) 的動作驅動法產生。

| 檔案 | 打光原型 | 場景 | 規格 | scene_control |
|------|---------|------|------|---------------|
| `sofia_dance_A_studio_spotlight.mp4` | L1 教室 spotlight | DANZZUP 鏡面教室 | 1080×1936 / ~10.6s / 含配樂 | `video` |
| `sofia_dance_B_street_daylight.mp4` | L5 自然日光 | Wynwood 塗鴉牆（Sofia 原圖） | 1080×1936 / ~10.9s / 含配樂 | `image` |

## 生成配方

- **工具**：Higgsfield Kling 3.0 Motion Control（`motion_control`，pro / 1080p）
- **角色圖**：`kols/sofia-vargas/images/soul_v3_training/09_wynwood_fullbody.png`（單人正面全身）
- **動作驅動**：DANZZUP「STREET JAZZ」IG Reel（`DaU-Z-JShL0`）裁成單人中央 9:16，A/B 取不同編舞段落
- **音樂**：DANZZUP 原曲對應段落，tempo-fit（atempo）對齊影片長度以維持卡拍
- **後製**：本機 ffmpeg mux 音軌 + web 壓縮（CRF 23）

## ⚠️ 使用限制

- 背景殘留 DANZZUP 黃色 neon logo（driver 帶入）；音樂為 DANZZUP 原曲。
- **僅供內部方法驗證 / demo，不得對外發佈。** 正式發佈需換無浮水印驅動 + 可商用配樂。
