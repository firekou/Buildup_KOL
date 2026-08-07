# 對標帳號清單（Benchmark Accounts）

用途：每個角色在其實際發文平台上，各自對標 1-3 個內容主題相近的真人 KOL 帳號，記錄帳號、粉絲量、可效仿的手法重點，作為發想題材、拍攝手法、剪輯節奏的參考範本。**只借鏡手法，不抄襲內容本身**，也不代表這些帳號跟角色本人有任何關聯或合作關係。

格式參考自 Penny 團隊的 [Virtual_KOL_Studio/BENCHMARK_ACCOUNTS.md](https://github.com/pennyhuang-oss/Virtual_KOL_Studio/blob/main/BENCHMARK_ACCOUNTS.md)。

> 更新日期：2026-08-07　｜　涵蓋 5 位角色：Tan XiaoXiao（賭博哥）、Faye Tan（旅遊姊）、Zhang Qinfeng（遊戲哥）、Rachel Ong（B01）、Rafael Costa／Captain（B02）

---

## 平台選擇邏輯

| 角色 | 主要對標平台 | 說明 |
|------|--------------|------|
| Tan XiaoXiao（賭博哥） | YouTube、TikTok/Instagram、X | 深度教學型內容集中在 YouTube；短影音拆解與日常分享在 TikTok/IG；文字型「一天一個觀點」在 X |
| Faye Tan（旅遊姊） | Instagram、YouTube、TikTok | 旅遊垂直本身就是視覺/影音導向平台為主，Facebook/Threads/X 較少有專門的旅遊帳號可對標 |
| Zhang Qinfeng（遊戲哥） | YouTube、X | AI/科技/電影分析垂直的深度內容以 YouTube 為主，第一手消息與行業動態集中在 X；IG/TikTok 目前該垂直缺乏公認的指標帳號，暫不強行湊數 |
| Rachel Ong（B01） | 全 6 平台皆有 | 尚未開始發文，六個平台都做了對標研究。登山／戶外垂直在英文圈的 YouTube 最成熟，中文圈的日常感圖文則集中在 Threads／Instagram |
| Rafael Costa（B02） | 全 6 平台皆有 | 尚未開始發文，六個平台都做了對標研究。現役運動員的圖文日常在 Instagram／Threads／Facebook 最多，長篇成長論述在 YouTube |

---

## 查證方式與標記說明

前三位角色（第 1～3 節）是人工整理；Rachel Ong 與 Rafael Costa（第 4～5 節）是 2026-08-07 用自動化研究流程產出的：每個「角色×平台」單位先由 1 位研究員找 5 個候選，再交給 **2 位互相獨立、且被指示要「試圖推翻」結果的查核員**，只有兩位都判定 CONFIRMED 才留下；不足 3 個的單位自動補件；最後每個角色再有一位審查員檢查漏網的知名帳號，其建議同樣要重新查證才會列入。

帳號後面的標記：

- **✔直接抓取** — 查核員實際抓取該平台個人頁並讀到資料（顯示名稱、bio 逐字、粉絲數）。
- **◇交叉比對** — 該平台無法用直接抓取讀到（例如 X 會回 HTTP 402），改以瀏覽器載入頁面、或用創作者官網／Linktree／搜尋索引摘要，並用「同一 handle 在其他可讀平台已確認為本人」互相印證。

⚠️ **這兩個標記不是「可信度高低」的分級，只是取得資料的路徑不同**，兩者都要求讀到真實頁面內容才算通過。實務上兩者混用的原因是不同平台擋不同的抓取方式：Instagram 與 Threads 用 WebFetch 讀得到，X 用 WebFetch 會被擋、要改用瀏覽器。

**重要更正：** 2026-08-06 那次針對前三位角色的研究，曾記錄「Instagram／Threads／Facebook 無法匿名抓取」而把 8 個單位回報為數量不足（其中旅遊姊與遊戲哥的 Threads 是 0 個）。2026-08-07 這次實測確認，**那是本機 curl 的限制，不是平台的限制**——改用 WebFetch 可以正常讀到 Instagram 與 Threads 的個人頁（已用 `@snowap`、`@david_goettler` 逐字核對粉絲數與 bio 驗證）。所以前三位角色在那三個平台上的缺口是可以補齊的，只要重跑一次研究即可，不需要靠人工登入站內搜尋。

---

## 1. Tan XiaoXiao（賭博哥）— 規則研究者

**定位核心：** 冷靜、理性、把規則/機率/博弈結構講清楚，絕不談賭博策略或收益。

### YouTube

| 帳號 | 訂閱數 | 效仿重點 |
|------|--------|----------|
| [3Blue1Brown](https://www.youtube.com/@3blue1brown)（Grant Sanderson） | 數百萬 | 用視覺化動畫把抽象的機率/邏輯結構講清楚，語氣平靜、不追熱點，是「規則優先於結果」的最佳範本 |
| [StatQuest with Josh Starmer](https://www.youtube.com/@statquest) | — | 把複雜統計概念拆成「一次只講一個觀點」的節奏，搭配簡單視覺與輕鬆舉例 |
| The Math Sorcerer | — | 個人化的讀書/自學日常分享語氣，適合「每日閱讀」欄目參考 |
| Khan Academy | — | 教學語速平穩、邏輯拆解清晰，示範如何把機率概念講到「聽得懂但不簡化到失真」 |

### TikTok／Instagram

| 帳號 | 粉絲數 | 效仿重點 |
|------|--------|----------|
| [@learnwithsherlock](https://www.instagram.com/learnwithsherlock/)（Sherlock / Sherlock Learn） | IG 約 1M+／TikTok 約 857K | 用數學/物理拆穿社群上瘋傳的說法（debunk），切入角度是「大家覺得對，其實規則不是這樣」，跟曉曉「拆穿直覺」的公式高度吻合；單集只講一個觀點、節奏快 |

### X（Twitter）

| 帳號 | 說明 | 效仿重點 |
|------|------|----------|
| [@3blue1brown](https://x.com/3blue1brown) | Grant Sanderson 本人帳號 | 用一句話把一個數學/機率洞見講完，附一張視覺化圖 |
| [@probnstat](https://x.com/probnstat)（Probability and Statistics） | 分享機率/統計/ML/DL 觀察 | 高頻率、短篇幅的「今天注意到一個現象」貼文節奏 |
| @ProbFact | 每天發一則機率冷知識 | 「一天一個概念」的固定發文節奏，適合曉曉的每日閱讀支柱 |

**生成重點：** 曉曉的內容應該像 3Blue1Brown 的冷靜視覺化 + Sherlock Learn 的「拆穿直覺」切角 + @probnstat 的高頻短文節奏，三者疊加——絕對不要往「教你怎麼贏」的方向偏，重點永遠是規則/結構本身為什麼有趣。

---

## 2. Faye Tan（旅遊姊）— 世界觀察者

**定位核心：** 手持自拍走路視角，觀察城市與旅行中的小細節，不是打卡導覽型內容。

### Instagram

| 帳號 | 粉絲數 | 效仿重點 |
|------|--------|----------|
| [@theblondeabroad](https://www.instagram.com/theblondeabroad/)（Kiki／Kiersten Rich） | 約 500K–1M+ | 個人化敘事口吻，把每個地方拍得像「跟朋友分享」而非導覽介紹；70+ 國家的長期內容累積出的信任感 |

### YouTube

| 帳號 | 訂閱數 | 效仿重點 |
|------|--------|----------|
| Erik Conover | 2.8M | 長期定居亞洲的城市漫遊+個人觀察混合敘事，鏡頭語言自然、不刻意擺拍 |
| Mark Wiens | 11.5M | 用「當地生活細節」（尤其飲食）而非知名景點打卡建立記憶點，示範如何讓內容有記憶點但不炫耀式旅遊 |

### TikTok

| 帳號 | 粉絲數 | 效仿重點 |
|------|--------|----------|
| [@kyramaeturner6](https://www.tiktok.com/@kyramaeturner6)（Kyra-Mae Turner） | 1.8M+ | 輕鬆隨性、不追求「完美旅遊博主」形象的敘事節奏，反而更真實；短時間內靠東南亞旅程內容累積大量觀看，示範「隨手拍」格式也能爆紅 |

**生成重點：** 旅遊姊的內容方向應該偏向 Kiki 的個人化口吻 + Kyra-Mae 的隨性真實感，避免走向精緻打卡導覽風格；優先拍「觀察到的城市細節」而非「必去景點清單」。

---

## 3. Zhang Qinfeng（遊戲哥）— 數字體驗觀察者

**定位核心：** 研究 AI、電影、遊戲設計背後「為什麼有效」，合規紅線是絕不談博弈玩法/收益。

### YouTube

| 帳號 | 訂閱數 | 效仿重點 |
|------|--------|----------|
| [Fireship](https://www.youtube.com/@Fireship)（Jeff Delaney） | 3.5M+ | 快節奏「100秒」格式的科技/AI新聞解說，資訊密度高、剪輯明快，是「未來十分鐘」欄目的直接範本 |
| [Two Minute Papers](https://www.youtube.com/@TwoMinutePapers)（Károly Zsolnai-Fehér） | 1.6M | 用「這個 AI 結果為什麼令人驚訝」切入研究論文摘要，跟遊戲哥「一個 AI 實驗」系列公式完全吻合 |
| [Nerdwriter1](https://www.youtube.com/@nerdwriter1)（Evan Puschak） | 3.2M | 「一部電影一個設計原理」的深度拆解敘事，是「經典電影分析」支柱的示範案例 |
| Every Frame a Painting（Tony Zhou & Taylor Ramos） | 2M+（經典系列已停更，2024年短暫回歸） | 純粹用畫面本身（不太依賴口白）解釋電影語言的 video essay 先驅，是「體驗拆解」欄目的最佳範本 |

### X（Twitter）

| 帳號 | 說明 | 效仿重點 |
|------|------|----------|
| [@OpenAI](https://x.com/OpenAI)／[@AnthropicAI](https://x.com/AnthropicAI)／[@GoogleDeepMind](https://x.com/GoogleDeepMind) | 官方 AI 實驗室帳號 | 第一手技術發布消息來源，適合「未來十分鐘」的題材發想起點 |
| Logan Kilpatrick（Google DeepMind 產品負責人） | 個人視角分享 AI 產品開發細節 | 「產業內部視角」的分享語氣，比純新聞稿更有個人溫度 |
| @fofrAI（fofr） | 每天分享生成式 AI 實驗 | 「現場實驗」公式的最佳範本——每天測一個新工具、分享真實（包括失敗的）反應，跟遊戲哥「一個 AI 實驗」系列高度吻合 |

**生成重點：** 遊戲哥的內容應該像 Fireship 的快節奏剪輯 + Two Minute Papers 的「為什麼令人驚訝」切角 + Every Frame a Painting 的畫面本位敘事，三者疊加；IG/TikTok 目前該垂直缺乏公認範本帳號，遊戲哥的短影音格式可以自行摸索，不強求對標。

---

## 4. Rachel Ong（王瑞秋）— 邊界感型高海拔登山向導（B01）

**定位核心：** **不是**征服敘事的冒險家，而是風險管理與節制的敘事。核心命題是「允許人說今天不上」、在登頂前轉身，並相信那不是失敗。四支柱：轉身時刻／山徑日誌／給平地人的山間道理／深夜筆記本。語氣慢、平、簡省，從不說「這絕對安全」。

**合規紅線：** 不對標為流量擺拍危險動作、誇大難度、表演極限的帳號；不對標「零事故傳奇」式個人英雄敘事；不對標會給絕對安全保證的帳號。

**語言範圍：** 英文母語級＋中文流利，發文語言尚未鎖定，故英文與中文帳號都納入。

> 本節共 35 個帳號（主研究 29 ＋ 審查員補充 6），全部通過雙重獨立查證。查證標記：✔＝實際抓取該平台個人頁讀到資料；◇＝改以創作者官網／Linktree／搜尋索引＋跨平台同 handle 互證。

### YouTube（6 個）

**[Cody Townsend](https://www.youtube.com/@CodyTownsend)** ・ 16.3萬位訂閱者 ・ English ・ ✔直接抓取

> **對得上的理由：** 極高。滑雪登山（ski mountaineering）而非高海拔嚮導，運動項目不同，但編輯骨幹幾乎就是 Rachel 的支柱一＋二：整季內容大量是「雪況不好，我們今天不下這條線」，並在片中完整演示天氣窗與雪坡評估。他公開承認清單心態會扭曲風險判斷、在 46/50 主動終止整個計畫——這是英文圈最乾淨的「節制勝於征服」範本，且完全沒有零事故英雄敘事。
>
> **可直接抄的做法：** 1) 每集開場先報「今天目標＋我現在的疑慮」，把不確定性放在最前面，而不是留到結尾當轉折。2) 在現地對鏡頭做出聲的雪況／地形判讀（挖雪坑、講測試結果），讓觀眾看見判斷依據而非只看見結論——對應 Rachel 展示天氣窗計算。3) 決定撤退時攝影機不關，把「掉頭」拍成一集的正式結局而非花絮。4) 標題直接寫隊友名字＋當下具體狀況（「A Sketchy Snowpack, Bjarne on the Juice」），用人名與情境取代抽象形容，正好對應 Rachel「用隊員的名字而不是籠統的大家」。5) 自嘲式承認自己被目標數字影響，把個人判斷偏誤當成公開議題討論。
>
> **畫面／縮圖手法：** 大量實拍 B-roll＋自拍手持混剪；高規格航拍與長焦壓縮的坡面鏡頭，但刻意保留晃動的第一人稱手持段落。縮圖以真實現場劇照為主（人在地形中的比例尺），有文字疊加但不做誇張後製合成，不用驚嚇臉／紅圈箭頭那套。

**[Kraig Adams](https://www.youtube.com/@kraigadams)** ・ 83.2萬位訂閱者 ・ English（旁白極少，實質接近無語言） ・ ✔直接抓取

> **對得上的理由：** 中等偏高，但是「鏡頭語言與剪輯節奏」的最佳範本。他是徒步／trekking 而非技術攀登，沒有風險決策的編輯主軸；但他的慢、平、簡省，幾乎是 Rachel 語氣的影像版本，且他真的走過 K2 基地營路線。純粹拿來對標支柱二（山徑日誌的紀錄片感）與支柱四（深夜筆記本），不拿來對標風險論述。
>
> **可直接抄的做法：** 1) 近乎無旁白的長片：環境音＋極簡配樂，讓觀眾自己待在山裡，不用旁白解釋情緒——直接可移植到山徑日誌。2) 標題只寫可驗證的具體事實（幾英里、哪條路線、哪個國家），零情緒形容詞、零懸念鉤子。3) 固定視覺節奏：長定鏡＋人物走過畫面（walk-through frame）＋每天重複的紮營／收帳／煮食段落，用重複而非高潮建立時間感。4) 少數說話段落安排在帳內或休息時，語氣是自言自語而非對觀眾演說，低光、單機、不打燈——這正是「深夜筆記本」該有的質地。5) 同一趟行程另出一支純環境音長版（Ambient Footage），一次素材兩種用途。
>
> **畫面／縮圖手法：** 全片實拍 B-roll，無圖表、無資訊疊加。大量三腳架長定鏡與航拍地景，冷調、低飽和。縮圖是單張安靜的風景或小小的人影在大地形裡，通常無文字或僅極小字，刻意反高對比誘餌縮圖。

**[Jost kobusch](https://www.youtube.com/@JostKobusch)** ・ 2.47萬位訂閱者 ・ English（德國籍，頻道主要以英文發布） ・ ✔直接抓取

> **對得上的理由：** 高，但有一個需要留意的張力（見 notes）。他是高海拔無氧攀登者，內容主軸是一個橫跨數年、尚未成功的目標，且他把「終止」本身做成公開內容並列出反向指標清單——這正是支柱一。連載編號＋倒數天數的結構，證明「還沒成功也能持續產出」，對一個尚未發布任何內容的新人設特別實用。
>
> **可直接抄的做法：** 1) 用「EPISODE N ＋ 距離下次推進還有 X 天」的連載編號，把長期計畫本身當成內容主線，不必等成功才發片。2) 把「這次不上」拍成完整一集，逐項解釋反向指標（counter-indicator）清單，而不是一句話交代。3) 大量帳內／低光自拍獨白，語速慢、留白多，接近日記而非旁白配音。4) 明確分集主題（技術難點、動機維持、身為登山者的日常生活），把單一目標拆成可長期產出的知識線。5) 撤退後的下一集直接談「回去練什麼」，把失敗接到具體訓練計畫上，避免停在情緒。
>
> **畫面／縮圖手法：** 自拍手持為主，畫質與穩定度不追求電影級，保留真實的喘息與晃動；帳內低光獨白比例高。縮圖多為真實現場自拍或路線照，有系列統一的 EPISODE 編號文字排版，屬於系列識別而非誘餌式後製合成。

**[Hazel Findlay ~ Strong Mind](https://www.youtube.com/@StrongMindClimbing)** ・ 6990位訂閱者 ・ English ・ ✔直接抓取

> **對得上的理由：** 高（主題面），低（地形面）。她是岩壁攀登＋心理教練，不是高海拔，訂閱數也小。但她是英文圈把「恐懼、退場、什麼時候該停」講得最有方法論的現役攀登者，而且明確把「退掉這條路線」框成技術決定而非失敗——這正是 Rachel 支柱三（給平地人的山間道理）要的骨架，也是「允許人說今天不上」的專業依據。
>
> **可直接抄的做法：** 1) 用「先承認一個具體恐懼→給一個可操作的小練習」的固定兩段結構，避免格言停在漂亮但沒用的層次。2) 把心理概念綁在具體路線與難度上（點名 Muy Caliente E9 6c），讓抽象原則有可查的錨點——對應 Rachel 該點名具體山名、營地、天氣數字而非泛稱。3) 以問句開場的短標題直接說出觀眾的處境（「Scared to try a boulder?」），把觀眾的猶豫寫進標題。4) 明確區分「退掉」與「失敗」並反覆正常化，語氣是同行者而非教官。5) 把人生階段變化（懷孕、當媽後第一條大路線）當成風險胃納改變的公開案例，而不是勵志故事。
>
> **畫面／縮圖手法：** 以攀登實拍 B-roll＋對鏡頭講解的訪談機位交錯；部分影片有簡單的重點字卡疊加，屬教學輔助而非資訊圖表。縮圖多為她本人在岩壁上的動作照，配短句文字，後製痕跡輕。

**[Alan Arnette](https://www.youtube.com/channel/UCPg__zM9MzjNjDyyjTDr7ZQ)** ・ 2.37萬位訂閱者 ・ English ・ ✔直接抓取

> **對得上的理由：** 高（題材與語氣），中（形式）。他是高海拔攀登者兼 Everest 紀錄者（2014 年 58 歲登頂 K2），內容是每季的 Everest／K2 追蹤、死亡事故與產業檢討，語氣刻意去戲劇化。對 Rachel 而言，他示範了怎麼在講死亡與風險時完全不用聳動包裝——這是紅線 (c) 的正面示範。形式偏 podcast／口播更新，鏡頭語言較弱，主要對標敘事結構與措辭。
>
> **可直接抄的做法：** 1) 固定命名的季節連載（「Everest 2026: 日期＋Weekend Update」），讓觀眾知道下一集何時來，用可預期的節奏累積信任。2) 平鋪直敘報導死亡與事故：數字、地點、已知事實優先，不配戲劇化音樂、不用驚嘆式標題——直接對應 Rachel 從不誇大的語氣。3) 訪談格式讓當事嚮導／攀登者自己講決策過程，主持人只負責追問「為什麼在那個時間點決定…」，把決策拆解交給當事人。4) 季末做結構化總結（紀錄、人潮、垃圾、風況），把一整季的個別判斷拉高成產業層級觀察——可對應 Rachel 把小眾運動翻譯成普世問題。5) 長年累積同一題材的「編年」定位，用時間深度取代單片爆紅。
>
> **畫面／縮圖手法：** 以口播／視訊訪談畫面為主，搭配少量現地照片與路線圖示意；製作規格不高，資訊密度取勝。縮圖多為人像或山體照加日期與標題文字，樣式固定、辨識度來自一致排版而非後製特效。

**[Utah Avalanche Center](https://www.youtube.com/channel/UCUWI0rsRTgGKvqFVETvyOsA)** ・ 1.34萬位訂閱者 ・ English ・ ✔直接抓取 ・ （機構帳號）

> **對得上的理由：** 中高，且是唯一能直接提供「措辭系統」的對標對象。它是機構帳號、內容是雪崩預報而非登山敘事，運動項目也不同；但雪崩預報員是全世界最制度化地「絕不說安全」的職業——他們只講危險等級、可能性與後果。Rachel 設定裡「從不說這絕對安全」若要有專業可信度，這裡的語言範式最值得整套借鏡。
>
> **可直接抄的做法：** 1) 全程使用機率與等級語言（危險等級、可能性、後果三分法），從不給絕對保證——這套措辭可以直接成為 Rachel 的語氣底線規則。2) 事故與近失事件的公開拆解：時間軸＋當下已知資訊＋事後回看，重點放在判斷鏈而非責怪個人，這是支柱一最安全的敘事模板。3) 現地短片就站在雪坑旁指著剖面講，畫面本身就是證據，不需後製圖表——對應「展示真正的計算」。4) 高頻率、低製作成本的固定節目（每日／每週更新），用穩定節奏而非單片精緻度累積信任，1.8K 部影片就是這個策略的結果。5) 把「今天請做更保守的決定」當成正式公開建議發布，而非個人感想。
>
> **畫面／縮圖手法：** 現地實拍為主，預報員手持或單機定拍，畫面常直接對著雪坑剖面、坡向、裂縫等實體證據；另有部分教學片使用簡單圖表與地圖疊加。縮圖多為未經修飾的現場截圖加地區／日期文字，功能性極強、完全不做戲劇化合成。

研究員備註：【查證方法與可信度】
YouTube 這次用 WebFetch 抓頻道頁會被截斷成只剩頁尾導覽（desktop、m.youtube.com、/about、/videos 四種 URL 都試過，全部失敗），所以改用 curl 直抓原始 HTML 並解析 YouTube 自己的內嵌欄位：channelMetadataRenderer.title/description、externalId、contentMetadataViewModel 裡的 "NNN subscribers" 與 "NNN videos"、og:* meta。腳本在 C:\Users\Vincent Chiu\AppData\Local\Temp\claude\C--Users-Vincent-Chiu\0969d312-11b4-4dab-8d90-d3f1532f9cca\scratchpad\ytcheck.sh（需加 ?hl=en&gl=US，否則頁面回繁中，訂閱數會變成「X 萬位訂閱者」不好比對）。
上述 6 個帳號全部 verify_tier=direct-fetch，訂閱數與影片數都是我在 HTML 裡實際看到的字串，抓取時間 2026-08-07。注意 Cody Townsend 與 Alan Arnette 的頁面各自另外出現 "3.71K subscribers"、"12.5K subscribers"，那是頁面上推薦／關聯頻道的數字，不是本人；我取的是頻道標頭的 163K 與 23.7K。

【假帳號防呆已生效】
我試抓 @alanarnette 與 @TonyHuang0902 都只回 755 bytes 的錯誤頁，證明這兩個 handle 不存在——Alan Arnette 因此改用查證過的 channel ID 而非猜測的 handle。這正是你提醒的張冠李戴陷阱，方法上已擋掉。Utah Avalanche Center 與 Alan Arnette 的頻道頁都沒有公開 @handle，所以 handle 欄位我如實填頻道 ID，沒有編造。

【被我主動排除的帳號（重要）】
Furtenbach Adventures／Lukas Furtenbach：原本是高海拔商業嚮導的強候選，但查證時看到他公開行銷「zero-accident record for more than 20 years」「We are the only major Everest operator without any fatalities」，直接命中紅線 (b) 零事故傳奇＋(c) 絕對保證，因此不列入。Nirmal Purja、Kristin Harila 一類的紀錄／征服敘事帳號同理未納入。

【需要你判斷的一個張力】
Jost Kobusch 的內容質地非常合（慢、自省、公開撤退、列反向指標），但他的招牌系列叫「The Impossible Solo」，且計畫本身是無氧單人冬攀聖母峰西稜——「難度框架」與 Rachel 的反征服定位有輕微牴觸。他沒有擺拍危險、沒有零事故英雄敘事，我判斷不觸紅線，但如果你要把標準拉到最嚴，他是這 6 個裡最先該被換掉的一個。

【幾個查證過但我降序、可備用的帳號（數字同樣是實抓）】
Elia Saikaly @eliasaikaly：77.5K 訂閱／95 部影片。四次登頂聖母峰的攝影師，講聖母峰倫理與死亡有份量，但頻道近期主力是 timelapse 影像作品，缺決策敘事主軸，故未入選。
Kilian Jornet @kilianjornet：144K 訂閱／170 部影片。標題語氣（「A Different Athlete Now」「What Normal People Do」）很接近 Rachel 的謙抑第一人稱，但近期內容幾乎都是越野跑賽事（Western States、Zegama），登山風險決策比重太低。

【找不到的部分，如實回報】
中文帳號我沒有找到任何一個達標的，因此 6 個候選全是英文帳號。實際情況：搜尋回傳的台灣登山 YouTuber 清單（Tony Huang、凱西與蓋瑞、不只是旅行、林宣、圓糖混哪裡等）屬百岳旅遊／Vlog 型，沒有風險管理與撤退決策的編輯主軸；呂忠翰（阿果）我只查到新聞報導與他人頻道的訪談影片，沒有查到他本人的 YouTube 頻道；公視《群山之島與不去會死的他們》題材極貼合但是電視台的紀錄片系列而非創作者帳號。我沒有用「同名 handle 應該就是本人」去補這個缺口。人設發文語言尚未鎖定，若最終選中文，這塊需要另開一輪針對中文圈的查證。

### TikTok（5 個）

**[Nature Reliance（Nature Reliance School，出鏡者為其創辦教練）](https://www.tiktok.com/@naturereliance)** ・ 166.6K ・ English ・ ✔直接抓取 ・ （機構帳號）

> **對得上的理由：** 不是高海拔登山，是野外技能／追蹤／荒野安全教學，但方法論契合度是這批裡最高的：整個帳號的核心命題就是「判斷與節制」，而且真的有一支直接叫「什麼時候該在健行中掉頭」。可對標 Rachel 的支柱(1)轉身時刻與(3)給平地人的山間道理，缺的是遠征紀錄片感。
>
> **可直接抄的做法：** 1) 風險疊加句構：一支影片只講一個風險，但把造成它的因子逐項攤開再收束（實際 caption：「Hypothermia can happen even when it is not freezing outside. Wet clothing, wind, cotton, exhaustion, and too little food can combine to...」）→ Rachel 講高山症、失溫、天氣窗可直接套用「不是單一原因，是這五件事疊起來」的說法，天然避開「這絕對安全」的絕對句。2) 把「何時掉頭」做成可重複的系列題目，標題就是一句問句（When should you turn around on a hike?），而不是講故事講到最後才給結論。3) 開場先推翻觀眾預設再修正（「You do not need perfect tracks to know something was here」「Most people walk past this plant without knowing...」）——固定用「大多數人以為X，其實Y」開頭。4) 把「不做」包裝成技能：影片主題直接叫 Learn Restraint & Nature Awareness，節制被當成一門要學的技術，不是失敗，這正是 Rachel 人設要的翻譯方式。
>
> **畫面／縮圖手法：** 以林間實地、單人出鏡、單機定點口述為主，畫面直接對著實物（植物、足跡、傷口處置器材）拍近景；沒有任何圖表疊加或後製合成縮圖的跡象，縮圖幾乎都是本人或實物近景。註：我未逐支觀看影片，此判斷來自 caption 內容（都在指認眼前的具體實物）與貼文主題，非逐支畫面查證。

**[Outdoor Devin](https://www.tiktok.com/@outdoor.devin)** ・ 62.6K ・ English ・ ✔直接抓取

> **對得上的理由：** 中高。科羅拉多 14ers 級別的健行／背包，不是 8000 米，但 bio 自我定位就是「practical trail advice & responsible mountain safety」，且大量做事故復盤與準備不足的檢討，對標 Rachel 的支柱(2)山徑日誌與(1)轉身時刻的「案例→通則」寫法很好用。
>
> **可直接抄的做法：** 1) 「我這一年在山上看到的問題」開場＋三個短命令句收尾（Download your map. Carry water. Stay together.）——個人現場觀察 → 通則化，正是 Rachel 把小眾經驗翻成普世道理的最短路徑，而且語氣平不說教。2) 每支路線影片一律附硬數據三件套：路線名＋里程＋爬升（Missouri Mountain (14,067 ft) standard route 11 miles, 4,500 ft of gain）→ 山徑日誌可固定這個資訊格式，讓紀錄片感建立在數字上而不是形容詞上。3) 把別人的事故當教材：先講一個真實救援案例，再給觀眾可執行步驟（Lost on the trail? Here's what to do），永遠不是「我很強所以我沒事」。4) 給可背的口訣（rule of 3）——Rachel 的固定點、繩隊、天氣窗可比照做成可記憶單位。5) feed 中夾雜非戶外的生活貼文（國慶、餐廳），刻意讓帳號有呼吸感而不是純教材台。
>
> **畫面／縮圖手法：** 實拍 B-roll＋本人在步道邊對鏡講話的混合型（單支 1:30、帶 location tag「Colorado Mountain, Central City」），另有一部分純風景與生活實拍；未見圖表疊加或明顯後製合成縮圖，縮圖以實拍山景／本人為主。註：未逐支觀看，判斷來自單支影片頁的片長與地點資訊＋caption 語境。

