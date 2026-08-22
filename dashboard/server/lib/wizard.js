/**
 * docs/11 §6 — the guided KOL creation flow.
 *
 * Why a wizard rather than a form: the ordering matters. Step 2 (credibility
 * mode) determines the whole risk structure of the persona and is expensive to
 * change once an account has published and an audience has formed
 * expectations. Asking it early, with the consequences spelled out, is the
 * point of the whole screen.
 *
 * Every step ships its own expert panel. The rule for that copy, from §6.2: no
 * jargon; if a term is unavoidable, define it on the spot. Where there is no
 * verified literature behind an option, the panel says so rather than
 * borrowing authority it does not have.
 */

const panel = (p) => ({ plain: '', consequence: '', evidence: [], recommendation: '', ...p })

export const STEPS = [
  {
    id: 1,
    key: 'purpose',
    title: '商業目標與 AI 身分揭露',
    intent: '先確定這個帳號要達成什麼，以及你打算怎麼交代它是 AI。',
    fields: [
      {
        key: 'goal',
        label: '這個帳號主要要做什麼？',
        type: 'select',
        options: [
          { value: 'traffic', label: '導流到別的地方（網站、商品、報名）' },
          { value: 'brand', label: '建立品牌印象' },
          { value: 'community', label: '經營一群固定的人' },
          { value: 'test', label: '測試題材，還沒決定要幹嘛' },
        ],
      },
      {
        key: 'disclosure',
        label: '要怎麼交代這是 AI 生成的角色？',
        type: 'select',
        options: [
          { value: 'always', label: '每一則都標示' },
          { value: 'profile', label: '個人檔案寫明，內容不重複標' },
          { value: 'on_ask', label: '被問到就誠實回答' },
        ],
      },
    ],
    panel: panel({
      plain:
        '「揭露」就是讓看的人知道這個角色不是真人。你可以選擇每則都寫、只在個人檔案寫、或是被問到再說——但你不能選「否認」。',
      consequence:
        '這一步要先決定，因為下一步（可信度型態）的風險大小完全取決於它。如果你打算完全不揭露、甚至否認，那麼下一步不管選什麼都會踩到紅線 R-AI-DISCLOSURE。',
      evidence: [
        {
          claim: '「透明揭露」是感知真實性的五個構面之一——它不是扣分項，是真實性的來源之一。',
          source: 'Lee & Eastin (2021), Journal of Research in Interactive Marketing, 15(4), 822–841',
          url: 'https://www.emerald.com/jrim/article-abstract/15/4/822/451011/Perceived-authenticity-of-social-media-influencers',
          status: 'verified',
        },
      ],
      recommendation: '選「個人檔案寫明」。每則都標會很吵，被問才說在被抓包時看起來像隱瞞。',
    }),
  },

  {
    id: 2,
    key: 'credibility_mode',
    title: '可信度型態',
    intent: '這是整個流程最重要的一步，而且事後改動的成本最高。',
    highlight: true,
    fields: [
      {
        key: 'credibility_mode',
        label: '這個角色的可信度要靠什麼？',
        type: 'select',
        options: [
          { value: 'database', label: '靠整理知識（資料庫型）' },
          { value: 'embodied', label: '靠親身經歷（具身經驗型）' },
          { value: 'hybrid', label: '兩者混合' },
        ],
      },
    ],
    panel: panel({
      plain:
        '你要決定這個角色的可信度是靠親身經歷，還是靠整理知識。\n' +
        '「靠親身經歷」＝她說「我爬過那座山，當時風很大」。\n' +
        '「靠整理知識」＝她說「根據這三份路線報告，那座山的風險是這樣」。\n' +
        '兩種都能做出好內容，但壞掉的方式完全不同。',
      consequence:
        '這是一個 AI 生成的角色。當觀眾知道這件事的時候：\n' +
        '· 選了「靠整理知識」→ 可以完全避開人設崩塌的風險。觀眾知道是 AI，也不影響「它讀完了所有資料」這件事。但這不等於專業度會自動變高——你還是要真的把資料整理對。\n' +
        '· 選了「靠親身經歷」→ 這類主張會變得幾乎沒有人信。「我爬過那座山」對一個 AI 來說是假的，而且是一秒就能看穿的假。而且很難救回來：被戳破之後，這個帳號講什麼都會被打折。',
      evidence: [
        {
          claim:
            '人會用「這是機器做的」當判斷可信度的捷徑。這個捷徑在處理客觀資料的任務上是優勢，在「我親身在場」的主張上是反證。',
          source: 'Sundar, S. S. (2008), The MAIN Model',
          url: 'https://www.researchgate.net/publication/323990996',
          status: 'verified',
        },
        {
          claim: '揭露 AI 身分會讓具身經驗的主張更難被相信。',
          source: 'Lee & Eastin (2021), JRIM, 15(4), 822–841',
          url: 'https://www.emerald.com/jrim/article-abstract/15/4/822/451011/Perceived-authenticity-of-social-media-influencers',
          status: 'verified',
        },
      ],
      recommendation:
        '選「資料庫型」，除非你有把握這個帳號永遠不會被問「你真的去過嗎」。\n' +
        '要做具身題材（登山、旅遊、開箱）也可以，把主張改成可查證的形式：不要說「我走過」，要說「這條路線的紀錄顯示」。',
      footnote:
        '如果這個帳號還沒發布，現在改還來得及。一旦有了公開內容和固定的受眾期待，改動成本會非常高。',
    }),
  },

  {
    id: 3,
    key: 'expertise',
    title: '專業領域與可查證的知識來源',
    intent: '把「她憑什麼講這個」寫成可以被查的東西。',
    fields: [
      { key: 'domain', label: '主要領域', type: 'text' },
      { key: 'credibility_basis', label: '知識來源（每一條都要能被查）', type: 'list' },
    ],
    panel: panel({
      plain:
        '這裡填的是「她的說法是從哪裡來的」。公開資料、官方紀錄、原始作品、研究報告都可以——重點是別人查得到。',
      consequence:
        '如果你在這裡填的是「執照」「國際認證」「在某某機構任職」，會直接命中紅線 R-CREDENTIAL：那些是要真人去考、去登記、去被機構承認的，而且查得到名冊。\n' +
        '同樣地，如果之後內容裡出現查不到的研究或統計數字，會命中 R-FABRICATED-SOURCE——對資料庫型人設來說，捏造來源等於拆掉自己唯一的地基。',
      evidence: [
        {
          claim: '同一條機器捷思對資料庫型主張是加分，對具身型主張是否定證據。',
          source: 'Sundar, S. S. (2008), The MAIN Model',
          url: 'https://www.researchgate.net/publication/323990996',
          status: 'verified',
        },
      ],
      recommendation: '寫「整理自 IFMGA 公開的路線標準」，不要寫「IFMGA 認證嚮導」。前者可查，後者是假的。',
    }),
  },

  {
    id: 4,
    key: 'pillars',
    title: '內容支柱',
    intent: '這個帳號固定會講的兩到三件事。',
    fields: [{ key: 'pillars', label: '支柱（含權重）', type: 'pillars' }],
    panel: panel({
      plain:
        '支柱就是「這個帳號固定會講的那幾件事」。觀眾追蹤你，是為了其中某一根。',
      consequence:
        '支柱太多、或關鍵字太泛（人生、職場、內耗、邊界這種），等於這個帳號什麼都能講。什麼都能講的帳號，觀眾不知道要為了什麼追蹤你。\n' +
        '這不是假設——我們實測過：一個純職場情緒題只因為命中「离职」一個詞，就在一位登山嚮導的帳號上拿到「可做」。',
      evidence: [
        {
          claim: '未被所屬產業專門分析師覆蓋的公司，股價會被折價——身分歸類不清會被市場懲罰。',
          source: 'Zuckerman, E. W. (1999), American Journal of Sociology, 104(5), 1398–1438',
          url: 'https://www.jstor.org/stable/10.1086/210178',
          status: 'verified',
        },
      ],
      recommendation:
        '兩到三根。每根的關鍵字要換成只有這根支柱會用的具體詞——如果一個詞放在任何帳號上都會命中，它就不該在這裡。',
      footnote:
        '超過三根會出現警示，但不會擋你。Zuckerman 說的是「會被折價」，沒有說折價多少——所以我們不會用一個編出來的公式幫你扣分。',
    }),
  },

  {
    id: 5,
    key: 'axes',
    title: '四軸自評與理由',
    intent: '每一個分數都要寫得出理由，寫不出來就不要填。',
    fields: [{ key: 'axes', label: '四軸（分數 + 理由）', type: 'axes' }],
    panel: panel({
      plain:
        '四個軸分別是：理性拆解、敘事情緒、視覺張力、身分可信。每一軸給 0–100，然後寫一句話說明為什麼是這個分數。',
      consequence:
        '沒有理由的分數不會進入計算——整條軸會被略過，而不是當成 0。\n' +
        '（當成 0 會變成「這個 KOL 這一軸很差」，那是另一種造假。）',
      evidence: [
        {
          claim: '本專案方法論 docs/09 §0 原則二：沒有依據的分數不進計算。',
          source: '內部規範',
          url: null,
          status: 'internal',
        },
      ],
      recommendation: '填一個數字很快，但寫不出理由就代表這個數字是隨手打的。隨手打的數字進到公式裡，出來的還是隨手打的答案。',
    }),
  },

  {
    id: 6,
    key: 'homophily',
    title: '受眾分群與相似性',
    intent: '觀眾覺得「這個人跟我是同一種人」的程度。',
    fields: [
      { key: 'audience_identity', label: '受眾是誰', type: 'text' },
      { key: 'shared_situation', label: '你們共同的處境', type: 'text' },
      { key: 'language_register', label: '講話的方式', type: 'text' },
      { key: 'score', label: '相似性自評（0–100）', type: 'number' },
      { key: 'why', label: '為什麼是這個分數', type: 'text' },
    ],
    panel: panel({
      plain:
        '這一格問的不是「他厲不厲害」，是「他像不像自己人」。這兩件事是分開的，而且都會影響觀眾要不要聽你的。',
      consequence:
        '太低：觀眾會佩服，但不會行動——他們覺得「他很厲害」，不覺得「我該聽他的」。\n' +
        '太高：人設沒有專業距離，講什麼都像朋友閒聊，權威感就消失了。',
      evidence: [
        {
          claim:
            '內容的資訊價值、影響者的可信賴度、吸引力、以及與追隨者的相似性，四者正向影響追隨者的信任。',
          source: 'Lou & Yuan (2019), Journal of Interactive Advertising, 19(1), 58–73',
          url: 'https://doi.org/10.1080/15252019.2018.1533501',
          status: 'verified',
        },
      ],
      recommendation:
        '先寫「共同的處境」再回頭給分數。處境寫得越具體，分數越好給——「時間破碎、想離開又不敢離開現在的位置」比「上班族」有用得多。',
      footnote: '這一維刻意沒有底線。文獻確立它是信任的來源之一，但沒有任何研究說低於多少就不行——編一條就是在造假。',
    }),
  },

  {
    id: 7,
    key: 'redlines',
    title: '紅線設定',
    intent: '全域紅線自動套用，這裡加的是這位 KOL 專屬的。',
    fields: [{ key: 'redlines', label: '專屬紅線', type: 'redlines' }],
    panel: panel({
      plain:
        '紅線是「不論分數多高都不做」的事。系統已經內建九條全域紅線，這裡你可以加只屬於這個角色的。',
      consequence:
        '紅線是門檻，不是扣分。命中就是不做——不會因為這個話題很紅就放行。',
      evidence: [
        {
          claim: '契合度具有門檻性質：極度不一致無法被化解，直接產生負評，不是靠其他維度的高分可以補回來的。',
          source: 'Mandler, G. (1982), The Structure of Value: Accounting for Taste',
          url: null,
          status: 'verified',
        },
      ],
      recommendation:
        '想一下這個角色「做了就毀了」的事情是什麼。通常跟她最核心的那個主張有關——例如一個講「轉身不是失敗」的嚮導，去美化冒險就是自我否定。',
    }),
  },

  {
    id: 8,
    key: 'review',
    title: '檢核與產出',
    intent: '跑完整紅線檢查，沒有 block 才能存檔。',
    fields: [],
    panel: panel({
      plain: '這一步會把前面填的東西全部跑一次紅線檢查，然後產生兩個檔案。',
      consequence:
        '有 block 級紅線沒解決就不能存檔。\n' +
        '關鍵字比對只是第一層——標成「待判定」的項目需要人或語意層再看一次，因為關鍵字會誤擋（「我親身比對了三份報告」）也會漏抓（「那晚我手指凍到沒感覺」）。',
      evidence: [],
      recommendation: '待判定的項目不要跳過。它們正是關鍵字抓不準、但最容易出事的那一類。',
    }),
  },
]

