import { db } from './store.js'
import { newId, assertId } from './ids.js'
import { validator, notFound, badRequest } from './validate.js'
import { emit } from './events.js'
import * as audit from './audit.js'
import * as policy from './policy.js'
import { PLATFORM_IDS } from './platforms.js'
import { analyseProduct } from './product-analysis.js'

/**
 * Product & Campaign registry — FR-P0-01, DATA_MODEL.md §2.
 *
 * The acceptance criterion is the whole design constraint: "同一套 GHOS 可以
 * 同時容納 Showgame 與另一個產品，而不需 fork codebase." So everything a
 * product-specific behaviour could key on — conversion events, policy profile,
 * allowed platforms, CTA roles — is a row here, not a branch in code.
 */

export const BUSINESS_MODELS = [
  'subscription',
  'transactional',
  'marketplace',
  'advertising',
  'freemium',
  'lead_gen',
  'content_platform',
  'prediction_market',
]

export const CONVERSION_EVENT_TYPES = ['visit', 'signup', 'activation', 'purchase', 'deposit', 'retention', 'custom']

/**
 * FR-P1 / GHOS-100 — what the product *is* inside a piece of content.
 *
 * This is the taxonomy that stops every post ending with the same bolted-on
 * ad. An arm declares which role it uses, and CTA templates are filed under
 * the role rather than under the product.
 */
export const PRODUCT_ROLES = {
  utility: { label: '工具', hint: '產品是主角在內容裡實際用來解決問題的東西。' },
  answer_to_debate: { label: '爭議的解答', hint: '內容先立起一個對立，產品是驗證誰對的方式。' },
  destination: { label: '去處', hint: '內容是體驗預告，產品是體驗本身發生的地方。' },
  proof_source: { label: '佐證來源', hint: '產品的資料／賠率／排行本身就是內容的證據。' },
  challenge: { label: '挑戰', hint: '把產品行為包成可被複製的挑戰或賽制。' },
  next_action: { label: '下一步', hint: '內容給出結論，產品是唯一合理的下一個動作。' },
}

/* ------------------------------------------------------------- products */

export function listProducts() {
  return db.list('products').map(withCounts)
}

const withCounts = (product) => ({
  ...product,
  conversionDefinitions: db.list('conversionDefinitions', { productId: product.id }),
  campaignCount: db.count('campaigns', { productId: product.id }),
  experimentCount: db.count('experiments', { productId: product.id }),
})

export function getProduct(id) {
  const product = db.get('products', id)
  if (!product) return null
  return withCounts(product)
}

export function requireProduct(id) {
  const product = getProduct(assertId(id, 'product', 'productId'))
  if (!product) throw notFound(`Product ${id}`)
  return product
}

export function createProduct(input, actor = 'system') {
  const clean = validator(input)
    .required('name', { label: '產品名稱' })
    .oneOf('businessModel', BUSINESS_MODELS, { label: '商業模式' })
    .required('valueProposition', { label: '核心價值主張', min: 10 })
    .optional('owner')
    .optional('primaryDomain')
    .optional('description', '')
    .optional('policyProfileId', 'standard-consumer')
    .list('targetAudience')
    .list('differentiators')
    .list('proofPoints')
    .list('knownObjections')
    .list('blockedPlatforms', { of: PLATFORM_IDS })
    .list('allowedGeos')
    .number('minAge', { min: 0, max: 99, fallback: null })
    .list('productRoles', { of: Object.keys(PRODUCT_ROLES) })
    .oneOf('status', ['draft', 'active', 'paused', 'archived'], { required: false, fallback: 'draft' })
    .done()

  if (!policy.getProfile(clean.policyProfileId)) throw badRequest(`未知的 policy profile "${clean.policyProfileId}"`)

  const product = db.insert('products', {
    id: newId('product'),
    ...clean,
    // Stage is the field the Dashboard's product board reads. It moves only
    // through recomputeStage(), never by hand — see pipeline.js.
    stage: 'registered',
  })

  audit.record({ actorType: 'human', actorId: actor, action: 'product.created', entityType: 'product', entityId: product.id, after: product })
  return getProduct(product.id)
}