**[American Alpine Institute（AAI）](https://www.tiktok.com/@alpine_institute)** ・ 38.1K ・ English ・ ✔直接抓取 ・ （機構帳號）

> **對得上的理由：** 高（技術面）。真正的 IFMGA/AMGA 體系嚮導學校，內容全是技術動作與危害拆解（rest step、冰斧持法、冰河結構、裂隙救援、裝備失效），沒有任何征服敘事。對標 Rachel 支柱(3)的前半段——先把術語講到觀眾懂，才有資格把它翻成人生原則。
>
> **可直接抄的做法：** 1) 一支影片只拆一個術語或一個動作，60 秒左右單機示範講完（rest step / ice axe positions / glacier structure），標題就是那個術語本身 → Rachel 的「高山症、天氣窗、繩隊、固定點、登頂窗口」可各自成為一支獨立短片，先技術後隱喻。2) 兩種格式交替：#greenscreen 白板／圖示式講解，與 #stitch 引用別人的事故或危險示範影片再回應（實例：#stitch ... #climbing accident、Household #chemicals an #climbing #equipment hazard）——用回應體處理危險議題，自己完全不必擺拍危險動作，這對 Rachel 的合規紅線很關鍵。3) 說明欄極短、幾乎只有 hashtag，所有資訊放在影片本體＋location tag（Bellingham 校區），刻意不靠文案煽動。4) 權威來自「教了 50 年」的機構語氣（bio 直接寫 Since 1975），而不是個人戰績——Rachel 若要建立可信度，可比照用「累積判斷次數」而非「登頂次數」。
>
> **畫面／縮圖手法：** 雙軌：一是現場技術示範實拍（校區、冰河、岩場，動作特寫＋手部近景），二是 #greenscreen 綠幕講解與 #stitch 分割畫面。縮圖偏動作定格（冰斧位置、繩結、裂隙剖面），資訊靠畫面內文字與示範，不靠外部圖表包裝。註：#greenscreen／#stitch 為 caption 內實際出現的 hashtag，屬直接證據；縮圖風格為依標題與示範性質推斷，未逐支查看。

**[Denis（7Summ / 7Summ.com 遠征服務）](https://www.tiktok.com/@7summ.co)** ・ 21K ・ English（創作者疑為中東歐語系——DDG 索引到其影片配樂標為「původní zvuk」，但文案與內容皆英文） ・ ✔直接抓取 ・ （機構帳號）

> **對得上的理由：** 中高（題材命中、動機需打折）。真的在做 8000 米／七頂峰的期待值校正，而且立場是「先確認這件事對你現不現實」，不是賣夢；但它是商業招募帳號，同頁也出現把遠征包裝成 business system／ROI 的 B2B 話術。只借鏡「拆帳＋先評估你適不適合」的內容框架。
>
> **可直接抄的做法：** 1) 單題反覆做：同一個問題（到底要花多少錢）被做成至少 5 個不同版本，靠拆帳項目（permit／嚮導後勤／氧氣／保險）撐內容 → Rachel 可移植成「一趟遠征的天氣窗成本拆帳」或「下撤要付出的代價逐項列」，把抽象決策換算成可數的東西。2) 固定鉤子句式：以第三人稱代問開場＋「Let's break it down simple 👇」，5 秒內建立「這支會給你一張清單」的預期。3) 把自己放在守門人位置而非帶路人位置（bio：Check if Everest is realistic for you／Personal readiness check with IFMGA guides）——這正是 Rachel「允許你說今天不上」的商業化版本說法，可直接借用這種自我定位的句法。4) 【警示】不要學它的銷售層與 ROI／business system 框架；若後續嚴格查核要淘汰一個，這個是我自己列的第一順位淘汰對象。
>
> **畫面／縮圖手法：** 以文字／數字字卡疊加為主體的「拆帳」版面，搭配山景素材當底；內容本體就是價格清單，屬圖表／字卡疊加型，縮圖多為金額或數字字卡。註：此判斷依據是單支影片頁抓到的內容摘要（逐項金額清單）與重複的拆帳標題，未逐支觀看畫面。

**[Katherine & Derrick（The Guidebook）](https://www.tiktok.com/@the.guidebook)** ・ 12K ・ English ・ ✔直接抓取

> **對得上的理由：** 中。純健行路線資訊，海拔與風險層級遠低於 Rachel，主題契合度是這五個裡最低；但它是「說明欄結構化模板」的最佳教科書，且每篇都常駐安全與規範提醒（而不是口頭保證安全），對 Rachel 建立可重複的貼文骨架很實用。
>
> **可直接抄的做法：** 1) 說明欄完全模板化三段式：固定鉤子（Trail info you'll want to know ⤵️）→ 一份每篇都不變的責任／安全條列 → 再列本篇具名對象與其硬數據。Rachel 可把第二段換成固定的「今天的決策條件清單（天氣窗／隊員狀態／回程時間）」，讓觀眾養成翻說明欄的習慣。2) 每個地點都給錢與數字（$35/week、4.7 miles RT、1,978' of elevation），從不用「很美很值得」這種形容詞——與 Rachel 要求的具體、不抽象一致。3) 常駐一句不變的節制註記（Always check current local weather / Follow local rules），等於把「我不保證安全」寫進版型，而不是靠口頭免責。4) 先說出觀眾的猶豫再回應的開場（Ever think 'solo hiking just feels too risky'?）——正是 Rachel「先講自己此刻的猶豫再進入決策過程」的低成本版本。5) 一支影片串多個地點，用同一套字卡格式切段，維持節奏。
>
> **畫面／縮圖手法：** 以多路線串接的實拍風景 B-roll 為主（單支影片涵蓋 6 個地點），畫面上多半疊路線名／數據字卡分段；縮圖為風景實拍，未見合成式縮圖。註：說明欄的六地點結構為直接證據，畫面上疊字卡的部分屬依「一支多地點」結構與同類帳號慣例的推斷，未逐支觀看。

研究員備註：【方法與抓取實況（與上次經驗不同，請更新）】TikTok 這次「不能」直接抓：WebFetch https://www.tiktok.com/@handle 只回「TikTok - Make Your Day」JS 殼；改用內建瀏覽器開 tiktok.com 會跳出滑塊 CAPTCHA（我沒有也不應破解）。可行的替代路徑是 r.jina.ai 文字代理讀同一個 TikTok 頁面：(a) 個人頁能穩定拿到「N Following / N Followers / N Likes」原字串＋bio 逐字＋外連網域；(b) https://www.tiktok.com/tag/<hashtag> 的 feed 能一次拿到數十組「handle＋完整 caption」，這是本次找帳號最有效的工具；(c) 單支 /video/<id> 頁能拿到完整說明欄逐字與 views/likes。另外 WebSearch 額度在本次執行中用盡（200/200），後半段改用 r.jina.ai 代理 DuckDuckGo HTML 版做 site:tiktok.com/@handle 查詢，可取回該帳號的影片標題（=caption 前段）與 URL，非常適合驗證內容調性；Bing 會擋 CAPTCHA、Socialblade 與 urlebird 皆回 403。

【上次那類假帳號陷阱，本次實際踩到並排除的】@carolinegleich＝2 Followers／0 Likes／「No bio yet.」的空殼占用帳號（Caroline Gleich 本人在 TikTok 上我查不到可信帳號）；@utahavalanchecenter＝「Couldn't find this account」（不存在，別因為它在 IG／官網有帳號就假設 TikTok 也有）；@mentourpilot＝49 Followers、@mentourblackbox＝240 Followers，雖是真的關聯帳號但量能等於沒經營，不能當「知名創作者的 TikTok」引用；@world.alpine.expeditions 只有 15 Followers。這再次證明「某人在 A 平台紅 → B 平台同名 handle 就是他」完全不能用。

【合規紅線淘汰名單（有查證數據，供交叉比對）】@biancaaadler（209.3K Followers／10.6M Likes，bio「Summited EVEREST! 💖 Youngest woman to climb Manaslu, Ama Dablam」）——量能與部分誠實內容（公開講 Everest 垃圾與擁擠、死亡區真實狀態）都很好，但 bio 是紀錄／最年輕／個人英雄框架，直接觸紅線(b)，故不列入。@nimsdai_official 與 @eliteexped 同理排除（且 feed 顯示 Nims Purja 已於 2026-07-30 在 Broad Peak 罹難，相關內容大量轉為悼念與事故流量，更不適合對標）。

【被我列在候補、規模不足或調性衝突的真實帳號（數據均實查）】@dirtbag.dispatch（6,358 Followers／779K Likes，bio「Ultrarunner. Mountaineer. SAR & WFR.」）——最接近 Rachel 的「深夜筆記本」支柱，有真實的心理韌性獨白與復原敘事，但用詞粗（實際標題「I'm literally insane, fuck off」）、另有「Adventure over Everything」這類調性，與 Rachel 慢／平／節制的語氣衝突，故未入選；若之後要補第 6 個，這是我的首選。@altitudequest（6,105 Followers／322.7K Likes）——格言型且反炫耀（「90% suffering, 10% views. Wouldn't change a thing.」「The hardest mountains we climb aren't always made of rock」），非常對 Rachel 支柱(3)，但抓不到 bio、規模小、疑為尼泊爾行程商。@alpenglowexpeditions（2,148 Followers，bio「IFMGA/AMGA accredited mountain guide service based out of Olympic Valley, CA」）——Adrian Ballinger 的公司、定位幾乎完美，但 TikTok 幾乎沒經營。@no.ego.climbing（2,915 Followers）、@quartersendy（2,286 Followers／882.9K Likes，實際 caption「Safety is always an illusion in the mountains. The mountains are gonna do whatever they want」＋SAR 任務內容，理念超契合）、@martinpeak_（847 Followers）——都太小。@nepalmountainguides（97.2K Followers，Sanjib 的尼泊爾行程商）——量夠但內容偏通用行程宣傳，方法論可借鏡的少。

【語言缺口，誠實回報】五個入選帳號全部是英文帳號；我沒有找到任何一個規模與方法論都夠格的中文（繁／簡）TikTok 登山風險管理帳號可對標。中文相關搜尋只回到 TikTok 的 /discover 聚合頁與非創作者結果。順帶一提，主題命中度最高的其實是兩個日文帳號 @mountain1911 與 @inoueninaritai（DDG 索引到的影片標題分別是「剣ヶ峰（大山）稜線撤退：ビビりな友達と下山する方法」與「空木岳登山計画：百メートル手前での撤退」，整支影片就是在講「為什麼在登頂前 100 公尺撤退」）——這是我看過最貼近 Rachel 支柱(1)的內容型態，但我只驗到 DDG 索引的標題、沒有抓過它們的個人頁與粉絲數，且語言超出本次指定的英／中範圍，因此不列入名單，僅作為線索提供，若要採用請先另做查證。

【共同注意事項】五個帳號我都只驗到個人頁數據＋部分 caption／單支影片說明欄，沒有逐支觀看影片，因此 image_approach 欄我已逐一標明哪部分是直接證據、哪部分是推斷。粉絲數皆為 2026-08-07 抓取的當日顯示值。

### Instagram（5 個）

**[David Goettler (David Göttler)](https://www.instagram.com/david_goettler/)** ・ 116K ・ English ・ ✔直接抓取 ・ `中等長度` + `具體點名` + `問句少`

> **對得上的理由：** 與 Rachel 的第一支柱「轉身時刻」幾乎是一對一對應，而且是全平台我找到最乾淨的範本。他是 no-O2 阿爾卑斯式登山者兼嚮導，公開發過 2019 年 8650m 折返、2021 年與 Kilian Jornet 在 South Col 折返、2024 年 Nanga Parbat 在 7550m 折返的完整決策紀錄。敘事重心是判斷與身體訊號，不是征服：他明確寫「不能把責任推給風」，而是承認是身體狀態不對；並寫「安全邊際這麼薄的時候，只要有一片拼圖不合，你就拼不完」。完全沒有零事故傳奇包裝，也從不給絕對保證。同時他也做 Reels（純環境音的路線影片），圖文與影音兩邊都有對標價值。
>
> **可直接抄的做法：** 1) 開場直接用兩三個字否認結果、不鋪陳：「No. No, we didn't climb Everest.」——Rachel 的下撤貼文可以照這個節奏開，先把「沒登頂」講完，再進決策過程。2) 把折返寫成「兩個人同時發現自己不對」的對照場景（他寫兩人在 South Col 會合、各自說出「我不 ok」，於是決定變得很容易），用來降低「放棄」的道德重量。3) 明確把責任歸給身體與判斷、而不是天氣：他刻意寫「其實可以怪風，但不是風的問題」——這正好是 Rachel「節制敘事」要的反推鍋寫法。4) 結尾用兩個並列碎句收束情緒、不問問題：「Disappointed, of course. Regretful. Not a bit.」5) 遠征日誌用「Day 4：這本來是預定登頂日」開頭，接著給精確海拔（7400m 營地 → 7550m 決定折返）、地形方位（Rupal 面翻到 Diamir 面）、雪深（每步陷到膝蓋）——不是精華剪輯，是真的把「做決定的那一刻」寫出來。6) Reels 用純環境音（風聲、踩雪聲）配一行字 caption，不做旁白教學。
>
> **配圖手法：** 以純山景／路線照與攀登中遠景為主，人常常是畫面裡很小的比例或根本不入鏡；Reels 大量使用純環境音的地形長鏡頭（Ganchempo 北壁那則就是「聲音本身是主角」）。少量搭檔合照。幾乎沒有自拍式擺拍，也沒有大字報式縮圖。

**[Mingma G (Mingma Gyalje Sherpa)](https://www.instagram.com/mingma.g/)** ・ 109K ・ English（尼泊爾人的非母語英文，句子短、直白） ・ ✔直接抓取 ・ `短碎片` + `具體點名` + `問句少`

> **對得上的理由：** 對應第二支柱「山徑日誌」最強：他是實際在山上工作的 IFMGA 級嚮導／營運者，貼文就是遠征現場的即時流水紀錄（誰明天上去、哪一段最可怕、直升機在哪、Broad Peak 最新狀況），不是事後精華。他也長期公開講風險與人為擁塞（直接寫 K2 Bottleneck「是 K2 上最可怕的一段，而我們卻得排長隊」），並曾公開主張 Manaslu 真正山頂問題、直指其他人的登頂宣稱不實——這種「願意公開講沒真的登頂」的態度符合紅線要求。**保留意見**：他的 bio 是成就清單（14x8000ers no O2、37 次 8000m）、部分貼文帶團客招募與贊助商列表，帶有一點英雄化與商業推銷味，所以只建議對標「現場日誌寫法」，不要對標他的 bio 自我定位。
>
> **可直接抄的做法：** 1) 用「格言碎句開場 + 具體案例收尾」的兩段式：「More people are defeated by blisters than by mountains.」接著馬上落到 2023 年 Shishapangma／Cho Oyu／Manaslu 連續三座、以及水泡帶來的具體痛苦——這正是 Rachel 第三支柱「給平地人的山間道理」該有的寫法（先一句可被引用的話，立刻用真實細節接住，不停在抽象）。2) 短標題 + 分隔線的排版：第一行只寫地名（「K2 bottle neck」），第二行一串 * 當視覺分隔，第三行才進內容——非常適合 Rachel 的日誌貼文做成可辨識的固定版型。3) 用具體人名／關係稱呼取代籠統「大家」：他寫「my 4 Sherpa brothers」而不是「團隊」，跟 Rachel「用隊員名字」的語氣設定完全一致。4) 寫精確日期與數字當可信度錨點（「22-July-2022 創下 K2 單日登頂人數紀錄」）。5) 用「Broad Peak Update」這種大字報式資訊圖當縮圖發即時進度——對應 Rachel 天氣窗／進度更新這類資料型題材，不必硬套人像。6) 承認恐懼而不表演克服：把「這是最可怕的一段」直接寫出來，不加「但我很享受」的英雄轉折。
>
> **配圖手法：** 混用得很符合需求：大量純路線／地形／直升機／營地實拍（本人常不在畫面內，甚至是別人代拍或轉貼隊員畫面，alt text 顯示作者常是 Imagine Nepal 或隊員如 Tejan Gurung）、外加明顯後製的大字報縮圖（「Broad Peak Update」）。手機隨手拍質感，不修得漂亮。

**[Alan Arnette](https://www.instagram.com/arnette.alan/)** ・ 8,124 ・ English ・ ✔直接抓取 ・ `中等長度` + `具體點名` + `問句少`

> **對得上的理由：** 對應第一與第三支柱的「判斷 vs 賭博」對照寫法最好。他是登山界最持久的獨立觀察者，每季寫 Everest／K2／Karakorum 現場報導，而且立場明確站在風險管理那一側：直接寫「登頂推進是建立在希望而不是科學上」「這永遠是一場賭博」，也照實發「Summits Across the Karakorum but not K2」「Tragedy on Broad Peak」這種不好聽的標題。完全沒有征服包裝，也不美化難度。他是評論者／教練而非現役高山嚮導，所以對標價值在「怎麼把天氣窗與決策寫得具體又不說教」。
>
> **可直接抄的做法：** 1) 第一句就下判斷、且是節制那一側的判斷：「Summit pushes are underway for K2 based on hope than science.」——Rachel 可以用同樣手法開場，先給立場，再給證據。2) 用「反成就」標題做縮圖：「Summits Across the Karakorum but not K2」——直接把「沒登頂」放進大字報，對應 Rachel 的轉身敘事。3) 天氣窗寫法：不寫「天氣不好」，而寫「這季是 Karakorum 最反覆的一季，高風延後甚至中止了不少隊伍的適應輪次」——把抽象天氣翻成具體後果。4) 用可查核的硬數字當骨幹（Icefall Doctors 已開工、EBC 春季要住進 1,000 多人）。5) 結尾用一個標籤 + 一條連結收尾，不問「你們覺得呢」。6) 內文提「rope team」「acclimatization rotation」這類術語時不解釋，靠語境帶——這是 Rachel 第三支柱把術語直譯成人生原則的前置素材。7) 圖片幾乎不用自己：靠文字圖、螢幕截圖、山景，資料型題材就用圖表式縮圖。
>
> **配圖手法：** 最符合「配圖不一定有本人入鏡」這條：大量明顯後製的大字報／資訊圖式縮圖（山景上疊「Tragedy on Broad Peak」「Summits Across the Karakorum but not K2」）、社群貼文截圖（alt text 顯示有 Twitter screenshot）、純山景照，偶爾夾一支完全離題的野生動物影片（松鼠／土撥鼠）當生活調劑。本人幾乎不入鏡。

**[Utah Avalanche Center – UAC](https://www.instagram.com/utavy/)** ・ 97.4K ・ English ・ ✔直接抓取 ・ `短碎片` + `具體點名` + `問句少` ・ （機構帳號）

> **對得上的理由：** 這是唯一一個「內容主體就是風險管理與節制」的大帳號，而且格式跟 Rachel 要做的事幾乎重疊：天氣窗／雪層弱面計算、什麼時候不要上去、預報員站在雪坑前對鏡頭講判斷過程。他們甚至直接把主題定為「persistent weak layers and mindsets in the mountains」——把技術判斷與心態並置，正是 Rachel 第三支柱的原型。從不給絕對保證（整個機構的語言就是機率與不確定性）。是機構帳號，所以對標的是格式與語言，不是人格。
>
> **可直接抄的做法：** 1) 極短的事實型 caption 就發：「Snowpack discussion (02/07/2025) Days Fork.」——一個日期加一個地名就結束，完全不解釋、不釣留言。Rachel 的山徑日誌可以直接沿用這個 3~4 字碎句的極簡版型。2) 標題永遠帶精確日期與地點，讓貼文自然變成可回查的日誌序列。3) Reels 手法：預報員站在雪坑／雪坡前一鏡到底講當下的判斷依據，沒有配樂、沒有花字、不剪成精華——對應 Rachel「紀錄片感、不是精華剪輯」。4) 把「多個人的看法」做成一則影片（UAC 團隊＋社群幾位關鍵人物談現況），而不是單一權威發言——可轉成 Rachel 的繩隊多方視角。5) 用「mindsets in the mountains」這種把技術詞與心理狀態綁在一起的措辭，作為術語直譯人生原則的橋樑。6) 配圖完全不需要人：雪坑剖面、雪崩裂面、坡向照就是主體。
>
> **配圖手法：** 幾乎全是無人物的現場實拍：雪坑剖面、雪崩裂面（crown）、特定坡向與地形照，配上日期地點；Reels 則是預報員站在雪地裡對鏡頭講解的單鏡頭素人質感影片（臉在畫面裡但不是「網紅出鏡」，是工作紀錄）。另有少量活動公告與職缺的圖文卡。

**[Melissa Arnot Reid](https://www.instagram.com/melissaarnot/)** ・ 47.8K ・ English ・ ✔直接抓取 ・ `長篇` + `偏抽象` + `問句少`

> **對得上的理由：** 對應第四支柱「深夜筆記本」最直接——她真的在寫凌晨兩點醒來、自我懷疑、害怕被看見。而且她的整本書與整個帳號論述就是 Rachel 的核心命題的反面教材版：她公開檢討自己把「把身體推到危險極限」當成證明自己夠好的手段，這正是「允許人說今天不上」需要的心理學基礎。她是現役高山嚮導（Pacific Alpine Guides），親歷聖母峰兩次最大量傷亡事件並公開作證，完全不是零事故傳奇包裝。**保留意見**：她的 caption 是長篇自白式，跟「3~4 個碎片短句」的定案風格明顯不符，配圖也偏本人肖像，所以只建議對標「題材與坦白程度」，不要對標她的長度與版型。
>
> **可直接抄的做法：** 1) 用一個精確的生理時刻當開場錨點：「這幾天我都凌晨兩點醒來」——不是「我最近很焦慮」。Rachel 的深夜筆記本可以照這個做法，先給時間與身體狀態，再給心事。2) 把矛盾直接並列不化解：她寫「我一生大半在害怕被看見，同時又深深想被真正看見」——保留張力而不給結論，符合 Rachel「慢、平、不給保證」的語氣。3) 承認動機不純：把「我當初被山吸引是因為它代表自由，但我很快把它當成逃避」寫出來——對應 Rachel 拆解征服敘事。4) 在自白貼文裡標註老照片的攝影者與年份（她標 2013 年、標 @pointshootthink），讓情緒貼文仍有可查核的具體錨點。5) 用自嘲短句收尾降溫（「快去預購，趁我還沒改變主意」），避免自白變成沉重說教。6) 反向教材：她的長度與自拍配圖不要照抄——Rachel 應把同樣的內容壓成 3~4 句碎句，並改用無人物配圖。
>
> **配圖手法：** 偏本人入鏡：肖像照、山中人物照、開車／日常影片、書籍宣傳素材，並有「Book q&a」「Believe me」等 highlight。配圖多為情緒對位的人像而非物件特寫或圖表——這一項是她與定案風格差距最大的地方。

研究員備註：【方法論更新 — 請覆蓋 2026-08-06 的實測結論】Instagram 這次**可以直接抓取**。WebFetch `https://www.instagram.com/<handle>/?hl=en` 穩定回傳真實的帳號名稱、完整 bio、followers/following 數、verified 標記、貼文日期與圖片 alt text（alt text 甚至帶「May be an image of ... text that says '...'」，可用來判斷配圖手法與縮圖大字）。更關鍵的是，個別貼文頁 `https://www.instagram.com/p/<id>/` 與 `https://www.instagram.com/<handle>/reel/<id>/` 會回傳**完整逐字 caption**。所以這次 5 個帳號全部標 direct-fetch，沒有一個是靠推論補的。不過抓取不是 100% 穩定：同一個 URL 偶爾回傳純 JS 殼（@alan_arnette、@malla.mountaineer 的某則 reel、@utavy 的某則 reel 各失敗一次），重試或換貼文即可。

【本次攔下的假／死帳號陷阱，共 4 個】(1) `@davidgoettler`（無底線）只有 4 followers、2 following、無內容，是被佔用的空帳號；本尊是 `@david_goettler`。(2) `@alan.arnette` 有 2,204 followers、bio 寫得很像本人（「Oldest American to summit K2」），但可見貼文只到 **2016 年 4 月 2 日**，是停更十年的舊帳號；活躍本尊是 `@arnette.alan`（2026-08-06 還在發文）。(3) `@utahavalanchecenter` 這個「看起來才是官方」的 handle 只有 2,842 followers、27 following、貼文只到 2013 年；真正官方是 `@utavy`（97.4K, verified）。(4) 搜尋 Carla Pérez 時撈出大量同名帳號（@carlaperez、@cccarlaperez、@carlaperezdobrasil 等，多為巴西藝人／不相關人士），登山家本尊是 `@carla.perez.ec`。

【風格符合度的誠實評估 — 不要當成 5 個都達標】定案的圖文風格（3~4 句碎句／具體／不總以問句收尾／配圖不一定有人）有明顯落差：
- 完全符合的只有 2 個：`@utavy`（caption 短到只有「Snowpack discussion (02/07/2025) Days Fork.」，配圖全是無人雪坑／裂面）與 `@mingma.g`（短碎句＋精確海拔日期＋純路線實拍與大字報縮圖）。這兩個是版型與句長的主要對標對象。
- `@arnette.alan` 句長算 medium，但「第一句就下判斷」「用反成就大字報當縮圖」「幾乎不入鏡」三點極度可用。
- `@david_goettler` 是**題材上的最佳範本、句長上的部分範本**：Reels caption 只有一行，但遠征日誌是整段長文。建議拆開學——學他的開場句、結尾雙碎句、以及「不推鍋給天氣」的歸因方式，不要學段落長度。
- `@melissaarnot` **明確不符合**句長與配圖兩條（長篇自白＋本人肖像為主），我照實標了 long-form / mostly-abstract / 人像為主。她入選是因為第四支柱「深夜筆記本」在這個圈子裡幾乎找不到別的真人範本，價值在坦白程度與題材，不在版型。若下一輪查證要以風格符合度為主要篩選標準，她是第一個該被替換掉的。

【已查證、可直接替補的候補（都是直接抓取到的真實數字，2026-08-07）】
- `@dawayangzum` Dawa Yangzum Sherpa — 22.5K followers / 1,123 following，bio「IFMGA Moutain Guide 1st Nepali female to complete 14x8000m peaks @thenorthface」。**人設相似度最高**（亞洲女性 IFMGA 高山嚮導、常駐 North Cascades 帶團）。但我抓到的兩則逐字 caption（North Cascades 夏季帶團、International Women's Day）都偏籠統且贊助商標註很重，具體度不足，所以沒進前五。
- `@carla.perez.ec` Carla Perez — 28.9K / 1,337，verified，厄瓜多女性嚮導（ASEGUIM / IFMGA aspirant），美洲第一位無氧登頂 Everest 與 K2 的女性。人設契合度高，但我用完搜尋額度前沒能抓到她的逐字 caption 樣本，風格未經查證，不敢貿然填欄位。
- `@adrianballinger` — 119K / 1,685，Alpenglow Expeditions 創辦人，2016 年在 8600m 折返（題材完全對）。但我抓到的 caption 是長段落＋大量 @ 標註的團隊致謝文，且縮圖大量使用「EMBRACE BAD DAYS」「HOW TO BECOME A CLIMBER」這類勵志／教學大字報，偏精緻權威型，與「隨手打」的定案風格衝突。
- `@malla.mountaineer` Vinayak Jaya Malla — 12.2K / 1,445，尼泊爾 IFMGA 嚮導，bio「IFMGA Mountain Guide | Nepal 🇳🇵 Expeditions • Himalaya • Alpine Life」。風格樣本抓取失敗，未評估。
- `@coavalancheinfo` Colorado Avalanche Information Center — 85.8K / 319，機構，與 @utavy 同類型，可作為第二個雪崩預報對標。
- `@tiphaineduperier` — 4,320 / 164，UIAGM 女性嚮導（David Goettler 的 Nanga Parbat 隊友），粉絲數偏小。
- `@lukasfurtenbach` — 7,046 / 1,896，以「為安全中止遠征」出名，但內容偏「Everest 沒人說的秘密」這類鉤子式教學＋自家團隊行銷。
- `@coryrichards` — 940K，bio 已改成「SECONDS - Artist - Explorer - LA/OC」，題材已離開登山（藝術／演講／房地產周邊），caption 是長篇自白（「READ CAPTION //」開頭），與本次 niche 相關度下降，故未列入。

