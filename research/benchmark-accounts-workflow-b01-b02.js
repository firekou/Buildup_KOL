export const meta = {
  name: 'benchmark-accounts-research-b01-b02',
  description: 'Find + adversarially verify 3 real benchmark KOL accounts per platform for Rachel Ong (B01) and Rafael Costa (B02)',
  phases: [
    { title: 'Research', detail: '1 agent per persona-platform unit, over-provisions 5 candidates' },
    { title: 'Verify', detail: '2 independent adversarial fact-checkers per unit, strict AND rule' },
    { title: 'Topup', detail: 'refill units left with fewer than 3 confirmed accounts' },
    { title: 'Critic', detail: 'per-persona completeness review + verification of its suggestions' },
  ],
}

const TODAY = '2026-08-07'

const PERSONAS = [
  {
    key: 'rachel-ong',
    nick: 'Rachel',
    name: 'Rachel Ong / 王瑞秋（Project B01）',
    positioning: '「邊界感」型高海拔登山向導。**不是**征服敘事的冒險家，而是風險管理與節制的敘事——她的存在是允許人說「今天不上」、在登頂前轉身，並相信那不是失敗。四個內容支柱：（1）轉身時刻——真實案例：為什麼這次選擇下撤，把小眾運動翻譯成近乎普世的人生問題（什麼時候繼續、什麼時候放手）；（2）山徑日誌——每趟遠征的決策/過程紀錄，扎實有細節、紀錄片感，不是精華剪輯，會展示真正的天氣窗計算與做決定的那一刻；（3）給平地人的山間道理——把登山術語直譯成人生原則（高山症、天氣窗、繩隊、固定點、登頂窗口），溫暖、格言式、高分享性；（4）深夜筆記本——低光獨白碎片（疲憊、自我懷疑、家人來電），刻意少用。語氣：慢、平、簡省；從不說「這絕對安全」；用隊員的名字而不是籠統的「大家」。',
    locale: '新加坡華人，34歲女性。英文母語級、中文流利（家庭語言）、尼泊爾語會話。長期在遠征中，一年待在新加坡不到3個月。**發文語言尚未鎖定**（這個人設還沒發布過任何內容），所以英文帳號與中文帳號都可以對標，但請在 primary_language 欄位註明該帳號主要用什麼語言。',
    redlines: '絕對不可對標：（a）為了流量擺拍危險動作、誇大難度、表演極限的帳號；（b）把自己包裝成「零事故傳奇」的個人英雄敘事帳號；（c）會給「這絕對安全」這類絕對保證的帳號。要找的是願意公開講下撤決定、講失敗判斷、講風險管理過程的帳號——重點永遠是「判斷與節制」，不是「征服與極限」。',
  },
  {
    key: 'rafael-costa',
    nick: 'Rafael',
    name: 'Rafael Costa / Captain / 拉斐爾·科斯塔（Project B02）',
    positioning: 'Captain — 現役職業足球運動員 × 長期主義成長陪伴型 IP。**不是**講台上說教的導師，也不是表演成功的偶像，而是「早走十年的隊友」。五個內容支柱：（1）訓練結束以後——從當天訓練/比賽/隊友互動的一個小片段，帶出一個關於選擇、紀律、金錢或成長的點，對話感而非演講；（2）球場之外——真實個人故事：傷病、一次投資失敗、語言障礙、家庭、職涯轉換；原則是絕不英雄化自己、絕不把失敗說得比實際漂亮；（3）冠軍思維——一篇一個判斷原則（冠軍不是打敗別人的人，是建立起一套能長期遵守的標準的人）；（4）如果我是20歲的你——一個具體困境，結尾給一個可執行動作；（5）今天我學到了什麼——展示自己還在成長，刻意不裝全知。語氣：平靜、簡潔、有力、不急著給人生教訓，常用足球經驗與比喻解釋人生；偏好「如果我是今天的你，我會先考慮…」而不是「你必須…」。',
    locale: '巴西人，30歲男性，長期定居中國（目前與中國職業俱樂部有合約）。葡萄牙語母語、中文流利、英文工作級、西語基礎。**發文語言尚未鎖定**（這個人設還沒發布過任何內容），中文、英文、葡語帳號都可以對標，請在 primary_language 欄位註明該帳號主要用什麼語言。',
    redlines: '絕對不可對標（這是不可妥協的紅線）：（a）任何販賣焦慮、保證收益、製造稀缺感、教人快速致富的帳號；（b）推薦自己沒用過/沒驗證過的賺錢方法或投資標的的帳號；（c）炫富、假豪宅生活、擺拍公益、利用貧困兒童賣慘的帳號；（d）捏造榮譽成就、蹭災難新聞流量、性別對立／世代對立引戰的帳號。要找的是真實的現役或退役運動員、或以長期主義／紀律／誠實面對失敗為核心而**不賣焦慮**的成長型帳號。',
  },
]

