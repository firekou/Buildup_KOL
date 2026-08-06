# 對標帳號總表

3 個人設 × 6 個平台 = 18 個單位，共 **41 個經查證的真人帳號**。
資料日期 2026-08-06；原始資料 `research/benchmark-accounts/results.json`，
查證工具 `research/benchmark-accounts/vf.py`，方法與限制見 `research/benchmark-accounts/README.md`。

> 每一筆都經過實際查證，`查證方式` 欄寫明當時看到什麼。
> 湊不滿 3 個的單位誠實留白，**不以推測補足**。

## 覆蓋率

| 人設 | YouTube | X（Twitter） | TikTok | Instagram | Threads | Facebook | 小計 |
|---|---|---|---|---|---|---|---|
| 賭博哥 | 3 | 3 | 3 | 3 | **2** | 3 | 17 |
| 旅遊姊 | 3 | 3 | **2** | 3 | **0** | **1** | 12 |
| 遊戲哥 | 3 | **2** | 3 | **2** | **0** | **2** | 12 |
| **小計** | **9** | **8** | **8** | **8** | **2** | **6** | **41** |

粗體 = 未達 3 個，缺口原因見各單位下方說明。

## 查證強度

| 等級 | 帳號數 | 說明 |
|---|---|---|
| 直接抓取 `direct-fetch` | 25 | 實際抓取該平台個人頁並解析，身分與粉絲數直接讀自頁面（YouTube／X／TikTok）。 |
| 交叉比對 `cross-reference` | 16 | 平台拒絕本機匿名請求（Instagram 回 401、Threads／Facebook 只給 JS 殼）。改以創作者自家網站／Linktree 或搜尋索引佐證，並盡量用同 handle 在可直接抓取平台上的帳號互相印證。 |

---

# 賭博哥（`kols/xiaoxiao-tan`）

## YouTube · 3/3 · 作品型平台

### 3Blue1Brown `@3blue1brown`

- **連結**：https://www.youtube.com/@3blue1brown
- **粉絲數**：8.52M subscribers
- **查證等級**：直接抓取 `direct-fetch`
- **查證方式**：直接抓取 youtube.com/@3blue1brown，channelMetadataRenderer 回傳 externalId=UCYO_jab_esuFRV4b17AJtAw、title=3Blue1Brown、頁面標示 8.52M subscribers（2026-08-06）
- **為什麼對得上**：Grant Sanderson 的視覺化數學頻道，貝氏定理、蒙提霍爾等「直覺錯覺」主題正是賭博哥的核心公式
- **可直接抄的做法**：把抽象機率變成螢幕上可移動的具體物件（一格一格的機率方塊），先讓觀眾說出直覺答案再用動畫當場推翻；全程不出鏡，只有旁白＋動畫

### Primer `@PrimerBlobs`

- **連結**：https://www.youtube.com/@PrimerBlobs
- **粉絲數**：1.94M subscribers
- **查證等級**：直接抓取 `direct-fetch`
- **查證方式**：直接抓取 youtube.com/@PrimerBlobs，channel_title=Primer、簡介 'Attempting to communicate the deep ideas of academic subjects'、頁面標示 1.94M subscribers / 24 videos（2026-08-06）
- **為什麼對得上**：用模擬生物（blobs）跑演化與賽局模擬，內容主體就是「規則→模擬→結構為什麼有趣」，與賭博哥定位幾乎完全重疊且零博弈風險
- **可直接抄的做法**：先明確宣告規則，再讓模擬自己跑出反直覺結果，結論交給觀眾；用同一組角色貫穿全片建立記憶點；影片少而長，重質不重量

### 李永乐老师 `@李永乐老师官方`

- **連結**：https://www.youtube.com/channel/UCvNxfitQbWkmLuCd44UfrYQ
- **粉絲數**：50K subscribers
- **查證等級**：直接抓取 `direct-fetch`
- **查證方式**：直接抓取 youtube.com/channel/UCvNxfitQbWkmLuCd44UfrYQ，channel_title=李永乐老师、canonical handle=@李永乐老师官方、簡介『大家好，我是李永乐老师』、頁面標示 50K subscribers / 117 videos（2026-08-06）。註：YouTube 是其海外鏡像頻道，主戰場在中國平台
- **為什麼對得上**：簡體中文母語講者，主題涵蓋概率、检查悖论、组合数，語言與題材都與賭博哥直接對應
- **可直接抄的做法**：一塊白板從頭寫到尾、單鏡到底不剪輯；用當下時事熱點當引子再轉進機率原理；標題直接下問句（『XXX能被预测吗？』）

> 另已直接查證 @zachstar(1.41M)、@standupmaths(1.35M)、@Vsauce(25M)、妈咪说MommyTalk(@Sci1729, 217K) 均真實存在，可作後備。

## X（Twitter） · 3/3 · 日常感平台

### Daniel Litt `@littmath` — 日常感

- **連結**：https://x.com/littmath
- **粉絲數**：—
- **查證等級**：直接抓取 `direct-fetch`
- **查證方式**：直接抓取 x.com/littmath，頁面標題為 'Daniel Litt (@littmath) / X'、簡介 'Assistant professor (of mathematics) at the University of Toronto'（2026-08-06）。Quanta Magazine 專文報導其機率謎題現象
- **為什麼對得上**：多倫多大學數學家，以『看起來很簡單卻反直覺』的機率謎題在 X 上引發大規模討論（某題只有約 22% 的人答對），就是賭博哥『大家覺得是這樣，其實機率上不是』的原型
- **可直接抄的做法**：用一則純文字短貼文丟出謎題＋投票，先讓群眾投錯，隔天再公布解法；謎題設定極簡（罐子裡 100 顆球）不需任何圖表；答案揭曉時大方承認自己也曾直覺答錯

### Nassim Nicholas Taleb `@nntaleb` — 日常感