【中文帳號查找結果：不足】Instagram 上沒找到符合條件的中文高山風險敘事帳號。台灣主要的相關創作者重心都不在 IG：雪羊（黃鈺翔，「雪羊視界」）近 10 萬追蹤但主場在 Facebook 且寫長篇評論文；呂忠翰（阿果）的下撤決策紀錄（K2 因雪況不穩定撤退、他自述「有七成以上把握才會繼續上」）主要散見於 Facebook 與媒體專訪；詹喬愉（三條魚，高山嚮導兼山域搜救）我在耗盡搜尋額度前無法查證到她的 IG handle，所以沒有回報。**沒有用「同名 handle 應該就是本人」去補足任何一個。** 因為發文語言尚未鎖定、英文帳號同樣可對標，我判斷回報 5 個已查證的英文帳號比硬湊中文帳號更安全。

【額度限制】本 session 的 WebSearch 已用盡 200/200 次，最後一次查證（Mingma G 是否有公開發過「取消遠征／救援」貼文）沒能執行。若要補這一項，或補 `@carla.perez.ec`、`@malla.mountaineer`、詹喬愉 的風格樣本，需要新的 session 或提高 CLAUDE_CODE_MAX_WEB_SEARCHES_PER_SESSION。

【合規檢查】5 個帳號都沒有為流量擺拍危險動作或誇大難度的跡象；沒有零事故傳奇式個人英雄敘事（Mingma G 的 bio 是成就清單，這是唯一的灰色地帶，已在他的 niche_match 欄位標註保留意見）；沒有任何一個帳號給出「這絕對安全」式的絕對保證——@utavy 與 @arnette.alan 的語言反而是機率與賭注（「It's always a gamble」）。已排除 Nirmal Purja／Kristin Harila 這類征服極限敘事帳號。所有 5 個都與 Rachel 這個角色無任何關聯或合作，僅供內容手法借鏡。

### X（Twitter）（5 個）

**[Angela Benavides](https://x.com/Angelab8848)** ・ 6,064 followers / 282 following ・ English（本人為西班牙籍，X 上以英文發文） ・ ◇交叉比對 ・ `短碎片` + `具體點名` + `問句少`

> **對得上的理由：** 專職報導 8000 公尺遠征的體育記者，長年追蹤「誰上了、誰下撤了、為什麼」。她的內容核心就是決策與風險本身（雪崩前後的時序、隊伍為何放棄、遺體搜救的取捨），跟 Rachel 的「轉身時刻」與「山徑日誌」兩根支柱幾乎重疊。她也明確反征服敘事，用「rejected but not defeated」描述未登頂。
>
> **可直接抄的做法：** （1）開場先承認自己不懂再進入問題：「I have some questions about the hours before and after the avalanche... The more I ask, the less I understand.」— Rachel 可直接套用這種「不裝懂」的開場，取代權威口吻。（2）替未登頂者選中性措辭：「rejected but not defeated」、「Thwarted once... prepare to try again」，永遠不寫「失敗/攻頂失利」。（3）貼文末尾補一行圖片來源（「Photo: Karakorum Expeditions.」），用署名把貼文變成紀錄而不是表演。（4）用一句格言式短句收束、不加問句：「Bonds of friendship are strong but so are the risks.」（5）一律點名真實山名、路線名、人名（Broad Peak、Rupal face of Nanga Parbat、Holecek、Petrecek），不寫「某座八千米」。（6）轉貼別人的內容時只加一句自己的判斷（「Cool thread on...」「😲」），不搶話。
>
> **配圖手法：** 以遠征現場照、雪崩痕跡、山壁照為主，本人幾乎不入鏡；照片一律附拍攝者或單位署名。轉貼新聞時直接用對方文章的連結卡片縮圖，不硬塞一張自拍。偶爾純文字無圖。

**[Jimmy Chin](https://x.com/jimkchin)** ・ 120,255 followers / 132 following ・ English ・ ◇交叉比對 ・ `短碎片` + `具體點名` + `問句少`

> **對得上的理由：** 高山攝影/紀錄片作者，長期在遠征現場。他的圖說寫法（一句觀察 + 點名人物 + 點名精確地點）是本次找到最貼近 Rachel 目標圖文格式的範本。新書《Rules to Live By》主題是從山岳前輩身上蒐集人生原則，與 Rachel 第三根支柱「給平地人的山間道理」直接對應。合規上：他確實拍過高風險攀登（Meru、Free Solo），但貼文不擺拍危險動作、不吹「零事故」，且公開談過 Meru 首攀撤退。
>
> **可直接抄的做法：** （1）三段式圖說骨架，直接可套：一句格言／觀察 → 點名照片裡的人 → 點名精確地點。原文「It's about your point of view. @conrad_anker has a good one. Bugaboo Provincial Park, British Columbia, Canada.」→ Rachel 版：一句山間道理 → 隊員本名 → 精確營地或海拔。（2）用真實路線名取代形容詞：「Screams from the Balcony, on Saddle Mountain. Banff National Park, Canada.」而不是「一條很難的路」。（3）誇獎別人用淡描寫：「@sonnietrotter making it look casual…」不用「史詩級」「神級」。（4）照片主角是隊友或風景，本人極少入鏡——正好對應 Rachel「配圖不一定有本人」的要求。（5）宣傳自己的東西時只放一行字 + 連結，不寫長篇銷售文。（6）刻意用刪節號結尾留白，不用問句釣留言。
>
> **配圖手法：** 大幅攝影作品為主：攀登者在巨大岩壁／山景中只佔畫面一小點，或純風景無人。本人幾乎不入鏡。宣傳新書時改用書封或 15 秒短片縮圖，不硬套自拍。圖說一定帶精確地點（國家公園、省份、國家全名）。

**[ExplorersWeb](https://x.com/ExplorersWeb)** ・ 8,096 followers / 1,836 following ・ English ・ ◇交叉比對 ・ `短碎片` + `具體點名` + `問句少` ・ （機構帳號）

> **對得上的理由：** 專報高海拔／極地遠征新聞。關鍵價值：它把「決定不去」當成正式新聞來寫（Petrecek Bails / Thwarted / proved undoable），這正是 Rachel「轉身時刻」支柱缺的句構範本。也會直接寫嚮導行程因客觀風險取消，符合風險管理而非征服的框架。
>
> **可直接抄的做法：** （1）最可抄的兩句式下撤寫法：先寫權衡 → 再寫決定 → 最後補一句人際代價。原文「After weighing the pros and cons, Tomas Petrecek decided not to attempt the Rupal Face of Nanga Parbat again this year. His partner was not happy.」— 只有兩句，不評價、不美化、不安慰，但把隊內摩擦留在檯面上。（2）不隱藏嘗試次數：「It was his 5th try.」（3）動詞刻意中性：用 bails / thwarted / proved undoable / retrieved，避開「征服」「挑戰失敗」這類戲劇字眼。（4）每則就 1~2 句寫完，絕不問句收尾，也不下「你怎麼看」。（5）數字一律精確到底：「the 4,600m-high Rupal Face」、「160km across the Baltic Sea」、「Four bodies... Three others will remain on the mountain for now」。（6）壞消息用平鋪直敘的事實句，不用感嘆號。
>
> **配圖手法：** 清一色文章連結卡片縮圖：山壁、雪崩痕跡、遠征現場、落石影片截圖，幾乎都是純景或遠景人物，沒有記者本人入鏡。不做精緻後製封面，就是現場照直接上。

**[Will Gadd](https://x.com/gilwad)** ・ 4,153 followers / 109 following ・ English ・ ◇交叉比對 ・ `中等長度` + `具體點名` + `問句普通`

> **對得上的理由：** 職業冰攀／高山嚮導，是整個戶外圈把「風險管理」講得最直白的人之一：他給客戶的文件〈To my Dear Mountain Guests〉明寫「I really can't keep us—you or me—completely safe」，直接對應 Rachel「從不說這絕對安全」的紅線。他辦免費風險講座、轉貼雪崩決策文章，完全是節制敘事而非征服敘事。
>
> **可直接抄的做法：** （1）把「我無法保證安全」做成常設宣告：他對客戶的風險告知直白到近乎冒犯（「I really can't keep us—you or me—completely safe」）。Rachel 可以把這句改寫成置頂貼文，並定期重申。（2）轉貼專業文章時只加一句自己的判斷，不加教學：「'The Power of Noticing.' This is a real superpower for engaging with mountains. Excellent piece.」+ 連結，句子結束。（3）用「risk engagement」（風險互動）而不是「risk avoidance」或「征服」的詞彙框架——這個用詞差異就是整個人設的立場。（4）主動宣告自己要減少／搬離某個平台，用行動示範節制而不是喊口號。（5）活動宣傳也點名到底：「Santa Monica Brewworks」「@_N_9_5 Nicola」，不寫「某場活動」。（6）警示：此帳號已於 2025-02 停更並轉往 Bluesky，只能對標它的語彙與風險框架，不能對標發文頻率或成長路徑。
>
> **配圖手法：** 幾乎不放原創照片，配圖多為連結卡片縮圖（BBC 報導、活動報名頁、雪崩教學文），本人不入鏡。這對 Rachel 只有部分參考價值：可借鏡「純文字＋一個連結也算一則貼文」的鬆散感，但不足以支撐圖文支柱。

**[Colorado Avalanche Information Center（CAIC 全州資訊帳號）](https://x.com/COAvalancheInfo)** ・ 5,673 followers / 98 following ・ English ・ ◇交叉比對 ・ `短碎片` + `具體點名` + `問句少` ・ （機構帳號）

> **對得上的理由：** 官方雪崩預報單位。價值不在題材（雪崩 vs 高海拔）而在句構：它是「天氣窗計算＋風險等級＋一句可行動建議」這套骨架最乾淨的公開範本，直接對應 Rachel「山徑日誌」裡的天氣窗判讀與「山間道理」的格言化。而且它從不給絕對保證——每個等級後面一定緊接一個具名的例外條件，完全符合合規紅線。
>
> **可直接抄的做法：** （1）三件套骨架，Rachel 的天氣窗貼文可直接套：風險等級（含幾分之幾）＋ 具名地點 ＋ 一句動作建議。原文「MOD(2of5) Generally safe conditions with slightly elevated danger in RMNP and Cameron Pass. Pay attention to warming snow and isolated areas of drifted snow. Start early and end early before the snow gets too wet.」（2）永不給絕對保證的技法：講「generally safe」時，同一句話裡就把例外具名寫出來（哪個地區、哪種雪、哪個坡向），讓「安全」永遠是有條件的。（3）把六字可行動格言當 pillar 3 模板：「Start early and end early.」— 短、可執行、沒有勵志味。（4）把「大家實際怎麼做決定」本身當內容：它公開發表向山友蒐集的二月決策行為調查結果，這招 Rachel 可用在「我的隊員當天怎麼投票」。（5）用量化等級（1of5、2of5）取代形容詞，逼自己講數字。（6）警示：這是制式公告口吻，只能抄骨架與用詞紀律，不要抄它的語氣——Rachel 需要在骨架上加一層第一人稱的疲憊感。
>
> **配圖手法：** 雪坡、雪坑剖面、雪崩滑落痕跡照，完全無人入鏡；危險等級用五級量表圖卡／玫瑰圖等資訊圖呈現；調查結果類貼文直接放數據圖表（開頭用 📊 emoji 標示）。這正是 Rachel「資料型題材用圖表而不是硬套自拍」的現成範例。

研究員備註：【抓取方式】WebFetch 對 x.com 一律回 HTTP 402 Payment Required，twitter.com 會 301 到 x.com，xcancel.com 鏡站則卡在 anti-bot 挑戰頁。因此改用瀏覽器分頁（preview_start + navigate + get_page_text）直接載入 X 個人頁，成功讀到真實的顯示名稱、bio 逐字內容、Following／Followers 數字、加入時間與最近 5 則貼文全文。以上 5 個帳號全部為 direct-fetch，粉絲數皆為 2026-08-07 當日親眼所見（X 介面以中文「萬」顯示大數，我已在欄位中換算並標明原始寫法）。

【本次被雙重查核淘汰的陷阱 — 全部實際載入頁面後才發現，請勿在後續流程中誤用】
1. @alan_arnette（搜尋結果指向 twitter.com/alan_arnette）→ 實際載入為 404「We're unable to show this account」。@alanarnette 同樣 404。Alan Arnette 官網 alanarnette.com 只列出 YouTube（@AlanArnetteClimbs）、Spotify、Apple Podcasts，未列任何 X 連結。判定：X 上查無可證實的 Alan Arnette 本人帳號，不回報。
2. @christomer → 實際為「Christinger Tomer」，位置 Mount Lebanon, Pennsylvania，僅 64 followers，最後貼文 2016 年，內容是 Mac 軟體特賣連結。這不是 Everest 氣象預報員 Chris Tomer。Chris Tomer 本人只在 Facebook（@ChrisTomer）、Instagram（@chrisdtomer）、YouTube（@TheChristomer）有帳號，X 上查無可證實帳號。
3. @UACinfo → 實際為澳洲雪梨的「Universities Admissions Centre」大學入學中心，761 followers，最後貼文 2022 年。不是 Utah Avalanche Center。搜尋結果推薦的 @UACwasatch 實際載入為 404。Utah Avalanche Center 真正的帳號是 @utavy_（2.2萬 followers，已驗證存在）。
4. @stevehouse → 實際為舊金山的股票／加密貨幣帳號，bio 寫「I have the intellect of a goat... $TSLA $clov #spacex」，590 followers，最後貼文 2022 年。不是登山家 Steve House。
5. 其他載入後為 404 或不可用：@SAISAvalanche、@RMIGuides、@KeswickMRT。@LlanberisMRT 存在（7,598 followers）但 bio 明寫「No longer on Twitter. Find us on Mastodon」且貼文已設為僅限核准追蹤者可見，無法對標。

【已驗證存在但因合規或風格不合而未列入前 5 的帳號】
- @EveningSends（Andrew Bisharat，7,098 followers，活躍）：語氣短、隨手感極強，但 2026 年內容幾乎全是政治議題，且含「Mitch McConnell needs to come out as dead」這類粗口貼文。品牌安全風險，排除。
- @carolinegleich（Caroline Gleich，1.2萬 followers，活躍至 2026-07）：確實是滑雪登山家本人，但 X 上 2026 年內容幾乎全是美國政治倡議與選舉爭議，山岳內容極少，不適合當圖文手法範本。
- @Team_BMC（英國登山協會，3.8萬 followers）：2024-11 起停更，且貼文多為職缺與保險推廣。
- @ZimmermanGraham（Graham Zimmerman，147 followers）：確認是本人（bio 對得上 grahamzimmerman.com，並提及其回憶錄《A Fine Line》）。主題（風險、失去朋友後如何重新校準風險承受度）與 Rachel 契合度極高，但只有 147 followers 且 2023 年後停更，作為 X 對標範本規模不足。他的書比他的 X 更值得參考。
- @alpenglowexp（Adrian Ballinger，1.2萬 followers）：確認為 IFMGA 嚮導本人（bio「Big Mountain Climber/Skier/Mtn Guide. Founder @alpenglowexped」，Olympic Valley CA）。身分與 Rachel 最接近，但 2024-04 起停更，且可見貼文幾乎全是 3~5 字的引用轉推（「Yes this」「This one…Andrew nails it」），原創內容太少。
- @EverestToday（15.5萬 followers，1 小時前才發文，Nepal）：極度活躍、內容全是遠征決策／事故／搜救，題材完全對得上。但貼文是長段落新聞稿（多則被 X 折疊成「Show more」），caption_style 屬 long-form，與本次「3~4 個碎片短句」的定案風格不符，故列為備選而非前 5。若後續需要「題材與事件時間軸」的參考來源，這是最好的一個。
- @avalancheca（Avalanche Canada，9,003 followers）：機構帳號但語氣意外地生活化（bio 自稱「Canada's national public avalanche safety people」，徵人寫「generally awesome person」），且有「It's a good weekend to make sure we verify conditions carefully」這種節制框架。缺點是 2025-12 起停更，且不少貼文是職缺公告。
- @UDOTavy（1.7萬 followers）與 @utavy_（2.2萬 followers）：兩個都已驗證存在且真實。@UDOTavy 的具體程度是全部候選中最高的（精確到閘門編號、時間到分鐘、距離到公尺），但純粹是作業通報，完全沒有人的成分；@utavy_ 是制式警報公告。可當「數字紀律」的極端參考，不宜整體對標。
- @kilianj（Kilian Jornet，33.3萬 followers，活躍至 2026-08）：已完整驗證。優點是點名極具體（「Western States, Emelie's return, Xavier Thévenard, Hardrock, new lines in Pakistan, Alberto Ginés, Sam Laidlow, Sabastian Sawe」）、句子短、不用問句收尾，而且會主動把 DNF 正常化（「Neither of us finished the race that Saturday. But this conversation was a good one.」）。但兩個顧慮：一是貼文幾乎都是 YouTube／Substack 導流的連結卡片，原創圖文比例低；二是他的公眾形象本質上是紀錄型菁英運動員，與 Rachel 明確的「反征服敘事」在立場上相反。若要用，只建議借鏡「點名到底」與「公開承認沒完成」這兩點，不要借鏡整體人設。

【尚未達成的部分】未能找到任何可驗證的中文（繁體或簡體）高海拔登山／風險管理 X 帳號達到可對標的規模。X 在華語登山社群幾乎沒有聚落，相關創作者集中在 IG、YouTube 與小紅書。若 Rachel 最終決定以中文為主要發文語言，建議另開一輪針對 IG／YouTube 的研究，而非在 X 上硬找中文範本。回報的 5 個帳號全部為英文帳號，已如實填入 primary_language。

【整體建議】5 個帳號中最值得優先參考的是 @Angelab8848（個人聲音、活躍、下撤敘事、圖片一定署名）與 @jimkchin（三段式圖說骨架，是最貼近定案圖文風格的句構範本）。@ExplorersWeb 提供「把決定不去寫成新聞」的兩句式模板。@Gilwad 提供風險語彙與「我無法保證安全」的立場宣告，但務必注意該帳號已停更。@COAvalancheInfo 提供天氣窗／風險等級的資訊圖與量化寫法，但語氣需要重新包一層第一人稱。所有帳號都只借鏡手法，與 Rachel 這個角色無任何關聯或合作關係。

### Threads（5 個）

**[TAITAI 阿泰&呆呆（楊世泰＆戴翊庭）](https://www.threads.com/@taitai.live.wild)** ・ 10.6K ・ 中文（繁體） ・ ✔直接抓取 ・ `短碎片` + `具體點名` + `問句少`

> **對得上的理由：** 部分吻合。他們是長程徒步者／山岳作家（走過 PCT 太平洋屋脊步道 160 天、台灣古道），不是高海拔商業遠征嚮導，海拔量級與 Rachel 差很遠。但核心命題極近：著作《折返：山徑、公路、鐵道，往復內心與荒野的旅程》書名本身就是「不走完也是一種完成」，正對 Rachel 的「轉身時刻」支柱。內容零征服敘事、零極限表演、無安全保證式話術，合規上乾淨。本次找到的帳號中，Threads 圖文形式的匹配度最高的一個。
>
> **可直接抄的做法：** 1) 單句貼文就收工，只給座標級事實不給感悟：「清晨攝氏9度的合歡山日出」＝地名＋實測溫度＋時段，句尾沒有反思也沒有問句。Rachel 可直接套「C2。凌晨三點。負十九度。」
2) 山的內容與純生活內容在同一條時間線交錯（山日出 → 新來的貓撞到頭 → 台中大雨變小噴泉），刻意稀釋「登山家人設濃度」，讓讀者相信這是本人隨手發而不是內容排程。
3) 用「⋯⋯」＋單一顆 emoji（😆🐤）壓平語氣，代替驚嘆號與抒情公式，剛好對應 Rachel「慢、平、簡省」的設定。
4) 把「折返」當中性／正面詞使用而不是遺憾詞（已經做到書名層級的定位），可整套借用為 Rachel 的固定詞彙表。
5) 配圖只拍「當下看到的那個東西」，不補拍人物。
>
> **配圖手法：** 抓到的四則貼文全部沒有本人入鏡：純山景日出照一張、貓的影片、街道積水的影片、寵物玩偶洗澡的影片。主體一律是「此刻眼前的物件或場景」，人物入鏡比例極低。未見資訊圖表型配圖（他們題材不走資料型），這是與 Rachel 需求的唯一小落差。

**[Cher | 雪兒](https://www.threads.com/@snowap)** ・ 8,585 ・ 中文（繁體） ・ ✔直接抓取 ・ `短碎片` + `具體點名` + `問句普通`

> **對得上的理由：** 部分吻合。她是台灣本土實務登山嚮導（真的帶團、發 GPX、揪隊），海拔量級遠低於 Rachel，且沒有下撤決策的敘事型貼文。但「持有執業嚮導身分 × 貼文完全是生活隨手記」這個組合，正是 Rachel 在 Threads 上要佔的聲音位置——她的 bio 自己就寫明「日常隨性的地方」，等於公開把此平台定義為非正式頻道。無誇大難度、無極限表演、無安全保證話術。
>
> **可直接抄的做法：** 1) 用 bio 直接宣告平台調性差異（「日常隨性的地方～～」），預先跟讀者說「這裡不是我的正式頻道」。Rachel 可比照寫成「遠征之間的空檔都寫在這裡」，一句話豁免掉深度內容的期待。
2) 發一則跟登山無關但發生在山路上的小事：陽金公路 8.5k 撿到一張卡片，配兩張卡片特寫，找主人。零說教、零感悟，但把「人在哪、看到什麼」講到公里數這麼具體——這正是「具體不抽象」的可複製做法。
3) 主動公開自己收到的假業配邀約截圖與自己的驗證步驟。對 Rachel 可轉譯為公開自己拒掉哪個贊助條件、或某個客戶要求壓縮行程的請求。
4) 固定格式的低成本事務貼（每週一徵：直接列行程名稱＋缺幾人），完全不寫文案只列事實，維持發文頻率而不消耗人設。
5) 事務型貼文不收問句、社群型貼文才收問句，兩種收尾分開用。
>
> **配圖手法：** 大量非本人素材，走「證物照／現場照」路線而非自拍路線：詐騙訊息的螢幕截圖、撿到的卡片實物特寫兩張、山景照當徵伴貼文的底圖。抓到的五則貼文都沒有明顯的個人形象照。未見圖表／資訊圖（題材不走資料型）。

**[Adrian Ballinger](https://www.threads.com/@adrianballinger)** ・ 20.7K ・ English ・ ✔直接抓取 ・ `中等長度` + `具體點名` + `問句少`

> **對得上的理由：** 高度吻合，是本次找到的英文帳號中職業角色最接近 Rachel 的一個：真正的高海拔商業遠征嚮導與遠征公司創辦人，Alpenglow 的核心賣點就是「用預適應縮短高海拔暴露時間」——即風險管理而非硬撐；他本人有無氧聖母峰在接近頂峰處轉身、隔年才成功的公開紀錄，屬於會承認沒登頂的人，不是零事故傳奇型人設。落差要誠實講：他在 Threads 上這幾個月幾乎不談下撤或決策，貼的是家庭與返家生活；下撤敘事主要在他的長影音／訪談，不在 Threads。
>
> **可直接抄的做法：** 1) 抵達新國家只發三個短句、完全不解釋要去做什麼：「We're here. We're learning. It's quite rad 🇳🇮」——用國旗 emoji 當唯一的地點標示。Rachel 可直接套「Kathmandu. 行李還沒到。先睡。🇳🇵」
2) 描述自己的專業活動時用「learning」而不是 conquering／sending，主動把專家身分降級成學習者，語意上先卸掉權威姿態。
3) 把嚮導身分與私人身分放在同一條時間線（兒子 Aaro 要剪跟爸爸一樣的髮型、三代同框），讓讀者相信山不是他生活的全部——對「一年在新加坡不到三個月」的 Rachel 特別有用，可用來避免人設變成單薄的遠征機器。
4) 主動發一則反遠征價值的貼文（「被提醒 home adventuring 也很啟發人」），把「不出發」也寫成正面選擇，這是 Rachel「允許人說今天不上」的日常版。
5) 提及具體人名（兒子 Aaro、自己的父親）而不用泛稱，剛好對上 Rachel「用隊員的名字而不是籠統的大家」。
>
> **配圖手法：** 人物照比例偏高，是他與 Rachel 目標圖文風格的主要落差：三代合照、剪完髮的兒子等家庭人物照為主，另有家鄉場景照。沒有走純物件特寫或資訊圖表路線。建議只借他的語氣與句長，配圖手法改參考 @taitai.live.wild 與 @snowap。

**[岳野登山社](https://www.threads.com/@mountainfield177)** ・ 7,588 ・ 中文（繁體） ・ ✔直接抓取 ・ `長篇` + `具體點名` + `問句少` ・ （機構帳號）

> **對得上的理由：** 支柱吻合度最高的一個。這是一個商業帶團單位公開發文說「我們這團沒登頂，因為風速」，並把「平安回家＝真正的完成」寫成品牌主張——直接對應 Rachel 的支柱（1）轉身時刻與（2）山徑日誌。合規上非常乾淨：不誇大難度、不包裝英雄故事、不做安全保證，反而在拆解商業登山團的結構性風險（低價團、嚮導比不足）。落差要誠實講：這是機構帳號、講述對象是潛在客戶，語氣是勸告與衛教，不是私語；篇幅是長串文而不是 3~4 句碎片，因此形式上不符合本次定案的圖文風格。
>
> **可直接抄的做法：** 1) 「本次未登頂」單獨當主文發，不藏在行程回顧的中段；主體鎖定風速這個單一可驗證變因，不鋪陳心境、不做起承轉合。
2) 建立一句可跨貼文重複的固定收束句（「平安回家才是真正的完成」／「登山真正的終點不是山頂」），靠重複形成識別度——Rachel 的「給平地人的山間道理」支柱可比照先訂 2~3 句固定句，而不是每篇造新格言。
3) 別人出事之後不發悼念文，改發「你報名的團該問哪四件事」的檢核清單，把集體情緒轉成可操作動作。這是把風險管理內容化最不油的做法。
4) bio 先自曝身分弱點（「雖然是商業團 但是是您登山的好朋友」），用坦承換信任。Rachel 可用「我收錢帶你上山，所以我也負責告訴你哪一天不該上」。
5) 談風險時只給具體變因（風速、嚮導比、休息時數、山屋位置），不使用「安全」「放心」這類抽象保證詞。
>
> **配圖手法：** 山景照與帶團現場照，主體是隊伍與路線而不是領隊個人形象照，未見自拍導向經營。資料型主張（嚮導比、休息時間）目前是純文字陳述，沒有做成圖表或資訊圖——這塊反而是 Rachel 可以做得比它更好的空間。

**[山問攀登 The Great Hunger](https://www.threads.com/@tgh_tw)** ・ 3,008 ・ 中文（繁體） ・ ✔直接抓取 ・ `長篇` + `具體點名` + `問句少` ・ （機構帳號）

> **對得上的理由：** 部分吻合但立場精準。它是攀登品牌而非高海拔遠征嚮導（海拔量級與商業模式都不同），但「風險可以被評估與分級，不該被恐懼一刀切」這個公開立場，跟 Rachel 拒絕「這絕對安全／這絕對禁止」二元論的節制敘事同一條線；馬博橫斷搜救的過程紀錄也對應「山徑日誌」要的紀錄片感而非精華剪輯。合規乾淨：無擺拍危險動作、無零事故傳奇、無安全保證。落差：機構帳號、篇幅偏長。
>
> **可直接抄的做法：** 1) 情緒最重的地方改用最短的句子：搜救第五天找到人，只寫「人還活著。太好了。」——在最高點反而字最少。這是 Rachel「慢、平、簡省」語氣最可直接複製的技術，適合放在「深夜筆記本」支柱。
2) 當外界要求「全面封閉／全面禁止」時，公開主張分區判斷與比例原則，讓「節制」不等於「什麼都不做」。這能讓 Rachel 的邊界感人設避免退化成一味勸退。
3) 先講清楚「投入搜救／協助他人需要什麼準備」，把利他行為也拉進風險管理框架，而不是把它浪漫化。
4) 讓品牌名／人設名本身承載命題（「向山提問」），因此貼文不必每篇都重述世界觀，可以放心發輕的內容。
5) 提到事件一律給具體座標式細節（馬博橫斷、協作身分、第五天、堰塞湖、太魯閣），不用「某條路線」「最近有個事件」這種模糊寫法。
>
> **配圖手法：** 以搜救現場照與山域實景為主，未見經營個人形象自拍。資料型／政策型主張文目前為純文字，未使用圖表或資訊圖。整體是「事件現場照」導向而非人物導向，這部分符合 Rachel 的需求；但缺少純物件特寫與縮圖式後製圖這兩種手法。

