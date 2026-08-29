import { PLATFORMS, PLATFORM_IDS } from './platforms.js'
import { CLAIM_DOMAINS, ALWAYS_HUMAN_REVIEW } from './policy.js'

/**
 * 產品特性分析 — the analyser behind FR-P0-01.
 *
 * What this is *not*: a scorer. README.md §6 principle 7 ("Evidence before
 * scoring") and DASHBOARD_SPEC.md §4 both forbid manufacturing a `87/100`
 * before there is calibration data. So every output here is one of three
 * things: a restatement of what the operator declared, a derivation whose rule
 * is printed alongside it, or an explicit gap.
 *
 * What it is for: three downstream consumers need structured product facts,
 * and without this they each invent their own.
 *   - Opportunity relevance (opportunities.js) needs angle families and
 *     objections to judge "can this product actually carry this topic".
 *   - The Persona router needs required credibility and claim surface.
 *   - The review gate needs the claim domains and disclosure obligations.
 */

export const ANALYSIS_VERSION = '1.0.0'

/**
 * Keyword → claim domain. Deliberately coarse and deliberately over-inclusive:
 * a false positive costs one human review, a false negative ships an
 * unreviewed financial claim. Same asymmetry the redline checker uses.
 */
const CLAIM_MARKERS = {
  finance: ['投資', '報酬', '獲利', '賺', '收益', 'ETF', '股', '幣', '理財', '本金', 'roi', 'yield', 'invest', 'profit', 'trading'],
  prediction_market: ['預測市場', '下注', '賠率', '押', 'odds', 'prediction market', 'wager'],
  gambling: ['博弈', '賭', '娛樂城', '老虎機', '百家樂', '柏青哥', 'casino', 'slot', 'baccarat', 'betting'],
  health: ['健康', '療效', '減肥', '瘦', '醫', '藥', '症狀', 'health', 'cure', 'treatment', 'diet'],
  legal: ['法律', '合法', '訴訟', '合約', 'legal', 'lawsuit', 'compliance guarantee'],
  political: ['選舉', '政黨', '候選人', 'election', 'political party'],
  adult: ['成人', '情色', '18禁', 'adult content', 'nsfw'],
  employment: ['求職', '職缺', '薪資', 'hiring', 'salary'],
  housing: ['房貸', '租屋', '房產', 'mortgage', 'rental'],
}

/** Value-prop verbs that imply an outcome the product must be able to prove. */
const OUTCOME_MARKERS = ['提升', '增加', '減少', '節省', '保證', '最', '第一', '唯一', 'guarantee', 'best', 'fastest', 'only', 'proven']

