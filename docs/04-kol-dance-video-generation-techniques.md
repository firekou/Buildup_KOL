# KOL 跳舞影片生成技巧（Dance Video Generation Techniques）

**版本：** v1.0
**制定日期：** 2026-07-20
**適用範圍：** `Buildup_KOL/kols/` 所有 KOL 角色的「跳舞 / 舞蹈」影片內容生成
**參考平台：** [`app.liangliang.biz`](https://app.liangliang.biz/)（站名 **AI COMPANIONS-MUSE**）
**上游文件：** [`01-video-generation-quick-ref.md`](01-video-generation-quick-ref.md)、[`02-kol-image-photography-standard.md`](02-kol-image-photography-standard.md)

> 本文件是「舞蹈影片」的技巧提取手冊。凡是 KOL 要以「跳舞」呈現（配合音樂、擺動、手勢舞、
> 轉身展示），須先讀本文件確認要套用哪一種「舞蹈原型 × 打光原型 × 場景原型」，再依
> [`01-video-generation-quick-ref.md`](01-video-generation-quick-ref.md) 的管線落地。
>
> 技巧來源：對 5 支參考影片（`app.liangliang.biz` 產出）逐支拆解後歸納。以下記錄了
> **影片規格、Model 形象、舞蹈動作、打光（光線 / spotlight）、場景影像、聲音音樂** 六大維度，
> 並整理成可重複套用的生成模板。

---

## 0. 參考平台速記：AI COMPANIONS-MUSE（`app.liangliang.biz`）

| 項目 | 觀察 |
|------|------|
| 定位 | AI 虛擬人物（Companion / Muse）跳舞短影片生成平台 |
| 產出型態 | 直式 9:16 短影片，單一女性 AI 形象，配樂、循環友善的舞蹈 |
| 核心手法 | 以「一張角色參考圖 → 舞蹈動作驅動（image-to-video / motion 模板）」生成，跨幀維持同一張臉 |
| 前端 | 純前端 SPA（首頁只回傳標題，內容為 JS 動態渲染），功能細節需登入後操作 |

> **對我們的意義：** 這類平台的效果 = 我們既有管線裡 **「Higgsfield / 影像生成」 + 「動作驅動 / img2video」** 的組合。
> 不需要另接新工具，只要把下面歸納出的「原型參數」餵進既有管線即可重現同等效果。

---

## 1. 五支參考影片逐支拆解

| # | 檔名 | 規格 | 場景 | 服裝 | 舞蹈原型 | 打光原型 | 聲音 |
|---|------|------|------|------|---------|---------|------|
| V1 | `…153829_476` | 272×512 · 4.8s · 16fps · 無音軌 | 純色棚拍灰背景 | 黑色蕾絲馬甲 + 蕾絲內褲 | **轉身展示（Turntable）** | 棚燈正面柔光 + 前上主光 | 無（純視覺 loop） |
| V2 | `…153834_385` | 720×1280 · 15.4s · 30fps · 有音樂 | 昏暗走廊 / 玄關 | 紅色印花旗袍（高衩、露背） | **手勢舞（Hand / Finger dance）** | 走廊縱深暖色 practical 燈、逆光輪廓光 | 音樂（mean −8.8dB，響、壓限到 0dB） |
| V3 | `…153827_713` | 720×1280 · 9.0s · 30fps · 有音樂 | 明亮飯店臥室（床、枕） | 灰色長袖針織包身裙（低胸露蕾絲） | **甩臂 / 律動舞（含動態模糊）** | 柔和窗光 + 床頭暖燈，淺景深 | 音樂（mean −26.9dB，較輕柔） |
| V4 | `…153831_264` | 720×1280 · 8.1s · 30fps · 有音樂 | 奢華賭場（水晶吊燈、HIGH LIMIT、老虎機） | 米金色鏤空綁帶包身短裙 | **舉臂扭腰（Glam sway）** | 吊燈華麗環境光 + 大理石反光 | 音樂（mean −15.5dB） |
| V5 | `…153833_264` | 720×1280 · 8.1s · 30fps · 有音樂 | 印度鄉村（茅草屋、國旗、雞、單車） | 黑色短袖上衣 + 紫黑內搭褲 | **轉身 / 前後身展示（Body-turn）** | 自然戶外日光、黃金時刻順光 | 音樂（mean −8.9dB，響） |

> 逐支拆解的重點不在服裝，而在 **「舞蹈原型 × 打光原型 × 場景原型」的三元組合**——這三者才是可以
> 被抽象、被重複套用的生成技巧。以下第 2 節即據此展開。

---

## 2. 提取的通用生成技巧

### 2.1 影片規格（Format Spec）

| 參數 | 標準 | 說明 |
|------|------|------|
| 長寬比 | **9:16 直式** | 抖音 / Reels / Shorts 原生比例，全部 5 支一致 |
| 解析度 | 720×1280（交付） | 生成後可依 `01` 文件跑 Real-ESRGAN 放大 |
| 幀率 | 30fps（低配 16fps 亦可循環） | 舞蹈需 30fps 以上才順；可用 RIFE 補到 60fps |
| 長度 | **5–15 秒**，可無縫循環 | 短版 5–8s 用於鉤子，長版 15s 用於完整一段 |
| 音軌 | 立體聲 AAC 44.1kHz | 見 §2.6 |

### 2.2 Model 形象（Character Image）

跨 5 支影片的共同形象語言——這是「一眼可辨的平台風格」：

- **單人、正臉可辨、跨幀一致**：全程同一張臉，靠「參考圖 → img2video」鎖定 identity（對應 `01` 的 LoRA + 固定 Seed）。
- **理想化超女性化身形**：大胸、細腰、長腿的沙漏比例（平台的標誌性誇張度）。
- **純欲風 / 微性感基調**：露膚服裝（馬甲、旗袍高衩、包身裙、鏤空綁帶、運動貼身），與 `kol-builder` 的純欲風規則同源。
- **皮膚與質感**：滑順、微光澤、寫實但偏「精修」感（比 `02` 的 Film Candid 更棚拍、更磨皮）。
- **表情**：介於「望鏡頭放電」與「閉眼陶醉」之間，配合節拍切換。

> **與既有標準的分工：** `02-kol-image-photography-standard.md`（Film Candid）是**靜態生活照**的預設；
> 本文件的「精修棚拍感」是**舞蹈影片**的預設。兩者刻意不同，依內容型態選用。

### 2.3 舞蹈動作原型庫（Dance Motion Library）

平台的舞蹈不是複雜編舞，而是**少數幾種「循環友善、身形友善」的動作原型**。這是可直接複用的核心技巧：

| 原型 | 動作描述 | 適用鏡位 | 對應影片 |
|------|---------|---------|---------|
| **A. 轉身展示 Turntable** | 原地慢速旋轉，正面→3/4→側身→背面，展示身形輪廓 | 全身 / 3-4 身 | V1、V5 |
| **B. 手勢舞 Hand dance** | 上半身固定，雙手在胸前做指向、波浪、拍點手勢，卡拍點 | 半身 / 胸上 | V2 |
| **C. 甩臂律動 Arm-swing** | 手臂大幅擺動、抱胸、撩髮，帶動態模糊表現速度 | 半身 | V3 |
| **D. 舉臂扭腰 Glam sway** | 雙手上舉 / 撥髮，胯部左右擺動，重心轉移 | 全身 | V4 |
| **E. 前後身展示 Body-turn** | 面向鏡頭 ↔ 背對鏡頭切換，強調腰臀曲線 | 全身 | V5 |

**共通動作設計原則：**
1. **卡拍點（beat-sync）**：動作的關鍵幀落在音樂重拍上（見 §2.6）。
2. **循環友善**：首尾姿態相近，可無縫 loop。
3. **幅度克制**：動作以「展示身形」為目的，不做高難度地板動作，降低 AI 崩壞率。
4. **保臉優先**：臉部盡量朝向鏡頭、少遮擋，維持 identity 穩定。

### 2.4 打光技巧（Lighting / 光線 / Spotlight）★ 核心

打光是本平台「高級感」的關鍵。歸納出 **5 種打光原型**，每種對應一種情緒：

| 打光原型 | 佈光 | 光質 | 情緒 | 對應影片 | Prompt 關鍵字 |
|---------|------|------|------|---------|--------------|
| **L1 棚燈 Spotlight** | 前上方主光（key）+ 柔和補光，純色背景 | 硬中帶柔、輪廓清楚 | 聚焦、展示 | V1 | `studio spotlight, soft key light from above, seamless backdrop` |
| **L2 走廊逆光 Rim/Backlight** | 縱深 practical 暖燈在身後，形成輪廓光 | 暖、對比高、邊緣發光 | 神秘、高級 | V2 | `warm practical lights down a dark corridor, rim backlight, moody low-key` |
| **L3 柔和窗光 Soft daylight** | 側 / 前窗自然光 + 床頭暖燈補光，淺景深 | 柔、通透、乾淨 | 清新、私密 | V3 | `soft window daylight, warm bedside lamp fill, shallow depth of field, airy` |
| **L4 華麗環境光 Glam ambient** | 水晶吊燈環境光 + 大理石地面反光 | 亮、金、有反射高光 | 奢華、派對 | V4 | `chandelier ambient light, glossy marble reflections, glamorous interior` |
| **L5 自然日光 Golden-hour** | 戶外順光 / 側光，黃金時刻暖陽 | 暖、自然、飽和 | 陽光、真實 | V5 | `natural outdoor sunlight, golden hour, warm directional sun` |

**打光通則：**
- **主光永遠打亮臉與身形輪廓**——光是用來「雕」身形的，不是平打。
- **暖色調偏好**：5 支中 4 支偏暖（L2/L3/L4/L5），只有棚拍 L1 中性。暖光是平台的預設色溫。
- **spotlight（聚光）語言**：L1 的正面聚光 + L2 的逆光輪廓，是最「舞台感」的兩種，優先用於強調身形展示的段落。
- **背景亮度 < 主體亮度**：讓主角在畫面中「跳出來」（V1、V2 尤其明顯）。

### 2.5 場景與影像（Scene & Cinematography）

| 維度 | 技巧 | 說明 |
|------|------|------|
| 場景反差 | **「衝突感場景」是流量密碼** | V5 精緻美女 × 印度鄉村茅草屋 = 反差鉤子；V4 華服 × 賭場 = 奢華鉤子 |
| 鏡位 | 固定機位為主，主體置中偏下（露出身形） | 少運鏡，降低 AI 崩壞；靠主體動作與音樂帶動節奏 |
| 景深 | 主體清晰、背景虛化（V3 最明顯） | 淺景深強化主體、遮醜背景 |
| 動態模糊 | 快動作段落保留 motion blur（V3 手臂） | 增加「真實拍攝」的速度感 |
| 場景庫 | 棚拍 / 室內走廊 / 飯店臥室 / 奢華場所 / 戶外鄉村 | 五種原型可循環搭配任一舞蹈原型 |

### 2.6 聲音與音樂（Audio & Music Sync）

| 觀察 | 數據 | 技巧 |
|------|------|------|
| 音樂為主、無旁白 | 5 支中 4 支有音軌 | 舞蹈影片靠音樂驅動，不放人聲對白 |
| 響度壓限 | 3 支 mean −8~−16dB、max 壓到 ~0dB | 主打「響、飽、卡點」的短影片配樂（trending sound） |
| 輕柔備選 | V3 mean −26.9dB | 私密 / 臥室情境用較輕柔的音樂 |
| 卡拍 | 動作關鍵幀對齊重拍 | **先選曲、抓 BPM / 重拍，再讓動作卡點**（beat-sync 是質感關鍵） |
| 循環 | 音樂段落與影片長度對齊，可 loop | 5–15s 對應一段完整 hook |

> 音源建議走既有音樂庫 / trending sound；若需角色開口說話，改走 `01` 文件的 CosyVoice + Linly-Talker
> 對嘴管線（本文件的舞蹈影片預設**不需要**對嘴）。

---

## 3. 生成管線（如何重現此效果）

映射到本 repo 既有工具（Higgsfield MCP `generate_image` / `generate_video` / `motion_control`，或等效 img2video 平台）：

```
1. 選定三元組合：舞蹈原型（§2.3）× 打光原型（§2.4）× 場景原型（§2.5）
   ↓
2. 生成角色參考圖（首幀）
   - 用 KOL 的 soul_id / LoRA + 固定 Seed 鎖定 identity（見 01 文件）
   - Prompt = [KOL 外型] + [場景 + 服裝 + 姿態] + [打光原型關鍵字]
   ↓
3. Image-to-Video 舞蹈驅動
   - 以參考圖為首幀，套用舞蹈原型（motion 模板 / 動作提示）生成 5–15s 直式片段
   - 動作幅度克制、臉朝鏡頭、首尾可循環
   ↓
4. 配樂與卡點
   - 選 trending sound → 抓重拍 → 對齊動作關鍵幀（§2.6）
   ↓
5. 後製（依 01 文件）
   - Real-ESRGAN 放大 → RIFE 補幀 60fps → 套 KOL 專屬 LUT（膚色一致）
   ↓
6. 品質檢核（§5）
```

---

## 4. Prompt / 參數模板

### 4.1 首幀圖像 Prompt 公式

```
[KOL 外型（透過 soul_id / LoRA 注入）]
+ wearing [服裝], standing in [場景原型],
+ [舞蹈原型的起始姿態],
+ [打光原型關鍵字],
+ vertical 9:16, single subject centered, cinematic, high detail
```

### 4.2 範例（棚拍轉身展示，對應 V1）

```
[soul_id 注入外型], wearing a black lace corset and lace briefs,
standing on a seamless grey studio backdrop,
front-facing pose starting a slow turn,
studio spotlight, soft key light from above, subject brighter than background,
vertical 9:16, single subject centered, cinematic, high detail
```

### 4.3 範例（走廊手勢舞，對應 V2）

```
[soul_id 注入外型], wearing a red floral qipao with high slit,
standing in a dark residential corridor,
upper-body hand-dance pose, hands raised in front near chest,
warm practical lights receding down the corridor, rim backlight, moody low-key,
vertical 9:16, subject centered, cinematic
```

### 4.4 影片段生成參數（建議起點）

| 參數 | 建議值 | 說明 |
|------|--------|------|
| 影片長度 | 5–8s（hook）/ 15s（完整） | 依用途 |
| 動作幅度 | 中低 | 保臉、降崩壞 |
| 鏡頭運動 | 固定 / 極輕微 | 減少背景瑕疵 |
| 循環 | 開啟（首尾對齊） | 可無縫重播 |
| identity 鎖定 | LoRA weight 0.7–0.9 + 固定 Seed | 見 01 文件 |

---

## 5. 品質檢核清單（Dance Video QA）

- [ ] **臉部一致**：全片同一張臉，無跨幀漂移（identity 鎖定生效）
- [ ] **手部無崩壞**：手勢舞 / 甩臂段落手指數量、形狀正常
- [ ] **卡拍**：關鍵動作落在音樂重拍上
- [ ] **打光正確**：主體亮於背景，光有雕出身形輪廓（非平打）
- [ ] **循環無縫**：首尾姿態銜接，重播不跳幀
- [ ] **背景穩定**：固定機位下背景無鬼影 / 扭曲
- [ ] **規格**：9:16、≥30fps、音樂已對齊長度
- [ ] **色調一致**：套 KOL 專屬 LUT，膚色跨鏡不跳色

---

## 6. 各 KOL 套用建議（原型配方）

> 依 KOL 既有調性挑選「舞蹈 × 打光 × 場景」三元組合，維持人設一致：

| KOL | 建議舞蹈原型 | 建議打光原型 | 建議場景原型 | 理由 |
|-----|------------|------------|------------|------|
| Chloe Lin（純欲風） | B 手勢舞 / A 轉身 | L2 走廊逆光 / L3 柔和窗光 | 走廊 / 臥室 | 純欲風最契合低光、私密感 |
| Sienna Lai（健康生活系） | E 前後身展示 | L5 自然日光 | 戶外 / 健身場景 | 陽光、健康、真實 |
| Brooke Sinclair（性感遊戲） | D 舉臂扭腰 | L4 華麗環境光 | 賭場 / 派對 | 奢華、外放、派對感 |
| Mika Tran（Real-IP sexy） | C 甩臂律動 | L3 柔和窗光 | 飯店臥室 | 真實 IP 私密感 |
| Sofia Vargas（生活風格） | A 轉身展示 | L1 棚燈 spotlight | 棚拍 | 乾淨、聚焦、品牌友善 |

> 落地前務必回查 [`01-video-generation-quick-ref.md`](01-video-generation-quick-ref.md) 確認該 KOL 的
> 生成資產（LoRA、固定 Seed、LUT、聲音樣本）是否齊備。

---

## 附錄：技巧一句話總結

> **一張鎖定臉的參考圖 → 選一個「循環友善的舞蹈原型」→ 用暖色 spotlight / 逆光把身形雕出來 →**
> **放進一個有反差感的場景 → 配一段卡得住重拍的 trending sound → 固定機位、動作克制、首尾循環。**
