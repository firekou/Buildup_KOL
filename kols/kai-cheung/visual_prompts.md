# Kai Cheung — Visual / AI Image Prompts

給 Seedream / Midjourney v6 / Stable Diffusion 使用的角色視覺設定。
（結構化版本同步存於 [`profile.json`](profile.json) 的 `ai_prompts` 區塊。）
專案代號 Project A03 ·「數字體驗觀察者」· Flavor 5 智性數字人。

---

## 0. 智性數字人視覺三原則（科技 / 未來版）

1. **屏幕光是主角光：** 大量使用 UI、代碼、電影畫格、AI 生成畫面的屏幕光；人物常在「測試 / 觀察 / 講解」中，很少對鏡自拍。
2. **比 A01 動態、比 A02 科技，但仍高級：** 冷調對比、淺景深、乾淨 UI overlay；未來實驗室 / 放映室 / 遊戲展 / 城市夜景。
3. **創業者不是西裝商人：** 黑 / 灰 / 白 / 深藍 + 節制霓虹點綴；科技極簡，無大 Logo，不炫富、不嚴肅商務。

> 尺度守則：成人、主流、年輕、**合規**。涉及老虎機 / 街機 / 博弈主題時，畫面**只呈現視覺 / 動畫 / UI
> 設計**（主題美術、介面、動效），**不出現老虎機收益、下注、籌碼等任何賭博引導元素。**

---

## 1. 角色外觀基礎設定 (Base Character Prompt)

每張圖都以這段墊底，作為一致性錨點，再接場景區塊。

```
A cinematic photograph of Kai, a young, smart, creative 26-year-old Hong Kong
Chinese man with a slightly mysterious, future-facing presence — looks like a
startup founder or designer, not a suit. Neat modern slightly tousled hair,
curious sharp bright eyes, clear skin with real texture. Wearing tech-minimal
futurist casual: a black tee or white shirt under a loose relaxed blazer, clean
sneakers, black / grey / navy palette, no loud logos, a smartwatch and wireless
earbuds. Cool screen-lit color, cinematic contrast, shallow depth of field,
editorial tech aesthetic, creative and experimental. --ar 3:4
```

**Stable Diffusion 建議 Negative Prompt：**
```
solemn corporate suit, gaudy, oversaturated, luxury showoff, casino chips,
gambling, slot payout, plastic skin, heavy smoothing, over-retouched, studio
glossy, fake AI look, nsfw, explicit, deformed, extra fingers, watermark, text
```

---

## 2. 經典場景 Prompt

### 場景 A — 未來實驗室書桌（招牌畫面）
```
Kai at a multi-monitor desk glowing with UI, code, and AI-generated images,
leaning in testing something with a curious focused expression, a mechanical
keyboard and a tablet on the desk, wireless earbuds in, black tee under a loose
blazer, cool screen-lit color with a warm practical lamp accent, cinematic
contrast, shallow depth of field, editorial tech aesthetic. --ar 3:4
```

### 場景 B — 放映室看電影（研究一個鏡頭）
```
Kai sitting in a dim private screening room, a paused cinematic film frame
glowing on the big screen behind, looking back over his shoulder mid-thought as
if noticing a detail, projector light and screen glow on his face, tech-minimal
outfit, cinematic teal-and-amber contrast, shallow depth of field,
film-analysis mood. --ar 3:4
```

### 場景 C — 遊戲展觀察（設計角度）
```
Kai walking through a neon-lit game expo hall studying a display, colorful
screen glow and blurred crowd behind, curious engaged expression, sneakers and
loose blazer, dynamic cinematic lighting, muted neon accents, editorial
documentary tech photography, real texture. --ar 3:4
```

### 場景 D — 設計工作室分析牆
```
Kai standing before a wall of pinned UI screenshots, film frames, and
generative-art prints, gesturing mid-explanation connecting ideas, clean modern
studio, soft daylight plus screen glow, tech-minimal outfit, cinematic,
creative teaching energy. --ar 3:4
```

### 場景 E — 霓虹城市夜景
```
Kai on a rooftop or walkway at night with a neon Hong Kong cityscape and screen
billboards behind, hands in pockets looking out thoughtfully, cool neon rim
light, cinematic night contrast, tech-minimal jacket, future-facing mood,
shallow depth of field, editorial realism. --ar 3:4
```

### 場景 F — AI 實驗特寫（屏幕光眼神）
```
Close-up over the shoulder as Kai watches an AI generate an image / animation on
screen, reflected screen glow in his eyes, slight surprised delighted
expression, wireless earbuds, dark room lit only by the monitor, cinematic tech
aesthetic, real skin texture, shallow depth of field. --ar 3:4
```

### 場景 G — showgame.live 未來實驗室開場（16:9）
```
A young creator's 'future lab' livestream setup — a desk with monitors showing
AI tools and film stills, a game controller and VR headset nearby, film posters
and RGB-accent shelves behind, Kai looking into the camera with a bright
welcoming half-smile, cool screen key light with a warm accent, cinematic,
energetic experimental mood, 16:9 composition. --ar 16:9
```

### 空鏡補充 — 標誌性片頭空鏡
```
A cinematic still-life: a monitor glowing with a clean UI / a paused film frame,
wireless earbuds and a mechanical keyboard on a dark desk, cool screen light,
shallow depth of field, editorial tech detail, no people. --ar 16:9
```

---

## 3. 一致性工作流 (Consistent Character)

1. **刷種子臉：** 用「基礎設定 Prompt」生成多張年輕、聰明、帶點神秘的「創業者 / 設計師」男性臉孔，挑一張最有創造感的當基準臉。
2. **鎖臉：**
   - **Seedream（本 Flavor 房規預設）：** 生成基準臉 → `show_reference_elements(action=create)` 建立 Reference Element → prompt 內嵌 `<<<element_id>>>` 生成各場景。Souls 為 soul_2 專用，不與 Seedream 混用。
   - **Midjourney：** `--cref <基準臉URL> --cw 100`。
   - **Stable Diffusion：** IP-Adapter / InstantID 或訓練專屬 LoRA。
3. **批次生成：** 基準臉鎖定後，固定基礎設定，只替換場景區塊，產出整套內容。多用屏幕光與冷調。
4. **存檔：** 把 `element_id` 與各 job id 記錄回 `profile.json` 的 `ai_assets`，圖片放進 `kols/kai-cheung/images/`。

---

## 4. 後續操作建議

1. **種子圖建立：** 先刷出滿意的「創業者 / 設計師臉」→ 選定基準臉 → 建立 Element 鎖臉。
2. **腳本自動化：** 把本檔 + `profile.json` + `content_style.md` 餵給 Claude，批次產出「一週企劃（屏幕光視覺 + 合規提問式文案）」。
3. **影片化：** 種子圖與屏幕光空鏡可接 image-to-video（參考 `docs/01-video-generation-quick-ref.md`）做成《60秒體驗分析》《一個AI實驗》短片，節奏動態、聲音與動效設計並重。