- **連結**：https://x.com/nntaleb
- **粉絲數**：—
- **查證等級**：直接抓取 `direct-fetch`
- **查證方式**：直接抓取 x.com/nntaleb，頁面標題為 'Nassim Nicholas Taleb (@nntaleb) / X'、簡介 'Flaneur: probability (philosophy), probability (mathematics), probability (real life)'（2026-08-06）
- **為什麼對得上**：機率與不確定性的公共知識分子，貼文語氣極度口語隨性、日常吐槽與機率論點混雜，符合 X 平台要的『日常感』而非精緻教學
- **可直接抄的做法**：把生活瑣事直接換算成機率語言隨手發一句；不怕立場鮮明地打臉主流說法；長短貼文交錯，不追求每篇都完整論證

### Matt Parker `@standupmaths` — 日常感

- **連結**：https://x.com/standupmaths
- **粉絲數**：—
- **查證等級**：直接抓取 `direct-fetch`
- **查證方式**：直接抓取 x.com/standupmaths，頁面標題為 'Matt Parker (@standupmaths) / X'、簡介 '#1 best-selling author, also maths clown'（2026-08-06）
- **為什麼對得上**：數學脫口秀演員，把數學錯誤與統計誤用當笑料，語氣輕鬆日常，示範了『知識型但不說教』的文字語氣
- **可直接抄的做法**：自嘲式開場（自稱 maths clown）降低知識份子距離感；抓現實世界的數字錯誤（新聞、包裝、看板）當隨手貼文題材；用玩笑包裝糾錯，不居高臨下

> @3blue1brown（Grant Sanderson）在 X 上同樣已直接查證存在，但貼文偏頻道宣傳，日常感較弱，列為後備。

## TikTok · 3/3 · 作品型平台

### Kyne `@onlinekyne`

- **連結**：https://www.tiktok.com/@onlinekyne
- **粉絲數**：1,600,000
- **查證等級**：直接抓取 `direct-fetch`
- **查證方式**：直接抓取 tiktok.com/@onlinekyne，頁面 JSON 回傳 uniqueId=onlinekyne、nickname=Kyne、followerCount=1600000、簡介 'Math queen'（2026-08-06）
- **為什麼對得上**：滑鐵盧大學數學系出身，短影音講數學謎題並專門教觀眾『如何識破媒體上被誤用的統計數字』，與賭博哥『拆穿直覺錯覺』完全同軌
- **可直接抄的做法**：前 3 秒先丟一個會讓人答錯的選擇題把人釘住；用強烈的個人視覺形象讓硬知識變得好記；每支影片只處理一個誤解，不貪多

### 3Blue1Brown（官方 TikTok） `@3blue1brown`

- **連結**：https://www.tiktok.com/@3blue1brown
- **粉絲數**：238,700
- **查證等級**：直接抓取 `direct-fetch`
- **查證方式**：直接抓取 tiktok.com/@3blue1brown，頁面 JSON 回傳 uniqueId=3blue1brown、nickname=Grant Sanderson、followerCount=238700、簡介自述 'Official 3Blue1Brown TikTok Account'（2026-08-06）
- **為什麼對得上**：同一位創作者在短影音格式下的版本，可直接對照『同樣的機率內容，長影音與短影音各要怎麼剪』
- **可直接抄的做法**：把長片裡最反直覺的 30 秒單獨切出來當獨立影片；直式畫面裡動畫置中、字級放大；結尾不硬導流，讓內容自己成立

### AndyMath.com `@andymath.com`

- **連結**：https://www.tiktok.com/@andymath.com
- **粉絲數**：1,300,000
- **查證等級**：直接抓取 `direct-fetch`
- **查證方式**：直接抓取 tiktok.com/@andymath.com，頁面 JSON 回傳 uniqueId=andymath.com、nickname=AndyMath.com、followerCount=1300000、簡介 'how exciting'（2026-08-06）
- **為什麼對得上**：用極短篇幅處理單一數學謎題，示範了『一題一片、講完就停』的節奏，適合賭博哥把機率題拆成系列
- **可直接抄的做法**：開場即題目、沒有自我介紹；手寫解題過程全程入鏡，讓觀眾跟著推導；固定收尾語做成個人標記

> 已直接查證 @veritasium(1.8M)、@tibees(215.1K) 亦真實存在可當後備。查證中淘汰兩個：TikTok 的 @numberphile 實際暱稱為 Pranjal6MS、僅 2 名粉絲，並非 Numberphile 本尊；@standupmaths 的 TikTok 僅 3 名粉絲屬閒置帳號，皆不適合對標。

## Instagram · 3/3 · 日常感平台

### Hannah Fry `@fryrsquared` — 日常感

- **連結**：https://www.instagram.com/fryrsquared/
- **粉絲數**：約 2.1M（搜尋結果所示，未能親自登入核對）
- **查證等級**：交叉比對 `cross-reference`
- **查證方式**：本機無法匿名抓取 Instagram（回傳 401 require_login）。改以交叉比對：同一 handle 的 x.com/FryRsquared 與 tiktok.com/@fryrsquared 皆由我直接抓取確認為本人（X 標題 'Hannah Fry (@FryRsquared) / X'；TikTok nickname=Hannah Fry、496,600 粉、簡介 'Maths Prof, writer'），搜尋結果亦一致指向 instagram.com/fryrsquared（2026-08-06）
- **為什麼對得上**：劍橋數學教授、機率與統計的公共傳播者，IG 貼文把個人生活與數學觀察混著發，正是這個平台要的日常感而非精緻教學
- **可直接抄的做法**：專業身分與生活照交錯發，不把版面經營成教材；圖片用隨手拍而非設計過的圖卡；文案用第一人稱講當下心情，把知識點藏在句子後半

### Kyne Santos `@onlinekyne` — 日常感

- **連結**：https://www.instagram.com/onlinekyne/
- **粉絲數**：—
- **查證等級**：交叉比對 `cross-reference`
- **查證方式**：由本人官網 onlinekyne.com 直接抓取到其社群清單，明列 instagram.com/onlinekyne；該清單上的 tiktok.com/@onlinekyne 已由我直接抓取確認（uniqueId=onlinekyne、1,600,000 粉），故此清單可信（2026-08-06）
- **為什麼對得上**：數學系出身的短影音創作者，IG 上以個人生活與造型內容為主、數學為輔，示範了知識型人設如何在圖文平台維持人味
- **可直接抄的做法**：把專業內容與生活內容維持大約一比一，避免帳號變成單向教學；限時動態用來丟半成品想法與提問；貼文文案短、留白多