export const getStep = (id) => STEPS.find((s) => s.id === Number(id)) ?? null

/** Assemble a draft into schema v3 shape without writing anything to disk. */
export function draftToAffinity(draft = {}) {
  return {
    kol_id: draft.id ?? null,
    schema_version: 3,
    credibility_mode: draft.credibility_mode ?? null,
    credibility_basis: draft.credibility_basis ?? [],
    homophily: draft.homophily ?? null,
    axes: draft.axes ?? {},
    pillar_keywords: draft.pillar_keywords ?? {},
    topic_hooks: draft.topic_hooks ?? [],
    redlines: draft.redlines ?? [],
    reach: draft.reach ?? { regions: [], language: null },
  }
}

/** Per-step validation. Returns what is still missing, in plain language. */
export function validateStep(stepId, draft = {}) {
  const problems = []
  const need = (cond, message) => {
    if (!cond) problems.push(message)
  }

  switch (Number(stepId)) {
    case 1:
      need(draft.goal, '還沒選商業目標。')
      need(draft.disclosure, '還沒決定 AI 身分要怎麼揭露。')
      break
    case 2:
      need(draft.credibility_mode, '還沒選可信度型態——這是後面所有判斷的前提。')
      break
    case 3:
      need(draft.domain, '還沒填主要領域。')
      need((draft.credibility_basis ?? []).length > 0, '至少要有一條可被查證的知識來源。')
      break
    case 4:
      need((draft.pillars ?? []).length >= 2, '至少要兩根內容支柱。')
      break
    case 5: {
      const axes = draft.axes ?? {}
      const keys = Object.keys(axes)
      need(keys.length > 0, '還沒填四軸。')
      for (const [k, v] of Object.entries(axes)) {
        need(Number.isFinite(Number(v?.score)), `軸「${k}」沒有分數。`)
        need(String(v?.why ?? '').trim().length >= 10, `軸「${k}」的理由太短——寫不出來就把分數拿掉，不要填 0。`)
      }
      break
    }
    case 6:
      need(draft.homophily?.audience_identity, '還沒寫受眾是誰。')
      need(draft.homophily?.shared_situation, '還沒寫共同的處境。')
      need(Number.isFinite(Number(draft.homophily?.score)), '還沒給相似性分數。')
      need(String(draft.homophily?.why ?? '').trim().length >= 10, '相似性分數需要一句理由（至少 10 字）。')
      break
    default:
      break
  }

  return { stepId: Number(stepId), passed: problems.length === 0, problems }
}