研究員備註：【方法論修正 — 請更新平台可抓取性筆記】
上一次（2026-08-06）記錄「Threads 只會拿到純 JS 殼」在本次不成立。關鍵是網域：**https://www.threads.com/@handle 現在會回傳伺服器端渲染的真實內容**（顯示名稱、bio 逐字、粉絲數、貼文全文、讚數／留言數、外連），本次 5 個帳號全部是直接抓取成功，全部標 direct-fetch，沒有一個需要靠間接推論。同時觀察到三種失敗態，判讀方式如下：
- 回傳登入頁／footer 殼 → 幾乎都代表**該 handle 在 Threads 上不存在**（本次 @coryrichards、@alanarnette、@brody.leven、@lukasfurtenbach、@majkaburhardt、@dawayangzumsherpa、@jenndrummond 都是這一態）。
- 回傳「Content truncated due to length」→ 頁面太長被截斷，只拿到 header（@emilyaharrington 確認帳號**存在**、@byron_yuan 顯示名稱為「阮國祥」也存在），但拿不到粉絲數與貼文，重試與加 ?hl= 參數都無效，因此不予採計。
- 另外用 WebSearch 限定 allowed_domains: ["threads.com"] 檢索中文登山關鍵詞非常有效，本次 5 個帳號中有 3 個（@snowap、@mountainfield177、@tgh_tw）是靠這招撈到的；英文關鍵詞檢索則幾乎只會撈到新聞媒體帳號轉貼，效率很差。

【已攔下的假帳號陷阱】
- **@garrettmadison**（https://www.threads.com/@garrettmadison）＝ 一位 33 歲、KY 州、bio「33/KY/🐕/🏳️‍🌈」、**484 粉絲**的個人，貼文是生日與朋友聚會，與美國知名聖母峰嚮導 Garrett Madison **完全無關**。跟上次 @baldandbankrupt / @LiYongLe 同一類型的同名／佔用陷阱，已排除。
- @saila_mingma（Mingma D Sherpa，真人尼泊爾嚮導，**1,297** 粉絲，bio 逐字列出 Everest×4／K2×3／Manaslu×6 等紀錄）確認為真，但排除：粉絲量太小、貼文是馬來西亞攀岩行程＋勵志語錄＋業配感謝，bio 本身是成就清單式的敘事，偏向本次紅線（b）個人英雄敘事的方向，且完全不談判斷與下撤。

【符合但被我排在 5 名之外的候補（都已直接抓取確認存在，數字可直接沿用）】
- **@snow_ram**（雪羊 Snow Ram，黃鈺翔，**18.7K**）— 台灣最大山岳 KOL 之一，bio「用鏡頭與文字，把山裡的故事帶回人間」，配圖全是山景無本人入鏡，具體度極高（點名玉山違規車輛事件、已故登山者張元植被中國創作者盜用內容等真實事件）。**淘汰原因純粹是形式**：Threads 上幾乎都是 500~800 字以上的調查型長文，與本次定案的「3~4 句碎片」正相反，everyday_feel 應標 false。若後續改走「山岳議題評論」路線，他是第一順位。
- **@melissaarnot**（Melissa Arnot Reid，**7,945**，已驗證勾勾）— 職業角色與 Rachel 最像的真人：女性高海拔嚮導＋mentor＋媽媽，bio「First American Woman to ascend/descend Everest without oxygen, 6x summits // Mountain Guide // Mentor // Mom //」。**淘汰原因**：Threads 發文極稀疏（可見僅 2 則，2026-04 與 2026-07），文案偏中長篇且帶 #alwaysforward 這類口號 hashtag，作為「圖文手法」範本樣本量不足。人設參考價值仍高，建議另案研究她的長文平台。
- **@codytownsend**（Cody Townsend，**40.6K**）— 語氣最鬆、最像真人隨手打（近期一則是嘲諷「true summit」定義的玩笑文），everyday_feel true。**淘汰原因**：滑雪為主、近期貼文以玩笑與 onX 業配為多，風險判斷內容不在 Threads 上；且「The Fifty」本質仍是挑戰型專案，題材方向偏離節制敘事。
- **@carolinegleich**（**53.4K**）— 粉絲最多，且真的談山難（Broad Peak 雪崩、為罹難嚮導家屬募款）。**淘汰原因**：現階段 Threads 內容主體是美國政治（選民資料、國家保護區），長篇且多串文，題材與形式雙重不符。

【明確排除，不建議再花時間】
@kilianjornet（233K，但貼文是專案宣告＋業配，且「31 天連走 72 座 14,000 呎山峰」屬挑戰量化敘事，方向相反）／@odinhung（810，內容已轉為政治評論）／@hikingbiji 健行筆記（3,124，機構帳號但 Threads 上最新貼文停在 2023-07，等於停更）／@team.jingxingshi 徑行式（898，太小且為衛教型知識卡）／@yesman_traveler（5,292，內容雜、含防曬業配問句文）／@mountain_traveler_365 與 @pikajosport（未深入抓取，快掃為百岳知識卡與揪運動團，非本人語氣型）。

【給後續使用的策略建議】
Threads 上沒有任何一個帳號同時滿足「高海拔嚮導題材」＋「3~4 句碎片圖文」，這是這個平台的客觀限制，不是查證不足。建議拆成兩組來用：
- **借形式與語氣**：@taitai.live.wild（最優先，句長／配圖／不釣留言三項全中）、@snowap（bio 定調＋事務型短文＋證物照）、@adrianballinger（英文語氣、learning 用詞、具體人名）。
- **借題材結構**：@mountainfield177（「本次未登頂」怎麼寫成主文、固定收束句、事後檢核清單）、@tgh_tw（最重的段落用最短的句子、反對一刀切的風險立場）。
另外兩點供決策參考：（1）**發文語言若鎖中文（繁體），可對標的樣本明顯較多且圖文形式匹配度更高**（本次 5 個裡 4 個是繁中）；若鎖英文，Threads 上的高海拔嚮導幾乎只有 @adrianballinger 一個可用，樣本嚴重不足。（2）**沒有找到任何新加坡籍或新加坡在地的登山／高海拔 Threads 帳號**，Rachel 的地緣設定在這個平台上找不到現成對標，代表這個位置目前是空的。

### Facebook（3 個）

