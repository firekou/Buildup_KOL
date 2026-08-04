# 口播敘事 16 式 × 鏡頭語言對應表

**版本：** v1.0
**制定日期：** 2026-08-04
**適用範圍：** `Buildup_KOL/kols/` 所有 KOL 的口播／說故事類影片（Tan XiaoXiao、Faye Tan、Zhang Qinfeng 優先）
**上游文件：** [`07`](07-kol-performance-realism-standard.md)（表演擬真標準 R1–R5）、[`01`](01-video-generation-quick-ref.md)（生成管線）
**來源：** 依 MP file（各角色搜尋關鍵字）的「避免內容類型」篩選後，整理出 16 種一般 YouTuber / KOL 講道理、說故事的表現手法，並補上每一式的影像生成與鏡頭配合方案。

> 全部 16 式都符合硬性約束：**單人演出、單場景可完成、無飲食動作、無真實店家/品牌/遊戲畫面、無兩人以上肢體接觸、無精細花色道具特寫**。
> 表演層（微表情、次級動態、眼神）一律遵循 `07` 的 R1–R5，本文件只補「**鏡頭這一層**」。

---

## Part 0 — 通用鏡頭規格（16 式共用底座）

| 項目 | 規格 | 理由 |
|------|------|------|
| 畫幅 | 9:16 直式，1080×1920 起跳 | 短影音平台標準 |
| 基礎取景 | **腰上半身（waist-up）**，主體佔畫面 60–75% | `07` §C.1：臉要大到看得見微表情 |
| 打光 | 大面積窗光，45° 前側柔光 | `07` R4 底層物理 |
| 機位生命感 | 永遠保留**手持微晃**（除第 12 式 deadpan 外） | `07` R5：死板機位＝AI 感 |
| 運鏡幅度 | 小而慢。口播片的運鏡是「呼吸」，不是「特技」 | 大幅運鏡會放大 AI 破綻（背景變形、手部崩壞） |
| 多景別策略 | **優先「一顆 4K 鏡頭 + 後製數位裁切」做景別變化**，而不是生成多顆不同景別的鏡頭 | 省生成成本、跨鏡頭臉部一致性最穩（`01` 常見問題第一條） |
| 驅動片 | 口播片的驅動片選「**講話手勢自然、表情密度高、有鏡頭互動**」的真人片，不選舞蹈片 | `07` §G 教訓 2：表情密度 > 動作品質 |

**Prompt 共用底座**（每一式的鏡頭 prompt 都疊在這段之上）：

```
vertical 9:16, waist-up medium shot, soft large window light from 45 degrees,
subtle handheld camera sway, natural skin texture, shallow depth of field,
lived-in room background with plants and everyday objects
```

---

## Part A — 開場鉤子型（1–4）

### 第 1 式：反直覺斷言開場（Hot Take）

> 文案：第一句直接丟違反常識的結論，整支片證明它。

| 層面 | 設計 |
|------|------|
| 取景 | **斷言那句 = 近景（MCU，胸上）**，臉佔畫面 40%+；證明段落退回標準腰上鏡頭 |
| 鏡頭運動 | 斷言瞬間做一個**快速小幅推近（snap push-in）**，約 5–8% 畫面放大，0.3 秒內完成——這是「敲桌子」的鏡頭版 |
| 生成方式 | **一顆鏡頭生成即可**：生成 4K 腰上鏡頭，開場的近景與 snap push-in 全部用**後製數位裁切**做，不必生成第二顆 |
| 眼神 | 斷言句**死盯鏡頭不眨眼**（R5 的反向運用：刻意的直視＝挑釁），之後恢復自然眼神漂移 |

**鏡頭 prompt 追加：**
```
she leans slightly toward the camera and holds direct unbroken eye contact
while delivering the opening line, confident assertive posture
```
（push-in 在後製做，不寫進生成 prompt——生成的 zoom 常伴隨背景變形。）

---