const PLATFORMS = [
  { key: 'youtube', name: 'YouTube', mode: '長影音與 Shorts 短影音為主，可對標製作精良的深度拆解/敘事型頻道。', dailyFeel: false, fetchable: true },
  { key: 'tiktok', name: 'TikTok', mode: '純短影音，節奏快、鉤子前置。', dailyFeel: false, fetchable: true },
  { key: 'instagram', name: 'Instagram', mode: '圖文貼文與 Reels 短影音並重。請同時考慮「圖文貼文寫法」與「Reels 影音手法」兩種對標價值。', dailyFeel: true, fetchable: false },
  { key: 'x', name: 'X（Twitter）', mode: '以文字為主的短貼文，偶爾配圖。', dailyFeel: true, fetchable: true },
  { key: 'threads', name: 'Threads', mode: '以文字為主、語氣最口語隨性的平台，接近隨手記錄的日常對話感。', dailyFeel: true, fetchable: false },
  { key: 'facebook', name: 'Facebook', mode: '文字＋圖片＋影片混合，貼文篇幅可較長。', dailyFeel: true, fetchable: false },
]

const ACCOUNT_SCHEMA = {
  type: 'object',
  properties: {
    accounts: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          handle: { type: 'string' },
          url: { type: 'string' },
          followers: { type: 'string' },
          primary_language: { type: 'string' },
          verify_tier: { type: 'string', enum: ['direct-fetch', 'cross-reference'] },
          verified_how: { type: 'string' },
          niche_match: { type: 'string' },
          imitation_points: { type: 'string' },
          is_org_account: { type: 'boolean' },
          everyday_feel: { type: 'boolean' },
          caption_style: { type: 'string', enum: ['short-fragments', 'medium', 'long-form', 'n/a'] },
          concreteness: { type: 'string', enum: ['names-specifics', 'mostly-abstract', 'n/a'] },
          question_ending_habit: { type: 'string', enum: ['rarely', 'sometimes', 'almost-always', 'n/a'] },
          image_approach: { type: 'string' },
        },
        required: ['name', 'handle', 'url', 'followers', 'primary_language', 'verify_tier', 'verified_how', 'niche_match', 'imitation_points', 'is_org_account', 'everyday_feel', 'caption_style', 'concreteness', 'question_ending_habit', 'image_approach'],
      },
    },
    notes: { type: 'string' },
  },
  required: ['accounts', 'notes'],
}

const VERDICT_SCHEMA = {
  type: 'object',
  properties: {
    verdicts: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          handle: { type: 'string' },
          verdict: { type: 'string', enum: ['CONFIRMED', 'REFUTED'] },
          verify_tier: { type: 'string', enum: ['direct-fetch', 'cross-reference', 'none'] },
          reason: { type: 'string' },
          observed_followers: { type: 'string' },
        },
        required: ['handle', 'verdict', 'verify_tier', 'reason', 'observed_followers'],
      },
    },
  },
  required: ['verdicts'],
}

const CRITIC_SCHEMA = {
  type: 'object',
  properties: {
    gaps: { type: 'string' },
    suggestions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          platform_key: { type: 'string' },
          name: { type: 'string' },
          handle: { type: 'string' },
          url: { type: 'string' },
          why: { type: 'string' },
        },
        required: ['platform_key', 'name', 'handle', 'url', 'why'],
      },
    },
  },
  required: ['gaps', 'suggestions'],
}

