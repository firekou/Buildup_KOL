# 林曜 / Leon Lim — Visual / AI Image Prompts

專案代號 B05 · 歷史沉浸型。角色設定見 [`character.md`](character.md)。

> **狀態（2026-08-11）：三張 ref 已定案並存入 `images/ref/`**（nano_banana_2，896×1200）。
> 定裝照、大頭照、生活照尚未生成。
> 生成順序：**三張 ref → 定裝照 → 大頭照 → 生活照**，每一階段都用前一階段鎖住臉。
>
> ⚠ 這三張是**第二版**。第一版（黑髮、胡渣、素 T）被客戶退掉：「很不討喜，很路人」，
> 已整組覆蓋。做法上 `leon_01` 先單獨生成定調，`leon_02`／`leon_03` 再用 `leon_01`
> 當 `medias` 參考生成，所以三張的臉、髮色、眼鏡、外套完全一致。
>
> ⚠ `leon_02` 實際生出來是**腰上**取景，不是原本寫的膝上——檔名沿用慣例沒有改。
> 對鎖臉來說腰上其實更有用（臉的細節更多）。

---

## 0. 視覺三原則

1. **舊的、皺的、有灰塵的。** 不修飾、不精緻、不打光。他是那個埋在紙堆裡的人，不是形象照裡的人。
2. **暖黃燈光是他的簽名色。** 所有畫面都是低彩度的木頭／紙／灰，加一個特定的暖黃光源。這個色調鎖死，不因題材更換——在只有兩秒的滑動裡，顏色比造型更能被認出來。
3. **刻意跟賭博哥反著做。** 兩個都是室內看書的男性，必須一眼看得出不是同一個人：賭博哥乾淨、極簡、桌面空；林曜堆疊、有灰、桌面滿。

---

## 1. 角色外觀基礎（Base Character Prompt）

所有圖共用這段人物描述，只換場景：

```
A documentary-realist photograph of Leon, a good-looking 34-year-old Malaysian
Chinese man with sharp defined features, high cheekbones and a clean jawline,
clean-shaven, dark eyebrows. His hair is a deliberate silver-white — short,
well cut, textured and swept back, clearly dyed rather than aged, in strong
contrast with his young face. Round thin gold-metal glasses. Calm, composed,
self-possessed. Slim build, good posture.
He wears a long dark forest-green military-style coat falling to mid-calf,
worn open over a plain black crew-neck top, slim black trousers and dark
leather boots. Strong clean silhouette, real fabric weave with slight wear —
stylish and lived-in, never a costume. No jewellery, no watch, no badges.
Warm amber light, low-saturation wood and paper tones, real skin texture,
natural and unretouched, no beauty smoothing, no studio gloss.
iPhone 15 main camera look. --ar 3:4
```

⚠ **不要加飾品。** 試過項鍊／耳環／戒指／腕帶，整體會變成時尚博主，離歷史帳號太遠，
客戶未採用。記憶點靠**銀白髮 ＋ 墨綠長外套的剪影**就夠了。

**Negative prompt（Stable Diffusion 用）：**
```
suit, luxury watch, jewellery, necklace, earrings, rings, designer clothing,
gym physique, glossy studio lighting, beauty retouching, plastic skin,
oversaturated, cool blue grade, cosplay, cape, period costume, fantasy outfit,
military insignia, old man appearance, clean empty desk, minimalist interior,
fake AI look, nsfw, deformed hands, extra fingers, watermark, text,
readable letters
```

⚠ **`readable letters` 一定要留在 negative**——他的畫面到處是書和地圖，最容易生出亂碼假文字。

---

## 2. 三張人物參考照（ref）— 先做這三張

放 `kols/leon-lim/images/ref/`，命名比照其他人設。**這三張是之後所有生成的臉部身份基準。**

背景刻意用中性淺灰，**不放他的房間**——參考照要乾淨，帶場景會干擾後續生成的色調（這是專案踩過的坑：服裝／人物參考圖裡留著背景會讓後面段落的色調跑掉）。

### `leon_01_fullbody_front.png` — 全身正面