### AndyMath.com `@andy_math_dot_com`

- **連結**：https://www.instagram.com/andy_math_dot_com/
- **粉絲數**：—
- **查證等級**：交叉比對 `cross-reference`
- **查證方式**：由本人 Linktree（linktr.ee/Andymath）直接抓取到其社群清單，明列 instagram.com/andy_math_dot_com；同一清單上的 tiktok.com/@andymath.com 已由我直接抓取確認（uniqueId=andymath.com、1,300,000 粉），故此清單可信（2026-08-06）
- **為什麼對得上**：單題數學謎題的圖文版本，可對照『同一道機率題在 IG 圖文與短影音要怎麼分別處理』
- **可直接抄的做法**：一張圖就是一道題，答案放留言或下一張；系列化編號讓觀眾養成追更習慣

> Instagram 在本機需登入，三個帳號皆為交叉比對查證（creator 自家網站／Linktree ＋ 同 handle 平台直接查證），非直接抓取。第三個 @andy_math_dot_com 的日常感較弱，已誠實標記 everyday_feel=false，若要更貼近平台調性建議日後替換。

## Threads · 2/3 · 日常感平台

### Hannah Fry `@fryrsquared` — 日常感

- **連結**：https://www.threads.com/@fryrsquared
- **粉絲數**：97.0K（搜尋索引所示）
- **查證等級**：交叉比對 `cross-reference`
- **查證方式**：本機無法抓取 Threads（回傳純 JS 殼，WebFetch 只拿到頁尾）。改以交叉比對：搜尋索引回傳標題 'Hannah Fry (@fryrsquared) • Threads, Say more'，並顯示 97.0K followers、42 threads、bio 'All math and no trouser'；此 bio 與我直接抓取 x.com/FryRsquared 所見的簡介 'All math and no trousers.' 一致，可確認為同一人（2026-08-06）
- **為什麼對得上**：數學教授在最口語的平台上的版本，貼文接近隨手記錄，與 Threads 調性相符
- **可直接抄的做法**：用一句話丟出當天遇到的數字或觀察，不附圖不附連結；回覆區當延伸內容用，把補充說明留在留言而非本文

### AndyMath.com `@andymath`

- **連結**：https://www.threads.com/@andymath
- **粉絲數**：—
- **查證等級**：交叉比對 `cross-reference`
- **查證方式**：由本人 Linktree（linktr.ee/Andymath）直接抓取到的社群清單明列 Threads @andymath；同清單上的 tiktok.com/@andymath.com 已由我直接抓取確認（uniqueId=andymath.com、1,300,000 粉），故該清單可信（2026-08-06）
- **為什麼對得上**：把單題數學謎題搬到純文字平台的做法，可對照機率題在無圖環境下要怎麼講
- **可直接抄的做法**：純文字描述題目、不倚賴圖形；把答案延到回覆串，製造留言互動

> ⚠ 只湊到 2 個，未達 3 個。原因：Threads 無法從本機抓取、且搜尋引擎對 Threads 個人檔案索引極稀疏，機率／規則這個垂直領域在 Threads 上找不到第三個能被獨立查證的帳號。依腳本規則 4「寧可少報，也絕對不要湊數編造」，不補足。建議由有登入 Threads 的人直接在站內搜尋補件。

## Facebook · 3/3 · 日常感平台

### Hannah Fry `HannahFryrsquared` — 日常感

- **連結**：https://www.facebook.com/HannahFryrsquared/
- **粉絲數**：305,287 likes（搜尋索引所示）
- **查證等級**：交叉比對 `cross-reference`
- **查證方式**：本機無法抓取 Facebook（回傳 400／JS 殼）。改以交叉比對：搜尋索引回傳 'Hannah Fry | Facebook' 指向 facebook.com/HannahFryrsquared，顯示 305,287 likes 與自述 'Maths Professor, science writer and all round bad ass'；此自述與我直接抓取 tiktok.com/@fryrsquared 所見簡介 'Maths Prof, writer and all-round badass' 高度一致，可確認為同一人（2026-08-06）
- **為什麼對得上**：同一位機率統計傳播者在篇幅可較長的平台上的版本，適合對照『同一個觀點在短貼文與長貼文要怎麼展開』
- **可直接抄的做法**：貼文比 X 長，會把一個機率觀念從生活情境寫到結論；固定分享自己上的節目與文章並附個人評註，而非單純轉貼

### Stand-up Maths `Stand-up Maths（頁面 ID 61561043015765）`

- **連結**：https://www.facebook.com/61561043015765/
- **粉絲數**：—
- **查證等級**：交叉比對 `cross-reference`
- **查證方式**：搜尋索引回傳該頁面的實際貼文 'Bayesian Statistics with Hannah Fry - Stand-up Maths'，網址為 facebook.com/61561043015765/videos/...；Stand-up Maths 本尊已由我直接抓取 youtube.com/@standupmaths（1.35M subscribers）與 x.com/standupmaths（Matt Parker）確認（2026-08-06）
- **為什麼對得上**：貝氏統計等主題的長篇說明，語氣詼諧不說教，是知識型帳號在 Facebook 上維持親和力的範例
- **可直接抄的做法**：把影片內容改寫成 Facebook 可讀的文字摘要再附連結，而不是只丟連結；用問句開頭邀請留言辯論

### AndyMath.com `@andymath`

- **連結**：https://www.facebook.com/andymath
- **粉絲數**：—
- **查證等級**：交叉比對 `cross-reference`
- **查證方式**：由本人 Linktree（linktr.ee/Andymath）直接抓取到的社群清單明列 Facebook @andymath；同清單上的 tiktok.com/@andymath.com 已由我直接抓取確認（uniqueId=andymath.com、1,300,000 粉），故該清單可信（2026-08-06）
- **為什麼對得上**：單題謎題的長圖文版本，可對照機率題在 Facebook 較長篇幅下要補多少背景說明
- **可直接抄的做法**：同一道題在不同平台重發但改寫敘述長度；善用留言區把答案討論延長成第二波觸及

