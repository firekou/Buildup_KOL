# 羅凱西 / Cathy Luo — Visual / AI Image Prompts

**專案代號 B04 · 神話沉浸型 · 2026-08-14 建立**

角色設定見 [`character.md`](character.md)，寫作方式見 [`content_style.md`](content_style.md)。

**模型**：新建人設的種子圖與參考照用 **Seedream v4.5**（約 1 credit/張，本專案新人設的慣例）。
i2i 衍生（服裝參考圖、背景參考圖）與需要精細控制的場景圖可用 **GPT Image 2**（2k / medium）。
影片一律 **Seedance 2.0**，9:16。

---

## 0. 視覺三原則

1. **青綠冷霧鎖死。** 所有畫面都是低彩度的青綠、灰藍、苔色。這個色調不因題材更換——
   在只有兩秒的滑動裡，顏色比造型更能被認出來。**跟林曜的暖黃是互斥的兩極。**
2. **全黑的人落在青綠的環境上。** 她是畫面裡唯一的深色塊，這是剪影辨識度的來源。
3. **她在場。** 除了段 1 只露手，其餘她都在畫面裡。**不要做成純 POV**——那是林曜的做法，
   他的檔案明令他不出現在場句；她佔的是相反的位置。

---

## 1. 角色外觀基礎（Base Character Prompt）

所有圖共用這段人物描述，只換場景：

```
A documentary-realist photograph of Cathy, a 27-year-old Taiwanese woman,
intellectual and quietly cool. Refined but not exaggerated features, clean
jawline, calm self-possessed eyes, not smiling. Natural light makeup with real
visible skin texture and pores — never retouched, never plastic.

Her hair is deep black, cut in a sharp blunt jaw-length bob, centre or slightly
off-centre parting, natural sheen. No hair accessories, no clips, no bands.

She wears all black: a short structured black leather jacket worn open (no
padding, no hood, no studs, no chain trim), a plain black crew-neck top, straight
black trousers and plain black ankle boots. No pattern, no lettering, no logos
anywhere. Clean fitted silhouette, real leather grain with slight wear —
stylish and lived-in, never a costume.

No jewellery, no watch, no glasses, no hat, no bag, nothing in her hands.
```

**禁止清單**（每張圖都適用）：古裝、漢服、道袍、斗篷、面紗、法器、發光符文、誇張首飾、
西裝、名錶、精品、棚拍打光感、健身身材、刺青、可辨讀的文字／標誌／浮水印／字幕／邊框。

---

## 2. 三張人物參考照（ref）— **已完成，不要重生**

都在 `images/ref/`，1728×2304，素色灰綠棚背景、全黑、**無道具無首飾**。
後兩張是用第一張當 `image_references` 生成的，所以三張的臉一致。

**之後所有影片與圖文一律餵這三張鎖臉。**

| 檔名 | 內容 |
|---|---|
| `cathy_01_fullbody_front.png` | 全身正面、筆直站立、雙手垂在身側 |
| `cathy_02_kneeup_side.png` | 側身膝上、臉跟著側過去、不看鏡頭 |
| `cathy_03_face_closeup.png` | 臉部特寫、正面直視、皮膚質地清楚 |

未採用版留在 `images/`：
- `cathy-v1-提燈軍綠版-未採用.png`——深墨綠戶外外套＋提燈。**跟 Rachel Ong 撞得最兇**
  （兩個都是軍綠連帽外套、深色長褲、靴子、頭髮往後綁），客戶也指出跟林曜太像。
- `cathy-v2-高馬尾版-未採用.png`——高馬尾的剪影太接近 Rachel「頭髮往後綁」。

★ **道具不進參考照。** 客戶 2026-08-14 定案：參考照的工作是鎖外形，手上不拿東西、
身上不掛東西。提燈／手電筒／書等道具改成「哪支影片需要就在那支影片生成」。

---

## 3. 每支影片的前置三張圖（順序不能顛倒）

1. **定裝照**——她在該支的目標場景裡的單張靜態圖。用三張 ref 生成。
2. **服裝參考圖**——從定裝照 i2i：去除人臉／頭部／背景，只留衣服本身，
   呈現成**無頭人形模特架（headless mannequin）＋純色攝影棚背景**的型錄照風格。
   不要懸空、去背變形的衣服剪影。
3. **背景參考圖**——從定裝照 i2i：人物完整移除，只留空的場景環境。

★ 三張都要**逐區放大檢查，四個邊緣各看一次**才准餵進生成。出問題的東西幾乎都躲在邊緣。

★ 該支若有道具中途換狀態（例如她中途拿起某物），就做兩張背景參考圖（有／無該道具），
否則模型很可能生出「手上一份、原地還有一份」。

---

## 4. 段 1 的畫面：原文（只露手）

```
Extreme close-up of an old Chinese book page under soft cool daylight, thick
handmade paper with visible fibre texture and faint foxing. A woman's hand with
short clean unpainted nails rests at the edge of the page, one fingertip resting
just beside a line of text. Only the hand and forearm in a black sleeve are
visible — no face, no body.

The characters on the page are deliberately soft and out of focus, unreadable —
the shape of columns of vertical text is legible as a pattern, but no individual
character can be made out. No modern printing, no page numbers, no marginal
notes, no seal stamps that could read as a real logo.

Low-saturation green-grey cool grade. Shallow depth of field. Documentary
realism, natural light from the side, no studio lighting.
```

⚠ **字一定要糊到不可辨讀。** 我們不要生出假的原文——真正的原文是靠口白讀出來的。
畫面上出現可辨讀的字，等於偽造文獻。

替代做法（更安全）：**暗底上字**——純黑底、只有一行她讀的原文以乾淨字體出現，
這樣文字是我們自己放的、可控，不是模型生的。

