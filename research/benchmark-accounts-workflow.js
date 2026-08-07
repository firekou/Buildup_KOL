export const meta = {
  name: 'benchmark-accounts-research',
  description: 'Find + adversarially verify 3 real benchmark KOL accounts per platform for each of 3 Buildup_KOL personas',
  phases: [
    { title: 'Research', detail: '1 agent per persona-platform unit, over-provisions 5 candidates' },
    { title: 'Verify', detail: '2 independent adversarial fact-checkers per unit, strict AND rule' },
    { title: 'Topup', detail: 'refill units left with fewer than 3 confirmed accounts' },
    { title: 'Critic', detail: 'per-persona completeness review + verification of its suggestions' },
  ],
}

const TODAY = '2026-08-05'

const PERSONAS = [
  {
    key: 'xiaoxiao-tan',
    nick: '賭博哥',
    name: 'Tan XiaoXiao / 陳曉曉',
    positioning: '機率／規則研究者。冷靜、理性，把規則、機率、博弈結構本身講清楚，重點永遠是「規則/結構為什麼有趣」與「拆穿直覺錯覺」，不是教人怎麼贏。內容公式常是「大家覺得是這樣，其實機率上不是」。',
    locale: '馬來西亞華人，居吉隆坡，貼文用簡體中文',
    redlines: '絕對不可對標以賭博攻略、投注技巧、教你贏錢、賭場推廣、收益展示為核心的帳號。只能對標「講機率/規則/決策結構本身」的知識型或觀察型帳號。',
  },
  {
    key: 'faye-tan',
    nick: '旅遊姊',
    name: 'Faye Tan / 陳曉菲',
    positioning: '世界／城市觀察者。手持自拍走路視角，觀察城市與旅行中的小細節與生活紋理，不是打卡導覽或必去景點清單型內容。強調隨性真實、不追求完美旅遊博主形象。',
    locale: '新加坡人，貼文用簡體中文',
    redlines: '不對標純業配導覽、豪華炫耀式旅遊、或以景點打卡清單為主體的帳號。',
  },
  {
    key: 'loima-cheung',
    nick: '遊戲哥',
    name: 'Zhang Qinfeng / 張秦峰',
    positioning: '數位／遊戲體驗觀察者。研究 AI、電影、遊戲設計背後「為什麼有效」的設計心理與體驗結構，例如成癮設計、獎勵機制、鏡頭語言。',
    locale: '馬來西亞華人，居吉隆坡，貼文用簡體中文',
    redlines: '絕對不可對標博弈玩法/收益類帳號。也避免會需要重現真實遊戲UI或點名真實電競選手的帳號做法。',
  },
]

const PLATFORMS = [
  { key: 'youtube', name: 'YouTube', mode: '長影音與 Shorts 短影音為主，可對標製作精良的深度拆解/教學型頻道。', dailyFeel: false },
  { key: 'tiktok', name: 'TikTok', mode: '純短影音，節奏快、鉤子前置。', dailyFeel: false },
  { key: 'instagram', name: 'Instagram', mode: '圖文貼文與 Reels 短影音並重。請同時考慮「圖文貼文寫法」與「Reels 影音手法」兩種對標價值。', dailyFeel: true },
  { key: 'x', name: 'X（Twitter）', mode: '以文字為主的短貼文，偶爾配圖。', dailyFeel: true },
  { key: 'threads', name: 'Threads', mode: '以文字為主、語氣最口語隨性的平台，接近隨手記錄的日常對話感。', dailyFeel: true },
  { key: 'facebook', name: 'Facebook', mode: '文字＋圖片＋影片混合，貼文篇幅可較長。', dailyFeel: true },
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
          verified_how: { type: 'string' },
          niche_match: { type: 'string' },
          imitation_points: { type: 'string' },
          is_org_account: { type: 'boolean' },
          everyday_feel: { type: 'boolean' },
        },
        required: ['name', 'handle', 'url', 'followers', 'verified_how', 'niche_match', 'imitation_points', 'is_org_account', 'everyday_feel'],
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
          reason: { type: 'string' },
          observed_followers: { type: 'string' },
        },
        required: ['handle', 'verdict', 'reason', 'observed_followers'],
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