// 這段是本次新增的關鍵指示：把 2026-08-07 定案的圖文風格寫成研究員的挑選判準
const CAPTION_STYLE_RULE = [
  '重要（本次研究的關鍵指示）：這個平台以文字／圖文為主。要找的是**貼文本身讀起來像真人隨手打的**帳號，不是精緻的教學／權威型深度內容。',
  '具體要符合以下這套「已經定案」的圖文風格，請據此挑選帳號，並在回報欄位裡據實評估（不要為了迎合指示亂標）：',
  '（1）**短** — 3~4 個碎片短句就結束。不是長篇小論文，也不是「起承轉合」的小故事（鋪陳→發現→反應→反思那種結構要避開）。→ 對應 caption_style 欄位。',
  '（2）**具體不抽象** — 會直接點名真實的數字、地名、產品、當季物、人名，而不是停在泛泛的觀察。例如講市場會直接點出標的代號與實際金額；講生活會說出人在哪個城市、當季在吃什麼水果。「最近某個議題很熱在吵」這種沒有specifics的寫法就是反例。→ 對應 concreteness 欄位。',
  '（3）**不是每篇都用問句收尾** — 很多篇就是講完一個心情或觀察就停，不刻意釣留言。每篇都用「你們覺得呢」收尾的帳號反而不是好範本。→ 對應 question_ending_habit 欄位。',
  '（4）**配圖不一定有本人入鏡** — 會混用純物件特寫、純場景照（完全沒有人）；資料型題材會用圖表／資訊圖／明顯後製合成的縮圖式圖片，而不是硬套一張自拍。→ 對應 image_approach 欄位，請具體描述該帳號的配圖手法。',
  '像 3Blue1Brown、Fireship、Two Minute Papers、StatQuest 這類製作精良的教學頻道，是很好的「影音」範本，但對這種鬆散的日常圖文格式來說太精緻、太像上課，不適合當範本。要找的是「本人貼文語氣就很生活化」的創作者。',
].join('\n')

const VIDEO_STYLE_RULE = [
  '這個平台以影音為主，可以且應該對標製作精良的教學／拆解／敘事型帳號，重點放在鏡頭語言、剪輯節奏、敘事結構。',
  'caption_style／concreteness／question_ending_habit 三個欄位若不適用於影音帳號，請填 "n/a"；但如果該帳號的影片說明欄或貼文也有明顯風格，就照實評估。',
  'image_approach 欄位請改寫「畫面／縮圖手法」：例如是否大量使用實拍B-roll、是否用圖表疊加、縮圖是否明顯後製合成。',
].join('\n')

const FETCHABILITY_RULE = [
  '【平台可抓取性 — 這是上一次執行（2026-08-06）的實測經驗，請據此調整方法，不要重複踩坑】',
  '- **YouTube／X／TikTok**：可以直接抓取個人頁並解析出真實資料（頻道標題、簡介、訂閱/粉絲數）。請優先直接抓取，verify_tier 標 `direct-fetch`。',
  '- **Instagram**：匿名請求會被擋掉（回 401 require_login），抓不到頁面內容。',
  '- **Threads**：只會拿到純 JS 殼，抓不到內容，而且搜尋引擎對 Threads 個人檔案的索引極度稀疏——上次3個人設裡有2個在這個平台一個帳號都查不到。',
  '- **Facebook**：同樣抓不到（回 400 或 JS 殼）。',
  '這三個抓不到的平台，請改用可靠的間接查證：創作者自己官網／Linktree／個人網站上列出的社群連結、搜尋引擎回傳的個人檔案索引摘要（標題+粉絲數+bio），並盡量用「同一個 handle 在可直接抓取的平台上已確認為本人」來互相印證（例如 bio 文字逐字吻合）。這種情況 verify_tier 標 `cross-reference`，並在 verified_how 裡寫清楚你實際做了什麼、看到什麼。',
  '**絕對不可以用「Threads handle 通常等於 Instagram handle」這類推論去補足**——那是未經查證的推測，正是本次研究要防的張冠李戴。查不到就誠實回報數量不足。',
  '上次被雙重查核攔下的典型假帳號長這樣，請特別警覺同類型陷阱：TikTok `@baldandbankrupt` 只有175粉、簡介自承「不是本尊」；X `@JacobGeller` 是同名的西語執業律師；YouTube `@LiYongLe` 其實是翡翠賣家；還有一堆知名創作者的同名 handle 在別的平台只有1~3個粉絲，是被佔用的空帳號。',
].join('\n')

