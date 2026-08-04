# Rachel Ong — Visual / AI Image Prompts

給 Higgsfield（nano_banana_2 / Seedream v4.5）/ Midjourney v6 / Stable Diffusion 使用的角色視覺設定。
（結構化版本同步存於 [`profile.json`](profile.json) 的 `ai_prompts` 區塊。）
專案代號 Project B01 ·「邊界感」型高海拔登山向導。

> **狀態：** 尚未生成任何種子圖 / 尚未建立 Reference Element。以下 Prompt 已備妥，待客戶確認生成順序後即可開始刷臉。

---

## 0. 視覺三原則

1. **紀實感優先於美型：** 健康戶外膚色、真實質感（結繩繭、疤痕），絕不磨皮、絕不影棚精修感。
2. **色彩克制：** 大地色 / 軍綠 / 炭灰 / 冰川白 / 清晨冷藍；高海拔裝備絕不使用鮮豔色。
3. **絕不擺拍危險：** 不生成誇張擺拍的「懸崖邊緣」「墜落瞬間」等博眼球畫面；危險感透過天氣、環境尺度、留白傳達，而非誇張姿勢。

---

## 1. 角色外觀基礎設定 (Base Character Prompt)

```
A documentary-realist photograph of Rachel, a lean, composed 34-year-old
Singaporean-Chinese woman with a healthy outdoor tan, upright posture, and
quiet, attentive eyes. Practical hair tied back, a faint scar on the left
eyebrow, rope-callused hands, no rings, a single worn climbing-rope bracelet
on one wrist. Wearing earth-tone/olive/charcoal high-altitude mountaineering
hardshell gear (never bright colors), natural harsh daylight or dawn light,
real skin and fabric texture, unhurried documentary mood, credible and calm.
--ar 3:4
```

**Stable Diffusion 建議 Negative Prompt：**
```
glossy studio beauty shot, bright neon colors, staged danger pose,
exaggerated peril, plastic skin, heavy smoothing, over-retouched,
fashion-editorial gloss, fake AI look, nsfw, explicit, deformed,
extra fingers, watermark, text
```

---

## 2. 經典場景 Prompt

### 場景 A — 山脊天氣窗口判斷
```
Rachel crouched checking a rope knot on an exposed ridge, mist rolling fast
behind her, focused unreadable expression, full hardshell gear in earth
tones, natural harsh overcast light, documentary realism, shallow depth of
field. --ar 3:4
```

### 場景 B — 營地前簡報
```
Rachel giving a calm, detailed pre-dawn safety briefing to an unseen team at
a basecamp, headlamp light and the first blue light of dawn, breath visible
in cold air, earth-tone gear, documentary realism, quiet authority. --ar 3:4
```

### 場景 C — 轉身下撤（招牌畫面）
```
Rachel and a client seen from behind, turning together to descend a snowy
slope, storm clouds gathering above the summit they are leaving behind,
muted cold light, documentary wide shot, quiet emotional weight, no faces
required. --ar 16:9
```

### 場景 D — 深夜筆記本（帳篷內）
```
Rachel sitting inside a dim tent at night writing in a worn notebook by
headlamp light, tired but calm expression, rope bracelet visible on her
wrist, warm small light against cold blue tent fabric, intimate low-key
documentary lighting. --ar 3:4
```

### 場景 E — 新加坡非攀登季日常
```
Rachel in minimalist plain tee and cargo pants on an ordinary Singapore
morning run route, humid soft daylight, relaxed unremarkable urban
background, understated off-duty mood, documentary candid realism. --ar 3:4
```

### 場景 F — 裝備檢查特寫
```
Close-up of Rachel's rope-callused hands checking a carabiner and harness
stitching with total focus, cold natural light, real texture on rope and
fabric, no jewelry except the worn rope bracelet, quiet competence. --ar 3:4
```

### 場景 G — 目的地空鏡建立
```
A vast high-altitude mountain landscape at first light (Gongga /
Everest-region style peaks), tiny roped human figures crossing a ridge far
below, dramatic natural scale, documentary expedition-film cinematography,
cold clean color grade, no CGI-glossy look. --ar 16:9
```

---

## 3. 一致性工作流 (Consistent Character)

1. **刷種子臉：** 用「基礎設定 Prompt」（nano_banana_2 或 Seedream v4.5）生成多張健康戶外膚色、精瘦挺拔、眼神安靜專注的新加坡華裔女性臉孔，挑一張最符合「能扛得住的美」的當基準臉。
2. **鎖臉：** 用 `show_reference_elements(action=create)` 建立 Reference Element，之後所有場景 prompt 在開頭嵌入 `<<<element_id>>>`。
3. **批次生成：** 基準臉鎖定後，固定基礎設定，只替換場景區塊。
4. **存檔：** 把 `element_id` 與各 job id 記錄回 `profile.json` 的 `ai_assets`，圖片放進 `kols/rachel-ong/images/`。

---

## 4. 後續操作建議

1. 先刷出滿意的「健康戶外女性向導臉」→ 選定基準臉 → 建立 Element 鎖臉。
2. 把本檔 + `profile.json` + `content_style.md` 餵給 Claude，批次產出「一週企劃（山徑日誌 / 轉身時刻視覺 + 話少金句文案）」。
3. 種子圖與空鏡可接 image-to-video 做成《山徑日誌》《轉身時刻》短片；紀實感、天氣光線與環境音優先於誇張運鏡。