function researchPrompt(p, plat, n, exclude) {
  const dailyRule = plat.dailyFeel
    ? '重要（這是本次研究的關鍵指示）：這個平台以文字／圖文為主。請**優先找「日常感」強的帳號**——它的貼文本身讀起來像真人隨手打的個人生活更新、碎片化、有真實生活紋理（抱怨、瑣事、當下反應），而不是精緻的教學／權威型深度內容。像 3Blue1Brown、Fireship、Two Minute Papers、StatQuest 這類製作精良的教學頻道，是很好的「影音」範本，但對這種鬆散的日常圖文格式來說太精緻、太像上課，不適合當範本。要找的是「本人貼文語氣就很生活化」的創作者。'
    : '這個平台以影音為主，可以且應該對標製作精良的教學／拆解／敘事型帳號，重點放在鏡頭語言、剪輯節奏、敘事結構。'
  const excludeRule = exclude && exclude.length
    ? '\n已經查證過、請不要重複回報的 handle：' + exclude.join('、') + '。請找**不同的**帳號。\n'
    : ''
  return [
    '你是一位社群內容研究員。今天是 ' + TODAY + '。',
    '',
    '任務：為一個虛擬 KOL 角色，在指定平台上找出 ' + n + ' 個「真實存在」的真人 KOL／創作者帳號，作為內容手法的對標範本（只借鏡手法，不抄內容）。',
    '',
    '【角色設定】',
    '代號：' + p.nick + '（' + p.name + '）',
    '定位：' + p.positioning,
    '所在地／語言：' + p.locale,
    '合規紅線：' + p.redlines,
    '',
    '【平台】' + plat.name,
    '內容型態：' + plat.mode,
    dailyRule,
    excludeRule,
    '【嚴格要求 — 違反就等於任務失敗】',
    '1. **絕對不可以編造帳號、handle、網址或粉絲數。** 只回報你真的用 WebSearch／WebFetch 查證過、確實存在的帳號。',
    '2. 每個帳號都要附上你實際查證過的完整網址，以及你怎麼查證的（用了什麼搜尋詞、抓了哪個頁面、看到什麼）。',
    '3. 粉絲／訂閱數：只寫你查證過程中真的看到的數字，並註明來源與大約時間。查不到就寫 "—"，不要猜、不要估。',
    '4. 如果找不到 ' + n + ' 個符合條件又確實存在的帳號，就只回報你真的找到的數量，並在 notes 說明原因。**寧可少報，也絕對不要湊數編造。**',
    '5. 排除：以賭博攻略／投注技巧／教你贏錢／賭場推廣為核心的帳號、成人內容、詐騙或割韭菜帳號。',
    '6. 如果某個帳號是機構／官方帳號而不是個人創作者，照樣可以回報，但 is_org_account 要標 true。',
    '7. everyday_feel 欄位：這個帳號的貼文語氣是否偏「隨手記錄的日常感」（true）還是「精緻製作的教學／權威型」（false）。誠實標記，不要為了迎合指示亂標。',
    '',
    '請找 ' + n + ' 個候選（刻意多找幾個，因為後面會有嚴格查證淘汰）。imitation_points 要寫具體可操作的手法，不要寫空泛形容詞。',
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
    '（b）**張冠李戴**（把某平台上存在的帳號，硬說成在 ' + plat.name + ' 上也是這個 handle）。',
    '',
    '【待查核清單】',
    list,
    '',
    '對每一個帳號，請獨立用 WebSearch／WebFetch 查證：',
    '1. 這個 handle 在 ' + plat.name + ' 上是否真的存在？（實際去抓該平台網址，或用搜尋交叉確認）',
    '2. 網址是否正確、指向的確實是所聲稱的那位創作者？',
    '3. 聲稱的粉絲數有沒有依據？明顯誇大或查無依據要標出來。',
    '4. 內容領域是否真的跟聲稱的相符？',
    '',
    '【判定規則 — 非常重要】',
    '- 只有在你能**獨立確認該帳號確實存在於 ' + plat.name + '** 時，才給 CONFIRMED。',
    '- 只要有任何一項無法確認，或查到的資訊與聲稱不符，就給 REFUTED 並說明理由。',
    '- **不確定就一律給 REFUTED。** 寧可誤殺真帳號，也絕不能讓編造的帳號通過。',
    '',
    '回報每個帳號的 verdict、reason，以及你查證時實際看到的粉絲數（沒看到就寫 "—"）。handle 欄位請原樣抄回，方便比對。',
  ].join('\n')
}

const UNITS = []
for (const p of PERSONAS) {
  for (const plat of PLATFORMS) {
    UNITS.push({ p: p, plat: plat })
  }
}

log('開始研究：' + PERSONAS.length + ' 個人設 × ' + PLATFORMS.length + ' 個平台 = ' + UNITS.length + ' 個單位，每單位目標 3 個經雙重查證的帳號')

function strictConfirm(candidates, v1, v2) {
  const ok = {}
  const reasons = {}
  const observed = {}
  for (const v of [v1, v2]) {
    if (!v || !v.verdicts) continue
    for (const d of v.verdicts) {
      const h = (d.handle || '').trim().toLowerCase()
      if (!h) continue
      if (!(h in ok)) ok[h] = 0
      if (d.verdict === 'CONFIRMED') ok[h] = ok[h] + 1
      else reasons[h] = d.reason
      if (d.observed_followers && d.observed_followers !== '—' && !observed[h]) observed[h] = d.observed_followers
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
log('查證完畢：' + totalConfirmed + ' 個帳號通過雙重查證，' + totalDropped + ' 個被淘汰（含編造/無法確認）')

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
      const accs = r.confirmed.map(function (a) { return a.name + '(' + a.handle + ')' }).join('、') || '（無）'
      return '- ' + r.u.plat.name + '：' + accs
    }).join('\n')
    const prompt = [
      '你是一位內容策略審查員。今天是 ' + TODAY + '。',
      '',
      '以下是為虛擬 KOL 角色「' + p.nick + '（' + p.name + '）」找到的對標帳號清單，已經通過存在性查證。',
      '角色定位：' + p.positioning,
      '合規紅線：' + p.redlines,
      '',
      '【目前清單】',
      summary,
      '',
      '請批判性檢視：這份清單漏了什麼？具體要回答：',
      '1. 有沒有這個垂直領域裡「明顯該在清單上、但沒出現」的知名創作者？',
      '2. 文字／圖文平台（Instagram、X、Threads、Facebook）的帳號，是否真的具備「日常感」（貼文像隨手打的個人生活更新），還是又偏回精緻教學型？如果偏了，建議該找什麼樣的替代帳號。',
      '3. 清單裡有沒有其實不太適合、或有合規風險的帳號？',
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
      if (v && v.verdicts) {
        for (const d of v.verdicts) {
          if (d.verdict === 'CONFIRMED') okSet[(d.handle || '').trim().toLowerCase()] = d.observed_followers || '—'
        }
      }
      const added = asCandidates.filter(function (c) { return (c.handle || '').trim().toLowerCase() in okSet })
        .map(function (c) {
          const o = {}
          for (const k in c) o[k] = c[k]
          o.observed_followers = okSet[(c.handle || '').trim().toLowerCase()]
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
