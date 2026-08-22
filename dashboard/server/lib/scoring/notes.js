/**
 * docs/11 §3 — every score carries its own explanation.
 *
 * The rule this file exists to enforce: a number that cannot show its meaning,
 * its impact and its evidence on screen is the next `0.35`. So the note travels
 * with the score rather than living in a document nobody opens.
 *
 * `decisionRole` and `share` are deliberately separate fields. v1.0 had a single
 * `impact` whose definition was "high if it holds ≥25% of the weighted model" —
 * which proves a dimension's importance using the design's own output. Circular.
 */

export const CALIBRATION = {
  verified: { label: '有文獻支持', tone: 'ok', hint: '這個做法有已查證的文獻直接支持。' },
  prior: { label: '先驗，尚未校準', tone: 'warn', hint: '方向有依據，但具體的數字或公式是我們定的。它可以被資料推翻，目前還沒有資料。' },
  calibrated: { label: '已用真實成效校準', tone: 'good', hint: '已通過 docs/11 §9.4 的統計判準，並經人簽核。' },
}

const note = (n) => ({ canVetoAlone: false, share: null, ...n })

export const DIMENSION_NOTES = {
  fit: note({
    key: 'fit',
    label: '人設契合',
    meaning: '白話：這個題目需要的能力，這位 KOL 有沒有。系統會先看題目吃重哪幾種能力，再看他在那幾項的分數夠不夠——不是看他總分高不高。',
    decisionRole: 'gate',
    share: 0.3333,
    canVetoAlone: true,
    impactWhy: '這是唯一有底線的維度。低於底線代表觀眾沒辦法用既有的認知去理解「這個人為什麼在講這個」，這種不理解不會被熱度或其他分數補回來。',
    function: '決定這個組合到底成不成立。它同時進 gate 也進分數：先當門檻，過了才當排序依據。',
    evidence: [
      {
        claim: '基模一致性：一致的內容產生溫和正面反應；中度不一致若能被化解會提高投入；極度不一致無法化解，直接產生負評。',
        source: 'Mandler, G. (1982), The Structure of Value: Accounting for Taste',
        url: null,
        status: 'verified',
      },
      {
        claim: '影響力是分話題的，不是全域的——在某個題材上的強度不能外推到別的題材。',
        source: 'Weng, Lim, Jiang & He (2010), TwitterRank, WSDM',
        url: 'https://www.researchgate.net/publication/221520147',
        status: 'verified',
      },
    ],
    failureMode: '分數低卻硬做：觀眾會覺得「他為什麼在講這個」，這種疑問會回頭傷害他本來可信的那些題目。分數高就一直做同一類：完全可預測的內容不會激發注意，文獻上這一端也不是最優解。',
    calibration: 'prior',
    calibrationWhy: '軸的定義有文獻支持，但底線 30 分這個切點沒有——Mandler 只說「有一條線」，沒說在哪裡。',
  }),

  pillar: note({
    key: 'pillar',
    label: '支柱契合',
    meaning: '白話：這個題目落不落在這個帳號「本來就在講的那幾件事」裡面。',
    decisionRole: 'score',
    share: 0.3333,
    impactWhy: '帳號的身分要能被一句話講清楚。什麼都能講的帳號，觀眾不知道要為了什麼追蹤你。',
    function: '把內容綁回帳號的既有承諾，避免每支影片都在重新自我介紹。',
    evidence: [
      {
        claim: '未被所屬產業專門分析師覆蓋的公司，股價會被折價——身分歸類不清會被市場懲罰。',
        source: 'Zuckerman, E. W. (1999), American Journal of Sociology, 104(5), 1398–1438',
        url: 'https://www.jstor.org/stable/10.1086/210178',
        status: 'verified',
      },
      {
        claim: '代言人與題材的契合度愈高，可信度與說服效果愈好（match-up hypothesis）。',
        source: 'Kamins & Gupta (1994), Psychology & Marketing, 11(6), 569–586',
        url: 'https://onlinelibrary.wiley.com/doi/abs/10.1002/mar.4220110605',
        status: 'verified',
      },
    ],
    failureMode: '支柱太多或關鍵字太泛，任何題目都能找到一根柱子掛上去——那等於沒有邊界。實測過：一個純職場情緒題只因命中「离职」一個詞，就在登山嚮導帳號上拿到「可做」。',
    calibration: 'prior',
    calibrationWhy: 'Zuckerman 支持「邊界模糊會被折價」的方向，但沒有給折價的公式。v1.0 曾用「支柱 > 3 就乘以 3/n」扣分，已刪除——那是用新編的公式取代舊編的數字。現在支柱治理完全由警示與人的判斷承接。',
  }),

  homophily: note({
    key: 'homophily',
    label: '相似性',
    meaning: '白話：觀眾覺得「這個人跟我是同一種人」的程度。不是指他厲不厲害，是指他像不像自己人。',
    decisionRole: 'score',
    share: 0.3333,
    impactWhy: '這是四個「信任前因」之一。相似性低的時候，就算專業度很高，觀眾也只會覺得「他很厲害」，而不會覺得「我該聽他的」。',
    function: '決定這個 KOL 說的話會被當成「自己人的建議」還是「專家的評論」。',
    evidence: [
      {
        claim: '內容的資訊價值、影響者的可信賴度、吸引力、以及與追隨者的相似性，四者正向影響追隨者的信任。',
        source: 'Lou & Yuan (2019), Journal of Interactive Advertising, 19(1), 58–73',
        url: 'https://doi.org/10.1080/15252019.2018.1533501',
        status: 'verified',
      },
    ],
    failureMode: '太低：觀眾會佩服但不會行動。太高：人設沒有專業距離，講什麼都像朋友閒聊，權威感消失。',
    calibration: 'prior',
    calibrationWhy: 'Lou & Yuan 確立它是信任的前因之一，但沒有任何文獻說它有一條不可跨越的底線——所以這一維刻意沒有 gate。低分會被單獨標出來，而不是靜悄悄被平均掉。',
  }),

  credibilityMode: note({
    key: 'credibilityMode',
    label: '可信度型態',
    meaning: '白話：這個題目需不需要「我親身在場」。需要的話，一個 AI 角色就不能講——這不是扣分，是不能做。',
    decisionRole: 'gate',
    share: null,
    canVetoAlone: true,
    impactWhy: '被戳破一次，這個帳號之後講什麼都會被打折，而且很難救回來。',
    function: '在產製之前就把「這個人設根本不該碰這種題」的組合擋掉。',
    evidence: [
      {
        claim: '人會用「這是機器做的」當判斷可信度的捷徑；這個捷徑在處理客觀資料的任務上是優勢，在「我親身在場」的主張上是反證。',
        source: 'Sundar, S. S. (2008), The MAIN Model',
        url: 'https://www.researchgate.net/publication/323990996',
        status: 'verified',
      },
      {
        claim: '揭露 AI 身分會讓具身經驗的主張更難被相信。',
        source: 'Lee & Eastin (2021), Journal of Research in Interactive Marketing, 15(4), 822–841',
        url: 'https://www.emerald.com/jrim/article-abstract/15/4/822/451011/Perceived-authenticity-of-social-media-influencers',
        status: 'verified',
      },
    ],
    failureMode: '把它當成一個可以被其他高分補回來的分數。v1.0 就是這樣做的——一個類別型的「是或否」被丟進算術平均數裡，等於允許用視覺張力去補「他根本沒去過那裡」。',
    calibration: 'verified',
    calibrationWhy: '這一維是 gate 而非分數，且判定依據是型態相符與否，不需要任何自訂數字。',
  }),

  timing: note({
    key: 'timing',
    label: '時機（樣本共現密度）',
    meaning: '白話：在我們用種子詞抓到的那一批貼文裡，有幾個不同的帳號用了這個標籤。這不是平台熱度，也不是「正在紅」。',
    decisionRole: 'display',
    share: null,
    impactWhy: '它完全不進總分、也不進 gate。放在旁邊是給人參考，不是給系統排序用的。',
    function: '提供一個「現在有沒有人在講」的粗略線索，同時把它的限制寫在旁邊。',
    evidence: [
      {
        claim: 'burst 的偵測建立在「相對於該詞自身歷史基準的異常增加」，需要時間序列與狀態轉移成本。單一時間切片無法判定升溫。',
        source: 'Kleinberg, J. (2002), Bursty and Hierarchical Structure in Streams, KDD',
        url: 'https://www.cs.cornell.edu/home/kleinber/bhs.pdf',
        status: 'verified',
      },
      {
        claim: '不同題材的擴散機制不同：政治性 hashtag 是複雜傳染（需重複曝光），慣用語與梗不是。',
        source: 'Romero, Meeder & Kleinberg (2011), WWW, 695–704',
        url: 'https://www.cs.cornell.edu/home/kleinber/www11-hashtags.pdf',
        status: 'verified',
      },
    ],
    failureMode: '把它當熱度用來排序。種子詞決定了能看到什麼——這份清單其實是「跟種子詞一起出現的字」，不是「大家在講什麼」。',
    calibration: 'prior',
    calibrationWhy: '在累積足夠的歷史快照之前，heatConfidence 永遠是 none。',
  }),
}

export const listNotes = () => Object.values(DIMENSION_NOTES)
export const getNote = (key) => DIMENSION_NOTES[key] ?? null

/**
 * Attach the note to a computed dimension so the API never returns a bare
 * number — but by reference, not by value.
 *
 * Embedding the full note in every dimension of every plan produced a 225KB
 * response for six plans, almost all of it the same paragraphs repeated. The
 * client fetches the note bodies once from `/api/notes` and joins on `noteKey`.
 */
export function withNote(key, payload) {
  const n = DIMENSION_NOTES[key]
  if (!n) return { ...payload, noteKey: null }
  return {
    ...payload,
    noteKey: key,
    /** Just enough to render a row without a second request. */
    noteSummary: { label: n.label, decisionRole: n.decisionRole, calibration: n.calibration, meaning: n.meaning },
  }
}

export const noteIndex = () =>
  Object.fromEntries(Object.entries(DIMENSION_NOTES).map(([k, n]) => [k, { ...n, calibrationMeta: CALIBRATION[n.calibration] }]))