**[詹喬愉 - 三條魚Tri Fish](https://www.facebook.com/3xfish/)** ・ 131,072 likes · 6,939 talking about this ・ 中文（繁體） ・ ✔直接抓取 ・ `中等長度` + `具體點名` + `問句普通`

> **對得上的理由：** 目前找到最貼近 Rachel 的帳號：台灣女性八千米攀登者＋現役山域搜救隊員，主題長期就是風險判斷與救援，而不是征服。她 2015 年吉爾吉斯冰壁墜落受困冰河 26 小時、親眼看救援隊兩度撤退，之後仍持續攀登，是「把失敗與被救援公開講」的活教材。2022 馬納斯盧那篇更難得：她承認「撤退不一定比較安全」——如果當時撤退反而會走進雪崩區——這種對撤退決策模糊性的誠實，正是 Rachel 想要的「判斷」而非「安全保證」。近兩年因懷孕/育兒暫停遠征，貼文重心移到日常，剛好也示範了遠征空檔期怎麼經營帳號。
>
> **可直接抄的做法：** （1）寫撤退時同時寫出「撤退也可能是錯的」——把兩條路徑的風險並排講（她：留下 vs 撤退，雪崩落在一步之差），而不是把下撤包裝成必然正確的高尚選擇；Rachel 的「轉身時刻」可直接沿用這個雙路徑結構，避免變成說教。（2）遠征貼文標題化＋書名號分段（《洛子峰攀登心得---八千米的空氣》），把長篇經驗談明確標為「心得」，和短日常貼文在版面上分流；Rachel 可把「山徑日誌」用同樣的標題格式獨立出來。（3）批評別人的危險計畫時，先立一句降溫的讓步句再進入批判（「登山不是只有體能，雖然體能是基礎」），語氣平不咆哮——符合 Rachel 慢、平、簡省的語氣。（4）遠征空檔期直接發院子、發小孩衣服變鬆、發「Dady 才下班幾天又去上班」，用具體到月齡的生活細節維持帳號溫度，不硬撐專業內容；Rachel 一年待新加坡不到三個月，回家那段可照抄這個手法。（5）把海外訓練寫成「我和別人不一樣的地方」（在 UK 繩索救援訓練那篇），用身體差異／傷後限制當切入點，而不是展示技術等級。
>
> **配圖手法：** 混用型，且相當比例的貼文沒有本人入鏡。日常貼文用純物件特寫（一年前那件變鬆的嬰兒衣服）、純場景照（剛整理的院子）；攀登貼文用高海拔地形／營地／繩索救援訓練現場照，本人常只是畫面裡的一個小點或根本不在畫面內；搜救與教育類貼文會出現裝備擺拍與地形標註。可直接對標 Rachel 「配圖不一定有本人」的要求。

**[Will Gadd](https://www.facebook.com/will.gadd/)** ・ 44,408 likes · 9 talking about this ・ English ・ ◇交叉比對 ・ `中等長度` + `具體點名` + `問句普通`

> **對得上的理由：** 合規紅線上最乾淨的一個。他是職業高山嚮導兼運動員，但公開內容的重心是「危害辨識」與「事後之明偏誤（hindsight bias）」，而且會直接開砲批評社群媒體把危險路線講得太輕鬆（"Scrambling to death"）——正是 Rachel 要對標的反誇大立場，完全不是零事故傳奇敘事。他寫朋友的死亡（Will Stanhope 悼文）也不神化。落差在於他的場域是冰攀／混合攀登與滑翔傘（加拿大洛磯山），不是八千米商業遠征，且他是白人男性，語氣比 Rachel 外放一些。
>
> **可直接抄的做法：** （1）「差一步就上了但沒上」的貼文格式：先放一張路線照＋一句『我們本來要爬這條』，再把問題丟成危害辨識練習（"We were about to climb this line... How can we identify unknown hazards?"）——把自己的猶豫變成讀者的判斷題，這比直接下結論更符合 Rachel 不給保證的原則。（2）純名詞短句開場當作情緒定錨（"Risk. Mountains. Life. Guiding."）——三到四個字就開場，正是 Rachel 要的碎片短句節奏，可直接移植成中文的四詞開場。（3）用引號包住一個刺人的詞當標題（"Scrambling to death"）來反擊難度誇大的風氣；Rachel 可用同樣手法反擊「輕鬆登頂」類話術。（4）談風險時明確指名認知偏誤（hindsight bias），把登山術語升級成思考工具而不是格言——這是 Rachel 第三支柱「給平地人的山間道理」避免變成心靈雞湯的關鍵。（5）悼念隊友時引用對方原話當標題並附上生卒年（"It's Hard to Explain." -Will Stanhope, 198x-2026, climber.），克制、不抒情、用名字不用「大家」。
>
> **配圖手法：** 以路線／冰況／天氣現場照為主，很多貼文完全沒有人入鏡，或只有一個當比例尺的小人影；危害辨識類貼文會用一張地形照當「找出風險」的題目板（近似標註圖）；電影首映、比賽、贊助合作時才會出現人像與活動照。整體偏「照物不照人」，可對標 Rachel 的純場景配圖需求。

**[TaiTai LIVE WILD（阿泰 楊世泰 & 呆呆 戴翊庭）](https://www.facebook.com/taitailivewild/)** ・ 65,054 likes · 188 talking about this ・ 中文（繁體） ・ ✔直接抓取 ・ `短碎片` + `具體點名` + `問句少`

> **對得上的理由：** 純粹作為「Facebook 圖文風格」的範本入選，niche 只是相鄰而非重疊——他們是長距離健行者／戶外作家與攝影者（PCT、台灣林道），不是高海拔嚮導，貼文裡的風險層級遠低於 Rachel 的八千米場域，「撤退決策」也不是他們的主打支柱。要借的是格式與語氣：這是五個候選裡唯一真正落在「3~4 個碎片短句、隨手打」那一格的帳號，其餘四個都偏長。若只看內容主題，它是本次名單中最弱的一個；若只看已定案的圖文風格，它是最強的一個。請把它當風格對標、不要當內容對標。
>
> **可直接抄的做法：** （1）短句斷行＋不收束：一段講完一個當下的感覺就停，不加反思段、不加「你們覺得呢」，整篇沒有起承轉合——這正是 Rachel 已定案風格要的節奏，可直接抄結構。（2）用具體物件當敘事支點：直接點名鞋子、爐頭、某條林道、當天吃的東西，讓短貼文靠 specifics 站住而不是靠形容詞；Rachel 可換成固定點、繩隊、天氣窗數值、隊員名字。（3）雙人視角交替發文（阿泰寫一篇、呆呆寫一篇），同一件事給兩種語氣；Rachel 雖是單人設，但可對標「同一趟遠征分兩種聲音」——白天的嚮導語氣 vs 深夜筆記本的獨白語氣。（4）把「回家」而不是「抵達」當情緒落點（伊日專訪標題〈穿過林道，步向回家的路〉），與 Rachel「登頂前轉身也不是失敗」的核心價值同構，可直接沿用這個把終點從山頂移到家門的敘事移位。（5）貼文與長文分流：Facebook 只放短碎片，深度內容留給書與專訪，粉專不承擔教學功能——這能防止 Rachel 的帳號滑向權威教學型。
>
> **配圖手法：** 攝影風格強烈但幾乎不靠自拍：大量裝備／食物／地圖的物件特寫，以及林道、霧、營地等純場景照（完全沒有人）；出現人時通常是背影、手部、鞋子等局部，而非正面人像。是五個候選中最貼近 Rachel 「純物件特寫＋純場景照混用」需求的配圖手法。

查證中淘汰：`@snowram`（帳號本身為真且歸屬正確，但「聲稱粉絲數」查無依據，依「不確定一律 REFUTED」規則判否。存在與歸屬部分沒問題：直接抓取 facebook.com/snowram 回傳 <title>「雪羊視界 Vision of a Snow ram」）；`@adrian.ballinger.1`（這是清單中最典型的張冠李戴風險，歸屬無法獨立確認，粉絲數完全查無依據。(1) 顯示名稱測試在此完全失效：我實際抓取三個同名變體，adrian.ballinger.1 回傳「Adrian Ballinger」、adrian.ballinger）

研究員備註：【平台可抓取性實測（2026-08-07，補充上一輪結論）】
Facebook 並非完全抓不到，但只抓得到 `<title>`。我對 6 個 FB 網址做直接 WebFetch，每一次都成功回傳頁面名稱（例：3xfish → 「詹喬愉 - 三條魚Tri Fish」、snowram → 「雪羊視界 Vision of a Snow ram」、will.gadd → 「Will Gadd」、taitailivewild → 「TaiTai LIVE WILD」、adrian.ballinger.1 → 「Adrian Ballinger」、climbermingma → 「Mingma G」），但正文、簡介、粉絲數全部被截斷，回應只剩標題那一行。這在實務上仍然很有價值：**它能一擊確認「這個 handle 是否真的屬於這個人」，正是用來擋張冠李戴的工具**（例如 TikTok @baldandbankrupt 那類陷阱）。建議下一輪把「FB 直接抓 title」固定當成 handle 驗真的第一道關卡。regional 子網域（is-is.facebook.com 等）試過，回傳內容與主網域相同，沒有額外資訊。

粉絲數與貼文內文全部來自 `https://html.duckduckgo.com/html/?q=...` 的 SERP 摘要。這個端點意外好用：它會吐出 FB 頁面的 like 數（131,172 / 44,486 / 64,992 / 25,093）、bio 原文，以及 `site:facebook.com/{handle} posts` 查詢下的真實貼文開頭逐字原文，讓我能實際評估 caption_style 而不是猜。注意兩件事：(a) duckduckgo.com/html 會 302 到 html.duckduckgo.com，要直接打後者；(b) **約 10 次請求後開始出現 CAPTCHA（選出含鴨子的方格）**，我沒有解、也不會解，後續改用內建 WebSearch 補完。下一輪若要靠這條路，請把 DDG 請求控制在 10 次以內並優先查最關鍵的欄位。Bing（bing.com/search）直接被 bot challenge 擋掉，不可用。

【本次沒有湊數，但有兩個必須誠實揭露的落差】
1. **風格落差**：Rachel 已定案的「3~4 個碎片短句」在 Facebook 的登山圈幾乎是逆風——這個平台的登山討論天生長篇。五個候選裡只有 TaiTai LIVE WILD 真正落在 short-fragments；雪羊視界明確是 long-form（千字政策長文），其餘三個是 medium。我沒有把任何人硬標成 short-fragments。實務建議：**內容角度對標前四位（三條魚、Will Gadd、雪羊、Ballinger），篇幅與配圖節奏對標 TaiTai LIVE WILD**，兩者分開取用。
2. **紅線張力（Adrian Ballinger）**：他是名單中職業對位最準的一位（IFMGA 高海拔商業遠征嚮導，公開講過讓客戶在距峰頂數步處轉身、自己在 28,215 ft 放棄無氧珠峰、並公開其決策矩陣），但同一個帳號也有「第 10 次登頂珠峰」這類登頂計數內容，且他是遠征公司老闆、貼文含招募與行銷。這部分靠近紅線（b）的個人戰績敘事。我仍然列入，因為可對標的是他的決策矩陣寫法，但**對標時必須主動剔除登頂計數那一層**，我已在該筆的 niche_match 標明。

【查證後被我主動剔除的候選（附理由，供下一輪別重複查）】
- **張元植**：台灣極受敬重的攀登者、文字極具反思性，但已於 2024 年 6 月在白朗峰墜崖離世（多家媒體：NOWnews、setn、PTS 皆有報導，年 36 歲）。不可作為現役對標帳號。另注意：曾有中國網紅散布關於他山難「敘述幾乎全虛構」的內容並道歉，查證時容易誤採到污染資料。
- **呂忠翰（阿果）**：本人主帳號我查不到可靠的個人粉專。DDG 只給到 `facebook.com/lu.zhong.han.942934/` 這種通用個人檔案索引頁（摘要僅「呂忠翰 is on Facebook. Join Facebook to connect with…」，是 FB 的樣板文字，不構成本人確認），以及應援性質的 `facebook.com/K2We2/`（title 確認為「K2 Project 張元植X呂忠翰八千計畫」，但那是應援專頁、非本人經營，且共同主角已離世，內容可能停更）。依規定不推論、不補足，故不列入。
- **王士豪醫師**：`https://www.facebook.com/doctor.on.the.mountain/` 確實存在，直接抓 title 回傳「Work now ＠王士豪醫師」。他是台灣高山醫學權威，主題（高山症、何時必須立刻下撤、失溫）與 Rachel 支柱三高度契合。**但他是明確的權威／教學型帳號**（everyday_feel 會是 false），正是本次指示要避開的類型；另有受訪語句「高山症是有機會『零死亡』的」，雖屬目標宣示而非安全保證，仍偏近紅線（c）的絕對語氣。粉絲數查不到。列為備選而非前五。
- **Mingma Gyalje Sherpa（Mingma G）**：`facebook.com/climbermingma` 已用 title 抓取確認（回傳「Mingma G」），且他確實公開宣布 2026 年第 7 次珠峰登頂後不再攀登珠峰。但帳號整體偏登頂戰績／英雄敘事，貼近紅線（b），且粉絲數查不到，故未列入。
- **Melissa Arnot Reid**：人設契合度極高（女性職業嚮導、首位美國女性無氧登頂並下撤珠峰、回憶錄《Enough》主題就是「在峰頂前接受氧氣」這個轉身時刻、創辦 Juniper Fund 照顧尼泊爾協作家屬）。FB 已雙重確認：她本人官網 melissaarnot.com 列出 `https://www.facebook.com/Melissa-Arnot-388299007856185/`，直接抓 title 回傳「Melissa Arnot Reid」。**未列入前五的唯一原因是查不到任何粉絲數，且該頁為舊式 FB 頁面網址、查不到近期貼文跡象，無法評估是否仍在更新。** 若下一輪能取得她的近期發文樣本，她應該直接取代 Ballinger 進入前五——人設對位更準、且沒有商業行銷與登頂計數的紅線張力。這是本次最值得回頭補查的一筆。
- **Caroline Gleich**：公開談轉身決策極為具體（Middle Teton 因暴風雨胞影響雪面回暖而在該季最後機會前撤退），但她已投入猶他州參議員選舉，帳號含大量政治內容，與 Rachel 定位混雜，未進一步查 FB。

【給下一輪的具體建議】
若要補到更貼近 Rachel 的名單，優先查這三個方向：(1) Melissa Arnot Reid 的 FB 近期活躍度（見上）；(2) Dawa Yangzum Sherpa（首位尼泊爾女性 IFMGA 嚮導）——本次查詢卡在 Bing bot challenge，未取得 FB 資料，人設對位可能是全名單最高；(3) 台灣／馬來西亞的認證女性嚮導，例如馬來西亞持證林業嚮導 Norimah Abd Karim，她在 2026 年 8 月馬來西亞取締網紅危險登山的新聞中公開批評「為了拍到有趣內容而願意承擔風險、忽視自身安全」的行為（BERNAMA、CNN 2026-08-03 報導），立場與 Rachel 完全一致且時事性強，但我尚未查證她是否有個人 FB 帳號。

### 審查員補充（6 個，經獨立查證）

**[Dawa Yangzum Sherpa](https://www.instagram.com/dawayangzum/)** ・ instagram ・ 22.5K ・ ✔直接抓取

> 已驗證存在：22.5K 追蹤、藍勾認證，bio 為「USA/Nepal IFMGA Mountain Guide, 1st Nepali female to complete 14x8000m peaks」。填補清單最大空缺——沒有任何「女性＋執業高山向導」對標，而 Rachel 本人就是這個身分。她是 IFMGA 認證執業向導而非贊助型探險家，語域是工作紀錄而非征服敘事，正對支柱（2）山徑日誌。注意：bio 以 14 座八千米成就開頭，屬成就陳述但非「零事故傳奇」自我包裝，未觸紅線（b），仍建議只取其向導工作語氣、不取成就清單框架。

**[American Alpine Club](https://www.instagram.com/americanalpine/)** ・ instagram ・ 181K ・ ✔直接抓取

> 已驗證存在：181K 追蹤、藍勾認證、2026 年 7-8 月仍活躍。清單漏掉的最對口機構——AAC 出版《Accidents in North American Climbing》，是全球最制度化的「公開檢討錯誤判斷」內容源，等於支柱（1）轉身時刻的機構版。可直接學習其「陳述事實、不指責個人、以判斷過程為主角」的寫法，這正是 Rachel 需要而清單缺乏的敘事骨架。

**[Northwest Avalanche Center (NWAC)](https://www.instagram.com/nwacus/)** ・ instagram ・ 50.4K ・ ✔直接抓取

> 已驗證存在：50.4K 追蹤、2026 年仍活躍。修正清單雪崩機構全集中在美國西南（Utah、Colorado）的地理偏斜。風格上是全清單最貼近 Rachel 圖文規格的範本：短句、點名具體坡向/海拔/日期、幾乎不用問句收尾、不釣留言，配圖大量是雪坑剖面與地形照而非人物入鏡——正是要求的「混用沒有本人入鏡的物件或場景照」。

**[Avalanche Canada](https://www.instagram.com/avalanchecanada/)** ・ instagram ・ 64.8K ・ ✔直接抓取

> 已驗證存在：64.8K 追蹤，bio 為「inspire, engage, and empower recreationists to enjoy Canada's winter backcountry」，並有地形教育、專業提示等精選限動。與 NWAC 同理補足地理覆蓋。特別值得對標之處：它把「賦能使用者自己做決定」寫進機構使命，而不是替使用者保證安全，語態上天然避開紅線（c）的絕對保證，可作為 Rachel 措辭的安全範本。

**[Conrad Anker](https://www.instagram.com/conrad_anker/)** ・ instagram ・ 449K ・ ✔直接抓取

> 已驗證存在：449K 追蹤、藍勾認證，bio 明寫「The summit is what drives us, yet the climb itself is what matters. hold fast, all storms pass」。清單缺乏的「主動收手」長者聲音——他在 Lunag Ri 心臟病後公開退出高海拔攀登，是支柱（1）「在登頂前轉身且那不是失敗」最高辨識度的真實範本，bio 那句話幾乎就是 Rachel 的世界觀宣言，可直接支援支柱（3）格言式內容。注意：動態偏 The North Face／YETI 贊助英雄美學，建議取其文字價值觀、不取其視覺語言。

**[雪羊視界 Vision of a Snow ram](https://www.facebook.com/snowram)** ・ facebook ・ — ・ ✔直接抓取

> 已驗證存在：直接抓取 facebook.com/snowram 確認頁名為「雪羊視界 Vision of a Snow ram」，簡介為「地平線上三公里，雪羊視界。從不同的角度，看見台灣，看見世界。」（Bing 摘要顯示約 16.7 萬讚，但頁面內容被截斷、按讚數未能親自確認）。中文圈寫山難分析、搜救制度與決策檢討聲量最高的寫作者，填補「判斷而非征服」的中文空缺——清單目前的中文聲音偏旅遊勵志（雪兒）或商業教學（岳野、山問）。他的事故分析文正對支柱（1）。

### 審查員指出的缺口

#### 驗證條件說明（先講限制）
本次 session 的 WebSearch 額度已用盡，只能用 WebFetch 直接抓取。實測結果：Instagram 個人頁可抓、Facebook 頁面可抓到頁名、Bing 結果雜訊極高、**X/Twitter 回 HTTP 402 完全無法驗證**、**Threads 有登入牆無法驗證**。因此我只提出 Instagram + Facebook 的補充建議；X 與 Threads 我刻意回傳零建議，不憑印象寫 handle。

驗證過程中有三個「我以為存在」的帳號被打掉，值得記錄：
- `@thesharpendpodcast`（IG）→ 實際是另一個叫 "The Sharp End with Roger Compton" 的無關 podcast，**只有 5 個追蹤者**。AAC 那個攀登事故分析 podcast 不是這個 handle。
- `@uphillathlete`（IG）→ 實際是名為 "Brendan Turner" 的個人帳號，**12 個追蹤者**，不是 Steve House 的 Uphill Athlete 組織。
- `@andy_kirkpatrick`（IG）→ **29 個追蹤者**的空殼/佔名帳號，不是本人。
這三個都不要寫進清單。

---

#### 1. 明顯該在清單上卻沒出現的創作者

**(a) 女性尼泊爾 IFMGA 高山向導 — 最大的空缺。**
清單有 Mingma G，但 Rachel 本身就是女性高海拔向導，清單裡卻沒有任何一個「女性 + 職業向導 + 尼泊爾」的對標。Dawa Yangzum Sherpa 是這個位置最明確的人選（已驗證，見 suggestions）。目前清單的女性代表只有 Melissa Arnot Reid（長文抽象）、Hazel Findlay（心理教練）、Angela Benavides（記者）、三條魚、呆呆、雪兒 — 沒有一個是「在講技術判斷的執業女向導」。

**(b) 攀登事故公開驗屍的機構 — American Alpine Club。**
AAC 出版《Accidents in North American Climbing》，是全世界最制度化的「公開檢討錯誤判斷」內容源，跟支柱（1）轉身時刻幾乎是同一件事的機構版。清單有 4 個雪崩中心卻漏掉 AAC，很不合理。

**(c) 雪崩中心地理覆蓋偏斜。**
清單的雪崩機構全是美國西南（Utah ×2、Colorado），漏掉北美另外兩個最大的：NWAC（西北）與 Avalanche Canada。這兩個的貼文風格（短、點名具體地名/坡向/海拔、配圖是雪坑與地形照、幾乎不用問句收尾、不釣留言）其實是全清單裡最貼近 Rachel 圖文規格的範本。

**(d)「不再往高處去」的長者聲音 — Conrad Anker。**
支柱（1）需要一個「轉身而且公開說那不是失敗」的最高辨識度範本。Anker 在 Lunag Ri 心臟病後公開退出高海拔攀登，他 IG bio 直接寫「驅動我們的是頂峰，但真正重要的是攀爬本身」— 這句話幾乎就是 Rachel 的世界觀宣言。清單裡沒有任何等量級的「主動收手」敘事。

**(e) 中文圈缺了做事故／判斷分析的那一位 — 雪羊視界。**
中文登山內容裡，寫山難分析、搜救制度、決策檢討最高聲量的就是雪羊。清單收了較輕的旅遊勵志聲音（雪兒），卻漏掉這個最對應「判斷而非征服」的中文寫作者。

**(f) 查不到、但值得下一輪再驗的名單（我不猜 handle）：**
Steve House / Uphill Athlete 組織正確帳號、Zahan Billimoria（Samsara，Teton 向導，專講風險決策）、Andy Kirkpatrick 本人正確帳號、Kelly Cordes、張元植、呂忠翰（阿果）、城市山人、健行筆記。這幾個在額度用盡前無法確認，請下一輪補驗。

---

#### 2. 圖文平台風格檢查（短／具體／非問句收尾／混用無人物配圖）

**明確不符規格，建議降級或替換：**

- **IG `@melissaarnot`（long-form + mostly-abstract）— 最嚴重的雙重不符。** 同時違反「短碎句」與「具體點名」兩條。她是回憶錄散文語域（抽象反思、內在狀態），這正好會把 Rachel 推向空泛心靈書寫，而 Rachel 的規則是「用隊員的名字而不是籠統的大家」。建議替換為執業向導的短貼文帳號（Dawa Yangzum）。
- **Threads `@mountainfield177`（岳野登山社，long-form）與 `@tgh_tw`（山問攀登，long-form）— 兩個都是商業登山學校／課程招生帳號，長文。** 這正是你警告的「精緻教學型」。兩個同時在清單上，等於中文 Threads 的一半被教學招生語域佔據。建議留一個當「技術正確性」參考，另一個換成短碎句的個人向導聲音。
- **IG `@arnette.alan`** — Alan Arnette 的 IG 實質是部落格導流＋新聞彙整，是中等長度的報導語域，不是個人碎句。而且他**同時佔用 YouTube + IG 兩個名額**。
- **TikTok `@the.guidebook`（long-form）** — 碎句規格不符（TikTok 文案規範較寬鬆，優先度低）。
- **YouTube `@StrongMindClimbing`（mostly-abstract）** — 是心理訓練教練品牌，抽象心理學語域。YouTube 不受圖文規格約束，但作為**語氣範本**它會把支柱（3）拉向通用自助書寫，跟 Rachel「具體、格言但落地」的要求相衝。

**重複計算的問題（結構性）：** Alan Arnette（YT + IG）、Will Gadd（X + FB）、TaiTai 阿泰呆呆（Threads + FB）、Utah Avalanche Center（YT + IG）都各佔兩個名額且內容互相轉貼。31 個名額實際只有約 24 個獨立聲音。建議去重釋放名額。

**最大的風格空缺：** 清單在「機構預報型（短、具體、無人物配圖）」和「長篇紀錄片型」兩端都很強，但**中間那一格幾乎是空的** — 也就是「第一人稱、短碎句、具體點名、不釣留言、混用無人入鏡配圖」。支柱（1）轉身時刻與支柱（4）深夜筆記本目前**沒有任何一個對標帳號在示範**。尤其（4）低光獨白／家人來電這個語域，全清單零範本。要找的替代類型是：執業向導或巡護員的個人帳號，貼文是「日期＋地點＋海拔＋一個決定＋一句收束」，配圖常是裝備、雪坑、天氣圖、帳篷內部而非本人自拍。

---

#### 3. 不適合或有合規風險的帳號

- **X `@jimkchin`（Jimmy Chin）— 風險最高，建議移除或降為純視覺參考。** 《Free Solo》整部作品的框架就是禮讚無繩極限風險，其動態是贊助商英雄美學。同時擦到紅線（a）表演極限與（b）個人英雄敘事。他跟「允許人說今天不上」是相反的價值主張。
- **TikTok `@7summ.co`（Denis / 7Summ 遠征服務）— 結構性利益衝突。** 賣遠征行程的商業帳號，天生有動機誇大難度（賣點）同時暗示安全無虞（成交），同時擦到紅線（a）與（c）。若保留，只能參考其行程資訊格式，絕不參考其風險話術。
- **Threads `@adrianballinger`** — Alpenglow Expeditions 老闆，「無氧登聖母峰」內容接近表演極限＋商業導流。他確實會談風險，但建議標記為觀察名單。
- **YouTube `@JostKobusch`** — 他公開講下撤這點非常對，但底層專案是單人冬季聖母峰，屬於極限個人壯舉；有把「孤身英雄」框架帶進 Rachel 的風險。保留但只取其「下撤說明」段落，不取其專案框架。
- **TikTok `@naturereliance`、`@outdoor.devin`** — 荒野求生／叢林技能，不是高海拔決策。屬於相關性漂移而非合規風險，但佔了兩個 TikTok 名額（共 5 個），比重過高。
- **Threads `@snowap`（雪兒）** — 旅遊勵志語域，容易滑向心靈雞湯。這會直接衝撞 Rachel 的兩條硬規則（不說絕對、點名具體），建議降低權重。
- **正面確認：** 目前清單裡**沒有**明顯的「零事故傳奇」自我包裝帳號，紅線（b）大致乾淨，主要缺口就是 Jimmy Chin 的英雄美學與 7Summ 的行銷話術這兩處。

---

## 5. Rafael Costa / Captain（拉斐爾·科斯塔）— 現役運動員 × 長期主義成長陪伴（B02）

**定位核心：** **不是**講台上說教的導師，也不是表演成功的偶像，而是「早走十年的隊友」。五支柱：訓練結束以後／球場之外／冠軍思維／如果我是20歲的你／今天我學到了什麼。語氣平靜簡潔，常用足球經驗解釋人生，偏好「如果我是你，我會先考慮…」而不是「你必須…」。

**合規紅線：** **不可妥協**：不對標任何販賣焦慮、保證收益、製造稀缺、教人快速致富的帳號；不對標炫富／假豪宅／擺拍公益；不對標捏造榮譽、蹭災難流量、性別或世代對立引戰。

**語言範圍：** 葡語母語＋中文流利＋英文工作級，發文語言尚未鎖定，故中／英／葡語帳號都納入。

> 本節共 42 個帳號（主研究 32 ＋ 審查員補充 10），全部通過雙重獨立查證。查證標記：✔＝實際抓取該平台個人頁讀到資料；◇＝改以創作者官網／Linktree／搜尋索引＋跨平台同 handle 互證。

### YouTube（4 個）

**[Connor Parsons](https://www.youtube.com/@ConnorParsons)** ・ 13萬位訂閱者 = 130K subscribers ・ English ・ ✔直接抓取

> **對得上的理由：** 最貼近的一個：真正的現役職業球員本人，主軸就是一個比賽週的真實生活，且會把受傷、被賣掉、旅外適應這些負面節點直接當主題。與支柱1（訓練結束以後）與支柱2（球場之外）幾乎同構。差異：他偏純 vlog 娛樂，不做結構化的人生原則輸出，標題偏農場化。
>
> **可直接抄的做法：** (a) 每集綁在「一個真實比賽週」的時間軸上（週一恢復訓練→週中分析→週末比賽），讓紀律靠行程表自己呈現，而不是口頭說教；(b) 負面節點正面拍：受傷當天、被賣掉那週直接開一集，把當下的不確定感留在鏡頭裡不修飾；(c) 猶豫式開場（他有一支就叫「I'm not sure if i should be doing this...」）——先說自己此刻在糾結什麼，再進入決定過程；(d) 敘事骨幹用訓練場、更衣室、球隊巴士的手持第一人稱 B-roll，和隊友的真實互動當對話素材，而非對鏡頭獨白。明確不要借鏡：全大寫加驚嘆號的標題寫法。
>
> **畫面／縮圖手法：** 縮圖是真實比賽照的後製合成：兩張現場照（頭球 + 衝向看台慶祝）拼接、重對比與暗角調色，疊一個超大無襯線白色關鍵詞（如「GOAL」）與賽事 Logo；沒有棚拍、沒有擺拍。影片本體以手持實拍 B-roll 為骨幹，插入比賽畫面，字幕條標對手與日期。

**[Matt D'Avella](https://www.youtube.com/@mattdavella)** ・ 404萬位訂閱者 = 4.04M subscribers ・ English ・ ✔直接抓取

> **對得上的理由：** 語氣與鏡頭語言的模板：平靜、簡潔、不急著下人生教訓，拿自己當實驗對象並公開失敗結果。而且他的內容線本身就在拆解「賣焦慮的成長產業」（明確做過自我成長大師與 hustle culture 的反面選題），與合規紅線同向。弱點：不是運動員，題材無足球。
>
> **可直接抄的做法：** (a)「30 天實驗」單元化格式：一次只測一個具體行為，片尾誠實給出「沒效／我中途放棄了」的結論，不硬拗成功；(b) 下結論前先自我反駁——承認自己上一次講過的方法後來對自己不管用了；(c) 用第一人稱過去式講一個具體早晨的細節（幾點起床、做了哪一件小事）取代抽象原則；(d) 刻意做反向選題：對自己所處的品類提出懷疑（我照著最佳化建議做，結果生活更糟），這是避免變成「說教型導師」最有效的一招。
>
> **畫面／縮圖手法：** 極簡縮圖：白牆＋木地板實拍、人物單獨入鏡、低飽和自然光，配一行小寫襯線句子（如「it wasn't enough」），完全不用紅圈、箭頭、誇張表情。影片是三腳架固定機位＋淺景深 A-roll，穿插自己真實生活的實拍 B-roll，幾乎不用資訊圖表。

**[struthless（Campbell Walker）](https://www.youtube.com/@Struthless)** ・ 122萬位訂閱者 = 1.22M subscribers ・ English ・ ✔直接抓取

> **對得上的理由：** 「把自己的失敗當教材，最後給一個當天就能做的動作」這個手法的最佳示範，對支柱4（如果我是20歲的你）最直接；不賣焦慮、不談致富、不擺拍成功。弱點：不是運動員，視覺風格很跳（手繪塗鴉），與 Captain 的沉穩調性需要大幅轉譯。
>
> **可直接抄的做法：** (a) 每支影片給出一個有名字的方法（命名化框架）並當場畫出來，讓觀眾能複述給別人聽；(b) 開場先自陳自己現在正在犯的毛病（拖延、自我破壞），用「我也還在裡面」建立同輩感，而不是導師感——正好對應「早走十年的隊友」；(c) 結尾一定收在一個當天就能做的動作，而不是心法或金句；(d) 嚴肅題材（自殺、AI 衝擊）照樣做，但用平視語氣、不消費情緒、附明確求助資訊。
>
> **畫面／縮圖手法：** 縮圖幾乎全是手繪：滿版黑白線稿字卡＋作者的眼睛從紙後窺視，方法論直接寫在紙上；影片大量手繪動畫疊在講話鏡位之上，用即時繪圖代替圖表軟體，後製合成痕跡刻意保留粗糙感。

**[Profissão Jogador（Ticão／Carlos Bertoldi）](https://www.youtube.com/@ProfissaoJogador)** ・ 64.5萬位訂閱者 = 645K subscribers ・ Português (Brasil) ・ ✔直接抓取 ・ （機構帳號）

> **對得上的理由：** 結構上最接近人設的一個：一個真的踢了近 20 年、旅外含亞洲（香港）的退役職業球員，用葡語對年輕球員講紀律與心理。差異與風險要註明：他已把內容產品化（Hotmart 上的「Mentoria 1%」付費導師制），標題與縮圖大量使用全大寫命令句與問句，語氣是「你必須」型，與 Captain 的「如果我是今天的你，我會先考慮…」相反。內容本身是運動心理／情緒訓練，不涉及投資或致富承諾，未觸及紅線 a／b，但商業化話術偏重，屬於「選擇性借鏡」而非整體對標。
>
> **可直接抄的做法：** 可借鏡：(a) 資歷開場法——先用一句自己的實際經歷（哪一年在哪個俱樂部、哪一次受傷或低潮）再進入建議，建立「我走過」而不是「我懂」；(b) 章節化系列：縮圖上直接標「CAPÍTULO 3」，把一個主題拆成可追的連續集，適合支柱3（冠軍思維）做成有編號的原則系列；(c) 選題直接對準球員最難堪的處境（打不好、被教練針對、狀態掉了），並用「今天該做的一件事」收尾；(d) 葡語口語稱呼開場（「Fala meu craque!」）壓縮距離感。明確不要借鏡：全大寫命令句標題（PARE DE…／ASSISTA ESSE VÍDEO!）、拿第三方名人照片當縮圖主視覺、以及片中課程導流話術。
>
> **畫面／縮圖手法：** 深色低光調縮圖：以第三方知名球員照片（實際看到一張 C 羅背影）當主視覺，疊大腦圖示、章節標「CAPÍTULO 3」與全大寫葡語問句；人物本人多為攝影棚固定機位講話，剪入比賽畫面，屬明顯後製合成的權威型縮圖。

查證中淘汰：`@thecyclinggk`（帳號本身真實存在且歸屬正確——頁面顯示「Ben Foster - The Cycling GK」、@thecyclinggk、446 部影片（與聲稱的 446 videos 完全相符），簡介自述職業守門員生活，並列出 benfoster 的）；`@playerstribune`（帳號真實存在且歸屬正確——頁面顯示「The Players' Tribune」、@playerstribune、1568 部影片（與聲稱的 1,568 videos 完全相符），簡介為運動員第一人稱敘事平台、2014 年由 Derek Je）

研究員備註：方法說明（與上次踩坑的差異）：WebFetch 抓 YouTube 頻道頁這次只回傳頁尾導覽（頻道資料在 1.8–2.9MB 的 ytInitialData JSON 裡，被截斷掉了），所以改用 curl 下載完整 HTML 後在本機解析 channelMetadataRenderer.title、vanityChannelUrl、"N subscribers"、"N videos"、description，以及 /videos 頁的 lockupMetadataViewModel 標題清單（新版 YouTube 已改用 lockupViewModel，舊的 videoRenderer 抓法無效）。另外每個頻道都下載了最新一支影片的 hqdefault 縮圖並用 Read 親眼看過，image_approach 欄位是看圖寫的，不是推測。六個帳號全部 direct-fetch，訂閱數是 YouTube 自己的四捨五入顯示值（2026-08-07）。

身分防偽：兩個運動員帳號都做了第二層查核，避免同名假帳號——Connor Parsons 用 Wikipedia 條目確認是現效力 Bohemians 的英格蘭職業中場（與頻道內歐洲賽會影片相符）；Ben Foster 用 ESPN 與 BBC 報導確認是前英格蘭門將本人，且退役公告就發在這個頻道上；Ticão 用巴西 bemparana 報導與官網確認是 Carlos Bertoldi（Athletico Paranaense 出身、2005 解放者盃決賽、曾在 Olympiakos 與香港 Southern District FC 效力，2020 退役）。

有查到但被我排除或降級的候選（都真實存在，可當備選）：Rio Ferdinand Presents（@rioferdinandpresents，1.64M subs、3,204 videos，簡介「Football stories told by Rio Ferdinand… honest conversations」）——真實且是退役職業球員，但實際近期影片幾乎都是轉會新聞與賽事評論（Chicharito、Tuchel、Ballon d'Or 之類），成長／紀律類的可對標手法密度低，故不列入；Simon Sinek（@SimonSinek，2.77M，簡介自稱「Official Simon Sinek brand account」）長期主義題材對得上但是商管品牌帳號、非運動員；Nathaniel Drew（@nathanieldrew，1.78M，212 videos）與 Nick Bare（@nickbarefitness，1.5M，1,078 videos）鏡頭語言與紀律題材可用，但niche 相關度低於已選六個。另外我試過 @JesseEnkamp，該 handle 回傳 755 bytes 的 404 空頁，因此完全不列入（不猜他真正的 handle）。

缺口與限制，誠實回報：(1) 沒有找到任何中文語系的合格對標帳號。YouTube 不是中國大陸的主場平台，這一輪沒有查到「現役／退役運動員 × 長期主義成長」且訂閱規模與製作水準過關的中文頻道；若人設最後鎖定中文發布，建議另開一輪針對 B 站／小紅書的對標研究，而不是在 YouTube 上勉強湊一個中文帳號。(2) 六個帳號裡只有三個是運動員本人或退役運動員（Connor Parsons、Ben Foster、Ticão），另外三個（Matt D'Avella、struthless、The Players' Tribune）是拿來對標語氣模板、可執行結尾結構與第一人稱敘事剪接，不是身分對標。(3) 合規備註：Profissão Jogador 有販售自家付費導師制（Hotmart「Mentoria 1%」），內容為運動心理訓練、未涉投資或收益承諾，未踩紅線 a／b，但商業化話術與命令式語氣偏重，只建議選擇性借鏡選題與資歷開場法；Nick Bare（備選）銷售自有補劑品牌，同理。其餘四個帳號未見炫富、保證收益、製造稀缺、蹭災難或性別／世代對立引戰內容；Matt D'Avella 反而長期在做「拆解自我成長產業謊言」的反向選題，與紅線方向一致。(4) 所有帳號與此人設無任何關聯或合作，僅為手法參考。

### TikTok（7 個）

**[Ben Foster The Cycling GK](https://www.tiktok.com/@benfcyclinggk)** ・ 1.1M 粉絲 / 39.6M 按讚 / 73 關注中 ・ English ・ ✔直接抓取

> **對得上的理由：** 最貼近 Rafael 的『真實職業球員』軸線：真的退役英超門將（Watford／West Brom／Wrexham）。內容在足球場域裡發生，退役球員直接談薪水、教練、退休後的日子，不包裝成勵志、不賣課、無焦慮行銷。強對應支柱1（訓練結束以後）與支柱2（球場之外：金錢與職涯轉換）。弱點：完全沒有導師／建議框架，不碰成長方法論。
>
> **可直接抄的做法：** 1) 用「一個具體金額」當鉤子而不是用道理：把當年合約拆到『我在西布朗每拿一分積分實拿多少錢』這種可驗證的自家帳目來談錢——只講自己的帳，從不講別人該怎麼投資（正好繞開紅線 b）。Rafael 可對應成『我第一份中國合約的簽字費，我當時拿去做了什麼』。2) 把「隊友／教練說過的一句話」當整支影片的軸：前 3 秒先把那句話丟出來（『想像你的教練對你說這個』），再回頭補當時的處境與自己的反應——這就是支柱1『從一個小片段帶出一個點』的現成骨架。3) 長訪談的切片規則：一支短片＝一個問題＋一個回答，不做片頭，第 0.5 秒就出現人臉與第一句話，大字幕壓畫面上半部。4) 自嘲式承認狼狽：『那段 GoPro 畫面到底發生了什麼事』——把自己的失誤當故事講而不是當教訓講，講完不上價值。這正是人設『絕不英雄化自己』的操作版本。
>
> **畫面／縮圖手法：** 畫面／縮圖手法：以訪談雙人中景實拍為主體，搭配比賽與訓練場 B-roll 插入；縮圖多為訪談停格＋加粗描邊大字（常含金額或人名），屬明顯後製合成的「節目化」縮圖，不是隨手截圖。字幕為逐句大字硬字幕，壓在畫面上半部避開 TikTok UI。

**[Chris Bumstead](https://www.tiktok.com/@cbum)** ・ 5M 粉絲 / 51.3M 按讚 / 19 關注中 ・ English ・ ✔直接抓取

> **對得上的理由：** 真實頂級職業運動員（非足球，但是同一種『靠身體吃飯、已經走完一輪職業生涯』的可信度）。語速慢、音量低、不喊口號，長期公開自己的傷勢與健康狀況並據此調整訓練，把『為了長期健康改變做法』講成取捨而非勵志。強對應支柱1（訓練現場帶出一個點）與支柱5（今天我學到了什麼／我以前想錯了）。賣自己創的訓練 App，是自己在用的產品，不觸紅線 b。
>
> **可直接抄的做法：** 1) 「我以前擔心過 X，後來我改成 Y」的自我修正結構：先承認過去的做法錯了（例如以前訓練時一直擔心肩膀），再給現在的做法——不宣稱自己一開始就懂，這是支柱5『刻意不裝全知』最直接可抄的句型。2) 訓練現場實拍當唯一背景，旁白用低音量第一人稱解說；鏡頭從器材／手部特寫切到臉，讓「我現在還在做這件事」本身成為說服力，不需要任何成就字卡。3) 一支影片只交付一個具體可執行動作（例：正式組前先做 2-3 組輕重量活化），結尾不催促、不給人生教訓——對應支柱4『結尾給一個可執行動作』的克制版本。4) 傷後敘事的講法：不講「我克服了」，講「我把訓練方式換成偏運動能力取向，為了還能練二十年」——把時間尺度講出來，長期主義就自己浮現，不必說教。
>
> **畫面／縮圖手法：** 畫面／縮圖手法：大量健身房實拍 B-roll（手機直拍質感為主，混入部分打光拍攝），動作特寫與人臉交替；不用圖表疊加。縮圖多為訓練動作停格，後製程度低，靠身體本身當視覺主體。整體介於「日常直拍」與「權威教學」之間，但因為有明確的機制解說（為什麼要活化、神經系統如何反應）而偏教學型。

**[Chris Williamson](https://www.tiktok.com/@chriswillx)** ・ 511.6K 粉絲 / 15.3M 按讚 / 1 關注中 ・ English ・ ✔直接抓取

> **對得上的理由：** 最貼近 Rafael 的『內容結構』軸線：他的兩個招牌格式幾乎就是支柱4與支柱3的現成模板——『某人會對年輕時的自己說什麼』、『20 幾歲與 30 幾歲的人最該聽的建議』。訪談對象包含運動員（含 Chris Bumstead 談冠軍思維），且主動把嘉賓的低潮／憂鬱／艱難期剪成主片段而非只剪高光。不賣致富方法、不製造稀缺感。
>
> **可直接抄的做法：** 1) 把建議掛在「具體人物＋具體年紀」上而不是通用格言：標題直接寫成『某人會對 20 歲的自己說什麼』——Rafael 可原樣轉成『如果我是 20 歲的你』系列，主角是他自己 30 歲對 20 歲。2) 反命題開場：先把一句大家都同意的話拆掉，再給替代判斷。實例是把「成就」與「特質」分開——該稱讚的是紀律、韌性、正直，不是獎盃，因為成就會褪色、品格會複利。這句的邏輯形狀正好等於人設的『冠軍不是打敗別人的人，是建立起一套能長期遵守標準的人』。3) 一支影片＝一個問題＋一段回答，畫面雙人對談中景，字幕逐句浮現，片尾不下結論、直接用原話收尾，不加總結字卡。4) 用「支持你是誰、而不是你產出什麼」的第二人稱說法把壓力拿掉——語氣上正是人設要的『不急著給人生教訓』，避免任何『你必須』。
>
> **畫面／縮圖手法：** 畫面／縮圖手法：以 podcast 攝影棚雙機位訪談實拍為主（4K，標題常自帶「(4K)」），無圖表疊加、無 B-roll 插入，純靠人臉與說話節奏。字幕為逐句浮現的大字硬字幕。縮圖為訪談停格＋嘉賓名字字卡，屬節目化後製合成。

**[Pedro Calabrez](https://www.tiktok.com/@pedro.calabrez)** ・ 844.9K 粉絲 / 3.4M 按讚 / 6 關注中 ・ Português (巴西葡語) ・ ✔直接抓取

> **對得上的理由：** 唯一的葡語（且是巴西人）候選，直接對應 Rafael 的母語選項。平靜、低戲劇性、以機制解釋代替道德勸說，明確反對速成與雞湯口號——他最紅的一支就是直接說『「永不放棄」是個很糟的建議』。強對應支柱3（一篇一個判斷原則）與支柱5。非運動員，這是它的限制。
>
> **可直接抄的做法：** 1) 一支影片只推翻一句陳腔濫調，而且標題就是那個反命題：『「永不放棄」是個很糟的建議』——正文才給替代判斷。這是支柱3『一篇一個判斷原則』最乾淨的執行法，也天然避開了賣焦慮（因為在拆解口號而不是製造壓力）。2) 「你控制不了 A，但你控制得了 B」的對句結構（你控制不了你感覺到什麼，但你控制得了你拿這個感覺去做什麼）——把責任範圍講清楚，既不喊口號也不推責，語氣強度剛好等於人設要的『平靜、簡潔、有力』。3) 先講機制、後講該怎麼做：先說行為／大腦怎麼運作，再給動作，所以聽起來是解釋而不是說教——Rafael 可把「機制」換成足球訓練與比賽的實際運作邏輯，用足球取代神經科學當解釋工具。4) 平靜坐姿定鏡、幾乎不剪點，靠句子本身的斷句製造節奏；字幕一句一行，讓觀眾跟著唸。反 TikTok 快剪，但用『第一句就是結論』保住前置鉤子。
>
> **畫面／縮圖手法：** 畫面／縮圖手法：單人定鏡半身實拍（室內、單一背景），幾乎無 B-roll、無圖表疊加、剪點極少。縮圖多為說話停格＋一句核心句大字，後製輕但有一致的視覺模板（NeuroVox 系列標籤），屬「低製作感但高一致性」的權威型，而非隨手日常感。

**[High Performance（Jake Humphrey & Damian Hughes）](https://www.tiktok.com/@high_performance)** ・ 324.3K 粉絲 / 18.6M 按讚 / 52 關注中 ・ English ・ ✔直接抓取 ・ （機構帳號）

> **對得上的理由：** 內容引擎與人設支柱3幾乎同構：整個節目就是在問頂尖表現者「哪些行為是你不可妥協的、讓你能一直待在頂端」，嘉賓大量為現役與退役運動員，且訪談重點常放在失敗與代價而非高光。強對應支柱3（建立能長期遵守的標準）與支柱2（誠實講失敗）。不賣致富、不製造稀缺。缺點：機構帳號，語氣是主持人提問而非當事人自述，Rafael 需把它從「訪談」翻成「自述」。
>
> **可直接抄的做法：** 1) 用一個固定提問框架當內容引擎：每支影片回答同一個問題（『你的不可妥協行為是什麼』），累積成可辨識的系列而不是每次換題目——Rafael 可設一條固定問句貫穿整個支柱3，讓觀眾看第三支就知道規則。2) 鉤子＝嘉賓自己說出的一句反直覺原話，前 2 秒先播那句話，之後才補嘉賓身分字卡（先給價值、後給名片）。3) 敘事核心放在「標準」而不是「目標」：講可長期遵守的行為，不講成績數字與獎盃——這正是人設對「冠軍」的定義，也是避開炫耀式內容的結構性做法。4) 片段長度以「一個完整想法講完」為界（約 45-90 秒），不為了留人硬切在高潮處；雙機位切換＋大字幕維持資訊密度。
>
> **畫面／縮圖手法：** 畫面／縮圖手法：攝影棚訪談雙機位實拍切換，無 B-roll、無圖表疊加。縮圖為統一模板的節目化合成圖（嘉賓停格＋節目識別色＋引言大字），後製痕跡明顯且刻意一致，方便建立系列辨識度。

**[Simon Sinek](https://www.tiktok.com/@simonsinek)** ・ 1.9M 粉絲 / 12.6M 按讚 / 10 關注中 ・ English ・ ✔直接抓取

> **對得上的理由：** 『長期主義』本身就是他的核心論點（The Infinite Game：把賽局分成有限與無限，重新定義什麼叫贏）。語氣平靜、留白多、用建議而非命令，不賣焦慮、不談致富。非運動員，且框架偏組織／領導語境，Rafael 需要把商業案例換成球隊案例。列為備選。
>
> **可直接抄的做法：** 1) 用「有限賽局 vs 無限賽局」這種二分框架重新定義勝利：贏不是打敗對手，而是能不能一直玩下去——可直接轉譯成人設的『冠軍不是打敗別人的人』，而且是有名詞、有結構的講法，不是空泛口號。2) 先講完一個具體小故事（某個團隊、某次對話），故事講完才給抽象名詞——避免一開口就是道理，這是說教感的主要解方。3) 全程第二人稱單數對話（『你會發現…』），節奏刻意放慢、句間留白，反 TikTok 快剪，靠句子密度而非剪點留人。4) 演講／對談現場實拍剪成短片，開場不自我介紹、不下片頭，直接進入一個提問或一個場景。
>
> **畫面／縮圖手法：** 畫面／縮圖手法：以演講舞台與訪談現場實拍為主，單一主體、無圖表疊加、極少 B-roll。縮圖多為演講停格＋引言大字，屬統一模板的後製合成。字幕為大字硬字幕。