> Facebook 在本機無法抓取，三個帳號皆為交叉比對查證。Hannah Fry 一筆的自述文字與其 TikTok 簡介逐字對應，識別強度最高；另兩筆屬於『帳號確實存在且歸屬正確』但未取得粉絲數。

---

# 旅遊姊（`kols/faye-tan`）

## YouTube · 3/3 · 作品型平台

### bald and bankrupt `@BaldandBankrupt`

- **連結**：https://www.youtube.com/@BaldandBankrupt
- **粉絲數**：4.54M subscribers
- **查證等級**：直接抓取 `direct-fetch`
- **查證方式**：直接抓取 youtube.com/@BaldandBankrupt，channelMetadataRenderer 回傳 channel_title='bald and bankrupt'、頁面標示 4.54M subscribers（2026-08-06）
- **為什麼對得上**：手持鏡頭走進一般住宅區與市場，內容主體是城市的生活紋理與偶遇的人，明確不是景點清單，與旅遊姊定位幾乎完全一致
- **可直接抄的做法**：整支片就是一段沒有腳本的走路，遇到什麼拍什麼；鏡頭常翻轉成自拍角度講當下感想再翻回去；刻意保留尷尬與冷場，不剪成順暢的旅遊節目

### Indigo Traveller `@IndigoTraveller`

- **連結**：https://www.youtube.com/@IndigoTraveller
- **粉絲數**：2.07M subscribers
- **查證等級**：直接抓取 `direct-fetch`
- **查證方式**：直接抓取 youtube.com/@IndigoTraveller，channel_title='Indigo Traveller'、簡介 'Travelling misunderstood parts of the planet showing the human side of what...'、頁面標示 2.07M subscribers（2026-08-06）
- **為什麼對得上**：以『被誤解的地方的人性面』為主軸，重點放在人與生活而非景點，符合旅遊姊觀察者而非導覽員的定位
- **可直接抄的做法**：開場先講自己此刻的緊張或困惑，讓觀眾跟著情緒進場；大量使用與當地人的即興對話當內容主體；旁白用氣音講，像在耳邊說話

### Nomadic Ambience `@NomadicAmbience`

- **連結**：https://www.youtube.com/@NomadicAmbience
- **粉絲數**：1.34M subscribers
- **查證等級**：直接抓取 `direct-fetch`
- **查證方式**：直接抓取 youtube.com/@NomadicAmbience，channel_title='Nomadic Ambience'、簡介 'Hello, I'm a solo traveler who loves photography, video and exploring new...'、頁面標示 1.34M subscribers（2026-08-06）
- **為什麼對得上**：純走路視角的城市漫遊，沒有旁白只有環境音，是旅遊姊『走路視角』鏡頭語言最純粹的參考
- **可直接抄的做法**：完全不解說，讓環境音自己敘事；鏡頭高度固定在視線水平，模擬真的用眼睛在看；長鏡頭不切，讓觀眾自己找細節

> 查證中淘汰：YouTube 的 @karlwatson 僅 441 訂閱，並非知名旅遊創作者 Karl Watson 本尊；@ProWalks 該 handle 不存在。@drewbinsky（7.23M）雖確實存在，但內容偏『世界最有趣的人事物』的故事導覽型，與旅遊姊避開打卡導覽的紅線較接近邊緣，未列入前三。

## X（Twitter） · 3/3 · 日常感平台

### Bald and Bankrupt `@BaldandBankrupt` — 日常感

- **連結**：https://x.com/BaldandBankrupt
- **粉絲數**：—
- **查證等級**：直接抓取 `direct-fetch`
- **查證方式**：直接抓取 x.com/BaldandBankrupt，頁面標題 'Bald and Bankrupt (@BaldandBankrupt) / X'、簡介 'Exploring the Soviet Union and other less-visited places in the world.'；與已直接查證的 youtube.com/@BaldandBankrupt（4.54M）為同一創作者身分（2026-08-06）
- **為什麼對得上**：影音之外的文字版本，貼文是隨手的旅途碎念與觀察，符合 X 要的日常感
- **可直接抄的做法**：用一句話講當下所在地發生的小事，不解釋前因後果；語氣像對朋友說話而非對觀眾發表；偶爾自嘲旅途的狼狽

### Everyday Asia `@everydayasia` — 機構帳號／日常感

- **連結**：https://x.com/everydayasia
- **粉絲數**：—
- **查證等級**：直接抓取 `direct-fetch`
- **查證方式**：直接抓取 x.com/everydayasia，頁面標題 'Everyday Asia (@everydayasia) / X'、簡介 'Photos of everyday life in Asia.'（2026-08-06）
- **為什麼對得上**：主題就是亞洲的日常生活影像，與旅遊姊『觀察生活紋理而非景點』的定位高度一致，地理範圍也涵蓋新加坡所在區域
- **可直接抄的做法**：一則貼文一張照片＋一句地點說明，不做長文；讓畫面裡的日常細節自己說話；持續累積同一主題形成識別度

### Drew Binsky `@drewbinsky` — 日常感

- **連結**：https://x.com/drewbinsky
- **粉絲數**：—
- **查證等級**：直接抓取 `direct-fetch`
- **查證方式**：直接抓取 x.com/drewbinsky，頁面標題 'Drew Binsky (@drewbinsky) / X'、簡介 'I Travel & Tell Stories About People & Culture'；與已直接查證的 tiktok.com/@drewbinsky（864,700 粉）一致（2026-08-06）
- **為什麼對得上**：旅行敘事者在文字平台的操作方式，可對照『影音創作者要怎麼經營文字帳號』
- **可直接抄的做法**：把旅途中的單一對話或衝突寫成短故事；用具體地名與人名增加真實感