function researchPrompt(p, plat, n, exclude) {
  const styleRule = plat.dailyFeel ? CAPTION_STYLE_RULE : VIDEO_STYLE_RULE
  const excludeRule = exclude && exclude.length
    ? '\n已經查證過、請不要重複回報的 handle：' + exclude.join('、') + '。請找**不同的**帳號。\n'
    : ''
  return [
    '你是一位社群內容研究員。今天是 ' + TODAY + '。',
    '',
    '任務：為一個虛擬 KOL 角色，在指定平台上找出 ' + n + ' 個「真實存在」的真人 KOL／創作者帳號，作為內容手法的對標範本（只借鏡手法，不抄內容，也不代表該帳號與這個角色有任何關聯或合作）。',
    '',
    '【角色設定】',
    '代號：' + p.nick + '（' + p.name + '）',
    '定位：' + p.positioning,
    '所在地／語言：' + p.locale,
    '合規紅線：' + p.redlines,
    '',
    '【平台】' + plat.name,
    '內容型態：' + plat.mode,
    styleRule,
    '',
    FETCHABILITY_RULE,
    excludeRule,
    '【嚴格要求 — 違反就等於任務失敗】',
    '1. **絕對不可以編造帳號、handle、網址或粉絲數。** 只回報你真的用 WebSearch／WebFetch 查證過、確實存在的帳號。',
    '2. 每個帳號都要附上你實際查證過的完整網址，以及你怎麼查證的（用了什麼搜尋詞、抓了哪個頁面、看到什麼字），寫在 verified_how。',
    '3. 粉絲／訂閱數：只寫你查證過程中真的看到的數字，並註明來源與大約時間。查不到就寫 "—"，不要猜、不要估。',
    '4. 如果找不到 ' + n + ' 個符合條件又確實存在的帳號，就只回報你真的找到的數量，並在 notes 說明原因。**寧可少報，也絕對不要湊數編造。**',
    '5. 排除：違反上面合規紅線的帳號、成人內容、詐騙或割韭菜帳號。',
    '6. 如果某個帳號是機構／官方帳號而不是個人創作者，照樣可以回報，但 is_org_account 要標 true。',
    '7. everyday_feel：這個帳號的貼文語氣是否偏「隨手記錄的日常感」（true）還是「精緻製作的教學／權威型」（false）。誠實標記。',
    '8. primary_language：這個帳號主要用什麼語言發文（例如 English／中文（簡體）／中文（繁體）／Português／混合）。',
    '',
    '請找 ' + n + ' 個候選（刻意多找幾個，因為後面會有嚴格查證淘汰）。imitation_points 要寫**具體可操作**的手法（例如「開場先講自己此刻的猶豫再進入決策過程」），不要寫「內容優質」「風格自然」這種空泛形容詞。',
  ].join('\n')
}

