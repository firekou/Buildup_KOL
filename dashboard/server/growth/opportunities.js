import { db } from './store.js'
import { newId, assertId } from './ids.js'
import { validator, notFound, badRequest } from './validate.js'
import { emit } from './events.js'
import * as audit from './audit.js'
import { getSignal, freshnessOf } from './signals.js'
import { requireProduct } from './products.js'
import { CLAIM_DOMAINS } from './policy.js'
import { relevanceOf, draftFields } from './relevance.js'

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
  const product = requireProduct(productId)
  const signal = signalId ? getSignal(signalId) : null
  if (signalId && !signal) throw notFound(`Signal ${signalId}`)

  const freshness = signal ? freshnessOf(signal.occurredAt ?? signal.ingestedAt) : { key: 'unknown', label: '無對應事件', hint: '人工建立的題目沒有事件時間戳，不得宣稱時效性。' }
  const relevance = signal
    ? relevanceOf(signal, product)
    : { connects: false, best: null, matches: [], verdict: '人工建立的題目：由你指定要用產品的哪一個切角。', familyLabel: null }

  const fields = draftFields({ signal, product, relevance, freshness })
  const analysis = product.analysis ?? null

  const suggestedRisk = []
  if (signal && /死|亡|災|罹難|意外|失蹤|槍擊|地震/.test(signal.title)) suggestedRisk.push('tragedy_adjacent')
  if (signal && /選舉|政黨|候選人|議員|市長|總統/.test(signal.title)) suggestedRisk.push('regulated_domain')
  if ((analysis?.claimSurface?.domains ?? []).length) suggestedRisk.push('regulated_domain')
  if (signal?.sourceType === 'news') suggestedRisk.push('fast_moving_story')

  return {
    productId,
    signalId: signal?.id ?? null,
    signalTitle: signal?.title ?? null,
    signalUrl: signal?.url ?? null,

    // 系統草擬的三欄。操作者是在改字，不是在填空白。
    topic: fields.topic,
    whyNow: fields.whyNow,
    tension: fields.tension,
    productRelevance: fields.productRelevance,
    relevanceAnchor: fields.relevanceAnchor,
    hooks: fields.hooks,
    suggestedProductRole: fields.suggestedProductRole,
    needsEdit: fields.needsEdit,

    relevance,
    freshness,
    suggestedRiskFlags: [...new Set(suggestedRisk)],
    suggestedClaimDomains: (analysis?.claimSurface?.domains ?? []).map((d) => d.domain),
    evidence: signal?.evidenceRefs ?? [],

    // 全部切角仍然提供，但不再是操作者唯一的依靠。
    allAnchors: (analysis?.angleFamilies ?? []).map((a) => ({ anchor: anchorFor(a.from), family: a.family, seed: a.seed, hint: a.hint })),

    caveat: '以下三欄是系統依你登記的產品事實草擬的，不是評分也不是結論。送出前請逐欄確認——特別是「對立」，機器只能給形狀，論點要你自己下。',
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
