# Tan XiaoXiao — Visual / AI Image Prompts

給 Seedream / Midjourney v6 / Stable Diffusion 使用的角色視覺設定。
（結構化版本同步存於 [`profile.json`](profile.json) 的 `ai_prompts` 區塊。）
專案代號 Project A01 ·「規則研究者」· Flavor 5 智性數字人。

---

## 0. 智性數字人視覺三原則

1. **主體是思考，不是自拍：** 鏡頭常落在物件（書頁、草稿紙、白板、鋼筆、黑咖啡）與環境，而非本人特寫；本人多為「側臉思考 / 專注閱讀 / 講解手勢」，很少對鏡自拍。
2. **電影感 / 紀錄片感 > 棚拍：** 自然光為主，淺景深，低彩度高級調色，真實皮膚與紙木質感。
3. **靜奢克制、絕不炫富：** 白 / 藍 / 灰 / 木 / 咖 的低彩度色盤；**畫面不出現豪車、現金、奢侈品、大 Logo**。

> 尺度守則：成人、主流、可信、**合規**。涉及博弈主題時，畫面只呈現規則 / 數學 / 書寫 / 思考，
> 絕不出現籌碼堆、賭桌收益、下注等引導性畫面。

---

## 1. 角色外觀基礎設定 (Base Character Prompt)

每張圖都以這段墊底，作為一致性錨點，再接場景區塊。

```
A cinematic, editorial photograph of XiaoXiao, a calm and composed 30-year-old
Singaporean Chinese man with a clean, mature, understated presence — the kind
of face that grows on you. Short neat dark hair, quiet intelligent attentive
eyes, healthy skin with real texture. Wearing quiet-luxury minimalist
business-academic clothing: a crisp white shirt with a navy blazer or a
fine-gauge high-neck knit, no visible logos, a mechanical watch. Natural window
light, shallow depth of field, muted premium color grade, documentary realism,
trustworthy and thoughtful. --ar 3:4
```

**Stable Diffusion 建議 Negative Prompt：**
```
flashy, gaudy, oversaturated, neon, luxury showoff, cash, sports car, logo
spam, plastic skin, heavy smoothing, over-retouched, studio glossy, fake AI
look, nsfw, explicit, deformed, extra fingers, watermark, text
```

---

## 2. 經典場景 Prompt

### 場景 A — 書房書桌（招牌思考畫面）
```
XiaoXiao seated at a spotless minimalist desk in a book-lined study, a single
open notebook, a fountain pen resting on it, a cup of black coffee, one laptop
closed to the side, twirling the pen while thinking and looking slightly
off-camera, warm floor-to-ceiling window light behind, muted premium color
grade, cinematic shallow depth of field, documentary realism, quiet and
focused. --ar 3:4
```

### 場景 B — 圖書館閱讀
```
XiaoXiao standing among tall wooden library shelves holding an open book,
dog-earing a page, calm absorbed expression, soft diffused daylight from high
windows, dust motes in the light, navy blazer over white shirt, cinematic
muted tones, editorial documentary photography. --ar 3:4
```

### 場景 C — 白板案例拆解（教學招牌）
```
XiaoXiao mid-explanation at a whiteboard covered in a clean probability tree
diagram and flowchart arrows, marker in hand, mid-gesture, engaged teaching
expression, fine-gauge high-neck knit, soft neutral workspace light, cinematic,
credible educator vibe, real texture. --ar 3:4
```

### 場景 D — 酒店行政酒廊（金色光思考）
```
XiaoXiao sitting by a large window in a quiet hotel executive lounge at golden
hour, a black coffee and a Kindle on the marble table, city skyline softly out
of focus behind, smelling the coffee before a sip, quiet-luxury minimal outfit,
warm cinematic light, muted grade, contemplative and composed. --ar 3:4
```

### 場景 E — 機場候機閱讀（長途旅人）
```
XiaoXiao seated in a modern airport lounge reading on a Kindle, noise-cancelling
headphones around his neck, a black notebook and fountain pen beside him, soft
grey daylight through tall glass, understated navy-and-grey outfit, calm
long-haul-traveller mood, cinematic documentary realism, shallow depth of
field. --ar 3:4
```

### 場景 F — showgame.live 直播間開場（16:9）
```
A warm 'study room' livestream setup — a wooden desk with a book, a stack of
notes, a fountain pen and black coffee, a soft bookshelf background with warm
practical lamps, XiaoXiao looking into the camera with a calm welcoming
half-smile, natural warm key light, cinematic, intimate learning-space mood,
16:9 composition. --ar 16:9
```

### 靜物補充 — 標誌性片頭空鏡
```
A quiet still-life: one hardcover book, a fountain pen, and a cup of black
coffee on a clean wooden desk beside a hand-drawn flowchart on paper, warm
window light, shallow depth of field, muted premium tones, no people,
cinematic documentary detail shot. --ar 16:9
```

---

## 3. 一致性工作流 (Consistent Character)

1. **刷種子臉：** ~~用「基礎設定 Prompt」生成多張沉靜男性臉孔~~ → **2026-07-27 起改用客戶提供的真人參考照**（`images/ref/xiaoxiao_01_fullbody_front.png` / `xiaoxiao_02_kneeup_side.png` / `xiaoxiao_03_face_closeup.png`），不再從文字 prompt 生成基準臉。
2. **鎖臉（待重建）：**
   - **舊 Reference Element 已失效並移除：** ~~`adrian-quek-a01` → `<<<2e323b3e-9d41-4ed1-829e-0c32c53bdcb5>>>`~~（舊人設的基準臉，`images/seedream_v1/` 整批舊種子場景與 `videos/reels_v1/` 舊影片已一併刪除，不再使用）。
   - **下一步：** 用 `images/ref/` 底下的真人照片建立新的 Reference Element（或訓練 Higgsfield Soul），鎖定 Tan XiaoXiao 的臉，再依本檔場景庫重新生成 A–F 整套場景。
   - **Seedream 工作流：** 上傳真人參考照 → `show_reference_elements(action=create)` 建立 Reference Element → prompt 內嵌 `<<<element_id>>>` 生成各場景。Souls 為 soul_2 專用，不與 Seedream 混用。
   - **Midjourney：** `--cref <基準臉URL> --cw 100`。
   - **Stable Diffusion：** IP-Adapter / InstantID 或訓練專屬 LoRA。
3. **批次生成：** 基準臉鎖定後，固定基礎設定，只替換場景區塊，產出整套內容。
4. **存檔：** 把 `element_id` 與各 job id 記錄回 `profile.json` 的 `ai_assets`，圖片放進 `kols/xiaoxiao-tan/images/`。

---

## 4. 後續操作建議

1. **種子圖建立：** 先刷出滿意的「耐看可信臉」→ 選定基準臉 → 建立 Element 鎖臉。
2. **腳本自動化：** 把本檔 + `profile.json` + `content_style.md` 餵給 Claude，批次產出「一週企劃（視覺構圖 + 合規文案）」。
3. **影片化：** 種子圖可接 image-to-video（參考 `docs/01-video-generation-quick-ref.md`）做成《規則一分鐘》《案例拆解》短片，節奏偏慢、無浮誇轉場。