### 第 2 式：提問懸念型（Open Loop）

> 文案：開頭拋問題不答，結尾收回。

| 層面 | 設計 |
|------|------|
| 取景 | 全程腰上鏡頭，但**開頭與結尾用同一個構圖**——「同框首尾呼應」讓觀眾潛意識知道「回到問題了」 |
| 鏡頭運動 | 拋出問題後開始**極慢速推近（slow creep-in）**，全片從 100% 緩推到 ~112%，在揭曉答案那一刻停住。觀眾感覺不到在推，但張力一直在升 |
| 生成方式 | 一顆 4K 鏡頭 + 後製做 creep-in（Premiere/Resolve 關鍵幀縮放即可）。**不要生成中途換景**——open loop 的張力靠連續感，跳景會洩壓 |
| 眼神 | 拋問題時**看鏡頭→移開（望向斜上方，像自己也在想）→回看鏡頭**，是 R5 眼神腳本的標準應用 |

**鏡頭 prompt 追加：**
```
she poses a question to the camera, glances up and away as if thinking,
then returns her gaze to the lens with a knowing half-smile
```

---

### 第 3 式：「我本來也不信」自我反轉型

> 文案：先站觀眾立場，再用自己的立場轉變帶觀眾走。

| 層面 | 設計 |
|------|------|
| 取景 | 用**身體姿態區分兩個「我」**：懷疑期＝靠椅背、身體偏離畫面中軸、微歪頭；相信期＝坐直、回到中軸、上身前傾 |
| 鏡頭運動 | 機位不動，**讓主體自己移動**。轉折句（「直到我自己算了一次」）配一個 jump cut：同機位、姿態直接切換——jump cut 本身就是「想法斷裂」的視覺隱喻 |
| 生成方式 | **生成兩顆同場景短鏡頭**（同 Seed、同景、同光），只差姿態 prompt；或一顆長鏡頭裡讓驅動片包含「坐姿改變」。前者更穩 |
| 眼神 | 懷疑期眼神多漂移、少看鏡頭；相信期眼神鎖定鏡頭——**眼神接觸率的變化就是說服力曲線** |

**鏡頭 prompt（兩顆）：**
```
A: leaning back in her chair, slightly off-center, skeptical raised eyebrow,
   arms loosely crossed, gaze drifting
B: sitting upright at frame center, leaning toward camera, engaged direct
   eye contact, hands open on the table
```

---

### 第 4 式：倒敘開場（先給結局）

> 文案：先講結果，再回頭講過程。天然適合 Faye 的親身經歷。

| 層面 | 設計 |
|------|------|
| 取景 | **冷開場（cold open）用近景**：臉佔畫面 45%+，光線可以稍暗、對比稍高（「事後餘悸」感）；回到過程敘述時切回標準腰上鏡頭、正常窗光 |
| 鏡頭運動 | 冷開場靜態微晃；進入倒敘時用一個**輕微的白閃或直接硬切**表示時間跳躍。不要用 AI 生成轉場動畫——便宜的剪接語言反而更像真人 vlog |
| 生成方式 | **兩顆鏡頭**：①近景冷開場（3–5 秒，一句話）②標準腰上主敘事鏡頭。近景那顆短，成本可控 |
| Faye 變體 | 冷開場改用**手持自拍近臉**（鏡頭微微舉高、輕微行走晃動），像「剛走出機場海關立刻開拍」的即時感 |

**鏡頭 prompt（冷開場顆）：**
```
tight close-up, face fills nearly half the frame, slightly dimmer moodier
light, she exhales and shakes her head as if just recovering from the event,
handheld micro-shake
```

---

## Part B — 敘事結構型（5–8）

### 第 5 式：三幕迷你故事（鋪陳→轉折→領悟）

> 文案：情境 30% / 轉折 40% / 領悟 30%。