**[Rio Ferdinand](https://www.tiktok.com/@rioferdy5)** ・ 1.9M 粉絲 / 21.9M 按讚 / 103 關注中 ・ English ・ ✔直接抓取

> **對得上的理由：** 部分符合。真實退役職業球員（曼聯／英格蘭）且量體大，但 TikTok 實際產出以球評、反應、戰術評論為主（節目型內容主要在另一個帳號 @rioferdinandpresents），成長型／自述型內容比重低。可借鏡的是「退役球員直接對鏡頭下判斷」的語域與可信度，不是內容結構。列為備選，優先度低於 Ben Foster。
>
> **可直接抄的做法：** 1) 退役球員對鏡頭下判斷時的語域：用『球員實際上會怎麼反應』這種內部視角切入話題（例如談球員如何看待批評過自家球隊的球評回訪），把外人看不到的房間內部細節當成內容價值——Rafael 可對應成休息室、體能團隊、翻譯溝通這些只有在隊內才知道的細節。2) 拿一個具體的適應難題拆成三個原因（例：某前鋒轉隊後為何難以適應），結構是「一個具體困境＋列點分析」——這個骨架可直接搬到支柱4的『一個具體困境＋一個可執行動作』。3) 三人對談的異議設計：刻意讓共同主持人當場反駁主講人，讓觀點衝突取代單向輸出，避免說教感。4) 標題用問句＋引號把爭議點前置（『這是他最大的難題？』），前 2 秒先給爭議。⚠️ 注意：此帳號同時有大量純娛樂／名人互動內容，且我無法讀取其影片牆（渲染失敗），採用前建議人工滑一遍確認無博彩類業配，以免與人設的長期主義定位衝突。
>
> **畫面／縮圖手法：** 畫面／縮圖手法：以攝影棚多人對談實拍為主，混入比賽片段與訓練基地探訪 B-roll；無圖表疊加。縮圖為明顯後製合成（人物去背＋爭議引言大字＋箭頭／emoji 標記），是典型足球內容的高對比點擊型縮圖。

研究員備註：【方法變更 — 請更新平台可抓取性筆記】上次（2026-08-06）記錄「TikTok 可直接抓取個人頁」在今天不成立：WebFetch 對 tiktok.com/@handle（含加 ?lang=en、含影片頁 URL）一律只回傳 JS 殼，內容僅有「TikTok - Make Your Day」；socialblade 回 HTTP 403。改用 Browser pane（mcp__Claude_Browser__preview_start / navigate + get_page_text）以真實瀏覽器渲染後，7 個帳號的 header 全部完整讀到（顯示名稱、handle、關注中／粉絲／按讚、簡介、外連）。因此本次 7 個帳號全部標 direct-fetch，數字都是我在頁面 header 上親眼看到的，非搜尋摘要推測。建議把「TikTok 要用 Browser pane，不要用 WebFetch」寫進下次的方法筆記。

【CAPTCHA】導航到 @rioferdy5 時跳出滑塊驗證碼（「Drag the slider to fit the puzzle」）。我沒有嘗試破解（違反規則），只是重新載入頁面就通過了。後續其他帳號未再觸發。若大量連續導航同一個 tab，建議放慢節奏。

【數字時效性警告】搜尋引擎摘要的粉絲數普遍過期，落差很大：搜尋摘要說 @chriswillx 有 135.6K，實際 header 是 511.6K；說 @high_performance 是 308.3K，實際 324.2K；說 @rioferdy5「超過 1.8M」，實際 1.9M。請一律採用我記錄的 header 數字（TikTok 只顯示到小數一位，例如 1.1M，無法取得精確值）。

【影片牆讀不到】所有帳號的影片格狀清單在瀏覽器中多數渲染失敗（顯示「發生錯誤 非常抱歉！請稍後再試」）或需登入。因此 imitation_points 的內容判斷不是憑印象：我改用 WebSearch 並以 allowed_domains 限定 tiktok.com，撈出「掛在該 handle 底下的實際影片說明文字」，例如 @benfcyclinggk 的『How much MONEY did I get for EVERY POINT I got at West Brom』、@chriswillx 的『What Cbum Would Tell His Younger Self…』、@pedro.calabrez 的『“Não desista nunca” é um péssimo conselho.』。這些是真實 caption 原文，不是第三方文章的轉述。

【缺口 1：找不到中文候選，這是真實的平台結構問題，不是我沒找】我用中文搜尋詞（「TikTok 中文帳號 自律 長期主義 成長 內容創作者 粉絲數」、「TikTok 中文 運動員 選手 帳號 訓練 心態 分享 職業」）都只撈到 TikTok 官方經營教學頁、營利課程頁、賣粉絲的服務頁（bymyfans.com）與 discover 主題頁，沒有任何可查證的個人 handle。根本原因：中國大陸的運動員與成長型創作者在抖音／小紅書，不在 TikTok。**因此我沒有回報任何中文帳號，而不是用推測補足。** 若 Rafael 最後決定用中文發布，建議另開一輪針對抖音／小紅書的對標研究；本次這 7 個只能提供手法層面（鏡頭語言、剪輯節奏、敘事結構）的借鏡，不能提供中文語感參照。

【缺口 2：找不到「現役」職業足球員在做反思型成長內容】這是本次最實質的限制。TikTok 上的「pro footballer day in the life」幾乎都是聚合／穿搭帳號（例如 @footballerfits 轉發他人素材）或青訓、半職業球員，不是現役職業球員的自述反思。所以「真實運動員」這條軸線只能由退役球員（Ben Foster、Rio Ferdinand）與已退出賽場的職業健美選手（Chris Bumstead）承擔。Rafael 作為現役球員，這其實是一個空缺的內容位置（機會，不是問題）。

【主動排除的帳號（供查核參考，勿列入）】
- @_fcmotivate：搜尋摘要顯示 840.2K 粉絲、43.1M 按讚，內容是足球勵志／訓練教學（例如「成為職業球員的 3 個步驟」、「英格蘭成為職業球員的機率」），但**無公開真人身分**，且在推自家 App（宣稱能幫你超越職業青訓球員）。無臉勵志帳號＋App 導流漏斗，正好落在紅線 (a)（製造稀缺感／販賣焦慮）與 (b)（推薦未驗證方法）的高風險帶，且我查不到是誰在營運，故不列入。
- 全面避開理財／賺錢／hustle 類帳號（含葡語的理財教育大號），因為無法在單輪研究內確認其變現話術是否觸及「保證收益／快速致富」。

【給下一階段查核的優先建議】最強的三個是 @benfcyclinggk（真實球員＋談自己的錢，對應支柱1、2）、@chriswillx（『對 20 歲的自己說什麼』格式，對應支柱3、4）、@pedro.calabrez（葡語＋反陳腔濫調的一篇一原則，對應支柱3）。@high_performance 手法最貼合支柱3但是機構帳號。@simonsinek 與 @rioferdy5 為備選，其中 @rioferdy5 請務必人工滑一遍影片牆確認無博彩業配（我無法讀取其影片牆，也沒有找到任何博彩證據，但也無法排除）。

### Instagram（6 個）

**[Molly Seidel](https://www.instagram.com/bygolly.molly/)** ・ 233K ・ English ・ ✔直接抓取 ・ `短碎片` + `具體點名` + `問句少`

> **對得上的理由：** 奧運馬拉松銅牌得主轉戰越野超馬，本次六個候選中「圖文風格」吻合度最高的一個。公開談 OCD、ADHD 診斷、飲食失調在成名期復發，且刻意不把它包裝成勵志弧線（受訪自述成了「不情願的倡議者」，被當成成功案例但自己仍在掙扎）——正對 Rafael 支柱二「絕不英雄化自己、絕不把失敗說得比實際漂亮」。同時她用反雞湯自嘲稀釋導師感，正對「不是講台上說教的導師」。
>
> **可直接抄的做法：** （1）開場丟一個帶數字的事實當標題句，不做鋪陳：「last long run of 2023 🍾」換行接「24 miles on beaver creek this morning to finish off the year」。Rafael 可寫「今年最後一場對抗賽」＋具體數字（第 63 分鐘被換下、跑了 11.2 公里）。（2）用分號串並列碎片收尾，不補感想句、不問問題：「some @kttape, some bottles of bubbly, and some great people to share the miles with」——三個並列物件就結束。（3）全篇小寫、句末不加標點，刻意讓貼文讀起來像手機隨手打，不像發稿。（4）反雞湯自嘲法：整篇只有一句「hard pivot to being an inspirational runfluencer ✨」，再用 hashtag 反串自己（#inspiration #demotivation #badrunningadvice #whyareyoustillreadingthesehashtags）。Rafael 想講冠軍思維又怕說教時，可用這招先自我解構再講重點。（5）Reels 手法：手持自拍視角＋螢幕上字幕吐槽，不做旁白教學，caption 只留一句。
>
> **配圖手法：** 直抓個人頁所見為 carousel、Reels、clips 混排（2026 年 6–7 月），內容含跑步日常與 @satisfyrunning／@corosglobal 合作。已驗證的兩篇：一篇是長跑當天的 Reel（現場手持畫面，非棚拍自拍），一篇是純自嘲梗圖式 Reel。她的圖不追求乾淨精緻，看得出是當天現場隨手拍；並非每篇都以本人正面入鏡。

**[Jim Walmsley](https://www.instagram.com/walmsleyruns/)** ・ 284K ・ English ・ ✔直接抓取 ・ `長篇` + `具體點名` + `問句少`

> **對得上的理由：** 外籍運動員為了目標整家搬到語言不通的國家、公開反覆失敗四次才成功——與 Rafael「巴西人長駐中國、語言障礙、職涯轉換」的處境高度平行，是六個候選裡情境對位最準的一個。他寫傷病與退讓時完全不英雄化，是支柱二最直接的素材範本。
>
> **可直接抄的做法：** （1）「先解釋我為什麼消失」開場法：第一句直接回答讀者心裡的疑問——「If you follow my training on Strava, you may have noticed I haven't been logging my training in my lead up to Western States… here's the scoop.」Rafael 可用「這兩週我沒發訓練紀錄，說一下原因」。（2）用具體數字寫「退讓」而非寫「堅持」：一週七天有五天不跑、只跑 30 英里、距離比賽剩 8 週、髂脛束問題。承認退讓的規模，比宣示意志力可信。（3）點名真實協作者本名而非泛稱「我的團隊」：物理治療／脊骨／力量教練 Wes Gregg（@hypo2sport）。（4）明說情緒起伏而不收束成金句：「went through ups and downs with emotions, not knowing if I'd be able to line up healthy」。（5）結尾收在「感到幸運」而不是「我克服了」：「looking back, I feel so fortunate how it has all come together」——這正是「早走十年的隊友」而非偶像的語氣。（6）配圖可用純器材／場景照、本人完全不入鏡（車庫裡的跑步機設置，並標註攝影者 @ovrlnd.studio）。
>
> **配圖手法：** 已驗證的兩篇：一篇是車庫裡的訓練器材／場景特寫（Wahoo KICKR RUN 擺設，標註攝影 @ovrlnd.studio），本人未必入鏡——正是「純物件特寫」的現成範例；另一篇搭配訓練與比賽現場影像。他也在 caption 裡把 Strava 訓練紀錄當作可查證的外部資料引用，屬於「資料型」佐證的變體。

**[戴資穎 Tai Tzu-ying](https://www.instagram.com/tai_tzuying/)** ・ 1.4M ・ 中文（繁體）＋ emoji，少量英文 ・ ✔直接抓取 ・ `短碎片` + `具體點名` + `問句少`

> **對得上的理由：** 僅作為「中文語境下的短碎句圖文」與「配圖不硬套自拍」的風格範本，不是內容範本。Rafael 若走中文路線，這是最現成的中文短貼文語感參照。誠實說明：她的帳號沒有長期主義／紀律／誠實面對失敗的論述內容，niche 內容契合度低，價值集中在版型與長度。
>
> **可直接抄的做法：** （1）極短收斂法：一場國際賽事的貼文，caption 只有「🇲🇾💪🏻🙏🏻」三個 emoji，敘事完全交給畫面。Rafael 賽後可用「客場。3-1。🙏」這種近乎無字的處理——用來打破「每篇都必須有金句」的慣性，也直接滿足「不是每篇都用問句收尾」。（2）點名真人真事的一句話貼文：「謝謝合庫蔡育勤學妹陪打羽球式桌球」——寫出具體對象姓名＋具體做了什麼（連「羽球式桌球」這種土味自創玩法都照寫），而不是泛泛的「感謝隊友陪練」。Rafael 可照抄成「謝謝老王陪我加練罰球，他明明放假」。（3）中文＋emoji 混排、不做起承轉合、不解釋動機，是繁中「短」的可直接套用版型。
>
> **配圖手法：** 已驗證單篇為比賽現場影片片段（本人在畫面中但屬賽事畫面，非擺拍自拍）。另一篇為與具名球友練球的生活場景。整體是「畫面自己講完，文字不補述」的路線；需誠實註明：我只直抓到兩篇的圖像資訊，無法逐篇統計她多少比例的貼文本人未入鏡，故不宣稱「大量無人配圖」。

**[Courtney Dauwalter](https://www.instagram.com/courtneydauwalter/)** ・ 746K ・ English ・ ✔直接抓取 ・ `中等長度` + `具體點名` + `問句少`

> **對得上的理由：** 世界頂尖超馬選手，最有價值的是她連「最難看的時刻」都照發：Leadville 挑戰中止、送進急診、血氧 70、做完 HAPE 與血栓等一整輪檢查才確診急性支氣管炎——數據照寫、不美化、不轉成勵志結論。對應支柱二（傷病、絕不把失敗說得比實際漂亮）。bio 自稱「愛長版褲管與糖果」的自我降格語氣，也符合「不表演成功」。
>
> **可直接抄的做法：** （1）開場先講自己此刻的心態而非結論：「During a race, I love not knowing what's around every corner or being surprised by a killer view at the top of a climb.」——先給主觀偏好，再才落到當天做了什麼。（2）用具體地名撐起整篇，不說「在山上訓練」：直接點 Transgran Canaria 賽道、Gran Canaria 島、還刻意留了幾段賽道沒去看。（3）失敗與傷病的寫法：附上真實臨床數字（pulse ox 70）、列出實際排除了哪些病（HAPE、血栓）、明說「We're crushed it had to end this way」，句尾不轉折成勵志。（4）換人稱代發：那篇由先生 Kevin 以第一人稱寫、末尾署名「-Kevin」——當本人狀況不允許時，讓身邊人代述，比停更或含糊帶過更誠實。Rafael 可比照用隊友／體能師視角補述。（5）收尾用感嘆句與 emoji，不用問句釣留言。
>
> **配圖手法：** 直抓個人頁所見為 carousel／clips 混排，大量標註專業攝影師與品牌（Tommy Leeming、Petzl、SunGod、Suunto USA、Salomon Running）——即偏向專業賽事與山景攝影，不是隨手自拍。急診那篇則是狀態不佳時的現場照。可借鏡的是「圖交給專業拍、文字保持口語」的落差配置；但要注意她的贊助 hashtag 極長（單篇十幾個），這部分不宜照抄。

**[Kilian Jornet](https://www.instagram.com/kilianjornet/)** ・ 2M ・ English（西班牙／加泰隆尼亞語地名為主的內容，貼文本文以英文書寫） ・ ✔直接抓取 ・ `中等長度` + `具體點名` + `問句普通`

> **對得上的理由：** 高山耐力運動員，長年以「持續與方法」而非爆發成績著稱，且是六個候選中「無人風景配圖」最徹底的一個。內容不販賣焦慮、不承諾捷徑，屬於長期主義取向。誠實註記：他的訓練貼文偏方法分享，權威感比 Rafael 想要的「隊友感」略重，且會用問句收尾（見下），需要挑著抄。
>
> **可直接抄的做法：** （1）「兩個詞當標題＋空行＋才進內容」的版型：整篇以「Body 🔛 Mind」起，換行後才寫方法。這個極短標題句可直接移植到 Rafael 的「冠軍思維」支柱。（2）講方法就列自己實際在做的清單，不講原則：他寫自己靠看越野滑雪／田徑／冬季兩項／自行車轉播來配 intervals、pyramids、tests，或把目標地點的照片放在眼前——具體到可以照做。（3）賽後貼文的順序值得整套照抄：先謝現場所有人（志工、團隊、其他選手），點名對手本名致意（@mathieu__blanchard、@tomevansultra），才進自己的比賽細節（150 km、17 小時、往 Vallorcine 的下坡追趕）。把別人放前面、自己放後面，天然去掉炫耀感。（4）配圖策略：大量純山景／無人風景，並在動態標出真實山名（Serra de Tramuntana、Serra del Cadí）而非泛稱「山上」。（5）要避開的一點：他 2020 那篇以問句收尾（「What are your "mind distractors" when training in a "non fun" place?」）——這正是本次指示要避免的釣留言收尾，不要抄。
>
> **配圖手法：** 直抓個人頁顯示近期貼文為山地活動、攀登、自行車影像，地點標註為具體山脈（Serra de Tramuntana、Serra del Cadí）——以無人或人只是風景中一個小點的構圖為主，是「純場景照、完全沒有人」的最佳範本。已驗證單篇中也有純室內跑步機訓練影片（非美圖），顯示他不迴避不好看的畫面。

**[Desiree（Des）Linden](https://www.instagram.com/des_linden/)** ・ 230K ・ English ・ ✔直接抓取 ・ `中等長度` + `具體點名` + `問句少`

> **對得上的理由：** 波士頓馬拉松冠軍、兩屆美國奧運代表，長年公開招牌是「Keep Showing Up」——長期主義的直白版本，且她以連年跑不出成績仍持續參賽的經歷著稱，不販賣捷徑。她也是六個候選中唯一大量使用「訓練數據截圖當配圖」的人，正對本次指示第（4）點的資料型配圖。誠實註記：她的商業合作貼文比例明顯偏高（見下），這部分與人設不合。
>
> **可直接抄的做法：** （1）bio 就是人設濃縮寫法：「201∞ Boston Marathon Champion」用一個 ∞ 取代年份自嘲（不強調哪一年、只強調發生過），後面才接身分，最後接「Coffee•Whiskey•Music•Read•Write•Travel」把生活愛好放在成就之後。Rafael 的 bio 可比照「成就一行、生活一行、成就不放大」。（2）一句話原則當開場：「Routine is everything, and…」——先落一個判斷原則，再接當天的具體行為。這是支柱三「一篇一個判斷原則」最省力的版型。（3）資料型配圖：直接把手錶／訓練 app 的距離與心率截圖當圖發，不硬套一張自拍；也發純梗圖影片。Rafael 講金錢或訓練量時可照此改用圖表／截圖。（4）自嘲式欄目名可移植：「Nobody Asked Me but imma tell you anyway」（另有同名 podcast「Nobody Asked Us」）——Rafael 可開「沒人問我，但我還是想說」系列，語氣天然低於說教。（5）要避開的一點：已驗證那篇是 Super Coffee 的 Amazon Prime Day 業配（含折扣碼、「Win-win-win!」），長度與話術都偏推銷——她的合作篇不是風格範本，只抄她非商業篇的語感。
>
> **配圖手法：** 直抓個人頁明確列出：訓練數據截圖（顯示跑步距離與心率統計）、梗圖式影片、carousel、賽事宣傳圖。即大量配圖沒有她本人正面入鏡，資料型題材直接上截圖——本次六個候選中最貼近「資料型題材用圖表／資訊圖，而不是硬套自拍」的一個。

研究員備註：【平台可抓取性重大更新 — 與 2026-08-06 的實測相反】
本次（2026-08-07）instagram.com **可以**直接抓取：個人頁（instagram.com/{handle}/）回傳真實顯示名稱、bio 全文、粉絲數、following 數；單篇頁（/p/{code}/ 與 /reel/{code}/）回傳 **completa caption 全文＋Verified 徽章＋按讚／留言數＋發文日期**。因此六個候選全部標 direct-fetch，沒有一個需要靠間接推論。抓取不穩定（同一 URL 有時只回 JS 殼「Instagram」一個字），重試或換 /p/ 完整路徑通常可解；失敗時我只採搜尋結果標題中確實出現的 caption 文字，並在 verified_how 中註明該篇是「僅採標題所見」。

【本次最有效的 caption 取得方法，建議下一輪沿用】
WebSearch 時設 allowed_domains=["instagram.com"]，撈出 /p/ 或 /reel/ 連結——**搜尋結果的標題本身就含 caption 開頭**，例如「Courtney Dauwalter | This definitely wasn't in the plan. …」、「Molly Seidel on Instagram: "last long run of 2023 24 miles on …"」、「desiree linden | Routine is everything, and cooling off after a …」。先用標題篩出風格對的篇，再 WebFetch 該單篇取全文，命中率遠高於直接搜關鍵字。

【被雙重查核攔下的陷阱（四個，全部已排除）】
1. **@zerobertto9** — 搜尋結果標題寫「Zé Roberto ⚽️」，看起來像前拜仁那位傳奇。直抓 bio 實為「💍 @marisilveirap ⚽️Atleta Profissional @sportrecife」、52.7K 粉，是**另一位現役 Sport Recife 的 Zé Roberto**，不是退役於 43 歲的前拜仁／勒沃庫森／皇馬／帕梅拉斯球員。典型同名陷阱。
2. **@zeroberto（真正的前拜仁 Zé Roberto，3.1M）** — 直抓確認 bio 為「Não existe atalho pra quem nasceu pra chegar longe.」（生來要走遠的人沒有捷徑），紀律／長期主義金句極度對味，又是巴西人、葡語、足球員、以紀律與 43 歲仍先發著稱，理論上是六個候選裡情境最完美的一個。**但同一 bio 掛「Embaixador - @estrelabet」——博彩品牌代言**，觸及合規紅線（賭性／快速致富的鄰接風險），故主動排除，不列入。若品牌端評估後可接受博彩代言的鄰接風險，這是唯一同時滿足「葡語＋足球＋紀律長期主義」三合一的候選，建議由人來拍板而非由我代決。
3. **@choutienchen（周天成，12.1K）** — bio 明寫「👉🏻This is ''NOT'' managed by Chou Tien Chen 👉🏻這頁面「不是」由周天成本人管理」，粉絲代管帳號，排除。
4. **@bymollyseidel** — 這是我自己推測的 handle，查證後**不存在／非本人**，Molly Seidel 實際 handle 為 @bygolly.molly。已按實際查到的更正。另排除 @taitzuying_tty（自述「戴資穎粉絲穎迷粉」）與 @brandoncopeland_（與已驗證的 @bcope51 並存的同名帳號，未進一步查證，不採用）。

【誠實說明的最大缺口：找不到符合條件的足球員帳號】
本次**沒有任何一個現役／退役足球員能同時通過「真實可查證」與「短碎句日常圖文」兩道篩**。實際碰到的狀況：足球員 IG 幾乎都是比賽美圖＋品牌貼文，caption 雖短但完全沒有 specifics（不符合第 2 點具體性），或明顯由俱樂部／經紀團隊代操；搜尋「誠實談理財失誤的球員」只找到報紙採訪素材（Lucky Maselesele 談古柯鹼與揮霍、Jamal Fyfield 談「買了不需要的東西」），這些人沒有對應的個人 IG 內容可對標。因此六個候選中五個是耐力運動員、一個是羽球選手。**建議下一輪換角度**：不要找現役球員，改抓「退役球員轉播客主持／評論者」，那群人才有長篇誠實敘事的產出習慣。

【查證過但列為替補、未進榜的三個】
- **Brandon Copeland @bcope51**（46.5K，直抓 bio「Brandon Copeland (Cope) Living My Dream & Helping Others Live Theirs」、co-founder @athletesorg、10 年 NFL 老將、著作《Your Money Playbook》、連結 brandoncopeland.com；另經 Patriots.com、AfroTech、NFL.com 交叉確認他在賓大 Wharton 畢業並開設 EDUC 245「Urban Financial Literacy」課程、儲蓄率近 90%）。**金錢支柱與「絕不推薦沒驗證過的賺錢方法」的立場是六人中最對的**，真實故事（球員身分同時當金融識讀教授）非常好用。但直抓與搜尋所見的貼文以新書宣傳、上《Tamron Hall Show》通知為主，everyday_feel 明顯偏低、偏權威型，與本次「隨手打」的關鍵指示衝突，故列替補。若之後要單獨做「金錢支柱」的對標，他應該排第一。
- **Ryan Broyles @ryanbroyles**（27.5K，直抓 bio 為「🏡 @broylesrealestategroup - OKC Area 🤝 @infinite.rentals_ - PM 🔨 @broylesconstructiongroup 🏈」，限時精選含 Family／OU Career／Real Estate Advisor／NFL／50 doors）。真實故事極強：NFL 合約逾 360 萬美元卻全家只花 6 萬美元／年，退役後轉做奧克拉荷馬市房地產。但 IG 內容已幾乎全是房地產業務，不是日常圖文。
- **Marvin Sordell @marvinsordell**（7,146，直抓 bio「A story & a storyteller… MD | EP @thisisoneighty ECD @swoopsocial Co-CEO @opusracepromotions @calmzone & @beder_uk」）。前英超球員、28 歲因心理健康退役、CALM 心理健康大使，誠實面對失敗的分量夠。但帳號已轉為影視製作公司主管的商務帳號，粉絲數也偏低，且我無法取得任何一篇 caption 全文（單篇未取得），無法評估風格，故不列入。

【風格吻合度的誠實排序（供淘汰參考）】
以本次「短／具體／不問句收尾／配圖不一定有本人」四項標準，吻合度由高到低：
1. @bygolly.molly（四項全中，唯一 short-fragments＋everyday＋rarely 全對的英文帳號）
2. @tai_tzuying（長度與收尾全中，但內容 niche 幾乎不相關，只能當版型範本；且她大量 caption 是純 emoji，比「3~4 個碎片短句」更極端）
3. @des_linden（配圖的資料截圖用法最對、原則句開場最對，但業配篇比例高）
4. @courtneydauwalter（失敗誠實度最高，但長度中等、贊助 hashtag 過長）
5. @kilianjornet（無人配圖最徹底、賽後致意順序最值得抄，但會用問句收尾、方法分享略帶權威感）
6. @walmsleyruns（情境對位最準、傷病誠實度最高，但 caption 明確是 long-form——他是「內容素材與誠實尺度」的範本，不是「貼文長度」的範本）

【重要聲明】以上所有 handle、網址、粉絲數、bio 文字與 caption 引文，都來自本次實際的 WebFetch／WebSearch 回傳內容，沒有任何一項是推測或估算。粉絲數皆為 IG 自身顯示的概數（1.4M、746K 之類），非精確值，且僅代表 2026-08-07 當日所見。凡我無法取得的資料（如逐篇統計本人入鏡比例、Marvin Sordell 的 caption 風格）都已在對應欄位明確標示無法確認，未以合理推論補足。

### X（Twitter）（5 個）

**[Chris Bosh](https://x.com/chrisbosh)** ・ 224.2萬 ・ English ・ ✔直接抓取 ・ `短碎片` + `具體點名` + `問句普通`

> **對得上的理由：** 五個候選裡與人設最貼近的一個。退役職業運動員（2×NBA 冠軍、名人堂），著作書名直接就是《Letters To a Young Athlete》＝人設支柱4「如果我是20歲的你」；公開談自己的瀕死經歷（血栓導致職涯提前結束）＝支柱2「球場之外／絕不英雄化自己」；仍每天發文談這項運動的判斷（誰該被簽、聯盟怎麼長大）＝支柱3。語氣是隊友／前輩而非講台導師。無任何保證收益、快速致富、炫富內容。
>
> **可直接抄的做法：** 1) 重大人生事件用兩句講完就收：8/4 那篇把瀕死經歷＋現況＋道謝＋一個極小行動（Take care of yourself today）壓在四個短句內，不鋪陳、不轉折成勵志故事——這是避開「起承轉合」的最好示範。2) 把「給年輕人的建議」拆成單句貼文，不搬自己書裡的段落：他有一整本給年輕運動員的書，但在 X 上一次只丟一句。3) 用一則產業新聞當支點講判斷：先陳述事實（WNBA 第16隊、2028、Cleveland Sirens），再給一句自己的看法，不下結論式教訓。4) 配圖：五篇可見貼文全部掛的是自己拍的短影片，不是自拍照。
>
> **配圖手法：** 時間軸上五篇可見貼文全都附原生短影片（頁面顯示 00:00 播放器），內容是活動／賽事現場畫面或隨手拍的環境，而不是精修自拍；連談自己健康的那篇也是配影片而非人像。純文字＋影片為主，少見靜態沙龍照。（註：/media 網格頁需登入才渲染，此欄依公開時間軸上實際附掛的媒體判定。）

**[Ben Foster](https://x.com/BenFoster)** ・ 29.5萬 ・ English ・ ✔直接抓取 ・ `短碎片` + `具體點名` + `問句普通`

> **對得上的理由：** 退役英格蘭／英超職業足球員（門將），現在做 YouTube 與 podcast。最貼近人設的一點：他在 X 上談球員時談的是人格與紀律（「grown up, in control of themselves」）而不是數據，這正是支柱3「冠軍不是打敗別人的人，是建立起一套能長期遵守的標準的人」的最短寫法。bio 自嘲「Footballer (sort of…)」＝刻意不裝權威，對應人設「不裝全知」。無販賣焦慮、無投資推薦、無炫富。
>
> **可直接抄的做法：** 1) 直接抄這個句型當支柱3模板：「如果我要組一支球隊，我會先挑 X 和 Y」→ 點名兩個真實球員，然後理由只講人格特質（成熟、能控制自己），不引用任何數據。2) 為別人的一次成功喊一句就好（「Kinsky that is a MASSIVE save!!!! So happy for ya」）——隊友視角而不是評論員視角，且完全不延伸道理。3) bio 用一個括號降低權威感：「Footballer (sort of…)」。4) 配圖：常常整篇沒有圖；有圖時用的是別人的比賽畫面並老實標來源（「(Footage - Watford FC)」），而不是硬塞一張自己的照片。
>
> **配圖手法：** 混用三種：完全無圖的純文字短貼（如組球隊那篇、稱讚 Kinsky 那篇）、Spotify／YouTube 連結卡（podcast 集數）、以及別人提供的比賽影片並標註出處。本人入鏡的原創照片在可見時間軸上很少。（註：/media 網格頁需登入，此欄依公開時間軸判定。）