> ⚠ 查證中排除 @IndigoTraveller：該 X 帳號確實存在，但顯示名稱為 'IndigoTraveller'、簡介為 'Little Miss Average who likes to have Big Adventures.'，與 YouTube 上 Indigo Traveller 頻道（『Travelling misunderstood parts of the planet』）的創作者身分不符，疑為同名不同人，依規則不予採用。@everydayasia 屬專題／機構型帳號而非個人創作者，已標記 is_org_account=true。

## TikTok · 2/3 · 作品型平台

### Drew Binsky `@drewbinsky`

- **連結**：https://www.tiktok.com/@drewbinsky
- **粉絲數**：864,700
- **查證等級**：直接抓取 `direct-fetch`
- **查證方式**：直接抓取 tiktok.com/@drewbinsky，頁面 JSON 回傳 uniqueId=drewbinsky、nickname='Drew Binsky 🌏'、followerCount=864700、簡介 'VISITED EVERY COUNTRY IN THE WORLD'（2026-08-06）
- **為什麼對得上**：把長片旅行故事壓縮成短影音的成熟範例，重點在人物故事而非景點導覽，可對標『一個城市觀察怎麼在 60 秒內講完』
- **可直接抄的做法**：開頭一句話就把地點與衝突講完再展開；同一趟旅程切成多支短片形成連載；口白節奏快但不喊叫，維持敘事感

### Zippo Sippe `@zipposippe` — 日常感

- **連結**：https://www.tiktok.com/@zipposippe
- **粉絲數**：598,800
- **查證等級**：直接抓取 `direct-fetch`
- **查證方式**：直接抓取 tiktok.com/@zipposippe，頁面 JSON 回傳 uniqueId=zipposippe、nickname='Zippo Sippe'、followerCount=598800、簡介 'From the Beautiful Maldives'（2026-08-06）
- **為什麼對得上**：以在地人視角拍自己家鄉的日常，刻意避開度假村式的觀光形象，正是旅遊姊要的『生活紋理而非打卡』
- **可直接抄的做法**：用本地人身分講在地事，建立外來遊客拍不出的視角；手持隨拍、不打光不調色；把當地人習以為常的小事當成內容主體

> ⚠ 只湊到 2 個，未達 3 個。查證中淘汰多個假冒／閒置帳號：TikTok 的 @baldandbankrupt 僅 175 粉、簡介自承 'I'm Bald And Bankrupt But Not The Original Version'（明確非本尊）；@indigotraveller 0 粉；@nomadicambience 僅 463 粉；@isaaclikes 實際暱稱 jedamleenard 僅 11 粉；@lukeychan 84 粉；@thevagabondtales 175 粉；@harrystours 0 粉。這些都是典型的『同名 handle 在不同平台屬於別人』陷阱。依規則寧可少報不湊數。

## Instagram · 3/3 · 日常感平台

### Everyday Asia `@everydayasia` — 機構帳號／日常感

- **連結**：https://www.instagram.com/everydayasia/
- **粉絲數**：159K（搜尋索引所示）
- **查證等級**：交叉比對 `cross-reference`
- **查證方式**：本機無法匿名抓取 Instagram（401 require_login）。交叉比對：搜尋索引回傳 'Everyday Asia (@everydayasia) • Instagram photos and videos'，顯示 159K followers、2,950 posts、主題 'Everyday life in Asia'；同名帳號 x.com/everydayasia 已由我直接抓取確認（簡介 'Photos of everyday life in Asia.'），兩者主題一致（2026-08-06）
- **為什麼對得上**：整個帳號的命題就是『亞洲的日常生活』，與旅遊姊觀察生活紋理的定位完全重疊，且地理範圍涵蓋新加坡
- **可直接抄的做法**：一張照片配一句地點與情境說明，不寫攻略；刻意挑選沒有觀光價值但有生活感的畫面；長期累積形成主題性而非單篇爆紅

### Bald and Bankrupt `@realbaldandbankruptofficial` — 日常感

- **連結**：https://www.instagram.com/realbaldandbankruptofficial/
- **粉絲數**：—
- **查證等級**：交叉比對 `cross-reference`
- **查證方式**：交叉比對：搜尋索引回傳 'Bald and Bankrupt (@realbaldandbankruptofficial) • Instagram photos and videos' 為官方帳號（同一組結果中另有 @baldandbankruptfanpage 被明確標示為粉絲頁，兩者已區分）；本尊身分已由我直接抓取 youtube.com/@BaldandBankrupt（4.54M）與 x.com/BaldandBankrupt 確認（2026-08-06）
- **為什麼對得上**：同一位創作者的圖文版本，貼文是旅途中的隨手記錄，符合 IG 要的日常感
- **可直接抄的做法**：照片不修圖不調色，維持粗糙的現場感；文案寫當下的情緒與偶遇，而非景點介紹

### Drew Binsky `@drewbinsky` — 日常感

- **連結**：https://www.instagram.com/drewbinsky/
- **粉絲數**：約 1M（搜尋索引所示）
- **查證等級**：交叉比對 `cross-reference`
- **查證方式**：交叉比對：搜尋索引回傳 'Drew Binsky (@drewbinsky) • Instagram photos and videos'、約 1M followers；同 handle 的 tiktok.com/@drewbinsky（864,700 粉）與 x.com/drewbinsky 均已由我直接抓取確認為本人（2026-08-06）
- **為什麼對得上**：跨平台一致的旅行敘事帳號，可對照『同一段旅程在 IG 圖文要怎麼重新剪裁』
- **可直接抄的做法**：人物特寫優先於風景，讓故事有主角；輪播貼文用來講一個完整小故事

> Instagram 在本機需登入，三筆皆為交叉比對查證。另已查得 Indigo Traveller 的官方 IG 為 @indigo.traveller（本名 Nick Fisher，紐西蘭旅行紀錄片創作者，與其 YouTube 頻道簡介一致），可作後備；注意 IG 上的 @indigotraveller 是一個 bboy 帳號，並非本人。

## Threads · 0/3 · 日常感平台

