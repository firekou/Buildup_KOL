# Elena Soh — Visual / AI Image Prompts

給 Seedream / Midjourney v6 / Stable Diffusion 使用的角色視覺設定。
（結構化版本同步存於 [`profile.json`](profile.json) 的 `ai_prompts` 區塊。）
專案代號 Project A02 ·「世界觀察者」· Flavor 5 智性數字人。

---

## 0. 智性數字人視覺三原則（旅行 / 建築版）

1. **世界是主角，本人是配角：** 鏡頭主體常是城市、建築、光影、街角，本人小小地站在畫面裡看建築（而非看鏡頭），很少自拍。
2. **電影感 / 紀錄片感 > 棚拍：** 大量自然光、淺景深、膠片質感；拍門、窗、樓梯、路燈、天花板、樹影。
3. **靜奢自然、絕不炫富：** 米白 / 燕麥 / 卡其 / 深藍 / 墨綠 + 膠片暖調；天然材質，幾乎無大 Logo。

> 尺度守則：成人、主流、知性、**合規**。涉及賭場 / 綜合度假區時，畫面**只呈現建築與設計**
> （天花板、大廳、動線、藝術品），**不出現籌碼、賭桌、下注等任何賭博引導元素。**

---

## 1. 角色外觀基礎設定 (Base Character Prompt)

每張圖都以這段墊底，作為一致性錨點，再接場景區塊。

```
A cinematic, editorial travel photograph of Elena, an elegant, natural,
intelligent 29-year-old Singaporean Chinese woman with an approachable
quiet-luxury presence — refined but warm, the kind of face that grows on you.
Softly wavy dark hair, calm observant eyes, healthy natural skin with real
texture, minimal no-makeup makeup. Wearing French-minimal quiet-luxury natural
fabrics (linen, wool, silk) in off-white / oatmeal / khaki / navy / deep green,
no big logos, a silk scarf, a small film camera around her neck. Natural light,
cinematic shallow depth of field, muted premium grade, documentary lifestyle
realism. --ar 3:4
```

**Stable Diffusion 建議 Negative Prompt：**
```
flashy, gaudy, oversaturated, neon, luxury showoff, big logos, casino chips,
gambling table, plastic skin, heavy smoothing, over-retouched, studio glossy,
fake AI look, nsfw, explicit, deformed, extra fingers, watermark, text
```

---

## 2. 經典場景 Prompt

### 場景 A — 酒店大堂觀察（人小、建築大）
```
Elena standing in a grand heritage hotel lobby looking up at the architecture
and the light, small film camera in hand, quiet-luxury linen outfit and silk
scarf, warm directional daylight through tall windows, cinematic wide shot with
her small in the frame, muted premium grade, documentary travel realism, the
architecture is the subject. --ar 3:4
```

### 場景 B — 老城小巷散步
```
Elena walking slowly down a quiet old European city lane holding a paper map,
looking off toward a doorway and a streetlight, no navigation, oatmeal wool
coat, natural overcast light, film grain, cinematic candid travel photography,
unhurried mood, real texture. --ar 3:4
```

### 場景 C — 博物館光線（感受光十秒）
```
Elena standing still in a minimalist museum gallery feeling the light before
lifting her camera, soft skylight, a sculpture softly out of focus behind, calm
absorbed expression, quiet-luxury neutral outfit, cinematic muted tones,
editorial documentary photography. --ar 3:4
```

### 場景 D — 咖啡館窗邊寫筆記
```
Elena sitting by a café window drawing a small map in a travel notebook with a
fountain pen, a coffee and a film camera on the marble table, warm afternoon
window light, silk scarf, film-photography texture, cinematic, intimate and
contemplative. --ar 3:4
```

### 場景 E — 城市陽台黃昏
```
Elena standing on a city balcony at golden-hour dusk looking out over the
skyline, a film camera resting in her hands, silk scarf moving slightly in the
wind, warm cinematic backlight, muted premium grade, the city vista dominant in
the frame, documentary realism. --ar 3:4
```

### 場景 F — 綜合度假區建築（僅建築 / 設計，合規）
```
Elena standing in the soaring atrium of a modern integrated-resort hotel
looking up at the ceiling art, geometry, and light — observing it purely as
architecture and design, NO gaming elements in frame, quiet-luxury outfit,
dramatic architectural daylight, cinematic wide shot, muted premium tones,
documentary architecture photography. --ar 16:9
```

### 場景 G — showgame.live 旅行客廳開場（16:9）
```
A warm 'travel living room' livestream setup — a soft armchair, a stack of
photo prints and an old map on a wooden table, a film camera and a coffee, warm
practical lamps and a shelf of travel books behind, Elena looking into the
camera with a warm gentle smile, natural warm key light, cinematic intimate
mood, 16:9 composition. --ar 16:9
```

### 建築空鏡補充 — 標誌性片頭空鏡
```
A cinematic architectural detail shot — the coffered ceiling and light of a
historic hotel lobby, or an old-city doorway with a streetlight, warm natural
light, film grain, shallow depth of field, muted premium tones, no people,
documentary travel detail. --ar 16:9
```

---

## 3. 一致性工作流 (Consistent Character)

1. **刷種子臉：** 用「基礎設定 Prompt」生成多張優雅自然、有親和力的女性臉孔，挑一張最「耐看」的當基準臉。
2. **鎖臉（已完成 v1）：**
   - **已建立 Reference Element：** `elena-soh-a02` → **`<<<94a1aa08-c337-4125-b85b-b3eaa7a02463>>>`**（基準臉 job `303f8566-cfdf-40cd-bc0f-f6bbcb0a1bfc`）。之後所有場景 prompt 直接在開頭嵌入此 element_id 即可鎖臉。
   - 已產出種子場景：`scene_A_hotel_lobby` / `scene_F_resort_architecture_16x9`（綜合度假區＝純建築，無賭博元素）/ `scene_G_livestream_16x9`（見 `images/seedream_v1/`）。
   - **Seedream 工作流：** 生成基準臉 → `show_reference_elements(action=create)` 建立 Reference Element → prompt 內嵌 `<<<element_id>>>` 生成各場景。Souls 為 soul_2 專用，不與 Seedream 混用。
   - **Midjourney：** `--cref <基準臉URL> --cw 100`。
   - **Stable Diffusion：** IP-Adapter / InstantID 或訓練專屬 LoRA。
3. **批次生成：** 基準臉鎖定後，固定基礎設定，只替換場景區塊，產出整套內容。多數場景「城市 / 建築為主角」，本人可縮小或側身。
4. **存檔：** 把 `element_id` 與各 job id 記錄回 `profile.json` 的 `ai_assets`，圖片放進 `kols/elena-soh/images/`。

---

## 4. 後續操作建議

1. **種子圖建立：** 先刷出滿意的「優雅耐看臉」→ 選定基準臉 → 建立 Element 鎖臉。
2. **腳本自動化：** 把本檔 + `profile.json` + `content_style.md` 餵給 Claude，批次產出「一週企劃（以城市 / 建築為主角的視覺 + 合規慢節奏文案）」。
3. **影片化：** 種子圖與建築空鏡可接 image-to-video（參考 `docs/01-video-generation-quick-ref.md`）做成《城市的一天》《建築會說話》短片，電影感、慢鏡頭、環境聲音。