```
[Base Character Prompt] Full-body front view, standing straight and relaxed,
arms at his sides, looking directly at camera with a neutral unposed
expression. Plain dark tee, dark trousers, plain dark shoes.
Plain neutral light-grey seamless background, even soft frontal lighting with
no coloured cast. Whole body in frame from head to feet with margin above and
below. Sharp focus, no depth-of-field blur. No props, no furniture, no text.
--ar 3:4
```

### `leon_02_kneeup_side.png` — 膝上四分之三側身

```
[Base Character Prompt] Three-quarter side view from the knees up, body turned
about 30 degrees away from camera, head turned back towards the lens, neutral
unposed expression. Faded navy shirt with sleeves rolled to the forearm.
Plain neutral light-grey seamless background, even soft lighting.
Sharp focus, no depth-of-field blur. No props, no furniture, no text. --ar 3:4
```

### `leon_03_face_closeup.png` — 臉部特寫

```
[Base Character Prompt] Tight head-and-shoulders portrait, face filling most of
the frame, looking directly at camera, neutral unposed expression, mouth
closed. Skin texture, stubble and the fine metal glasses frame all clearly
visible. Plain neutral light-grey seamless background, even soft frontal
lighting. Sharp focus throughout. No text. --ar 3:4
```

**三張都生成之後，逐張放大檢查：**眼鏡框有沒有斷裂變形、手指數量、有沒有生出假文字。臉必須三張一致——不一致就重生，這三張錯了後面全部會錯。

---

## 3. 定裝照（他的房間）— 用三張 ref 生成

這張是「那個房間」的基準，之後所有房間場景（段 2 首幀、圖文、生活照）都拿它當背景參考。

```
@Image 1 @Image 2 @Image 3 是 Leon。
[Base Character Prompt]

Leon sitting at a wooden desk in a small old Kuala Lumpur apartment room.
Behind him, one entire wall of shelves crammed with old books and rolled-up
old maps, uneven stacks, visible dust. On the desk: an open old book, a pair
of white cotton archive gloves resting on the open page, a low-hanging desk
lamp casting warm amber light downward, more stacked books and loose paper.
He is looking down at the book, one hand resting on the desk.
Warm amber lamp as the only light source, low-saturation wood and paper tones,
deep shadows in the corners of the room. Tropical afternoon light through a
window at the left edge, slightly hazy.
Camera at seated-eye height, about 1.8 m away, three-quarter angle from his
left. Documentary realism, iPhone 15 main camera look, no retouching.

**All book pages, map surfaces, spines and any paper in frame must be
completely illegible — visible as texture only, with no actual letters,
numbers or characters generated anywhere in the image.**
--ar 3:4
```

---

## 4. 大頭照（生活感）

**方向：他在檯燈下低頭看書的半側面，臉看得清楚但沒有對著鏡頭。**

這是刻意的——他不是站在你面前講話的人，是那個埋在書裡、剛好抬頭跟你講一件事的人。**頭像本身就在說明這個帳號跟觀眾的關係。**

```
@Image 1 @Image 2 @Image 3 是 Leon。背景參考：定裝照。
[Base Character Prompt]

Close portrait of Leon at his desk under the low lamp, head tilted down
towards an open book, face turned about three-quarters towards the camera so
his features read clearly, but his eyes are still on the page — he is not
looking at the lens. Faint smile lines, absorbed, unaware of being
photographed. The warm amber lamp lights one side of his face and leaves the
other in shadow. Blurred shelves of old books behind him.
Framed head-and-upper-chest, camera slightly above his eye level, about 0.7 m
away. Candid, unposed, documentary realism, no retouching, no studio gloss.

**No readable text anywhere — book pages and book spines must be texture only.**
--ar 1:1
```

⚠ **大頭照用 1:1**（社群頭像會被裁成圓形，直式構圖會被切掉臉）。

---

## 4.5 段 2 首幀：他站在古代場景裡（每支影片都要做一張）

**客戶 2026-08-11 定案：知識段不在他的房間，是他穿現代衣服站在剛剛那個古代場景裡。**
現代人站在古代街上的反差就是這個帳號的記憶點。

每支影片的段 2 首幀都照這個模板做，只換場景描述：