*（此單位沒有任何可查證的帳號）*

> ⚠ 0 個。查證能力限制：Threads 在本機完全無法抓取（curl 只拿到純 JS 殼，WebFetch 只拿到頁尾），而搜尋引擎對 Threads 個人檔案的索引極度稀疏——賭博哥那組只靠索引標題勉強確認到 2 個。這兩個垂直領域（城市觀察旅行／遊戲與影像設計分析）在搜尋索引裡找不到任何可獨立確認的 Threads 個人檔案。刻意不採用『Threads handle 通常等於 Instagram handle』這個推論來填補——那是未經查證的推測，正是本次研究要防的張冠李戴。建議由有登入 Threads 的人在站內直接搜尋補件。

## Facebook · 1/3 · 日常感平台

### Drew Binsky `drewbinsky` — 日常感

- **連結**：https://www.facebook.com/drewbinsky
- **粉絲數**：—
- **查證等級**：交叉比對 `cross-reference`
- **查證方式**：本機無法抓取 Facebook（400／JS 殼）。交叉比對：搜尋結果指出其 Facebook 頁面為 facebook.com/drewbinsky，且維基百科條目確認 Drew Binsky（本名 Drew Goldberg）為旅遊 YouTuber；同 handle 的 tiktok.com/@drewbinsky（864,700 粉）與 x.com/drewbinsky 已由我直接抓取確認為本人（2026-08-06）
- **為什麼對得上**：旅行敘事在長篇幅平台的版本，可對照『一段旅程要怎麼寫成能在 Facebook 讀完的文章』
- **可直接抄的做法**：貼文長度明顯拉長，把影片裡的故事改寫成可讀文字；固定用一張主圖＋長文的格式；留言區親自回覆，經營社群感

> ⚠ 只湊到 1 個，未達 3 個。Facebook 在本機完全無法抓取，只能靠搜尋索引交叉比對；Bald and Bankrupt 與 Everyday Asia 都未能找到可獨立確認的官方 Facebook 頁面（搜尋只回傳維基百科與第三方彙整文章，沒有指向官方頁面的可靠結果）。依規則寧可少報，不以『IG handle 應該也適用於 FB』這種推測補足——那正是本次要防的張冠李戴。

---

# 遊戲哥（`kols/loima-cheung`）

## YouTube · 3/3 · 作品型平台

### Game Maker's Toolkit `@GMTK`

- **連結**：https://www.youtube.com/@GMTK
- **粉絲數**：1.74M subscribers
- **查證等級**：直接抓取 `direct-fetch`
- **查證方式**：直接抓取 youtube.com/@GMTK，channel_title="Game Maker's Toolkit"、簡介 'a deep dive into game design, level design, an...'、頁面標示 1.74M subscribers（2026-08-06）
- **為什麼對得上**：逐一拆解遊戲機制『為什麼這樣設計會有效』，正是遊戲哥的核心命題；談設計本身而非攻略或收益，無博弈紅線風險
- **可直接抄的做法**：一支影片只回答一個設計問題，標題就是那個問題；用多款遊戲的同類機制並列比較，推導出通則；旁白冷靜不激動，讓論證本身帶節奏

### Thomas Flight `@ThomasFlight`

- **連結**：https://www.youtube.com/@ThomasFlight
- **粉絲數**：1.3M subscribers
- **查證等級**：直接抓取 `direct-fetch`
- **查證方式**：直接抓取 youtube.com/@ThomasFlight，channel_title='Thomas Flight'、簡介 'Exploring the artistry behind cinema, TV, and the visual media la...'、頁面標示 1.3M subscribers（2026-08-06）
- **為什麼對得上**：專門拆解影視的鏡頭語言與敘事結構為何有效，對應遊戲哥設定裡的『電影／鏡頭語言』那一塊
- **可直接抄的做法**：大量使用畫面對照剪輯來證明論點，而不是只用嘴說；把一個抽象的觀影感受精準命名，讓觀眾恍然大悟；片長依論證需要而定，不硬湊時長

### Extra Credits `@extracredits` — 機構帳號

- **連結**：https://www.youtube.com/@extracredits
- **粉絲數**：302K subscribers
- **查證等級**：直接抓取 `direct-fetch`
- **查證方式**：直接抓取 youtube.com/@extracredits，channel_title='Extra Credits'、簡介 'Video games are currently the most popular form of mass e...'、頁面標示 302K subscribers（2026-08-06）
- **為什麼對得上**：長期製作遊戲設計理論內容，含獎勵機制與成癮設計等主題，與遊戲哥『成癮設計、獎勵機制』的內容支柱直接對應
- **可直接抄的做法**：用簡單插畫動畫取代實機畫面，天然避開重現真實遊戲 UI 的風險（正好符合遊戲哥的紅線）；把學術概念改寫成口語比喻；系列化編排讓觀念可以層層堆疊

> 另已直接查證 @Nerdwriter1（3.24M，藝術與文化影像論文）、@JacobGeller（1.52M，遊戲與歷史／同理心）真實存在，可作後備。查證中淘汰：@Noclip 僅 1.79K 訂閱且簡介為泛用招呼語，並非知名遊戲紀錄片頻道 Noclip 本尊。

## X（Twitter） · 2/3 · 日常感平台

### Thomas Flight `@ThomasFlight` — 日常感

- **連結**：https://x.com/ThomasFlight
- **粉絲數**：—
- **查證等級**：直接抓取 `direct-fetch`
- **查證方式**：直接抓取 x.com/ThomasFlight，頁面標題 'Thomas Flight (@ThomasFlight) / X'；與已直接查證的 youtube.com/@ThomasFlight（1.3M）為同一創作者（2026-08-06）
- **為什麼對得上**：影像分析創作者的文字帳號，貼文是看片當下的即時反應與零碎觀察，符合 X 的日常感要求
- **可直接抄的做法**：看到一個鏡頭就隨手發一句為什麼有效，不等湊成完整影片；用『我剛注意到…』開頭降低論述壓力；把未成熟的想法公開，讓回覆幫忙補完