export function updateProduct(id, patch, actor = 'system') {
  const before = requireProduct(id)
  const allowed = [
    'name', 'businessModel', 'valueProposition', 'owner', 'primaryDomain', 'description',
    'policyProfileId', 'targetAudience', 'differentiators', 'proofPoints', 'knownObjections',
    'blockedPlatforms', 'allowedGeos', 'minAge', 'productRoles', 'status',
  ]
  const next = Object.fromEntries(Object.entries(patch).filter(([k]) => allowed.includes(k)))
  const after = db.update('products', id, next)
  audit.record({ actorType: 'human', actorId: actor, action: 'product.updated', entityType: 'product', entityId: id, before, after })
  return getProduct(id)
}

/* ------------------------------------------- conversion event definitions */

export function defineConversion(productId, input, actor = 'system') {
  requireProduct(productId)
  const clean = validator(input)
    .required('eventName', { label: '事件名稱' })
    .required('displayName', { label: '顯示名稱' })
    .oneOf('eventType', CONVERSION_EVENT_TYPES, { label: '事件類型' })
    .optional('valueField', null)
    .optional('currency', 'USD')
    .number('minSampleForEvaluation', { min: 1, fallback: 30 })
    .done()

  const isPrimary = Boolean(input.isPrimary)
  if (isPrimary) {
    // Exactly one primary per product — the evaluator picks the experiment's
    // primary_outcome from this, and two primaries means no defined winner.
    db.updateWhere('conversionDefinitions', (r) => r.productId === productId && r.isPrimary, { isPrimary: false })
  }

  const existing = db.find('conversionDefinitions', (r) => r.productId === productId && r.eventName === clean.eventName)
  if (existing) throw badRequest(`事件 "${clean.eventName}" 已定義`)

  const row = db.insert('conversionDefinitions', {
    id: newId('product'),
    productId,
    ...clean,
    isPrimary,
    schemaVersion: 1,
  })
  audit.record({ actorType: 'human', actorId: actor, action: 'conversion_definition.created', entityType: 'product', entityId: productId, after: row })
  return row
}

export const listConversions = (productId) => db.list('conversionDefinitions', { productId })

export const primaryConversion = (productId) =>
  db.find('conversionDefinitions', (r) => r.productId === productId && r.isPrimary)

/* ------------------------------------------------------------ campaigns */

export const CAMPAIGN_OBJECTIVES = ['awareness', 'traffic', 'signup', 'activation', 'revenue', 'retention']

export function createCampaign(input, actor = 'system') {
  const clean = validator(input)
    .required('name', { label: 'Campaign 名稱' })
    .oneOf('objective', CAMPAIGN_OBJECTIVES, { label: '目標' })
    .iso('startsAt')
    .iso('endsAt')
    .optional('owner')
    .number('budgetCapUsd', { min: 0, fallback: null })
    .done()

  const product = requireProduct(input.productId)
  const campaign = db.insert('campaigns', {
    id: newId('campaign'),
    productId: product.id,
    ...clean,
    status: 'active',
  })
  audit.record({ actorType: 'human', actorId: actor, action: 'campaign.created', entityType: 'campaign', entityId: campaign.id, after: campaign })
  emit('opportunity.created', { productId: product.id, campaignId: campaign.id, source: 'control_plane', properties: { kind: 'campaign_created' } })
  return campaign
}

export const listCampaigns = (filter = {}) => db.list('campaigns', filter)
export function requireCampaign(id) {
  const row = db.get('campaigns', assertId(id, 'campaign', 'campaignId'))
  if (!row) throw notFound(`Campaign ${id}`)
  return row
}

/* -------------------------------------------------- 產品特性分析 (FR-P0-01) */

/**
 * Run the characteristic analysis and store it on the product.
 *
 * Kept as an explicit action rather than a computed field: the analysis is an
 * input to Opportunity relevance and to the Persona router, and both need to
 * know *which version* of the analysis a decision was made under. Recomputing
 * silently on every read would make that untraceable.
 */
export function analyse(productId, actor = 'system') {
  const product = requireProduct(productId)
  const analysis = analyseProduct(product, {
    conversions: listConversions(productId),
    profile: policy.resolveProfile(product),
  })
  const after = db.update('products', productId, { analysis, analysedAt: new Date().toISOString() })
  audit.record({ actorType: 'human', actorId: actor, action: 'product.analysed', entityType: 'product', entityId: productId, after: analysis, reason: 'FR-P0-01 產品特性分析' })
  return { product: getProduct(productId), analysis: after.analysis }
}