function verifyPrompt(plat, candidates, seed) {
  const list = candidates.map(function (c, i) {
    return (i + 1) + '. name=' + c.name + ' ／ handle=' + c.handle + ' ／ url=' + c.url + ' ／ 聲稱粉絲數=' + c.followers
  }).join('\n')
  return [
    '你是一位嚴格的事實查核員（查核員編號 ' + seed + '）。今天是 ' + TODAY + '。你的任務是**試圖推翻**以下研究結果，不是幫它背書。',
    '',
    '有人聲稱以下帳號在 ' + plat.name + ' 上真實存在。你的預設立場是懷疑，特別要抓出兩種錯誤：',
    '（a）**憑空編造的 handle**（看起來合理但實際不存在）；',
    '（b）**張冠李戴**（把某平台上存在的帳號，硬說成在 ' + plat.name + ' 上也是這個 handle；或是同名不同人）。',
    '',
    '【待查核清單】',
    list,
    '',
    '對每一個帳號，請獨立用 WebSearch／WebFetch 查證：',
    '1. 這個 handle 在 ' + plat.name + ' 上是否真的存在？（實際去抓該平台網址，或用搜尋交叉確認）',
    '2. 網址是否正確、指向的確實是所聲稱的那位創作者？粉絲數極少（個位數到數百）卻聲稱是知名創作者的，幾乎都是被佔用的空帳號或冒名帳號——要抓出來。',
    '3. 聲稱的粉絲數有沒有依據？明顯誇大或查無依據要標出來。',
    '4. 內容領域是否真的跟聲稱的相符？顯示名稱／bio 是否與該創作者的身分一致？',
    '',
    '【verify_tier 判定】',
    '- 你自己實際抓到該平台頁面並讀到資料 → `direct-fetch`',
    '- 該平台擋匿名抓取（Instagram / Threads / Facebook），你改用創作者官網/Linktree/搜尋索引摘要+跨平台同handle互證 → `cross-reference`',
    '- 完全無法查證 → `none`（此時 verdict 必須是 REFUTED）',
    '',
    '【判定規則 — 非常重要】',
    '- 只有在你能**獨立確認該帳號確實存在於 ' + plat.name + ' 且歸屬正確**時，才給 CONFIRMED。',
    '- 只要有任何一項無法確認，或查到的資訊與聲稱不符，就給 REFUTED 並說明理由。',
    '- **不確定就一律給 REFUTED。** 寧可誤殺真帳號，也絕不能讓編造或冒名的帳號通過。',
    '',
    '回報每個帳號的 verdict、verify_tier、reason，以及你查證時實際看到的粉絲數（沒看到就寫 "—"）。handle 欄位請原樣抄回，方便比對。',
  ].join('\n')
}

const UNITS = []
for (const p of PERSONAS) {
  for (const plat of PLATFORMS) {
    UNITS.push({ p: p, plat: plat })
  }
}

log('開始研究：' + PERSONAS.length + ' 個人設 × ' + PLATFORMS.length + ' 個平台 = ' + UNITS.length + ' 個單位，每單位目標 3 個經雙重查證的帳號')
log('本次新增判準：圖文平台會額外評估 貼文長度／具體度／問句收尾習慣／配圖手法 四個欄位')

function strictConfirm(candidates, v1, v2) {
  const ok = {}
  const reasons = {}
  const observed = {}
  const tiers = {}
  for (const v of [v1, v2]) {
    if (!v || !v.verdicts) continue
    for (const d of v.verdicts) {
      const h = (d.handle || '').trim().toLowerCase()
      if (!h) continue
      if (!(h in ok)) ok[h] = 0
      if (d.verdict === 'CONFIRMED') ok[h] = ok[h] + 1
      else reasons[h] = d.reason
      if (d.observed_followers && d.observed_followers !== '—' && !observed[h]) observed[h] = d.observed_followers
      if (d.verify_tier && d.verify_tier !== 'none' && !tiers[h]) tiers[h] = d.verify_tier
    }
  }
  const confirmed = []
  const dropped = []
  for (const c of candidates) {
    const h = (c.handle || '').trim().toLowerCase()
    if (ok[h] === 2) {
      const enriched = {}
      for (const k in c) enriched[k] = c[k]
      if (observed[h]) enriched.observed_followers = observed[h]
      if (tiers[h]) enriched.verify_tier = tiers[h]
      confirmed.push(enriched)
    } else {
      dropped.push({ handle: c.handle, name: c.name, votes: ok[h] || 0, reason: reasons[h] || '未通過雙重查證' })
    }
  }
  return { confirmed: confirmed, dropped: dropped }
}

