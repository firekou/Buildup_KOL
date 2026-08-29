import { db } from './store.js'
import { newId, assertId } from './ids.js'
import { validator, notFound, badRequest } from './validate.js'
import { emit } from './events.js'
import * as audit from './audit.js'
import { getSignal, freshnessOf } from './signals.js'
import { requireProduct } from './products.js'
import { CLAIM_DOMAINS } from './policy.js'

/**
 * Opportunity & Controversy Engine — FR-P0-03, GHOS-020.
 *
 * The single most important line in the spec for this module:
 *
 *   "第一版允許人工建立與人工排序；不得因沒有校準資料而先製造虛假的『精準總分』。"
 *
 * So there is no `viralScore` here and there never will be until there is
 * calibration data. What there *is*: a required `why_now`, a required tension,
 * a product-relevance judgement that must name which product field it hangs
 * off, evidence with provenance, and risk flags. An operator ranks the queue;
 * the system's job is to make sure nothing enters it without those fields.
 */

export const OPPORTUNITY_STATUS = ['new', 'reviewed', 'experimenting', 'archived', 'rejected']

/**
 * Risk flags are the input to the review gate's "does this need a human"
 * question. Each one names a concrete failure mode, not a vibe.
 */
export const RISK_FLAGS = {
  controversial_framing: { label: '爭議框架', hint: '題目本身建立在對立上，擴散快但品牌風險同步放大。' },
  real_person_reference: { label: '涉及真人', hint: '提到可辨識的真實人物，需檢查 likeness 與名譽風險。' },
  unverified_claim: { label: '未證實宣稱', hint: '核心論點還沒有可引用的來源。' },
  fast_moving_story: { label: '事實會變', hint: '事件仍在發展，發布後可能被後續事實推翻。' },
  tragedy_adjacent: { label: '鄰近悲劇', hint: '涉及傷亡或災難，任何商業 CTA 都需個案判斷。' },
  visual_suggestiveness: { label: '視覺尺度', hint: '畫面尺度需審，平台判定標準不一。' },
  regulated_domain: { label: '受監管領域', hint: '金融／醫療／法律／博弈類，必經人工審查。' },
  platform_sensitive: { label: '平台敏感', hint: '此題材在特定平台歷史上有限流或刪文紀錄。' },
}

/**
 * Product relevance must point at a product field. "It feels related" is not
 * an answer the system accepts — FR-P0-03 requires `product_relevance`, and a
 * relevance with no anchor is exactly the 硬蹭 the P2 spec forbids.
 */
export const RELEVANCE_ANCHORS = ['value_proposition', 'differentiator', 'known_objection', 'target_audience', 'proof_point', 'product_role', 'none'];

export function createOpportunity(input, actor = 'system') {
  const clean = validator(input)
    .required('topic', { label: '題目' })
    .required('whyNow', { label: 'Why now', min: 10 })
    .required('tension', { label: '對立／張力', min: 10 })
    .required('productRelevance', { label: '產品相關性', min: 10 })
    .oneOf('relevanceAnchor', RELEVANCE_ANCHORS, { label: '相關性錨點' })
    .list('riskFlags', { of: Object.keys(RISK_FLAGS) })
    .list('claimDomains', { of: CLAIM_DOMAINS })
    .list('candidatePersonas')
    .list('platformNotes')
    .list('evidence')
    .optional('competingViewpoints', [])
    .done()

  const product = requireProduct(input.productId)
  const campaignId = input.campaignId ? assertId(input.campaignId, 'campaign', 'campaignId') : null
  const signal = input.signalId ? getSignal(assertId(input.signalId, 'signal', 'signalId')) : null
  if (input.signalId && !signal) throw notFound(`Signal ${input.signalId}`)

  // Evidence provenance is not optional for a `none` anchor: an opportunity
  // with no product anchor AND no evidence is an opinion, and the queue is not
  // for opinions.
  if (clean.relevanceAnchor === 'none' && clean.evidence.length === 0) {
    throw badRequest('相關性錨點為 none 時，至少要提供一項 evidence，否則這只是主觀想法而非可測機會。')
  }

  const opportunity = db.insert('opportunities', {
    id: newId('opportunity'),
    productId: product.id,
    campaignId,
    signalId: signal?.id ?? null,
    ...clean,
    // Freshness is captured at creation *and* recomputed on read. The stored
    // one is the state the decision was made under; the live one is what the
    // operator sees now. Conflating them hides "we sat on this for 3 days".
    freshnessAtCreation: freshnessOf(signal?.occurredAt ?? new Date().toISOString()),
    sourceOccurredAt: signal?.occurredAt ?? null,
    status: 'new',
    createdBy: actor,
  })

  emit('opportunity.created', {
    productId: product.id,
    campaignId,
    opportunityId: opportunity.id,
    source: signal ? 'opportunity_engine' : 'operator',
    properties: { topic: clean.topic, riskFlags: clean.riskFlags, signalId: signal?.id ?? null },
  })
  audit.record({ actorType: 'human', actorId: actor, action: 'opportunity.created', entityType: 'opportunity', entityId: opportunity.id, after: opportunity })

  return decorate(opportunity)
}