| 層面 | 設計 |
|------|------|
| 取景 | **三幕 = 三個景別，逐幕收緊**：鋪陳＝腰上（MS）→ 轉折＝胸上（MCU）→ 領悟＝近景（CU）。景別收緊曲線 = 情緒收緊曲線 |
| 鏡頭運動 | 每一幕內部機位穩定微晃；**幕與幕之間用硬切換景別**，切點對準文案的轉折句 |
| 生成方式 | **一顆 4K 長鏡頭 + 後製三段式數位裁切**（100% → 130% → 165%）。這是本文件最重要的省錢技巧：三個景別、一次生成、臉完全一致 |
| 注意 | 裁到 165% 時檢查皮膚質感是否還撐得住（`07` R4）——4K 源檔裁 165% 後仍約 1.5K，安全 |

**鏡頭 prompt：** 用共用底座即可，額外要求**表演有明確三段情緒**，供裁切點對位：
```
her performance shifts through three phases: relaxed storytelling,
a surprised turning point, then a quiet reflective conclusion
```

---

### 第 6 式：「朋友的故事」代入法

> 文案：「我有個朋友……」結尾點破那個朋友就是你。

| 層面 | 設計 |
|------|------|
| 取景 | 標準腰上，但構圖**刻意偏一側**（主體在畫面 1/3 處），留出的負空間彷彿「那個朋友」的位置 |
| 鏡頭運動 | 講朋友時，眼神偶爾**瞟向負空間那一側**（像朋友就坐在那）；點破「就是你」的瞬間，眼神甩回鏡頭 + 後製小幅 punch-in，同時可把構圖裁回置中——**「空位消失了，因為說的就是螢幕前的你」** |
| 生成方式 | 一顆鏡頭生成。關鍵在 prompt 寫清楚**眼神的兩個方向**；若驅動片驅動，選有「側看→回看鏡頭」動作的真人片 |
| 禁區對齊 | 「朋友」永遠不出現在畫面裡——這一式的力量正是**用鏡頭語言暗示一個不存在的人**，完全避開多人生成地雷 |

**鏡頭 prompt 追加：**
```
framed off-center on the left third of the image, she occasionally glances
toward the empty right side of the frame as if referring to someone sitting
there, then snaps her gaze back to the lens for the final line
```

---

### 第 7 式：清單倒數型（Top 3 / 5 件事）

> 文案：由輕到重倒數，最重的放最後。

| 層面 | 設計 |
|------|------|
| 取景 | 標準腰上，但**每個條目之間做 jump cut**：同機位、主體姿勢/位置微變（重心換腳、換手勢、身體角度差 10–15°）。jump cut 節奏 = 清單節奏 |
| 鏡頭運動 | 條目內靜態微晃；**最後一名（最重的）給獨有待遇**：後製 punch-in 一級 + 節奏放慢，鏡頭語言告訴觀眾「這條不一樣」 |
| 生成方式 | 兩條路：①**一顆長鏡頭剪成段**（最省，姿態變化靠驅動片自帶）②每條目**各生成一顆 5 秒短鏡頭**（同 Seed 同景，姿態 prompt 各異）——條目多於 3 個時建議走 ①，5 顆短鏡頭的臉部一致性風險太高 |
| 字卡 | 每個條目跳出編號大字卡（後製），生成時**頭頂留 15% 淨空**給字卡（見第 13 式的留白規則） |

**鏡頭 prompt 追加：**
```
generous headroom above her head for text overlay, she counts on her fingers
with clear deliberate gestures, shifting her weight and posture between points
```

---

### 第 8 式：時間軸拆解型

> 文案：把一件事按時間切開講（前 10 秒你在想什麼、第 30 秒發生什麼……）。