---

## 5. 段 2 的畫面：她在異境裡帶你看

**異獸與地景照原文的字面推，不參考流行畫法。** prompt 只寫原文描述的字，
不要寫「像某個遊戲／動畫裡的那隻」。

構圖原則：

- **她在前景或中景、入鏡**，異獸在她後方或側後方。
- 異獸要**大、慢、或遠**。第一階段**不接觸**（理由見 `character.md`）。
- 她的反應鏡頭（伸手停在半空、後退半步、抬頭看）**與異獸鏡頭分開生成再剪接**，
  不要求模型在同一鏡裡同時處理兩個會動的主體。

範例（帝江，原文逐項兌現；**原文待查證後才可正式使用**）：

```
[Base Character Prompt]

She stands in the middle ground of a wide misted valley of grey-green rock and
low moss, turned three-quarters toward camera, one hand half-raised and stopped
in the air, looking past the camera at something.

Behind her, roughly twenty metres away and much larger than her, rests a strange
creature exactly as an ancient text literally describes it: shaped like a soft
sagging yellow sack, its surface glowing a dull red like embers from within, six
legs beneath it and four wings folded at its sides. It has no face at all — the
front of the body is smooth and featureless, with no eyes, no mouth, no nose.
It is almost motionless, only the faint rise and fall of the glow.

Low-saturation green-grey cool grade, heavy mist flattening the background into
colour blocks. Overcast diffuse light. Documentary realism, no fantasy
illustration style, no glowing runes, no magical particles.
```

---

## 6. 段 3 的畫面：她解釋

同一個場景、她轉向鏡頭講話。異獸可以退到更遠、更模糊，或完全不在畫面裡。

```
[Base Character Prompt]

Medium shot from chest up, she faces the camera directly and speaks, calm and
composed. Same misted valley behind her, now with the far background more
strongly out of focus. Fixed camera, no push in, no pan.

Low-saturation green-grey cool grade, overcast diffuse light. Her face and the
texture of the black leather are both clearly readable — the black must not
collapse into a flat silhouette.
```

⚠ 每段 prompt 都要各自重申：**不加背景音樂、不疊字幕、不出現可辨讀文字**。

---

## 7. 大頭照（生活感）— **八張已完成**

都在 `images/生活照/`，3:4，用三張 ref 生成，全黑、青綠冷調、手上無道具。

| 檔名 | 角度 |
|---|---|
| `cathy-avatar-1-山霧稜線.png` | 四分之三側、臉轉回鏡頭 |
| `cathy-avatar-2-溪谷石灘.png` | 正面平視（臉佔比大，適合當主頭像） |
| `cathy-avatar-3-洞口.png` | 略側、洞口天光 |
| `cathy-avatar-4-針葉林.png` | 四分之三側、林間逆光 |
| `cathy-avatar-5-海邊礁岩.png` | 正面平視、海風 |
| `cathy-avatar-6-純側臉湖岸.png` | **正九十度側臉，完全不看鏡頭** |
| `cathy-avatar-7-背影回頭石階.png` | **越肩背影回頭** |
| `cathy-avatar-8-俯角草坡.png` | **俯角，她抬頭直視**（縮到小尺寸最好認） |

★ **頭像的構圖規則**：平台會裁成方形或圓形，所以**頭要放在「從畫面正中央裁成正方形時整顆頭
還在裡面」的位置**，頭頂上方留一點空間。做完用這行指令自己驗一次：

```
ffmpeg -i avatar.png -vf "crop=iw:iw:0:(ih-iw)/2" -frames:v 1 -update 1 check.png
```

---

## 8. 生活照（`images/生活照/`）

大頭照以外的長期素材庫存。共用 Base Character Prompt，換場景即可。
方向：**都在野外或異境，不要現代城市**（現代城市是旅遊姊陳曉菲的地盤）。

建議的四個方向：

- **A — 霧中的稜線**：她走在稜線上，背影或半側，霧把背景吃成色塊。
- **B — 溪谷的石灘**：她蹲在水邊看什麼，手不要碰水（避免手部與水面同時運動）。
- **C — 一本闔著的舊書放在石頭上**（無人、物件為主）：書皮朝上、看不到字，苔綠石頭與水氣。
- **D — 洞口回望**：她站在洞口的光裡，背後是洞內的深暗（暗處只有深灰與黑，無可辨識細節）。

---

## 9. 每次生成後必查

1. **臉**——跟三張 ref 是同一個人嗎？五官比例有沒有漂？
2. **短髮**——是齊下巴平剪嗎？有沒有被生成長髮或綁起來？（這是最重要的記憶點）
3. **全黑**——外套有沒有變色？黑色有沒有糊成一片剪影？
4. **色調**——是青綠冷霧嗎？有沒有跑成暖色（那會撞林曜）？
5. **手**——五指數量與比例正確嗎？有沒有變形？
6. **道具**——有沒有生出沒要求的東西（首飾、眼鏡、背包、法器）？
7. **文字**——四個邊緣逐區放大，有沒有可辨讀的假文字、招牌、商標？
8. **異獸**——每一項特徵都對得回原文嗎？有沒有偷偷長出原文沒寫的東西（例如臉）？
9. **顏色/曝光有疑慮時要量，不要靠印象**：
   ```
   ffmpeg -i img.png -vf "crop=W:H:X:Y,signalstats,metadata=print" -f null -
   ```
   看 `UAVG`（藍黃軸）／`VAVG`（紅綠軸）／`YAVG`（亮度），128 為中性。
   （2026-08-14 曾憑一張裁切圖誤判「外套偏藍」，實測色度差距只有 2/255，白改了三份紀錄。）
