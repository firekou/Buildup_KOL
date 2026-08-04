# Rafael Costa（Captain）— Visual / AI Image Prompts

給 Higgsfield（nano_banana_2 / Seedream v4.5）/ Midjourney v6 / Stable Diffusion 使用的角色視覺設定。
（結構化版本同步存於 [`profile.json`](profile.json) 的 `ai_prompts` 區塊。）
專案代號 Project B02 · Captain。

> **狀態：** 尚未生成任何種子圖 / 尚未建立 Reference Element。以下 Prompt 已備妥，待客戶確認生成順序後即可開始刷臉。

---

## 0. 視覺三原則

1. **紀實感優先於炫耀感：** 訓練場、更衣室外、社區球場、安靜咖啡館——絕不是豪宅 / 夜店 / 名車視覺符號。
2. **健康運動員質感：** 小麥色皮膚、真實肌理，不做誇張健美式擺拍，不過度磨皮。
3. **克制的品味：** 深色系剪裁、素色針織衫、一支機械表——不炫富、不大 Logo。

---

## 1. 角色外觀基礎設定 (Base Character Prompt)

```
A documentary-realist photograph of Rafael, a healthy tan-skinned, athletic
30-year-old Brazilian man with short clean hair and steady, warm eyes.
Standard professional-footballer build, visible leg strength, coordinated
upper body, a faint surgical scar on the left knee. Wearing minimalist
off-duty clothing — a solid tee or knit sweater, clean and understated, or
club training kit in a pitch-side setting. A single quality mechanical
watch. Natural daylight, real skin and fabric texture, warm grounded color
grade, calm and credible mood, never luxury-flex or glossy-studio. --ar 3:4
```

**Stable Diffusion 建議 Negative Prompt：**
```
luxury flex, mansion interior, sports car, gold chain, oversaturated,
staged charity pose, bodybuilder exaggeration, plastic skin, heavy
smoothing, over-retouched, studio glossy, fake AI look, nsfw, explicit,
deformed, extra fingers, watermark, text
```

---

## 2. 經典場景 Prompt

### 場景 A — 訓練場邊（招牌畫面）
```
Rafael sitting on the edge of a training pitch after practice, ball resting
beside him, sweat-damp training kit, warm late-afternoon sunlight, calm
reflective expression, documentary realism, shallow depth of field. --ar 3:4
```

### 場景 B — 更衣室外
```
Rafael leaning against a corridor wall just outside a locker room, gym bag
over one shoulder, quiet unguarded expression mid-thought, practical
fluorescent-and-daylight mixed lighting, documentary candid realism. --ar 3:4
```

### 場景 C — 社區球場（童年迴響）
```
Rafael standing on an ordinary community football pitch with kids playing
blurred in the background, a worn taped-up ball in his hands, warm
nostalgic late-day light, understated humble mood, documentary realism.
--ar 3:4
```

### 場景 D — 安靜咖啡館讀書
```
Rafael seated at a corner table in a quiet café with a view of the street,
a biography and a plain notebook in front of him, coffee cup mid-sip, soft
window daylight, calm unhurried mood, documentary realism, shallow depth of
field. --ar 3:4
```

### 場景 E — 家中書架
```
Rafael standing by a modest, uncluttered bookshelf at home with a few worn
jerseys and family photos visible, warm domestic lamp light, grounded
unshowy interior, documentary realism, quiet pride. --ar 3:4
```

### 場景 F — 康復訓練室
```
Rafael mid-stretch or rehab exercise in a modest recovery room, focused
determined expression, visible faint knee scar, clinical but warm daylight,
real texture, documentary sports-medicine realism. --ar 3:4
```

### 場景 G — 比賽日通道（16:9）
```
Rafael standing in a stadium tunnel before a match, focused calm
expression, kit clean and ready, cool stadium light mixing with warm tunnel
light, documentary sports photography, restrained not triumphant mood, 16:9
composition. --ar 16:9
```

---

## 3. 一致性工作流 (Consistent Character)

1. **刷種子臉：** 用「基礎設定 Prompt」（nano_banana_2 或 Seedream v4.5）生成多張健康小麥色、穩重溫和的 30 歲巴西男性運動員臉孔，挑一張最符合「隊長型」氣質的當基準臉。
2. **鎖臉：** 用 `show_reference_elements(action=create)` 建立 Reference Element，之後所有場景 prompt 在開頭嵌入 `<<<element_id>>>`。
3. **批次生成：** 基準臉鎖定後，固定基礎設定，只替換場景區塊。
4. **存檔：** 把 `element_id` 與各 job id 記錄回 `profile.json` 的 `ai_assets`，圖片放進 `kols/rafael-costa/images/`。

---

## 4. 後續操作建議

1. 先刷出滿意的「穩重溫和運動員臉」→ 選定基準臉 → 建立 Element 鎖臉。
2. 把本檔 + `profile.json` + `content_style.md` 餵給 Claude，批次產出「一週企劃（訓練場 / 更衣室外視覺 + 平靜有力量文案）」。
3. 種子圖與空鏡可接 image-to-video 做成《訓練結束以後》《球場之外》短片；紀實感、自然光優先於誇張運鏡或炫富畫面。