### Daniel Cook `@danctheduck` — 日常感

- **連結**：https://x.com/danctheduck
- **粉絲數**：—
- **查證等級**：直接抓取 `direct-fetch`
- **查證方式**：直接抓取 x.com/danctheduck，頁面標題 'Daniel Cook (also on mastodon) (@danctheduck) / X'、簡介含 'Chief Creative Officer' 與其部落格連結（2026-08-06）
- **為什麼對得上**：資深遊戲設計師，長期在網路上公開討論獎勵機制與玩家動機的設計原理，正是遊戲哥『成癮設計、獎勵機制』支柱的一手來源型帳號
- **可直接抄的做法**：用從業者身分講設計取捨的實際難處，而非旁觀者的評論；把設計原則寫成可引用的短句；串接自己的長文部落格，讓短貼文當入口

> ⚠ 只湊到 2 個，未達 3 個。查證中淘汰：@ExtraCredits 的顯示名稱為 'lindsay lohan'、0 追蹤者，屬被佔用的 handle 而非 Extra Credits 本尊；@JacobGeller 為一位西班牙語執業律師，與遊戲評論者 Jacob Geller 同名不同人；@grumpygame 實為 'Grumpy - Virtual Pet' 應用程式帳號，並非遊戲設計師 Ron Gilbert；@britishgaming 僅 47 追蹤者；@lizardengland 不存在。另 @gamemakerstk 確認為 Game Maker's Toolkit 本尊，但簡介明寫 'Now exclusively on Bluesky'，該帳號在 X 上已停止經營，不適合當現役對標範本，故未列入。

## TikTok · 3/3 · 作品型平台

### Josh Toonen `@joshtoonen`

- **連結**：https://www.tiktok.com/@joshtoonen
- **粉絲數**：103,400
- **查證等級**：直接抓取 `direct-fetch`
- **查證方式**：直接抓取 tiktok.com/@joshtoonen，頁面 JSON 回傳 uniqueId=joshtoonen、nickname='Josh Toonen'、followerCount=103400、簡介 'VFX Artist (Star Wars IX) Filmmaking + Unreal 5'（2026-08-06）
- **為什麼對得上**：VFX 從業者，用 Unreal 引擎講電影製作，同時橫跨遊戲技術與電影語言兩塊，正好對應遊戲哥『AI／電影／遊戲設計』的交叉點
- **可直接抄的做法**：把幕後製作過程本身當成內容，讓觀眾看到決策而不只是成果；用引擎畫面即時示範，避免引用真實遊戲 UI；每支片交付一個可帶走的技術觀念

### Daniel Joseph `@danjdickman`

- **連結**：https://www.tiktok.com/@danjdickman
- **粉絲數**：173,300
- **查證等級**：直接抓取 `direct-fetch`
- **查證方式**：直接抓取 tiktok.com/@danjdickman，頁面 JSON 回傳 uniqueId=danjdickman、nickname='Daniel Joseph'、followerCount=173300、簡介 'Emotion through motion 🎥 Director | Filmmaker'（2026-08-06）
- **為什麼對得上**：導演／攝影師，內容主軸是鏡頭運動如何製造情緒，直接對應遊戲哥的『鏡頭語言為什麼有效』
- **可直接抄的做法**：用同一顆鏡頭的兩種拍法並排對照，讓差異自己說話；把抽象的情緒效果歸因到具體的機位與運動；短片結構固定為『問題→示範→結論』

### Zach King `@zachking`

- **連結**：https://www.tiktok.com/@zachking
- **粉絲數**：86,500,000
- **查證等級**：直接抓取 `direct-fetch`
- **查證方式**：直接抓取 tiktok.com/@zachking，頁面 JSON 回傳 uniqueId=zachking、nickname='Zach King'、followerCount=86500000、簡介 'Bringing a little more wonder into the world, 15 seconds at a tim...'（2026-08-06）
- **為什麼對得上**：視覺設計與剪輯錯覺的極致範例。注意：他是『示範手法』而非『拆解為什麼有效』，與遊戲哥的分析型定位不完全同軌，列入是作為鏡頭語言與轉場設計的技術對標
- **可直接抄的做法**：轉場點精準卡在觀眾預期被打破的那一格；全片零口白，靠畫面邏輯敘事；固定的錯覺公式重複使用，形成可辨識的個人語言

> 查證中淘汰大量被佔用的空 handle：TikTok 的 @thomasflight 實際暱稱 Tom05rematch 僅 2 粉、@gmtk 僅 3 粉、@jacobgeller 90 粉、@nerdwriter 1 粉、@extracredits 實際暱稱 ExtraCredits21 僅 1 粉且為西班牙語帳號——這些知名影像論文創作者在 TikTok 上的同名 handle 幾乎都不是本人。@thecinemacartography 不存在。

## Instagram · 2/3 · 日常感平台

### Thomas Flight `@thomasflight`

- **連結**：https://www.instagram.com/thomasflight/
- **粉絲數**：—
- **查證等級**：交叉比對 `cross-reference`
- **查證方式**：交叉比對：搜尋索引回傳 'Thomas Flight (@thomasflight) • Instagram photos and videos'；本尊身分已由我直接抓取 youtube.com/@ThomasFlight（1.3M）與 x.com/ThomasFlight 確認，三平台 handle 一致（2026-08-06）
- **為什麼對得上**：影像分析創作者的圖文版本，可對照『鏡頭語言的觀察怎麼用靜態畫面呈現』
- **可直接抄的做法**：用單格劇照當貼文主體，讓構圖自己說明論點；文案短，把分析壓縮成一兩句

### Extra Credits `@extracredits` — 機構帳號

- **連結**：https://www.instagram.com/extracredits/
- **粉絲數**：—
- **查證等級**：交叉比對 `cross-reference`
- **查證方式**：交叉比對：搜尋索引回傳 'Extra Credits (@extracredits) • Instagram photos and videos'；本尊已由我直接抓取 youtube.com/@extracredits（302K）確認（2026-08-06）
- **為什麼對得上**：遊戲設計理論的圖文版本，插畫風格天然避開重現真實遊戲 UI 的風險，符合遊戲哥紅線
- **可直接抄的做法**：用自製插畫圖卡承載觀念，不用遊戲截圖；一則一觀念，系列編號讓觀眾追更