| 層面 | 設計 |
|------|------|
| 取景 | 腰上偏寬一點（大約肋骨上緣起框），因為**雙手要有比劃「時間從左到右」的空間** |
| 鏡頭運動 | 每進入下一個時間點，機位做**極小幅的側向平移（truck）**，方向固定由左至右（後製位移即可）——鏡頭跟著時間軸「走」，觀眾潛意識裡有進度感 |
| 生成方式 | 一顆 4K 鏡頭 + 後製側移裁切（4K 寬度裕度足夠做 3–4 檔位移）。**注意鏡像問題**：主體比手勢的「左→右」在觀眾視角是反的，文案若說「從左到右」，主體要比「從她的右到她的左」 |
| 手勢 | 手勢是本式的靈魂也是 AI 最易崩處（`07` §C.3 手部檢核）——手勢要**大、慢、少**，每個時間點一個定格手勢，不要連續快速比劃 |

**鏡頭 prompt 追加：**
```
slightly wider waist-up framing with both hands fully visible, she marks
points in the air moving from screen-left to screen-right, slow deliberate
hand positions held briefly at each beat
```

---

## Part C — 對鏡頭表演型（9–12）

### 第 9 式：一人分飾兩角（剪接切換，不同框）

> 文案：「理性的我」vs「上頭的我」自我對話。

| 層面 | 設計 |
|------|------|
| 取景 | **正反打（shot / reverse shot）的單人版**：角色 A 框在畫面左 1/3、身體朝右、視線看向畫面右外；角色 B 框在畫面右 1/3、身體朝左、視線看向畫面左外。剪在一起，觀眾大腦自動把兩人「接」在同一空間對話——**兩人永遠不同框，完全避開多人接觸地雷** |
| 鏡頭運動 | 兩邊都靜態微晃。對話節奏加快時剪接變快，不需要運鏡 |
| 生成方式 | **生成兩顆鏡頭，同場景、同 Seed、同光位**，只差：構圖側、身體朝向、以及**一個低成本的視覺記號**（理性我＝戴眼鏡/外套披上；上頭我＝眼鏡摘掉/外套脫掉）。切勿用分割畫面同框——那需要兩個「我」動作同步，生成風險高 |
| 眼神 | **這一式唯一不看鏡頭的**：兩個我互相「看對方」（即看向畫面外側），只有最後結論那句，由勝出的那個「我」轉頭看鏡頭收尾 |

**鏡頭 prompt（兩顆）：**
```
A: framed on the left third facing screen-right, wearing glasses, calm
   composed posture, speaking to someone just off-frame to the right
B: framed on the right third facing screen-left, no glasses, animated
   excited posture, speaking to someone just off-frame to the left
```

---

### 第 10 式：「假裝在跟你視訊」親密口吻型

> 文案：手持自拍視角，像跟朋友講電話。Faye 的慣用格式。

| 層面 | 設計 |
|------|------|
| 取景 | **手臂長度自拍框**：臉佔畫面高度 35–45%，鏡頭略高於眼線 10–15°（自拍俯角顯臉小，符合亞洲網紅習慣），廣角輕微變形（臉近大遠小）是**特徵不是瑕疵**，要保留 |
| 鏡頭運動 | **行走節奏晃動**：畫面隨步伐每秒約 1.5–2 次的上下微彈 + 手臂自然漂移。這是全 16 式中「機位生命感」最強的一式——晃動就是它的真實感來源 |
| 生成方式 | 驅動片**必須選真人自拍走拍片**（表情豐富 + 邊走邊講 + 鏡頭互動），Kling Motion Control + `scene_control=image`。純文字 prompt 很難生出正確的自拍透視與步伐晃動 |
| 背景 | 背景在動（街景後退）但**不可有可辨識的真實店家招牌**（MP file 禁區）——prompt 背景寫 generic：綠蔭街道、住宅巷弄、河堤、公園 |

**鏡頭 prompt 追加：**
```
handheld front-facing selfie perspective at arm's length, lens slightly above
eye level, mild wide-angle distortion, rhythmic walking bounce, generic
leafy residential street behind her with no readable signage, motion blur
on background
```

---

### 第 11 式：耳語爆料型（湊近鏡頭壓低聲音）