const unitResults = await pipeline(
  UNITS,
  function (u) {
    return agent(researchPrompt(u.p, u.plat, 5, null), {
      label: 'research:' + u.p.nick + ':' + u.plat.key,
      phase: 'Research',
      schema: ACCOUNT_SCHEMA,
    })
  },
  function (res, u) {
    if (!res || !res.accounts || !res.accounts.length) {
      return { u: u, confirmed: [], dropped: [], notes: (res && res.notes) || '研究階段沒有回報任何候選帳號' }
    }
    return parallel([
      function () {
        return agent(verifyPrompt(u.plat, res.accounts, 'A'), {
          label: 'verifyA:' + u.p.nick + ':' + u.plat.key,
          phase: 'Verify',
          schema: VERDICT_SCHEMA,
        })
      },
      function () {
        return agent(verifyPrompt(u.plat, res.accounts, 'B'), {
          label: 'verifyB:' + u.p.nick + ':' + u.plat.key,
          phase: 'Verify',
          schema: VERDICT_SCHEMA,
        })
      },
    ]).then(function (vs) {
      const out = strictConfirm(res.accounts, vs[0], vs[1])
      return { u: u, confirmed: out.confirmed, dropped: out.dropped, notes: res.notes || '' }
    })
  },
  function (r, u) {
    if (r.confirmed.length >= 3) return r
    const tried = r.confirmed.concat(r.dropped).map(function (x) { return x.handle })
    return agent(researchPrompt(u.p, u.plat, 4, tried), {
      label: 'topup:' + u.p.nick + ':' + u.plat.key,
      phase: 'Topup',
      schema: ACCOUNT_SCHEMA,
    }).then(function (extra) {
      if (!extra || !extra.accounts || !extra.accounts.length) return r
      return agent(verifyPrompt(u.plat, extra.accounts, 'T'), {
        label: 'verifyT:' + u.p.nick + ':' + u.plat.key,
        phase: 'Topup',
        schema: VERDICT_SCHEMA,
      }).then(function (tv) {
        const out = strictConfirm(extra.accounts, tv, tv)
        return {
          u: u,
          confirmed: r.confirmed.concat(out.confirmed),
          dropped: r.dropped.concat(out.dropped),
          notes: (r.notes ? r.notes + ' ／ ' : '') + '補件輪：' + ((extra.notes) || ''),
        }
      })
    })
  }
)

const clean = unitResults.filter(Boolean)
let totalConfirmed = 0
let totalDropped = 0
for (const r of clean) {
  totalConfirmed = totalConfirmed + r.confirmed.length
  totalDropped = totalDropped + r.dropped.length
}
log('查證完畢：' + totalConfirmed + ' 個帳號通過雙重查證，' + totalDropped + ' 個被淘汰（含編造/冒名/無法確認）')

for (const r of clean) {
  if (r.confirmed.length < 3) {
    log('⚠ 未湊滿3個：' + r.u.p.nick + ' / ' + r.u.plat.name + ' 只有 ' + r.confirmed.length + ' 個通過查證')
  }
}

phase('Critic')

const byPersona = {}
for (const p of PERSONAS) byPersona[p.key] = []
for (const r of clean) byPersona[r.u.p.key].push(r)