> ⚠ 只湊到 2 個，未達 3 個。Instagram 在本機需登入，只能交叉比對；遊戲／影像設計分析這個垂直領域的創作者多數以 YouTube 為主場，IG 上能被獨立查證為本人的官方帳號有限。依規則不湊數。

## Threads · 0/3 · 日常感平台

*（此單位沒有任何可查證的帳號）*

> ⚠ 0 個。查證能力限制：Threads 在本機完全無法抓取（curl 只拿到純 JS 殼，WebFetch 只拿到頁尾），而搜尋引擎對 Threads 個人檔案的索引極度稀疏——賭博哥那組只靠索引標題勉強確認到 2 個。這兩個垂直領域（城市觀察旅行／遊戲與影像設計分析）在搜尋索引裡找不到任何可獨立確認的 Threads 個人檔案。刻意不採用『Threads handle 通常等於 Instagram handle』這個推論來填補——那是未經查證的推測，正是本次研究要防的張冠李戴。建議由有登入 Threads 的人在站內直接搜尋補件。

## Facebook · 2/3 · 日常感平台

### Game Maker's Toolkit `gamemakerstoolkit`

- **連結**：https://www.facebook.com/gamemakerstoolkit/
- **粉絲數**：—
- **查證等級**：交叉比對 `cross-reference`
- **查證方式**：交叉比對：搜尋索引回傳 "Game Maker's Toolkit | Facebook" 指向 facebook.com/gamemakerstoolkit；本尊已由我直接抓取 youtube.com/@GMTK（1.74M）與 x.com/gamemakerstk 確認，且官網為 gamemakerstoolkit.com，命名一致（2026-08-06）
- **為什麼對得上**：遊戲設計拆解在長篇幅平台的版本，適合對照設計論證要怎麼寫成純文字
- **可直接抄的做法**：把影片論點濃縮成可獨立閱讀的貼文再附連結，而非只丟連結；用提問結尾邀請開發者留言辯論

### Extra Credits `ExtraCredits` — 機構帳號

- **連結**：https://www.facebook.com/ExtraCredits/
- **粉絲數**：—
- **查證等級**：交叉比對 `cross-reference`
- **查證方式**：交叉比對：搜尋索引回傳 facebook.com/ExtraCredits 頁面及其實際貼文 'Ladders and Team Games - Doing it Wrong - Extra Credits'，內容與該系列一致；本尊已由我直接抓取 youtube.com/@extracredits（302K）確認（2026-08-06）
- **為什麼對得上**：遊戲設計理論的長文版本，插畫式素材同樣避開真實遊戲 UI 的紅線
- **可直接抄的做法**：同一觀念在不同平台改寫長度重發；把系列影片整理成主題清單貼文，延長內容壽命

> ⚠ 只湊到 2 個，未達 3 個。Facebook 在本機無法抓取，僅能交叉比對。注意搜尋結果中另有 facebook.com/extracreditonline、facebook.com/extracreditness、facebook.com/extracreditprojects 等同名但無關的頁面，已排除。

---

# 缺口與後續

## 未達 3 個的單位

| 單位 | 數量 | 原因 |
|---|---|---|
| 賭博哥／Threads | 2 | 僅 2 個可經索引確認 |
| 旅遊姊／TikTok | 2 | 多數旅遊 YouTuber 的同名 TikTok handle 屬他人 |
| 旅遊姊／Threads | 0 | Threads 無法從本機抓取，且搜尋索引對 Threads 個人檔案極稀疏 |
| 旅遊姊／Facebook | 1 | 僅 Drew Binsky 找到可確認的官方頁面 |
| 遊戲哥／X（Twitter） | 2 | 影像論文創作者的 X handle 多被佔用或已停用 |
| 遊戲哥／Instagram | 2 | 該領域創作者主場在 YouTube |
| 遊戲哥／Threads | 0 | 同上；影像論文這個垂直領域在 Threads 上找不到可獨立查證的帳號 |
| 遊戲哥／Facebook | 2 | 同上 |

刻意**不**用「Threads handle 通常等於 Instagram handle」這類推論補足——
那是未經查證的推測，正是這次研究要防的張冠李戴。

## 查證過程攔下的假帳號

以下都是「handle 看起來合理、實際上不是本人」的例子，已排除：

| 平台 | handle | 實際是什麼 |
|---|---|---|
| TikTok | `@baldandbankrupt` | 175 粉，簡介自承 *"I'm Bald And Bankrupt But Not The Original Version"* |
| X | `@JacobGeller` | 一位西班牙語執業律師，與遊戲評論者同名不同人 |
| X | `@ExtraCredits` | 顯示名稱為 "lindsay lohan"，0 追蹤者 |
| X | `@IndigoTraveller` | 簡介與 YouTube 頻道創作者身分不符，疑為同名不同人 |
| YouTube | `@LiYongLe` | 實際是「小宝翡翠」翡翠賣家，不是李永乐老师 |
| YouTube | `@karlwatson` | 441 訂閱，非本尊 |
| YouTube | `@Noclip` | 1.79K 訂閱，非本尊 |
| TikTok | `@numberphile` | 暱稱 Pranjal6MS，2 粉 |
| TikTok | `@thomasflight／@gmtk／@nerdwriter／@extracredits` | 全是 1–3 粉的空帳號 |

## 建議的後續

1. Threads 與 Facebook 的缺口，請由有登入該平台的人在站內直接搜尋補件。
2. 標記為非日常感、卻落在圖文平台（IG／X／Threads／FB）的帳號，日後可替換成日常感更強的創作者。
3. 本次未能用 Workflow 的雙查核員交叉驗證（環境端 permission handler 清空 subagent 參數）；
   換一個正常 session 重跑 `research/benchmark-accounts-workflow.js` 可得原設計的交叉驗證結果。