> 文案：講到關鍵處身體前傾、壓低音量。

| 層面 | 設計 |
|------|------|
| 取景 | 起始腰上標準框。關鍵句時**主體自己前傾靠近鏡頭**，臉從 25% 漲到 50%+——**距離變化由主體驅動，不是鏡頭推**。物理上「她湊過來」和「鏡頭推過去」完全不同：前者親密，後者窺視。這一式要前者 |
| 鏡頭運動 | 機位不動（微晃保留）。主體前傾時**淺景深讓背景明顯糊掉**——世界縮小到只剩你們兩個，這就是耳語的鏡頭語言 |
| 生成方式 | 一顆鏡頭生成，prompt 明確寫「lean in」動作；或選有前傾動作的驅動片。前傾時臉部大特寫對皮膚質感要求最高——R4 檢核在這一式要加嚴 |
| 聲音 | 配音檔在該句實際壓低音量 + 加輕微氣音（CosyVoice 支援情緒標記），畫面與聲音的「靠近」必須同步 |

**鏡頭 prompt 追加：**
```
mid-sentence she leans in close toward the lens until her face fills half
the frame, background melts into soft bokeh, conspiratorial expression
with one eyebrow slightly raised, then she settles back
```

---

### 第 12 式：冷面吐槽型（Deadpan）

> 文案：面無表情講荒謬事實，反差製造笑點。

| 層面 | 設計 |
|------|------|
| 取景 | **全 16 式唯一的例外機位**：完全鎖死的三腳架感、置中對稱構圖、正面平視（Wes Anderson 式）。「過度工整」在這裡是喜劇語言——世界越端正，講的內容越荒謬，反差越大 |
| 鏡頭運動 | **零運鏡、零晃動**。唯一允許的鏡頭事件：荒謬點爆出後，硬切 punch-in 一級（後製裁切），配一拍沉默——這就是 deadpan 的「笑點鏡頭」 |
| 生成方式 | 一顆鏡頭生成 + 後製 punch-in。**R2/R3 檢核放寬但不豁免**：表情「冷」不等於「凍結」，仍需保留眨眼、極小幅的視線移動、吞嚥——差別是幅度調到最小。若整段任一秒完全靜止，依然是 AI 破綻 |
| 注意 | 因為機位死板是刻意的，**真實感的全部重量壓在微表情上**——這一式的驅動片要選「面癱但活著」的真人片（眨眼頻率正常、有呼吸起伏） |

**鏡頭 prompt 追加：**
```
perfectly centered symmetrical composition, static locked-off tripod shot,
flat frontal framing at eye level, deadpan expression with occasional slow
blinks and subtle breathing, minimal but never frozen facial movement
```

---

## Part D — 視覺輔助型（13–16）

### 第 13 式：大字卡節奏型

> 文案：關鍵詞跳全螢幕大字，一句一卡。

| 層面 | 設計 |
|------|------|
| 取景 | 腰上鏡頭，但**構圖為字卡服務**：主體壓低到畫面下 2/3，頭頂留 20–25% 純淨負空間（該區域背景避免雜物、避免高對比紋理），字卡落點固定在上 1/4 |
| 鏡頭運動 | 機位穩定微晃。**節奏感全部由字卡的出現/消失製造**，鏡頭本身不做事——鏡頭和字卡搶戲會亂 |
| 生成方式 | 一顆鏡頭生成。生成 prompt 要**明確要求上方留白**（見下），否則 AI 預設會把主體置中填滿。字卡、動態、音效全部後製，生成層完全不涉及文字（AI 生成文字必崩） |
| 進階 | 主體講到關鍵詞時**視線向上瞟一眼**（看向字卡將出現的位置），字卡應聲而出——主體「知道」字卡存在，畫面就活了 |

**鏡頭 prompt 追加：**
```
subject positioned in the lower two-thirds of the frame, large clean
negative space above her head against a plain softly lit wall, she
occasionally glances upward as if acknowledging something above
```