```
@Image 1 @Image 2 @Image 3 是 Leon。背景參考：這支影片段 1 的沉浸場景圖。
[Base Character Prompt]

Leon standing still in <這支的古代場景>, wearing present-day clothes — <當支服裝,
不重複用上一支的單品> — clearly a modern man standing inside an ancient scene.
He is looking straight at the camera, calm, about to say something.

Camera locked off directly in front of him at his eye level, about 1.5 m away,
he is centred and framed from the waist up. **Deep depth of field — the scene
behind him stays readable, not blurred out.** The background is the point.
Warm amber light matching the immersion segment, low-saturation tones.
Documentary realism, iPhone 15 main camera look, no retouching.

**He must NOT wear period costume — modern clothing only.**
**No white gloves in this shot.**
**No selfie framing, no arm reaching towards the lens, no orbiting camera.**
**No readable text anywhere — any signage, carving or inscription must be
texture only, with no generated letters.**
**No recognisable real historical figures, no visible bodies or injuries.**
--ar 9:16
```

⚠ 三條最容易被忽略的：**不准穿古裝**（他是從現在走進去的人）、**不戴手套**（手套屬於
「現在」的工作畫面）、**深景深**（背景就是重點，糊掉就沒有反差了）。

---

## 5. 生活照（`images/生活照/`）

依 `docs/producer-guide.md`，這類長期素材庫存放 `kols/leon-lim/images/生活照/`，**不要放進 `social media/<MMDD>/`**。

四個方向，都維持暖黃色調與「不修飾」的質地：

### A — 舊書店的走道
```
@Image 1 @Image 2 @Image 3 是 Leon。[Base Character Prompt]
Leon standing in a narrow aisle of a cramped second-hand bookshop, shelves
towering on both sides, pulling one book halfway out with his fingertips,
head tilted to read the spine. Warm tungsten light from bare bulbs overhead,
dust visible in the light. Camera behind and to his side at chest height,
about 2 m away. Candid, unposed. **All spines and covers illegible, texture
only, no generated letters.** --ar 3:4
```

### B — 熱帶午後的窗邊
```
@Image 1 @Image 2 @Image 3 是 Leon。[Base Character Prompt]
Leon sitting on the floor with his back against a wall beside a window, an
open book face-down on his knee, looking out at heavy tropical afternoon rain.
Warm interior light against grey-green light from the window. Bare feet,
creased shirt. Camera at floor level, about 2.5 m away, wide. Quiet, tired,
unposed. **No readable text.** --ar 3:4
```

### C — 手套與地圖（無臉，物件為主）
```
背景參考：定裝照。
Close overhead shot of a wooden desk under a low amber lamp: a large old
folded map partly unrolled, a pair of white cotton archive gloves being pulled
onto a hand at the edge of frame, a stack of books beside it. Only the gloved
hand and a shirt cuff enter the frame — no face, no body.
**The map surface must be completely illegible — coastline and grid texture
only, with no place names, numbers, legends or any generated letters.**
Warm amber lamp, low-saturation wood tones, visible dust. --ar 3:4
```

### D — 巷口的早餐攤（吉隆坡的根）
```
@Image 1 @Image 2 @Image 3 是 Leon。[Base Character Prompt]
Leon sitting alone at a plastic stool at a small open-air breakfast stall in a
Kuala Lumpur back lane, early morning, a glass of local coffee on the metal
table in front of him, an old book beside it, unopened. He is looking at
nothing in particular. Warm early sun and shade, humid air, ordinary street
clutter behind him. Camera across the table at seated height, about 1.5 m.
Candid, unposed, documentary realism.
**No readable signage — shopfront signs must be blurred colour shapes only.**
--ar 3:4
```

---

## 6. 每次生成後必查

1. **臉是否跟三張 ref 一致**（尤其眼鏡框形狀）
2. **手**：手指數量、有沒有變形。優先讓他戴白手套——戴手套的手比裸手好生成很多，這是他的造型也是技術對策
3. **有沒有生出可辨讀的假文字**——他的畫面到處是書和地圖，這是本人設最高頻的穿幫來源，每張都要放大看
4. **色調有沒有跑掉**：必須是暖黃＋低彩度木紙灰。偏藍、偏冷、過飽和都要重生
5. **有沒有變乾淨了**：桌面太整齊、衣服太挺、皮膚太滑，都是往賭博哥的方向漂，要退回來