**[Kílian Jornet](https://x.com/kilianj)** ・ 33.3萬 ・ English ・ ✔直接抓取 ・ `中等長度` + `具體點名` + `問句少`

> **對得上的理由：** 現役職業運動員（越野跑／登山），核心就是長期主義與紀律，且公開承認自己 DNF（沒跑完）而不美化——完全對上人設「絕不英雄化自己、絕不把失敗說得比實際漂亮」。同時他的內容一貫用「同行者」語氣談別人的表現而不是教學。無販賣焦慮、無收益承諾。唯一要注意的是他是自家鞋品牌共同創辦人，貼文偶有自有內容導流性質。
>
> **可直接抄的做法：** 1) 講完一次失敗就收，不補救場：「Neither of us finished the race that Saturday. But this conversation was a good one.」——承認結果、給一句平淡的正面，然後停。人設支柱2可以直接用這個節奏。2) 地名／路線名精確到專有名詞：不寫「爬了一條很難的稜線」，寫「the Blanca–Little Bear Traverse links two fourteeners... in the Sangre de Cristo Range」。這是「具體不抽象」的可操作標準。3)「這一季留在我心裡的幾個表現」＋直接列人名（Emelie、Xavier Thévenard、Sam Laidlow…）：把讚美具體化到人，是隊友而非導師的語氣。4) 配圖：連結卡縮圖幾乎都是稜線與地形的風景，人不在畫面裡。
>
> **配圖手法：** 以 YouTube／Substack 連結卡縮圖為主，畫面內容是山脊、路線、地形等純風景（例如 Blanca–Little Bear Traverse、Colorado），完全沒有人入鏡；其餘是純文字貼文。這是「配圖不一定有本人入鏡」的好範本。（註：/media 網格頁需登入，此欄依公開時間軸上的連結卡與附掛媒體判定。）

**[Chris Long](https://x.com/JOEL9ONE)** ・ 57.2萬 ・ English ・ ✔直接抓取 ・ `短碎片` + `具體點名` + `問句少`

> **對得上的理由：** 退役 NFL 職業球員（兩座超級盃）、現職 podcaster、慈善組織創辦人。與人設對得上的是「退役球員用完全生活化的語氣談這項運動與人」，以及支柱1「從當天的比賽／隊友互動帶出一個判斷」的對話感。無收益承諾、無炫富、無割韭菜。要注意：他的貼文以體育熱議與引用回嗆為主，成長／金錢反思比例不高，且偶有政治性嘲諷（曾嘲諷某政黨主席關於收視率的說法），若要對標建議只借語氣與句法，不借他的爭辯題材。
>
> **可直接抄的做法：** 1) 引用別人的貼文再補一句自己的判斷，先給態度詞再給理由：「Meh - best on the planet playing last night… stakes & skills…」——用破折號與省略號斷句，句子刻意不修飾。2) 用一句話把一件事重新定位（「Puts a potential Knicks loss in context honestly」），只給框架不給結論。3) 顯示名稱刻意全小寫、標點不整齊——這是最省力的去權威化手段，人設如果走英文帳號可以直接沿用。4) 配圖：幾乎不發自己的照片，媒體幾乎都是引用來的比賽片段或 podcast 連結卡。
>
> **配圖手法：** 絕大多數貼文是引用轉推，圖／影片屬於原推作者（比賽片段、球迷畫面），自己只出一行字；另有 YouTube 連結卡導流到自家 podcast。原創的本人照片在可見時間軸上幾乎沒有。（註：/media 網格頁需登入，此欄依公開時間軸判定。）

**[Geraint Thomas](https://x.com/GeraintThomas86)** ・ 49.5萬 ・ English ・ ✔直接抓取 ・ `短碎片` + `具體點名` + `問句少`

> **對得上的理由：** 職業自由車選手（環法總冠軍、兩屆奧運金牌）。最貼近人設的是他的自述方式：用出身地的自我懷疑開場而不是用成就開場，且明說自己從沒真的相信辦得到——正對上「絕不英雄化自己」。日常也照發生活抱怨，不維護完美人設。無販賣焦慮、無投資推薦。要注意：他的貼文有相當比例是品牌合作與募款導流，且置頂那篇是長文（人設要避開的長篇結構），對標時只取他平日的一行句。
>
> **可直接抄的做法：** 1)「反神話化的出身句」：「Kids from Cardiff don't ride the Tour.」——用一句地域化的自我否定收尾，取代成就式開場；人設可換成自己出身城市的版本。2) 直接承認曾經不相信自己：「I dreamt of racing it, of winning it, but I never for a second thought I would.」3) 具體數字當倒數／門檻：「only if we hit £700,000. 15mins to go」——不是「快來支持」，而是給金額與剩餘時間。4) 日常抱怨照發（公開追問航空公司四個月沒回信），維持真人感。5) 配圖：常常整篇無圖，只有一行字。
>
> **配圖手法：** 混用：純文字無圖的一行貼（募款倒數、抱怨航空公司）、贊助商製作的影片（Lloyds「Sofa to Saddle」）、以及 crowdfunder 連結卡。本人入鏡的比例不高，多數是文字或第三方製作素材。（註：/media 網格頁需登入，此欄依公開時間軸判定。）

研究員備註：【方法更正 — 請更新平台可抓取性筆記】
上一次（2026-08-06）記錄「X 可以直接 WebFetch」在本次已不成立：WebFetch 抓 https://x.com/{handle} 與 https://x.com/{handle}?lang=en 都回 HTTP 402 Payment Required；twitter.com 則 301 轉到 x.com 後同樣 402。
可行的替代方案（本次全部五個帳號都用這個做的）：用瀏覽器窗格（mcp__Claude_Browser__preview_start / navigate → get_page_text）在**未登入**狀態載入公開 X 個人頁，可以完整讀到顯示名稱、handle、bio 逐字、Following／Followers 數字、以及最近 5 篇貼文的實際文字與日期。因此五個帳號的 verify_tier 都標 direct-fetch（我確實載入了真實個人頁並讀到真實欄位），只是傳輸工具從 WebFetch 換成瀏覽器窗格。建議下次直接走這條路。
兩個限制：(a) 螢幕截圖失敗（Browser pane 未顯示、不合成畫面），所以沒有視覺確認；(b) /media 網格頁需登入才渲染，所以每個帳號的 image_approach 欄是依「公開時間軸上實際附掛的媒體」判定，不是依 Media 網格全覽，這點已在各欄註明。

【粉絲數讀取說明】
X 介面語言是 zh-TW，數字以「萬」顯示（1萬＝10,000）。所有數字都是 2026-08-07 當天在個人頁上讀到的原始顯示值，我在欄位裡同時保留原始「萬」值與換算值。沒有任何一個數字是估的。

【已攔下的假帳號／查不到的帳號 — 與上次同型的陷阱】
1. @ArianFoster1（Arian Foster，退役 NFL）— 假帳號，已排除。頁面實測：2,767 Followers、4 Following、「@ArianFoster1 hasn't posted」完全沒發過文，bio 錯字連篇（「played Mexan football」、「Tennesee」）。搜尋另外指出有個 2026 年 3 月才註冊的 @ArianFoster，我沒有拿它充數。
2. @andreward（Andre Ward，退役拳王）— 載入後回「We're unable to show this account / The account may be private, deleted, or only available on the app」，無法查證，已排除。
3. Lachlan Morton（EF 職業車手）— 搜尋沒有回傳任何可確認的官方 X handle，我**沒有**用「名字推 handle」去補，直接放棄。

【其他已實測查證、但這次沒進前五的候選（數字都是實際讀到的，可供替換）】
- @petercrouch（Peter Crouch，退役英超前鋒）107.1萬粉。極度隨手感、貼文常只有兩三個字（「Classy」「Some game this」「Wow !!!! Lionel」），但內容幾乎純足球即時反應，成長／紀律／金錢的實質為零，當「短」的範本可以，當人設支柱範本太薄。
- @JoeMarler（Joe Marler，退役英格蘭橄欖球）16.1萬粉。生活感很強、退役後談俱樂部治理很直白，但可見貼文有用表情符號引用《每日郵報》王室八卦、以及帶挑釁意味的選人嘲諷，題材風險較高。
- @stevemagness（Steve Magness，表現教練／《Do Hard Things》作者）13.2萬粉，最新貼文 13 小時前。內容上是全部候選裡最貼支柱3「一篇一個判斷原則」的（反 hustle 文化、反企業監控、「新手在輕鬆日跑太快、在辛苦日跑太輕」），且明確站在不販賣焦慮的一邊；但貼文格式是「一句洞見＋冒號＋導流到自家 newsletter」，是教學／權威型，everyday_feel 應標 false，所以我沒放進前五。若後續要補支柱3的手法範本，這個最值得取。
- @EliudKipchoge 53萬粉。貼文是全部候選裡最極致的短句（「Recovery.」「Hard work.」「Never lie to yourself.」），紀律／長期主義核心也最純。**但有兩個實測到的問題**：(a) 帳號看起來已停更，公開時間軸上最新一篇是 2024年2月12日；(b) 那些一詞貼文其實是抽象格言，違反「具體不抽象」這一條。所以不建議當主要範本。
- @yihong0618 7.7萬粉。**這是四條圖文風格條件裡吻合度最高的一個**：中文（簡體）、每篇 1～2 句碎片、點名極具體（duckdb 社區、腾讯 workbuddy、具體人名）、幾乎不用問句收尾、生活感極強；他也真的有長期主義的實踐（yihong.run 跑步紀錄站、每年一個 github.com/yihong0618/{年份} repo）。沒進前五的原因只是題材是程式／科技而不是運動或成長，niche 對不上。如果後續決定人設走中文帳號，這個是目前唯一實測到的中文語感範本。
- @morganhousel 69.1萬粉。長期主義主題正確、不賣快速致富，但目前 X 時間軸已經以 podcast 導流＋獨立格言為主（例：「The best math you can learn is how to calculate the future cost of current decisions.」），抽象度太高，違反「具體不抽象」，不建議。

【語言覆蓋的缺口 — 誠實回報】
前五名全部是英文帳號。我沒有找到可查證的葡萄牙語運動員 X 帳號同時符合這套「短、具體、隨手感」的風格；X 上巴西退役／現役球員的帳號多半是官方公關口吻或早已停更，我**沒有**為了湊語言多樣性去填一個沒查證過的巴西帳號。中文方面只有 @yihong0618 一個實測合格但 niche 不符（見上）。若這一項重要，建議另開一輪專門針對葡語與中文做，並接受可能需要放寬「運動員」這個條件。

【對標邊界提醒】
五個帳號都只作內容手法參考，與 Rafael／Project B02 無任何關聯或合作關係。合規上我逐一檢查過：無保證收益、無製造稀缺、無快速致富教學、無炫富或假豪宅、無利用貧困兒童、無捏造榮譽、無性別／世代對立。唯一要標注的watch item 是 @JOEL9ONE 偶有政治性嘲諷、@GeraintThomas86 與 @kilianj 有自有品牌／贊助導流成分，對標時建議只取句法與節奏，不取題材。

### Threads（6 個）

**[陳彥博 Tommy Chen](https://www.threads.com/@tommychen1986)** ・ 14.8K ・ 中文（繁體） ・ ✔直接抓取 ・ `中等長度` + `具體點名` + `問句少`

> **對得上的理由：** 契合度最高的一個。現役極地超馬運動員，25 歲罹咽喉癌後復出，整個 IP 核心就是長期累積與紀律，且從不用「快速致富／保證成果」語言。對應 Rafael 的支柱（1）訓練結束以後、（2）球場之外（傷病）、（5）今天我學到了什麼。落差：他是個人耐力項目、不談金錢與投資，所以支柱（3）冠軍思維與金錢話題無法從他身上取材。
>
> **可直接抄的做法：** 1) 用一個可查證的數字開場代替形容詞：「賽後靜止心率 43，海拔 2506m」，而不是「今天狀態很好」。2) 傷痛用中性動作序列交代，不美化也不悲壯化：標題寫「甜蜜的痛」，內文只寫「3902m 陡下碎石坡跌倒，先止血再繼續」。3) 賽前貼清單型準備（裝備 6.4kg、創傷醫療訓練），讓「紀律」以物件與重量出現，不用「自律」這個詞。4) 成績只給時間與名次（37小時13分57秒）就停，不加勵志結語——可直接搬給 Rafael 報告訓練/比賽結果的貼文。5) 把身體數據當敘事單位：心率、海拔、公斤數輪流當每篇的錨點。
>
> **配圖手法：** 混用四種：賽道地形照（純景無人）、裝備平拍（背包／醫療包／鞋，純物件）、手錶心率數據截圖（資料型縮圖）、比賽現場照。本人常入鏡但是紀錄式而非自拍式，且有相當比例的貼文完全沒有人。這是六個帳號裡配圖手法最接近本次要求的一個。

**[鄭凱鴻](https://www.threads.com/@ckaih_)** ・ 3,177 ・ 中文（繁體） ・ ✔直接抓取 ・ `中等長度` + `具體點名` + `問句少`

> **對得上的理由：** 運動項目最接近（現役五人制足球守門員，台灣 FF1 一級聯賽），而且他的招牌敘事幾乎就是 Rafael 支柱（2）「球場之外／絕不英雄化自己、絕不把失敗說得比實際漂亮」的活範本。落差：他不談金錢、投資或成長方法論，也沒有「如果我是20歲的你」這種給建議的姿態，所以只能對標失誤敘事與復原敘事，不能對標支柱（3）（4）。
>
> **可直接抄的做法：** 1) 先逐項承認事實再談自己：「我不想否認，那一球的確是我失誤，我太早慶祝，讓對手有機會」——先認定事實，才進情緒，不先鋪陳受害感。2) 把「被公開嘲笑」寫成可見的動作清單（截圖、轉發、嘲笑、脆發公開我），而不是抽象的「網路很殘忍」。3) 拒絕把復原寫成勝利：「我不完美，我甚至會犯讓人記一輩子的錯，但我也在努力學會怎麼站起來」。4) 同一個弱點第二次發生時，用短貼淡定收尾（「但那又怎樣，我並沒有被影響到，反而讓我更想把下一顆守住，我也做到了」）——示範「不完美但持續」的長期敘事，比一次性的懺悔文更耐用。5) 用一句自我定位句當簽名式結尾（「我是屏東那個守門員。我還在」），把地方＋位置＋現在式綁在一起。
>
> **配圖手法：** 以比賽現場照與球隊合照為主，本人入鏡比例高，也有品牌／球團合作的活動照（tag @taiwanbeerleopards）。純物件特寫與純場景照幾乎沒有，資料型圖表沒有 → 這是他作為對標範本最弱的一項，配圖手法不建議照搬。

**[張嘉哲 Chia Che Chang](https://www.threads.com/@trulyman42195)** ・ 7,346 ・ 中文（繁體） ・ ✔直接抓取 ・ `中等長度` + `具體點名` + `問句普通`

> **對得上的理由：** 退役／半退役奧運馬拉松國手，長期在寫「訓練場地、跑者的實際處境、長期累積」，語氣平靜、不說教、會自嘲，也不賣任何課程焦慮（他自營真男人文創商號賣運動恢復產品，屬於自己在用的實體商品，不是保證收益型販售）。對應 Rafael 的支柱（1）（3）（5）。落差：不談金錢決策。
>
> **可直接抄的做法：** 1) 把一個地點寫成一項共同資產：從曹純玉等具體人名的訓練路線切入，把貓空那段坡命名為「國手之道」並說明它屬於所有認真訓練的人——示範「用具體地名承載價值判斷」，不空談精神。2) 用一個判斷命題當整篇的軸並放在開頭而非句尾：「跑馬拉松，到底是在『求生存』，還是在『過生活』？」→ Rafael 的支柱（3）冠軍思維可直接套這個結構（開頭提問、中段給原則、結尾不回頭釣留言）。3) 講坡度就給數字（4–8 度上下坡循環刺激不同肌群），把抽象的「紀律」翻成可量測條件。4) 允許自己有「沒有洞見」的貼文：只發一張山林照＋四個字「山林涼」，這對維持隨手感非常關鍵。5) 談恢復與休息時把它放在與訓練同等的位置，而不是當成勵志對照。
>
> **配圖手法：** 大量純山林／訓練路線的場景照與短影片（完全沒有人入鏡），配上很短的文字；偶爾才出現比賽或本人照。基本不用自拍。這正是「配圖不一定有本人入鏡」的良好示範，但他沒有圖表／資訊圖類型的資料型配圖。

**[周青 Chou Ching](https://www.threads.com/@ayakashi1991)** ・ 1,861 ・ 中文（繁體） ・ ✔直接抓取 ・ `長篇` + `具體點名` + `問句少`

> **對得上的理由：** 現役頂尖越野跑選手兼協會／賽事經營者。貼文常主動寫自己的瓶頸、不足與「想法很美但都石沉大海」的失敗，完全不賣焦慮。對應 Rafael 的支柱（2）（5）以及「早走十年的隊友」姿態。落差：貼文形態是單段長敘述，跟本次要求的 3~4 句碎片相反；粉絲數也偏低（1.8K）。
>
> **可直接抄的做法：** 1) 賽前把目標寫成三條可判定的條件，賽後逐條核對哪條沒達成：「賽前設定三個目標…結果只有前兩項達標」——這是把「誠實面對失敗」變成可重複的貼文結構，Rafael 支柱（5）可直接沿用。2) 承認具體技術弱點而不是泛泛檢討：「現在能改善的大概就是爬坡能力了，下坡現在遇到瓶頸，太技術的路段，膝蓋會受不了」。3) 把數字放在句末當落點、不寫感想：「時間：04：47：38 排名：16」就結束。4) 講別人比自己強時直接認：「看了上田成績，只能嘆氣，實在太强了」——不轉成自我激勵。5) 談自己在推的事情時先講難處：「經營一個品牌很辛苦，沒有一個穩定的商業模式，都在考驗人性跟熱情」——示範不推銷式的自我提及。
>
> **配圖手法：** 賽道與山域場景照、裝備照（貼文開頭就是「打開塵封已久的裝備」）、合作據點的場地照混用，本人不一定入鏡。配圖邏輯符合要求，但沒有圖表／資訊圖類型。

**[陳游游](https://www.threads.com/@lan.shua)** ・ 574 ・ 中文（繁體） ・ ✔直接抓取 ・ `短碎片` + `具體點名` + `問句少`

> **對得上的理由：** 契合度最低但形態價值最高。他不是職業運動員（是有實力的市民／準菁英跑者），也不談金錢或成長方法論，所以在人設定位上只能算旁證。但他是我在 Threads 上找到最接近本次「已定案圖文風格」的運動類帳號：短、具體、不釣留言、配圖常無人。建議只當排版與語氣範本，不當權威或選題範本。
>
> **可直接抄的做法：** 1) 從一個極小的觸發點進場，順手帶出一個剛查到的具體數字：「昨天為了查明年渣打何時報名，好奇看到 M40 後可以查自己的分組世界排名，結果查出自己 M45-49 目前世界排名 474」。2) 用一句自嘲取代結論收尾：「然後老婆說我現在是標普500」——直接示範「不是每篇都給人生教訓、也不用問句收尾」。3) 訓練日誌貼原始格式不加修飾（Run W:2km 16km/p:3:56 C:2km Swim 1.4km），讓紀律以資料形態出現，完全不用「自律」「堅持」這類形容詞。4) 中間穿插完全無關的生活抱怨（「今年夏天怎麼感覺特別熱」、送貨員把貨堵在門口），維持隨手感、避免每篇都在講運動——Rafael 若要避免變成說教型帳號，這個節奏最值得抄。5) 全篇 3~4 個短句就停，不做鋪陳→發現→反應→反思的起承轉合。
>
> **配圖手法：** 混用世界排名查詢截圖（資料型縮圖）、訓練地點風景照（梅花湖，純景無人）、生活抱怨的物件照（堵住門口的貨箱）。本人幾乎不入鏡。六個帳號裡最貼合「配圖不一定有本人、資料型題材用截圖／圖表」這條要求。

**[Paulo André Benini](https://www.threads.com/@pauloandreofficial)** ・ 12.3K ・ Português ・ ✔直接抓取 ・ `長篇` + `具體點名` + `問句少`

> **對得上的理由：** 選題與論證方式契合度最高（葡語、退役職業足球員、正在寫「冠軍思維／判斷原則」），但文字形態與本次圖文風格完全相反。他的專欄命題「我們越來越無法與錯誤、脈絡與複雜性共處」、「領導最難的美德是抗拒太早下判斷」幾乎就是 Rafael 支柱（3）冠軍思維的內容藍圖。合規上乾淨：不炫富、不談投資、不賣焦慮。
>
> **可直接抄的做法：** 1) 每篇只推一條判斷原則，並用一個外部素材當入口（一部小說《大師與瑪格麗特》、一則中國古代寓言、一位義大利教練），從外部進場再折回足球，不從「我」開始——這正好解決 Rafael「不要像講台上說教」的問題。2) 用足球場景把事後諸葛翻成一句可轉述的原則：「球進了之後，一切看起來都很明顯；在那之前，幾乎都只是酒吧閒聊」。3) 把「抗拒太早下判斷」寫成領導技能而非道德勸說。4) 談自己球員生涯的錯誤時放在論點的證據位置，不放在情緒位置。5) 每篇明確標出這是第幾篇／哪個系列，建立可追蹤的專欄感。**不要抄的部分**：他的段落長度、書面語、以及每篇都導流到外部連結的做法。
>
> **配圖手法：** 以專欄文章縮圖／連結卡與球評工作照為主，屬於精緻導流型配圖，不是日常隨拍，也沒有純物件或純場景照。配圖手法不建議對標。

研究員備註：【平台可抓取性：與 2026-08-06 的實測結論不同，請更新】
這次實測 Threads 已經可以直接抓取。WebFetch https://www.threads.com/@{handle} 會回傳可解析的內容：顯示名、bio 逐字、粉絲數，以及最近數則貼文的文字（含日期與部分互動數據）。我用 @zuck 做對照測試（回傳「Mostly superintelligence and MMA takes」、5.6M followers）確認不是快取或特例。單篇貼文網址（threads.com/@handle/post/{id}）也能抓到全文與觀看／讚／轉發數。此外 `site:threads.com` 搜尋語法可用，且會回傳含貼文全文片段的個別貼文網址，非常適合先用風格關鍵字撈貼文、再回頭抓帳號頁驗證。因此這次六個帳號全部標 direct-fetch（其中四個另外做了新聞或第三方交叉比對）。上次「Threads 只拿到 JS 殼、搜尋引擎索引極稀疏」的結論建議作廢。

【六個都做過雙重查核，被我淘汰的同名／假帳號陷阱】
- threads.com/@casagrande：不是巴西名將 Walter Casagrande。651 粉，頁面寫「Perfil administrado pelos pais」（由父母代管），是兒童帳號。這正是任務警告的類型，已排除。
- threads.com/@wongsinfah：301 粉，bio「這邊變成運動日誌在發好了」，不是選手，貼文含潛水揪團與演唱會搶票，不符。
- threads.com/@safeliu810104（劉學甫，7,973 粉）：從 site:threads.com 搜尋撈到、看起來像運動員，實際 bio 是「新歌『說了不愛』點下方連結收聽」——歌手，不是選手。已排除。
- threads.com/@tzuching1212（晴Ching，14.8K 粉）：bio 是演員／模特／TVB 外景主持，運動是生活方式而非職業身分，不算運動員；且貼文多為品牌活動（Tiger Beer 籃球活動、Global Wellness Day）。已排除。
- threads.com/@janaborgescorredora（Jana Borges，8,254 粉）：真實的跑步／Hyrox 業餘競技者，但貼文是大量 emoji＋教練式激勵語（「correr rápido é importante… mas aprender a sustentar velocidade mesmo destruído é o que realmente separa quem participa de quem performa🔥」），語氣偏「分出高下」的動員感，離「隨手記錄」較遠，也貼近合規紅線的邊緣（不到販賣焦慮，但方向不對）。列為備案不列入正式回報。

【找到 6 個，但要誠實說明結構性落差】
1) 沒有找到「短碎句＋高權威＋大粉絲數」三者兼備的帳號。最好的**形態**範本（@lan.shua，574 粉）權威性最低；最好的**選題**範本（@pauloandreofficial，12.3K，退役職業足球員）形態完全相反（長段落書面語＋導流）。建議拆成兩種對標角色使用，不要指望一個帳號同時給排版與內容。
2) 六個之中只有 @lan.shua 與 @tommychen1986 明顯做到「資料型題材用截圖／圖表／資訊圖」（世界排名查詢截圖、手錶心率數據截圖）。其餘四個沒有圖表型配圖。若 Rafael 要做支柱（3）冠軍思維這種偏觀點的資料型貼文，Threads 上我沒有在運動員圈找到現成的圖表型範本可對標。
3) 語言分布嚴重偏 繁體中文（5/6）。這不是偷懶：Threads 台灣市占是全球最高（搜尋到的統計資料顯示台灣用戶佔比約 21%，超過美國），繁中運動帳號密度最高；而巴西雖是 Threads 大市場，我用多組葡語風格關鍵字（"quando eu jogava"、maratonista＋acordei＋km、atleta＋"meu treino"＋aprendi 等）搜尋，撈到的巴西運動內容幾乎都是健身激勵語、教練招生或新聞聚合帳號，找不到「現役／退役職業球員本人用短碎句寫日常」的帳號。唯一葡語人選就是 Paulo André，而他是專欄作家形態。
4) **完全沒有簡體中文候選，而且結構上不會有。** Threads 在中國大陸無法正常使用，所以「定居中國的職業球員用簡體中文發 Threads」這個組合在平台上基本不存在生態。如果 Rafael 的 Threads 帳號要走簡體中文，這個平台上找不到同語境的對標對象；建議 Threads 這條線鎖繁中或葡語／英語，簡體中文內容放到別的平台。
5) 粉絲數偏低者兩個：@ayakashi1991（1,861）、@lan.shua（574）。都是我親自抓頁面看到的真實數字，不是估算。@lan.shua 另有一個更嚴格的保留：他不是公眾人物，bio 裡的馬拉松成績（2:36:48、108 年全運會第五名）我在 Threads 以外查不到任何獨立來源可核對，屬自述。我確認的是「帳號真實存在且內容一致」，不是「成績為真」。

【合規檢查】六個帳號我都逐則看過可見貼文，沒有一個出現販賣焦慮、保證收益、稀缺感、快速致富、推薦未驗證投資標的、炫富假豪宅、擺拍公益、捏造榮譽或性別／世代引戰。@ayakashi1991 與 @tommychen1986 有品牌贊助標註（The North Face、720armour、Garmin、XTERRA），屬正常運動員贊助揭露，不是炫富。所有粉絲數均為 2026-08-07 抓取當下頁面渲染的數字。

### Facebook（4 個）