---

### 第 14 式：手勢計數／空中比劃型

> 文案：手指比一二三、空中比劃大小與曲線。

| 層面 | 設計 |
|------|------|
| 取景 | **肋骨上緣起框的寬腰上鏡頭**，雙手活動範圍完整入框，手離鏡頭不可太近（手部佔畫面越大，AI 崩壞越明顯） |
| 鏡頭運動 | 靜態微晃。可在「比出關鍵手勢並定住」的瞬間後製 punch-in 到手＋臉同框的中景——**推向手勢，不推向臉**，因為這一式的資訊在手上 |
| 生成方式 | **手是 AI 最高風險區**（`07` §C.3），三道保險：①手勢**大、慢、每個定格 ≥1 秒**，禁止快速連續變換 ②優先選手勢清晰的真人驅動片，讓手部動作有真實運動學 ③產後逐幀檢查手指數量，崩了就重抽 |
| 後製 | 空中比劃的「抽象曲線/大小」可以後製疊加手繪動畫線條跟著手走（motion graphics），比生成更穩也更有網感 |

**鏡頭 prompt 追加：**
```
wider waist-up framing with full gesture space, both hands clearly visible
and well-separated from her face, slow emphatic counting gestures held
distinctly at each number, fingers clearly articulated
```

---

### 第 15 式：白板／手繪示意型

> 文案：畫抽象圈圈、箭頭、曲線講機制。（禁區：不畫撲克花色、骰子點數）

| 層面 | 設計 |
|------|------|
| 取景 | **3/4 側面機位**：主體站白板側前方 45°，身體 1/3、白板 2/3 分割畫面。不用正面機位——正面白板反光且構圖死 |
| 鏡頭運動 | 靜態微晃為主；講解推進時可後製在「主體臉」與「白板區」之間做兩檔裁切切換（一顆 4K 鏡頭裁出雙機位感） |
| 生成方式 | **最重要的原則：白板上的內容不要用 AI 生成。** 路線：①生成「主體對著**空白/近乎空白**白板講解、做出書寫與指點動作」的鏡頭 ②白板上的圈圈、箭頭、曲線全部**後製以動畫疊加**，跟著她的手勢時間點出現。AI 生成的板書必然是亂碼，一秒穿幫 |
| 禁區對齊 | 疊加的圖形一律抽象（圓形、箭頭、曲線、方塊），MP file 禁區的撲克花色與骰子點數在後製層同樣禁止 |

**鏡頭 prompt 追加：**
```
three-quarter side angle, she stands beside a mostly blank whiteboard
holding a marker, gesturing toward the board and miming drawing motions,
the board occupies the larger portion of the frame with soft even lighting
and no readable writing
```

---

### 第 16 式：「鏡頭外有人」單口對話型

> 文案：對鏡頭外假想的工作人員/朋友說話，畫面裡始終一個人。

| 層面 | 設計 |
|------|------|
| 取景 | 標準腰上，構圖可微偏中軸。**鏡頭外的「人」固定在一個方位**（建議畫面右外、略低於眼線＝坐著的工作人員），整支片眼線方向不可漂移，否則假想空間崩塌 |
| 鏡頭運動 | 靜態微晃。進階版：她看向鏡外說「欸這能講嗎？」時，機位可做一個**極小的猶豫感偏移**（後製 2–3% 位移），彷彿掌機的人也有反應——鏡頭本身成為「第三個角色」 |
| 生成方式 | 一顆鏡頭生成。prompt 把**兩個眼線方向**（鏡頭 / 右外偏下）與切換時機寫清楚；或選有「與鏡頭後的人講話」感的訪談類真人驅動片 |
| 聲音 | 鏡外者**永遠不出聲**（出聲就需要第二個聲音人格，且觀眾會期待看到他）；她自己複述對方的反應：「你說什麼？……真的假的。」——單人聲軌完成雙人對話 |