/**
 * Derive an opportunity draft from a signal — the "找出可測題目" step.
 *
 * Deliberately returns a *draft for a human to complete*, not a saved row.
 * The three fields it cannot honestly fill (`whyNow` beyond recency, `tension`,
 * `productRelevance`) are returned as prompts, because a machine-written
 * tension is exactly the fabricated precision the spec forbids.
 */
export function draftFromSignal(signalId, productId) {
  // FR-P0-03 requires manual creation to work in v1. A product-only draft is
  // that path: for a B2B or developer product, the regional trend scan mostly
  // returns consumer hashtags with nothing to do with it, and the operator
  // already knows the argument they want to test. The draft then hangs off the
  // product analysis instead of a signal.
  if (!signalId) return draftFromProduct(productId)
  const signal = getSignal(signalId)
  if (!signal) throw notFound(`Signal ${signalId}`)
  const product = requireProduct(productId)
  const analysis = product.analysis ?? null

  const haystack = `${signal.title} ${signal.summary}`.toLowerCase()

  // Angle families come from the product analysis, so the suggestion always
  // points back at a declared product fact rather than a generic template.
  const angleMatches = (analysis?.angleFamilies ?? [])
    .map((a) => {
      const tokens = String(a.seed).toLowerCase().split(/[\s,、，。;；/]+/).filter((t) => t.length >= 2)
      const hits = tokens.filter((t) => haystack.includes(t))
      return { ...a, matchedTokens: hits }
    })
    .filter((a) => a.matchedTokens.length > 0)

  const suggestedRisk = []
  if (/死|亡|災|罹難|意外|失蹤/.test(signal.title)) suggestedRisk.push('tragedy_adjacent')
  if (/選舉|政黨|候選人|議員|市長/.test(signal.title)) suggestedRisk.push('regulated_domain')
  if ((analysis?.claimSurface?.domains ?? []).length) suggestedRisk.push('regulated_domain')
  if (signal.sourceType === 'news') suggestedRisk.push('fast_moving_story')

  const freshness = freshnessOf(signal.occurredAt ?? signal.ingestedAt)

  return {
    productId,
    signalId,
    topic: signal.title,
    // Only the part that is actually derivable is filled in.
    whyNowDraft: `${freshness.label}：${freshness.hint}${signal.evidenceRefs?.length > 1 ? `（已有 ${signal.evidenceRefs.length} 個來源提及）` : ''}`,
    prompts: {
      whyNow: '除了「它剛發生」以外，為什麼是現在？受眾此刻在爭論什麼、擔心什麼、想確認什麼？',
      tension: '這題的兩邊各是誰、各主張什麼？沒有真正的對立就沒有討論入口。',
      productRelevance: '產品憑什麼接住這題？指出是價值主張、差異點、已知反對意見還是受眾情境。',
    },
    suggestedAnchors: angleMatches.map((a) => ({ anchor: anchorFor(a.from), family: a.family, seed: a.seed, matchedTokens: a.matchedTokens, hint: a.hint })),
    suggestedRiskFlags: [...new Set(suggestedRisk)],
    suggestedClaimDomains: (analysis?.claimSurface?.domains ?? []).map((d) => d.domain),
    evidence: signal.evidenceRefs ?? [],
    freshness,
    // Said plainly so nobody mistakes the draft for an assessment.
    caveat: '這是草稿，不是評分。whyNow / tension / productRelevance 三欄必須由人填寫後才能建立 Opportunity。',
  }
}