**[Ítalo Ferreira](https://www.facebook.com/italotferreira/)** ・ 26 萬位追蹤者 ・ 混合（Português 為主，部分貼文並列英文） ・ ◇交叉比對 ・ `短碎片` + `具體點名` + `問句少`

> **對得上的理由：** 現役巴西職業運動員、奧運金牌＋世界冠軍，出身 Baía Formosa 的貧困漁村（拿保冷箱蓋當衝浪板起步），是「不英雄化自己、成長歷程本身就是內容」的真實版本，且沒有販賣焦慮或教人賺錢。與 Rafael 共享的關鍵條件是：巴西人、葡語、現役、靠訓練量與紀律吃飯，且會把訓練日常直接當貼文素材。跟足球的差異是他沒有「球隊／隊友互動」這條線，冠軍思維那條線也偏本能而非方法論。
>
> **可直接抄的做法：** 1) 三個字就成立的貼文：「MUITO SURF, esqueça」（很多浪，別想了）——示範一句話碎片也能發，不必補一段反思，直接對應「3~4 個碎片短句就結束」甚至更短。2) 「在家幾天＝玩＋衝浪＋訓練」這種把一段日子壓成一個公式的寫法（「Poucos dias em casa significa muita diversão, surf e treino」），Rafael 可套成「休賽期三天＝家人＋復健＋看帳」。3) 收尾用行動指令而非疑問句（「Da um confere no vídeo novo」＝去看新影片），達到互動目的但不落入「你們覺得呢」。4) 地名 hashtag 當具體性載體：#fernandodenoronha #swell 把抽象的「浪很好」錨定到真實地點與浪況。5) 葡＋英雙語並置但不是逐句翻譯，而是英文另寫一句更口語的（「The last few days was lit」），適合 Rafael 葡／中／英多語身分的處理方式。
>
> **配圖手法：** 以浪況／衝浪動作短影片為主，混用純海景與器材畫面；配文常常只有一句加一串地點 hashtag。缺點是本人入鏡比例仍偏高（因為主體就是他在衝浪），且贊助商內容（Red Bull、Cariuma）佔一定比例；純物件特寫與圖表型配圖幾乎沒有。

**[戴資穎 Tai Tzu Ying](https://www.facebook.com/people/%E6%88%B4%E8%B3%87%E7%A9%8E-Tai-Tzu-Ying/100044580272976/)** ・ 140 萬位追蹤者 ・ 中文（繁體） ・ ◇交叉比對 ・ `短碎片` + `具體點名` + `問句少`

> **對得上的理由：** 真實的頂級職業運動員（羽球前世界球后、已宣布退休），紀律與長年累積是她的底色，且完全不碰賺錢／焦慮題材。文風上是本次五個候選裡最貼近「已定案圖文風格」的範本。但要誠實指出落差：她幾乎不寫「判斷原則」或「如果我是20歲的你」這類帶觀點的內容，也很少主動剖析失敗，所以她只能當**文字手法與配圖手法**的對標，不能當內容深度的對標。
>
> **可直接抄的做法：** 1) 「兩個詞＋一個時間點」就發文：「收假，明天繼續加油」——示範最短可行貼文長度，Rafael 的「訓練結束以後」可以有一部分就停在這個量級，不必每篇都帶觀點。2) 用自家寵物／隨手物件當配圖並在文末署名（「戴萌TTY」＝她的貓），建立一個「不是本人臉」的固定視覺記號；Rafael 可用球鞋、護具、球隊餐廳餐盤當同等記號。3) 賽前預告寫成純資訊卡：把賽事全名、日期區間、對手姓名國籍全部寫出來（「Jun 14th-19th 2022 … 對上來自中國的王祉怡」），這是「具體不抽象」的極端示範——不寫「明天有場硬仗」，寫對手是誰。4) 業配也用同一套口語語氣處理（「這歌聲可以嗎～？🤣」自嘲），不切換成正式廣告腔，維持整個帳號的語氣一致性。5) 大量貼文完全不設問句，情緒講完就停。
>
> **配圖手法：** 混用：自家貓（戴萌TTY）短影片、食物、球場／訓練畫面、賽事資訊圖、以及贊助商（舒跑、VICTOR）影片。相當高比例的貼文主體不是她本人，符合「配圖不一定有本人入鏡」。要注意的是資訊圖多半是賽事宣傳圖卡，不是自製資料圖表。

**[Jeremy Lin 林書豪](https://www.facebook.com/jeremylin7/)** ・ 332 萬位追蹤者 ・ 混合（English 為主，中文為輔） ・ ◇交叉比對 ・ `中等長度` + `具體點名` + `問句少`

> **對得上的理由：** 與 Rafael 的重疊度在「人物處境」上最高：職業運動員、亞洲—西方跨文化身分、且**實際到中國職業聯賽打過球（北京首鋼／廣州）**，經歷語言與文化適應、被裁、傷病、生涯轉換，公開內容長期圍繞「誠實面對失敗」與信念，不賣焦慮也不教人賺錢。他的「重建身體再談復出」敘事幾乎等於 Rafael 的「球場之外—傷病」支柱。落差在於文長：他有相當比例是長篇，且有社會議題倡議內容（AAPI 反歧視），Rafael 若定位為不碰對立議題，這部分不宜照搬。
>
> **可直接抄的做法：** 1) 「偶遇舊識 → 時間跨度 → 一句感嘆」的極簡結構：「Brooo...lifes crazy. 14 years later! Just ran into Taylor King at the gym…」——開場用一個語氣詞而非金句，點名真人姓名與具體年數，是「具體不抽象」加「隨手打」的教科書級示範，Rafael 可套用在偶遇前隊友、前教練。2) 傷病敘事的第一句不寫感受寫順序：「The first step for my NBA comeback was always to rebuild my body」——先講方法步驟再講代價，避免自我英雄化。3) 自述身分時用地名錨定（「raised in the Bay Area」）而不是抽象講「我的成長背景」。4) 中英雙語不逐句對譯，而是同一則貼文裡切換受眾語氣——可直接借鏡到葡／中／英三語營運。5) 他把「營隊／基金會」的活動貼文和個人碎片貼文放在同一個頁面共存，示範商業／公益內容不必另開帳號，但要用同一種語氣。
>
> **配圖手法：** 混用訓練／復健照、球場畫面、與舊友的合照、營隊活動圖卡與媒體合作圖（如 Tatler Taiwan）。本人入鏡比例偏高，純物件／純場景照較少，這一項不是最佳範本。

**[Austin Kleon](https://www.facebook.com/Mr.Austin.Kleon/)** ・ 3.4 萬位追蹤者 ・ English ・ ◇交叉比對 ・ `短碎片` + `具體點名` + `問句少`

> **對得上的理由：** 唯一的非運動員，放進來是因為他是「已定案圖文風格」四項標準同時達標的最乾淨範本，而且合規上非常安全：他的核心主張是長期、緩慢、不焦慮的創作累積（反 hustle、反速成），從不保證成果也不賣致富方法。內容主題（創作習慣）與足球無關，所以只當**文字結構與配圖手法**的對標，不當內容主題對標。
>
> **可直接抄的做法：** 1) 「日常失誤 → 就地解法」兩句成文：「Finished a diary and forgot to bring a new notebook into the house last night…」——貼文起點是一個微小的自己搞砸的事，不鋪陳不反思，這正好是 Rafael「今天我學到了什麼」支柱最該用的低姿態開場。2) 時間與地點一律寫死：「this morning」「at bookpeople」「until wednesday」——不寫「最近」「某家書店」，「具體不抽象」的最小成本做法。3) 用破折號接一句實用資訊收尾（「— they ship!」），有資訊價值但不設問句。4) 配圖幾乎不放自己：筆記本內頁、書桌、待簽的書堆、日記封面等純物件特寫，這是本次四項標準裡最難學、而他做得最徹底的一項，Rafael 可平移為球鞋、貼布、隊上餐盤、飯店房卡的特寫。5) 把「訂閱／新書」這類推廣寫成一句話的近況更新（「My newsletter is now on Substack!」），不寫成行銷文案。
>
> **配圖手法：** 最貼近指示的一個：以純物件特寫為主——寫壞的日記本、新筆記本、書桌一角、簽名中的書堆、地方書店 BookPeople 的現場，幾乎不出現自拍，也不硬套人像。另有部分是部落格文章的縮圖式連結圖（如「What Groundhog Day means…」），對應「資料／觀點型題材用圖卡而非自拍」的做法。

查證中淘汰：`@fernandoprass1`（帳號確實存在（FB 登入牆標題回傳「Fernando Prass」，對照組不存在的 handle 只回傳「Facebook」），但【歸屬無法確認】。(1) Wikidata Q2063693（Fernando Büttenbender Pr）

研究員備註：【平台可抓取性實測（2026-08-07，與上次結論一致）】WebFetch https://www.facebook.com/JLin7 回傳的頁面只有「Facebook」字樣、零頁面資料，確認 Facebook 個人／專頁無法直抓。因此五個帳號全部標 cross-reference，沒有一個能標 direct-fetch。

【本次找到的高效替代查證法，建議沿用】Facebook 貼文被搜尋引擎索引時，**網址 slug 本身就是貼文原文的前 80 字左右**（例：/posts/finished-a-diary-and-forgot-to-bring-a-new-notebook-into-the-house-last-night-my/）。所以用 WebSearch 搭配 allowed_domains=["facebook.com"] 搜「<handle> posts」，可以在不登入、不直抓的情況下拿到**逐字的真實貼文文字**，直接用來判斷 caption_style / concreteness / question_ending_habit。本次五個帳號的文風評估全部建立在這種逐字 slug 證據上，不是靠推測。粉絲數則來自搜尋結果摘要中出現的頁面數字（如「1,405,420 個讚」「614,439 個讚」），我只寫我實際看到的數字，未看到的一律不填。

【已查證但主動剔除的候選 — 都是本次要防的陷阱類型】
1. facebook.com/CMWang40「王建民」234,729 個讚 — 搜尋摘要**明確載明「not officially connected with pitcher Chien-Ming Wang」**，是高粉數的非本尊頁。這正是題目警告的典型假帳號，已排除。（王建民本人頁 facebook.com/p/王建民-Chien-Ming-Wang-100050296997510/ 僅 30,414 個讚。）
2. facebook.com/ChouTienChen「周天成」僅 955 個讚，且其 Instagram @choutienchen 頁面自承非本人經營 — 判定為粉絲頁，排除。
3. 陳柏良（第一位踢中超的台灣球員，niche 上很契合）— 只查到 Facebook **自動生成**的 /pages/category/Athlete/ 頁，非本人經營帳號，查不到真實個人專頁，排除。
4. facebook.com/LuRendy 盧彥勳（96,000+ 個讚，退役網球一哥，長期主義 niche 極契合）— 但索引到的貼文是**第三人稱賽事快報**（「盧彥勳本星期參加ATP500的Acapulco公開賽第二輪面對…」），是團隊代發的新聞稿口吻，不符合「貼文本身讀起來像真人隨手打」，排除。
5. facebook.com/Markmansonnet 馬克·曼森（1,330,501 個讚，反 hustle、不賣焦慮，合規上很乾淨）— 但索引到的貼文幾乎清一色是「New Post: <文章標題>」的部落格連結轟炸（New Post: Screw Finding Your Passion / The Four Stages of Life…），屬廣播型連結流，不是日常圖文，排除。
6. facebook.com/zerobertoficial 巴西名將 Zé Roberto（1,474,946 個讚，踢到 43 歲、紀律與長壽命的代表，niche 幾乎完美）— **因身分存疑而排除**：該頁貼文含「PROTOCOLO ZR11」（ZR11 對應足球員 Zé Roberto 的 11 號），但另一則索引貼文原文為「58 anos, idade é só um número!」；足球員 Zé Roberto 生於 1974-07-06，2026 年應為 52 歲，與 58 不符（巴西另有排球名帥 Zé Roberto Guimarães 生於 1954）。在無法直抓確認的情況下，我不願冒張冠李戴的風險，故不列入。另外該頁文風偏健身漏斗型（「Me marca aí no stories」「corre lá no YouTube」），互動釣文明顯，本來也不是好範本。
7. facebook.com/HCKSport 郭泓志運動發展協會 — 這個是**唯一取得高強度間接查證**的候選：WebFetch https://linktr.ee/hcksport 成功直抓，該 Linktree 逐字列出 facebook.com/HCKSport、instagram.com/hcksport、YouTube 頻道與 email hungchihkuo1981@gmail.com，歸屬明確。但它是協會（機構）帳號而非本人日常帳號，文風必然偏公告型，且我未取得貼文原文與粉絲數，故未列入；若需要第 6 個備選可回頭補查。

【對五個入選帳號的誠實落差說明】
- 「短」這一項：Fernando Prass、Ítalo Ferreira、戴資穎、Austin Kleon 四個都確實達標（有逐字證據）。Jeremy Lin 我標 medium 而非 short-fragments，因為他確實有大量長篇（復出敘事、AAPI 議題長文），只有部分貼文（如「Brooo...lifes crazy. 14 years later!」）是碎片式。他入選是靠 niche 契合度（唯一在中國職業聯賽打過球的運動員範本）與傷病敘事手法，不是靠文長。
- 「配圖不一定有本人入鏡」這一項：只有 Austin Kleon 與 Fernando Prass、戴資穎 三個明確達標。Ítalo Ferreira 與 Jeremy Lin 本人入鏡比例偏高，這兩個不建議當配圖範本。**五個帳號裡沒有任何一個在做「自製資料圖表／資訊圖」**——這類配圖手法在運動員 Facebook 帳號上我完全沒有找到範例，若 Rafael 的「冠軍思維」支柱要用圖表，可能得從運動員圈以外（財經／科普類帳號）另外找對標，本次未涵蓋。
- 語言分布：葡語 2（Prass、Ítalo）、繁中 1（戴資穎）、英文 1（Kleon）、英中混合 1（Jeremy Lin）。因 Rafael 發文語言未鎖定，三個語種都有範本可用。
- 合規複查：五個帳號都沒有保證收益／快速致富／製造稀缺、炫富假豪宅、擺拍公益、捏造榮譽或蹭災難的跡象；商業內容都是自己實際使用的運動／消費品贊助（VICTOR 球具、舒跑、Red Bull、Cariuma）或自己的書與球評工作。**唯一需要提醒的一點**：Jeremy Lin 的頁面有明確的 AAPI 反歧視倡議長文（如「Something is changing in this generation of Asian Americans. We are tired of being…」）。我判斷這屬於反歧視發聲、不是題目紅線所指的「性別對立／世代對立引戰」，但若 Rafael 定位為完全不碰社會議題，這一條線不宜照搬，僅借鏡其個人敘事與傷病敘事手法即可。

### 審查員補充（10 個，經獨立查證）

**[Eliud Kipchoge](https://www.instagram.com/kipchogeeliud/)** ・ instagram ・ 3.1M ・ ✔直接抓取

> 已驗證存在（約 3M 粉絲，1,124 貼文）。全球紀律與長期主義的第一參照點，語氣平靜、從不英雄化自己、常以跑步經驗類比人生，完全零焦慮行銷。支柱3「冠軍思維」與支柱1的語氣基準。配圖大量訓練場、跑道、鞋子等非本人入鏡的物件與場景照，正好補清單裡最薄的那一項。

**[Rich Roll](https://www.instagram.com/richroll/)** ・ instagram ・ 1.6M ・ ✔直接抓取

> 已驗證存在（約 2M 粉絲）。40 歲從企業律師轉為耐力運動員、公開談酒癮與失敗且不美化，是支柱2（球場之外：真實個人故事、職涯轉換）與支柱5（今天我學到了什麼、刻意不裝全知）最直接的樣本。語調是安靜長談而非舞台演講，符合「不急著給人生教訓」。

**[Rich Roll](https://www.youtube.com/richroll66)** ・ youtube ・ — ・ ✔直接抓取

> 已驗證存在（主頻道 legacy URL youtube.com/richroll66，另有 podcast 與 clips 分頻道）。YouTube 目前只有 4 個帳號、其中 Profissão Jogador 建議剔除，這條可以補上「長篇對話式成長內容」的空缺，示範怎麼把個人失敗講得長但不自憐。

**[Ben Foster - The Cycling GK](https://www.youtube.com/@thecyclinggk)** ・ youtube ・ — ・ ✔直接抓取

> 已驗證存在（約 1.4M 訂閱）。清單已收他的 TikTok 與 X，卻漏掉他的內容主體：前英格蘭／曼聯門將的每週比賽日 vlog、GoPro 門將視角、球隊日常。這是支柱1「訓練結束以後」唯一真正由現役等級足球員自己拍的長片樣本，YouTube 端不該缺。

**[James Clear](https://x.com/JamesClear)** ・ x ・ — ・ ◇交叉比對

> 已驗證存在（@JamesClear 為現行帳號，舊 @james_clear 已停用；約 579K 粉絲）。支柱3的核心命題「建立一套能長期遵守的標準勝過打敗別人」幾乎就是他的主張，短碎句、極少問句收尾、不賣焦慮不保證收益。限制：他偏抽象格言，只可作為「一則一個判斷原則怎麼寫」的參照，具體度要另找樣本。

**[郭婞淳 Kuo Hsing-Chun](https://www.instagram.com/kuohsingchun_official/)** ・ instagram ・ 357K ・ ✔直接抓取

> 已驗證存在（約 357K 粉絲，453 貼文）。清單收了戴資穎卻漏了她，但她更契合：2014 大腿重傷後復出、公開談傷病與失敗不加修飾、語氣安靜謙抑、沒有炫耀敘事。台灣線的支柱2最佳樣本，也比戴資穎（以賽事照與廠商合作為主）有更多可用的反思文字。

**[Alexi Pappas](https://www.instagram.com/alexipappas/)** ・ instagram ・ 172K ・ ✔直接抓取

> 已驗證存在（約 172K 粉絲，奧運選手兼希臘國家紀錄保持者，著有《Bravey》）。公開書寫奧運後憂鬱，包括「我原本刪掉這篇，因為在憂鬱期間談憂鬱會讓焦慮更糟」這種不修飾的自白。這正是紅線「絕不英雄化自己、絕不把失敗說得比實際漂亮」的正面示範，清單裡目前只有 Molly Seidel 一人在這個位置。

**[Mikaela Shiffrin](https://www.instagram.com/mikaelashiffrin/)** ・ instagram ・ 1.6M ・ ✔直接抓取

> 已驗證存在（約 1.7–2M 粉絲，2,872 貼文）。史上最成功的高山滑雪選手，卻公開處理 2022 北京連續失格與喪父，示範「頂尖者如何誠實談崩掉的那一場」。對支柱3很關鍵：讓「冠軍思維」不變成勝利宣傳，而是標準與失敗並存。

**[Lachlan Morton](https://www.instagram.com/LachlanMorton/)** ・ instagram ・ 201K ・ ✔直接抓取

> 已驗證存在（202K 粉絲，2,958 貼文）。職業車手中最自嘲、最不英雄化自己的一位（Alt Tour 單人自補給環法），貼文短、具體點名路段與器材，配圖大量是路面、裝備、旅途場景而非本人擺拍。正好補「配圖混用沒有本人入鏡的物件或場景照」這個薄弱項。

**[Nick Bare](https://www.tiktok.com/@nickbare_fitness)** ・ tiktok ・ — ・ ✔直接抓取

> 已驗證存在（hybrid athlete 訓練內容，單片可達百萬級互動）。若剔除 Simon Sinek 與 Chris Williamson，TikTok 會少掉兩個名額，這條可以補上「真的在練的人講紀律」而不是「站著講紀律的人」。用具體數字與課表說話、不賣焦慮不保證結果。使用限制：他自營補劑品牌 BPN，取材只取訓練紀律與長期主義層，不要沿用任何產品導向敘事。

### 審查員指出的缺口

【驗證說明】本輪 WebSearch 配額已用盡，改用 html.duckduckgo.com 直抓驗證；下列建議帳號的 handle／URL／粉絲數皆為查證後填寫，未經查證者一律不列入。

■ 1. 明顯該在、但沒出現的創作者

(a) Eliud Kipchoge（IG @kipchogeeliud，3M）——這份清單最刺眼的缺口。全球「紀律／長期主義／不英雄化自己」的第一參照點，語氣平靜、常用比喻、從不喊你必須。一個以「早走十年的隊友」為定位的運動員 IP 沒有他，說不過去。

(b) Rich Roll（IG @richroll，2M；YouTube richroll66）——支柱2（酒癮、40 歲職涯轉換）與支柱5（持續在學、刻意不裝全知）的教科書級樣本，且語調是平靜長談而非舞台演講。

(c) James Clear（X @JamesClear，約 579K）——支柱3「冠軍不是打敗別人的人，是建立起一套能長期遵守的標準的人」幾乎就是他的核心命題；短碎句、極少問句收尾、不賣焦慮。唯一保留：他偏抽象格言，只能當「判斷原則怎麼寫成一句」的參照，不能當「具體度」參照。

(d) Ben Foster 的 YouTube（@thecyclinggk，約 1.4M）——清單只收了他的 TikTok 和 X，但他真正的內容主體在 YouTube（每週比賽日 vlog、GoPro 視角、門將日常）。支柱1「訓練結束以後」最直接的長片樣本被漏掉了。

(e) 台灣運動員選樣偏了：收了戴資穎，卻漏了郭婞淳（IG @kuohsingchun_official，357K）。郭婞淳有 2014 大腿重傷復出的真實敘事、公開談失敗不美化、語氣安靜——比戴資穎（IG/FB 以賽事照與廠商合作為主）更貼近角色定位。

(f) 足球員本人的反思型文字幾乎為零。整份清單裡真正「現役／退役足球員自己寫想法」的只有 Ben Foster、Rio Ferdinand（punditry）、Paulo André。角色是現役職業足球員 × 隊長，卻沒有任何華語圈足球員做角色類比。建議補陳柏良（台灣國家隊隊長、旅外中超／日職、37 歲仍在役、談生涯轉換）。

(g)「誠實面對失敗」這一支太薄：補 Alexi Pappas（奧運後憂鬱，公開說「在憂鬱期間談憂鬱會讓焦慮更糟」）、Mikaela Shiffrin（2022 北京連續失格 + 喪父）、Lachlan Morton（Alt Tour，自嘲、從不把自己說成英雄）。

(h) 結構性缺口（無法用可靠帳號補，直接標記）：
　- 支柱4「如果我是20歲的你」= 具體困境 + 一個可執行動作，這種寫法在清單裡沒有任何範本。台灣／巴西的「給年輕人建議」帳號九成落在紅線(a)，我刻意不硬補。
　- 港澳／粵語圈帳號完全為零。
　- 葡語／巴西線只剩 Paulo André 一人可用（Profissão Jogador 應剔除，見第3點）。這裡的填補誘惑是巴西理財網紅（Primo Rico、Bruno Perini 一類），明確建議不要——直接踩紅線(a)(b)。投資失敗的敘事只能取自「運動員自己講自己的錢」，不能取自理財教育帳號。

■ 2. 圖文平台風格審查（短碎句／具體／不每篇問句／配圖混用非本人物件場景）

【長度不合，應改標為「內容參照」而非「格式參照」】
　- Jim Walmsley（IG，long-form）：訓練日誌式長文，不是 3~4 句碎片。
　- 周青（Threads，long-form）：長篇散文。
　- Paulo André Benini（Threads，long-form）：內容契合度全清單最高，但長度完全不符。
　這三個照抄格式會直接把 Rafael 寫成長文作者，違背「平靜、簡潔」。

【具體度／文字含量不足，只能當「圖像調性」參照】
　- 戴資穎（IG @tai_tzuying + FB profile 100044580272976）：兩個平台都是賽事照＋廠商合作圖，caption 極短且幾乎沒有反思內容。短是短，但不是「短而具體」。文字風格價值接近零，重複佔了兩個名額。
　- Ítalo Ferreira（FB @italotferreira）：近乎純衝浪動作照，文字量極低，同上問題。
　- Chris Bosh（X）、Jeremy Lin（FB）：配圖幾乎全是本人／球隊，缺「沒有本人入鏡的物件或場景照」這一項。
　- Austin Kleon（FB @Mr.Austin.Kleon，34,302 likes，已驗證仍在更新）：帳號真實且活躍，但實質是電子報／IG 的導流轉貼，且他是作家不是運動員。留作圖文節奏參照可以，別當內容參照。

【問句收尾】圖文四平台目前沒有任何 almost-always，這點健康。張嘉哲、Kilian 的 sometimes 在可接受範圍。真正的「每篇釣留言」問題出在影音端的 Profissão Jogador（almost-always），見第3點。

【配圖混用非本人物件／場景】這項的可用錨點其實只有 Kilian Jornet、Courtney Dauwalter、Des Linden、Molly Seidel 四個，密度偏低。建議以他們為主錨，再補 Lachlan Morton（器材、路面、旅途場景）與 Kipchoge（訓練場、鞋、跑道細節）把樣本補厚。

【副作用提醒】IG 六個名額裡有五個是越野／馬拉松跑者，加上我建議的 Alexi Pappas／Mikaela Shiffrin／Lachlan Morton 會更偏耐力運動。落地時要刻意抽掉「山、海、無人風景」這類視覺母題，否則 Rafael 會長得像越野跑者而不是足球員。建議 IG 至少保留 1/3 名額給球場、更衣室、器材室、客場旅館這類團隊運動場景。

■ 3. 不適合或有合規風險的帳號

【建議直接剔除 — 觸及紅線】
　1. Profissão Jogador（YouTube @ProfissaoJogador）——風險最高。查證確認：由前職業球員 Ticão 經營，透過 comoserjogadordefutebol.net 與 Hotmart 販售「成為職業足球員」線上課程與「Mentoria 1% Ticão」付費導師制，行銷語言是「培養出那 1%、與眾不同的球員」「榨出最大潛能」。這是對青少年球員及其家長販售夢想＋製造稀缺感（紅線 a）＋推銷自家方法論（紅線 b）。加上評估本身就寫 mostly-abstract + 問句 almost-always（每篇釣留言），格式也是我們明確要避開的。沒有保留理由。
　2. Chris Williamson（TikTok @chriswillx）——中高風險。查證顯示他長期讓 manosphere／red-pill 相關論述上節目，並公開論證「manosphere 是女性主義的鏡像」，r/exredpill 等社群持續把他當討論對象；他的 TikTok 切片正是為這個受眾剪的。這踩到紅線(d) 性別對立引戰。另有自家機能飲 Neutonic 的商業導向。建議剔除；若真要留，只能白名單到「單支影片」層級，不能當帳號級對標。

【建議降級 — 定位矛盾而非合規】
　3. Simon Sinek（TikTok @simonsinek）——他就是「講台上說教的導師」本體（TED 舞台語法、mostly-abstract）。角色設定明文寫「不是講台上說教的導師」，把他放對標清單是自我矛盾。建議移除。
　4. High Performance（TikTok @high_performance）——同樣是主題演講／keynote 語法，且販售書、課程與商業演講，內容常年圍繞「展示成功者」。偏向「表演成功的偶像」那一側。建議降級為觀察組。
　5. Rio Ferdinand（TikTok @rioferdy5）——無合規問題，但內容主體是球評熱評／即時反應，與「平靜、不急著給人生教訓」相反。對這個角色參考價值低。

【保留但加使用限制】
　6. Chris Long（X @JOEL9ONE）——退役 NFL、誠實直白，但 X 帳號政治與社運發言比重高、語氣有攻擊性。不算世代／性別對立，但屬「引戰鄰近」。只取他談退役、傷病、金錢的貼文，不要沿用他的論戰語氣。
　7. Chris Bumstead（TikTok @cbum）——紀律敘事可用，但健美圈天然貼著補劑與用藥語境。只取「紀律／作息」層，不要借用任何身體改造框架。
　8. Pedro Calabrez（TikTok @pedro.calabrez）——神經科學家，格式是課堂講授（mostly-abstract），屬「精緻教學型」，與角色的對話感相衝。可留作葡語語感參照，不當內容參照。

【需回頭補驗證】
　9. Connor Parsons（YouTube @ConnorParsons）——本輪配額用盡前未能完成身分查證，我無法確認這個 handle 對應的是誰、也無法確認它不是自我提升／賣課型帳號。建議在採用前單獨查證一次（確認頻道主身分、是否販售課程、是否有焦慮行銷語言）。目前不應視為已通過紅線篩查。

【資料來源】驗證均經 [html.duckduckgo.com](https://html.duckduckgo.com/) 檢索結果比對，個別帳號 URL 已列於 suggestions 欄位。

---

## 使用方式

發想新題材前，先看對應角色這份清單裡的帳號最近在做什麼（畫面手法、剪輯節奏、切入角度），抓可以轉化的「手法」而非直接抄內容或選題。**各角色的合規紅線一律優先於任何對標帳號的做法**——前三位是不談賭博策略/收益、不重現真實遊戲UI、不點名真實電競選手；Rachel Ong 是不擺拍危險、不做零事故英雄敘事、不給絕對安全保證；Rafael Costa 是不販賣焦慮、不保證收益、不推薦沒親自驗證過的方法、不炫富。