const textOf = (product) =>
  [
    product.name,
    product.description,
    product.valueProposition,
    ...(product.differentiators ?? []),
    ...(product.proofPoints ?? []),
    ...(product.knownObjections ?? []),
    ...(product.targetAudience ?? []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

/**
 * The text the product uses to *assert things about itself* — which is what a
 * claim domain is derived from.
 *
 * `targetAudience` is deliberately excluded. Who uses a product is not what a
 * product claims: an API gateway whose users include doctors, lawyers and
 * quantitative analysts makes no medical, legal or financial claim by saying
 * so. Including the audience list flagged exactly that product as health +
 * finance + legal, which forced every asset it would ever produce into
 * mandatory human review (policy.ALWAYS_HUMAN_REVIEW) for no reason — an
 * over-inclusive rule that fires on everything stops being a signal.
 *
 * `knownObjections` stays in: an objection is about the product's own domain
 * ("線上博弈都作弊" belongs to a gambling product), so it is still a statement
 * about what this product is, not about who buys it.
 */
const claimTextOf = (product) =>
  [
    product.name,
    product.description,
    product.valueProposition,
    ...(product.differentiators ?? []),
    ...(product.proofPoints ?? []),
    ...(product.knownObjections ?? []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

/** Claim domains this product's own copy already walks into. */
function detectClaimDomains(product) {
  const haystack = claimTextOf(product)
  const hits = []
  for (const domain of CLAIM_DOMAINS) {
    const matched = (CLAIM_MARKERS[domain] ?? []).filter((m) => haystack.includes(m.toLowerCase()))
    if (matched.length) hits.push({ domain, matchedTerms: matched, alwaysHumanReview: ALWAYS_HUMAN_REVIEW.includes(domain) })
  }
  return hits
}

/**
 * Every claim the product makes about itself that content will be tempted to
 * repeat, paired with the evidence the operator has (or has not) supplied.
 *
 * An unproven differentiator is not a blocker — it is a `blocked_claim` for
 * the persona overlay, which is the whole point of surfacing it here.
 */
function proofObligations(product) {
  const proof = (product.proofPoints ?? []).map((p) => p.toLowerCase())
  const rows = []

  for (const claim of [product.valueProposition, ...(product.differentiators ?? [])].filter(Boolean)) {
    const lower = claim.toLowerCase()
    const outcomeWords = OUTCOME_MARKERS.filter((m) => lower.includes(m.toLowerCase()))
    // "Supported" means some proof point shares a meaningful token with the
    // claim. Crude on purpose — it can only ever downgrade a claim to
    // "needs evidence", never upgrade one to "verified".
    const tokens = lower.split(/[\s,、，。;；/]+/).filter((t) => t.length >= 2)
    const supportedBy = (product.proofPoints ?? []).filter((p) =>
      tokens.some((t) => p.toLowerCase().includes(t)),
    )
    rows.push({
      claim,
      isOutcomeClaim: outcomeWords.length > 0,
      outcomeWords,
      supportedBy,
      status: supportedBy.length ? 'evidenced' : outcomeWords.length ? 'needs_evidence' : 'descriptive',
      note: supportedBy.length
        ? '有對應 proof point，內容可引用。'
        : outcomeWords.length
          ? '這是結果型宣稱但沒有對應 proof point：在補上證據前應列入 blocked_claims。'
          : '描述性宣稱，無需外部證據，但仍不得升級成保證。',
    })
  }
  if (!proof.length && rows.length) {
    rows.push({
      claim: '(整體)',
      isOutcomeClaim: false,
      outcomeWords: [],
      supportedBy: [],
      status: 'needs_evidence',
      note: '產品尚未登記任何 proof point，所有結果型宣稱都無法在內容中使用。',
    })
  }
  return rows
}

/**
 * Which of the six product roles this product can plausibly play, and why.
 *
 * The rule for each role is printed in `because` so a strategist can disagree
 * with the reasoning rather than with a number.
 */
function roleFit(product) {
  const declared = new Set(product.productRoles ?? [])
  const haystack = textOf(product)
  const hasProof = (product.proofPoints ?? []).length > 0
  const hasObjections = (product.knownObjections ?? []).length > 0
  const isDestination = ['content_platform', 'marketplace', 'prediction_market'].includes(product.businessModel)
  const isTool = ['subscription', 'freemium', 'lead_gen'].includes(product.businessModel)

  const rules = {
    utility: {
      fit: isTool || haystack.includes('工具') || haystack.includes('tool'),
      because: '商業模式是訂閱／免費增值／名單型，產品通常有可示範的日常用途。',
    },
    answer_to_debate: {
      fit: hasObjections,
      because: hasObjections
        ? '產品已登記 known objections，這些反對意見本身就是可拍成對立的題材。'
        : '尚未登記 known objections，沒有現成的對立可以立。',
    },
    destination: {
      fit: isDestination,
      because: '內容平台／市集／預測市場的體驗發生在產品內，內容能當預告片。',
    },
    proof_source: {
      fit: hasProof,
      because: hasProof ? '產品有可引用的資料點，能當內容的證據來源。' : '沒有登記 proof point，無法擔任證據來源。',
    },
    challenge: {
      fit: isDestination || haystack.includes('挑戰') || haystack.includes('challenge'),
      because: '產品行為可被包裝成可複製的挑戰或賽制。',
    },
    next_action: {
      fit: true,
      because: '任何產品都能當結論後的下一步，但這是最弱的一種嵌入，不應是唯一角色。',
    },
  }

  return Object.entries(rules).map(([role, r]) => ({
    role,
    declared: declared.has(role),
    plausible: r.fit,
    because: r.because,
    // Declared-but-implausible is the interesting cell: the operator asserted a
    // role the product's own data does not support yet.
    status: declared.has(role) && !r.fit ? 'declared_unsupported' : declared.has(role) ? 'declared' : r.fit ? 'candidate' : 'unlikely',
  }))
}

/**
 * Per-platform CTA feasibility. This is where "下發平臺" meets attribution:
 * a platform that suppresses links is not unusable, but its conversions will
 * arrive through a referral code rather than a click, and the experiment
 * contract has to know that before it picks a primary outcome.
 */
function ctaCompatibility(product, profile) {
  const blocked = new Set([...(product.blockedPlatforms ?? []), ...(profile?.blockedPlatforms ?? [])])
  return PLATFORM_IDS.map((id) => {
    const spec = PLATFORMS[id]
    const linkSuppressed = /降權|bio|留言|限制/.test(spec.notes ?? '')
    return {
      platform: id,
      label: spec.label,
      allowed: !blocked.has(id),
      blockedReason: blocked.has(id) ? '此產品或其 policy profile 封鎖了本平台' : null,
      automation: spec.automation,
      // Direct click attribution needs a clickable, trackable destination in
      // the post itself. Where that does not exist, say so rather than let the
      // funnel quietly show 0 clicks and look like a content failure.
      attributionMode: spec.telemetry.includes('clicks') && !linkSuppressed ? 'direct_click' : 'referral_code_or_bio',
      disclosureRequired: spec.disclosureRequired,
      note: spec.notes,
    }
  })
}

/**
 * Content angle families — the seed list the Opportunity engine matches
 * incoming signals against. Derived, not invented: every family points back at
 * the product field it came from.
 */
function angleFamilies(product) {
  const families = []
  for (const objection of product.knownObjections ?? []) {
    families.push({ family: 'objection_reversal', seed: objection, from: 'knownObjections', hint: `把「${objection}」當成內容的開場反對意見，再用產品體驗回應。` })
  }
  for (const diff of product.differentiators ?? []) {
    families.push({ family: 'differentiator_demo', seed: diff, from: 'differentiators', hint: `示範「${diff}」，讓差異在畫面上看得出來，而不是用講的。` })
  }
  for (const audience of product.targetAudience ?? []) {
    families.push({ family: 'audience_situation', seed: audience, from: 'targetAudience', hint: `拍「${audience}」真實會遇到的情境，產品在情境裡自然出現。` })
  }
  for (const proof of product.proofPoints ?? []) {
    families.push({ family: 'evidence_led', seed: proof, from: 'proofPoints', hint: `以「${proof}」當內容的證據錨點，適合圖文與數據型 hook。` })
  }
  return families
}

/**
 * Readiness gates. These are the states the product board renders — a product
 * cannot enter the experiment stage with an unmet blocking gate, because every
 * experiment it produced would be unevaluable by construction.
 */
function readiness(product, conversions) {
  const primary = conversions.find((c) => c.isPrimary)
  const gates = [
    {
      gate: 'value_proposition',
      blocking: true,
      passed: Boolean(product.valueProposition),
      message: '產品必須有核心價值主張，否則 Opportunity 無從判斷相關性。',
    },
    {
      gate: 'conversion_defined',
      blocking: true,
      passed: conversions.length > 0,
      message: '至少要定義一個 product conversion event，否則所有實驗只能量到 vanity metrics。',
    },
    {
      gate: 'primary_conversion',
      blocking: true,
      passed: Boolean(primary),
      message: '必須指定一個 primary conversion，evaluator 需要它決定 primary outcome。',
    },
    {
      gate: 'tracking_destination',
      blocking: true,
      passed: Boolean(product.primaryDomain),
      // Without a destination there is nothing to append a tracking code to,
      // so every conversion would arrive `unattributed` (DATA_MODEL.md §5).
      message: '需要 landing / deep-link domain 才能產生 tracking link；沒有它，歸因只能是 unattributed。',
    },
    {
      gate: 'audience_declared',
      blocking: false,
      passed: (product.targetAudience ?? []).length > 0,
      message: '沒有目標受眾，Persona router 只能靠題目相似度配對。',
    },
    {
      gate: 'proof_points',
      blocking: false,
      passed: (product.proofPoints ?? []).length > 0,
      message: '沒有 proof point 時，所有結果型宣稱都必須列為 blocked claim。',
    },
    {
      gate: 'objections_declared',
      blocking: false,
      passed: (product.knownObjections ?? []).length > 0,
      message: '沒有 known objections 就沒有現成的對立題材，Controversy Engine 產出會變弱。',
    },
    {
      gate: 'policy_profile',
      blocking: true,
      passed: Boolean(product.policyProfileId),
      message: '必須綁定 policy profile；未綁定時系統以最嚴格的 profile 代入。',
    },
  ]

  const failedBlocking = gates.filter((g) => g.blocking && !g.passed)
  return {
    gates,
    ready: failedBlocking.length === 0,
    blockingGaps: failedBlocking.map((g) => g.gate),
    // Advisory gaps do not block, but they are the reason a product's
    // experiments will underperform, so the board shows them separately.
    advisoryGaps: gates.filter((g) => !g.blocking && !g.passed).map((g) => g.gate),
  }
}

export function analyseProduct(product, { conversions = [], profile = null } = {}) {
  const claimDomains = detectClaimDomains(product)
  const obligations = proofObligations(product)

  return {
    analysisVersion: ANALYSIS_VERSION,
    analysedAt: new Date().toISOString(),
    policyVersion: profile ? `${profile.key}@${profile.version}` : null,

    // 1. What the product is, restated in the fields the rest of the OS reads.
    identity: {
      businessModel: product.businessModel,
      valueProposition: product.valueProposition,
      targetAudience: product.targetAudience ?? [],
      differentiators: product.differentiators ?? [],
      knownObjections: product.knownObjections ?? [],
    },

    // 2. Claim surface — feeds the review gate and the persona blocked_claims.
    claimSurface: {
      domains: claimDomains,
      requiresHumanReview: claimDomains.some((d) => d.alwaysHumanReview) || profile?.autoApproveAllowed === false,
      minAge: product.minAge ?? profile?.minAge ?? null,
      allowedGeos: (product.allowedGeos ?? []).length ? product.allowedGeos : (profile?.allowedGeos ?? []),
      disclosure: profile?.disclosure ?? { aiPersona: true },
    },

    // 3. What content is allowed to assert, and what it must not.
    proofObligations: obligations,
    // The synthetic `(整體)` row is a readiness note, not a claim string a
    // persona overlay could block on — keep it out of the blocked list.
    blockedClaims: obligations.filter((o) => o.status === 'needs_evidence' && o.claim !== '(整體)').map((o) => o.claim),

    // 4. How the product can appear inside content.
    productRoles: roleFit(product),

    // 5. Where it can be distributed, and how a conversion would come back.
    distribution: ctaCompatibility(product, profile),

    // 6. Seed angles for the Opportunity engine.
    angleFamilies: angleFamilies(product),

    // 7. Can this product run an evaluable experiment at all?
    readiness: readiness(product, conversions),

    measurement: {
      conversionEvents: conversions.map((c) => ({ eventName: c.eventName, eventType: c.eventType, isPrimary: c.isPrimary, minSampleForEvaluation: c.minSampleForEvaluation })),
      primaryEvent: conversions.find((c) => c.isPrimary)?.eventName ?? null,
      // DATA_MODEL.md §5 — attribution priority order, applied to this product.
      attributionPriority: [
        product.primaryDomain ? 'direct_tracking_link' : null,
        'referral_code',
        'server_side_session_join',
        'configured_model',
        'unattributed',
      ].filter(Boolean),
    },
  }
}