**鏡頭 prompt 追加：**
```
she alternates between addressing the lens and glancing off-frame to the
lower right as if consulting someone behind the camera, reacting with a
short laugh and a shrug before turning back to the lens
```

---

## Part E — 生成路線速查表

| 式 | 鏡頭顆數 | 景別變化來源 | 驅動片需求 | 相對成本 |
|----|---------|-------------|-----------|---------|
| 1 反直覺斷言 | 1 | 後製裁切 punch-in | 一般口播片 | 低 |
| 2 提問懸念 | 1 | 後製 creep-in | 一般口播片 | 低 |
| 3 自我反轉 | 2（同景同 Seed） | 姿態切換 jump cut | 可純 prompt | 中 |
| 4 倒敘開場 | 2（近景+腰上） | 換顆 | 一般口播片 | 中 |
| 5 三幕故事 | 1 | 後製三段裁切 | 情緒有三段的口播片 | 低 |
| 6 朋友的故事 | 1 | 後製裁切 | 有側看動作的口播片 | 低 |
| 7 清單倒數 | 1（長鏡頭剪段） | jump cut + 字卡 | 手勢自然的口播片 | 低 |
| 8 時間軸拆解 | 1 | 後製側移 | 手勢清晰的口播片 | 低 |
| 9 一人分飾兩角 | 2（左右正反打） | 剪接 | 兩段對話感驅動片 | 高 |
| 10 視訊口吻 | 1 | 無需 | **必須**：真人自拍走拍片 | 中 |
| 11 耳語爆料 | 1 | 主體前傾 | 有前傾動作的口播片 | 低 |
| 12 冷面吐槽 | 1 | 後製 punch-in | 「面癱但活著」的片 | 低 |
| 13 大字卡節奏 | 1 | 字卡後製 | 一般口播片 | 低 |
| 14 手勢計數 | 1 | 後製推向手勢 | **必須**：手勢清晰真人片 | 中（重抽風險） |
| 15 白板手繪 | 1 | 後製雙機位裁切 | 有講解手勢的片 | 中（後製較重） |
| 16 鏡外有人 | 1 | 無需 | 訪談感口播片 | 低 |

> **成本結論：** 16 式中 10 式只需一顆鏡頭 + 後製，真正貴的只有第 9 式（兩顆正反打）。
> 起步建議先用低成本式（1、2、5、7、13）建立節奏，熟練後再上 9、10、14。

---

## Part F — 三個角色的優先配對建議

| 角色 | 首選式 | 理由 |
|------|-------|------|
| **Tan XiaoXiao**（機率/規則研究者） | 1 反直覺斷言、5 三幕故事、8 時間軸拆解、15 白板手繪（抽象圖形） | 講機制、講反直覺結論的知識型語感；白板式天然取代被禁的撲克/骰子特寫 |
| **Faye Tan**(世界/城市觀察者) | 10 視訊口吻、4 倒敘開場、6 朋友的故事、11 耳語爆料 | 手持自拍是她的既有格式；親身經歷敘事適合倒敘與爆料口吻；全部單場景，避開多景點快切禁區 |
| **Zhang Qinfeng**（數位/遊戲體驗觀察者) | 9 一人分飾兩角（理性我 vs 上頭我）、7 清單倒數、12 冷面吐槽、2 提問懸念 | 「為什麼你還想再玩一局」的內在拉扯天然適合分飾兩角；吐槽氪金套路適合 deadpan；全程不需出現任何真實遊戲畫面 |

---

## 附錄：一句話總結

> **口播片的鏡頭不是拍風景，是拍「關係」。**
> 16 式的鏡頭語言只做三件事：**距離**（誰靠近誰）、**眼線**（她在跟誰說話）、**節奏**（何時切、何時停）。
> 生成層只負責一顆穩定的好鏡頭；距離與節奏盡量交給後製裁切與剪接——**便宜、穩定、而且更像真人拍的**。