const criticResults = await parallel(PERSONAS.map(function (p) {
  return function () {
    const summary = byPersona[p.key].map(function (r) {
      const accs = r.confirmed.map(function (a) {
        return a.name + '(' + a.handle + ', ' + (a.caption_style || 'n/a') + '/' + (a.concreteness || 'n/a') + '/問句:' + (a.question_ending_habit || 'n/a') + ')'
      }).join('、') || '（無）'
      return '- ' + r.u.plat.name + '：' + accs
    }).join('\n')
    const prompt = [
      '你是一位內容策略審查員。今天是 ' + TODAY + '。',
      '',
      '以下是為虛擬 KOL 角色「' + p.nick + '（' + p.name + '）」找到的對標帳號清單，已經通過存在性的雙重查證。括號裡是該帳號的 貼文長度／具體度／問句收尾習慣 評估。',
      '角色定位：' + p.positioning,
      '合規紅線：' + p.redlines,
      '',
      '【目前清單】',
      summary,
      '',
      '請批判性檢視：這份清單漏了什麼？具體要回答：',
      '1. 有沒有這個垂直領域裡「明顯該在清單上、但沒出現」的知名創作者？',
      '2. 文字／圖文平台（Instagram、X、Threads、Facebook）的帳號，是否真的符合我們要的圖文風格——**短（3~4個碎片短句）、具體（點名真實數字/地名/產品）、不是每篇都用問句收尾、配圖會混用沒有本人入鏡的物件或場景照**？如果清單裡的帳號偏回「精緻教學型」或「每篇都釣留言」，請明確指出是哪幾個，並建議該找什麼樣的替代帳號。',
      '3. 清單裡有沒有其實不太適合、或有合規風險（違反上面紅線）的帳號？',
      '',
      '如果你要建議補充帳號，**必須先用 WebSearch／WebFetch 確認該帳號真的存在**，並附上你查證過的完整網址。絕對不要憑印象寫出可能不存在的 handle。沒有可靠建議就回傳空的 suggestions 陣列。',
      'platform_key 請用這些值之一：youtube / tiktok / instagram / x / threads / facebook。',
    ].join('\n')
    return agent(prompt, { label: 'critic:' + p.nick, phase: 'Critic', schema: CRITIC_SCHEMA })
      .then(function (c) { return { personaKey: p.key, critic: c } })
  }
}))

const criticVerified = await parallel(criticResults.filter(Boolean).map(function (cr) {
  return function () {
    const sugg = (cr.critic && cr.critic.suggestions) || []
    if (!sugg.length) return { personaKey: cr.personaKey, gaps: (cr.critic && cr.critic.gaps) || '', added: [] }
    const asCandidates = sugg.map(function (s) {
      return { name: s.name, handle: s.handle, url: s.url, followers: '—', platform_key: s.platform_key, why: s.why }
    })
    const platName = '多平台（見各筆 url）'
    return agent(verifyPrompt({ name: platName }, asCandidates, 'C'), {
      label: 'verifyCritic:' + cr.personaKey,
      phase: 'Critic',
      schema: VERDICT_SCHEMA,
    }).then(function (v) {
      const okSet = {}
      const tierSet = {}
      if (v && v.verdicts) {
        for (const d of v.verdicts) {
          if (d.verdict === 'CONFIRMED') {
            okSet[(d.handle || '').trim().toLowerCase()] = d.observed_followers || '—'
            tierSet[(d.handle || '').trim().toLowerCase()] = d.verify_tier || 'cross-reference'
          }
        }
      }
      const added = asCandidates.filter(function (c) { return (c.handle || '').trim().toLowerCase() in okSet })
        .map(function (c) {
          const o = {}
          for (const k in c) o[k] = c[k]
          const h = (c.handle || '').trim().toLowerCase()
          o.observed_followers = okSet[h]
          o.verify_tier = tierSet[h]
          return o
        })
      return { personaKey: cr.personaKey, gaps: (cr.critic && cr.critic.gaps) || '', added: added }
    })
  }
}))

let addedCount = 0
for (const c of criticVerified.filter(Boolean)) addedCount = addedCount + c.added.length
log('審查階段：新增 ' + addedCount + ' 個經查證的補充帳號')

return {
  generated: TODAY,
  scope: 'Rachel Ong (B01) + Rafael Costa (B02)',
  units: clean.map(function (r) {
    return {
      persona_key: r.u.p.key,
      persona_nick: r.u.p.nick,
      persona_name: r.u.p.name,
      platform_key: r.u.plat.key,
      platform_name: r.u.plat.name,
      platform_daily_feel: r.u.plat.dailyFeel,
      confirmed: r.confirmed,
      dropped: r.dropped,
      notes: r.notes,
    }
  }),
  critics: criticVerified.filter(Boolean),
  stats: { total_confirmed: totalConfirmed, total_dropped: totalDropped, critic_added: addedCount },
}