/**
 * A draft with no signal behind it. Every angle family the product analysis
 * produced becomes a candidate anchor, because without signal text there is
 * nothing to match against — and picking a subset would be an unfounded
 * ranking, which §4 of the Dashboard spec forbids.
 */
export function draftFromProduct(productId) {
  const product = requireProduct(productId)
  const analysis = product.analysis ?? null

  return {
    productId,
    signalId: null,
    topic: '',
    whyNowDraft: '這是人工建立的題目，沒有對應的外部事件。「為什麼是現在」要由你說明——如果答案只是「我們現在想推」，那它就不具時效性，不要在內容裡宣稱它有。',
    prompts: {
      whyNow: '受眾此刻在爭論什麼、擔心什麼、想確認什麼？沒有外部事件時，這一欄要說的是受眾當下的處境，而不是我們的行銷排程。',
      tension: '這題的兩邊各是誰、各主張什麼？沒有真正的對立就沒有討論入口。',
      productRelevance: '產品憑什麼接住這題？指出是價值主張、差異點、已知反對意見還是受眾情境。',
    },
    suggestedAnchors: (analysis?.angleFamilies ?? []).map((a) => ({
      anchor: anchorFor(a.from),
      family: a.family,
      seed: a.seed,
      matchedTokens: [],
      hint: a.hint,
    })),
    suggestedRiskFlags: (analysis?.claimSurface?.domains ?? []).length ? ['regulated_domain'] : [],
    suggestedClaimDomains: (analysis?.claimSurface?.domains ?? []).map((d) => d.domain),
    evidence: [],
    freshness: { key: 'unknown', label: '無對應事件', hint: '人工建立的題目沒有事件時間戳，不得宣稱時效性。' },
    caveat: '這是草稿，不是評分。whyNow / tension / productRelevance 三欄必須由人填寫後才能建立 Opportunity。',
  }
}

const anchorFor = (from) =>
  ({ knownObjections: 'known_objection', differentiators: 'differentiator', targetAudience: 'target_audience', proofPoints: 'proof_point' })[from] ?? 'none'

function decorate(o) {
  const live = freshnessOf(o.sourceOccurredAt ?? o.createdAt)
  return {
    ...o,
    freshness: live,
    // Explicit: how long has this sat in the queue since the source event?
    decayedSinceCreation: o.freshnessAtCreation?.key !== live.key,
    experimentCount: db.count('experiments', { opportunityId: o.id }),
    riskFlagDetail: (o.riskFlags ?? []).map((f) => ({ flag: f, ...(RISK_FLAGS[f] ?? {}) })),
  }
}

export const listOpportunities = (filter = {}) => db.list('opportunities', filter).map(decorate)

export function getOpportunity(id) {
  const o = db.get('opportunities', id)
  return o ? decorate(o) : null
}

export function requireOpportunity(id) {
  const o = getOpportunity(assertId(id, 'opportunity', 'opportunityId'))
  if (!o) throw notFound(`Opportunity ${id}`)
  return o
}

export function setOpportunityStatus(id, status, actor = 'system', reason = null) {
  if (!OPPORTUNITY_STATUS.includes(status)) throw badRequest(`未知狀態 "${status}"`)
  const before = requireOpportunity(id)
  const after = db.update('opportunities', id, { status })
  emit('opportunity.status.changed', { productId: after.productId, opportunityId: id, source: 'operator', properties: { from: before.status, to: status, reason } })
  audit.record({ actorType: 'human', actorId: actor, action: 'opportunity.status.changed', entityType: 'opportunity', entityId: id, before, after, reason })
  return decorate(after)
}
