import { db } from './store.js'
import { newId } from './ids.js'
import { PLATFORM_IDS } from './platforms.js'

/**
 * Policy as code — PRODUCT_SPEC.md §13, SYSTEM_ARCHITECTURE.md §2.8.
 *
 * "Governance 必須是產品能力，不是 README 裡的一句提醒." A policy profile is a
 * versioned control-plane row; every review decision stores the version it was
 * judged under, so tightening a rule tomorrow does not silently reclassify
 * yesterday's approvals.
 *
 * The built-in profiles below are seeds, not the source of truth — a product
 * points at a profile id, and an operator can create a stricter one without a
 * code change.
 */

export const CLAIM_DOMAINS = [
  'health',
  'finance',
  'legal',
  'political',
  'adult',
  'gambling',
  'prediction_market',
  'employment',
  'housing',
]

/** Domains that can never auto-approve, whatever the product profile says. */
export const ALWAYS_HUMAN_REVIEW = ['health', 'finance', 'legal', 'gambling', 'prediction_market']

export const REVIEW_REASON_CODES = [
  'OK',
  'CLAIM_UNSUPPORTED',
  'CLAIM_HIGH_STAKES',
  'PERSONA_OUT_OF_BOUNDS',
  'PERSONA_EMBODIMENT',
  'REAL_PERSON_LIKENESS',
  'PLATFORM_FORMAT',
  'PLATFORM_POLICY',
  'PRODUCT_RESTRICTION',
  'GEO_RESTRICTION',
  'AGE_RESTRICTION',
  'DISCLOSURE_MISSING',
  'BRAND_SAFETY',
  'DUPLICATE_CONTENT',
  'OTHER',
]

export const INCIDENT_TYPES = [
  'content_removed',
  'platform_warning',
  'account_restricted',
  'inaccurate_claim',
  'user_complaint',
  'product_policy_violation',
  'disclosure_failure',
]

export const SEVERITIES = ['low', 'medium', 'high', 'critical']

/**
 * Seed profiles. `version` is bumped by hand whenever a rule changes; the
 * seeder writes them into the store on first boot and never overwrites an
 * operator's edits (see ensureSeeded).
 */
export const BUILTIN_PROFILES = [
  {
    key: 'standard-consumer',
    name: '一般消費性產品',
    version: '1.0.0',
    description: '無高風險 claim 的一般產品：娛樂、工具、內容平台。',
    allowedGeos: ['*'],
    minAge: 13,
    restrictedClaimDomains: [],
    blockedPlatforms: [],
    requireHumanReviewWhen: ['controversial_framing', 'real_person_reference'],
    autoApproveAllowed: true,
    disclosure: { aiPersona: true, paidPromotion: true },
  },
  {
    key: 'regulated-financial',
    name: '金融／預測市場類',
    version: '1.0.0',
    description:
      'ROADMAP.md Pilot B。地區、年齡與平台限制依實際司法管轄區決定；本 profile 只提供最保守的預設，接入新市場時必須另建 profile 而非放寬這一份。',
    allowedGeos: [],
    minAge: 18,
    restrictedClaimDomains: ['finance', 'prediction_market', 'gambling'],
    blockedPlatforms: [],
    // Nothing in this profile auto-approves. The spec's Gate 4 says automation
    // widens only after pilot evidence, and there is none yet.
    requireHumanReviewWhen: ['*'],
    autoApproveAllowed: false,
    disclosure: { aiPersona: true, paidPromotion: true, riskWarning: true },
  },
  {
    key: 'entertainment-adult-adjacent',
    name: '娛樂／成人相鄰',
    version: '1.0.0',
    description: '視覺尺度需個案判斷的娛樂型產品；不含成人內容本身。',
    allowedGeos: ['*'],
    minAge: 18,
    restrictedClaimDomains: ['adult'],
    blockedPlatforms: [],
    requireHumanReviewWhen: ['visual_suggestiveness', 'controversial_framing'],
    autoApproveAllowed: false,
    disclosure: { aiPersona: true, paidPromotion: true },
  },
]

export function ensureSeeded() {
  for (const profile of BUILTIN_PROFILES) {
    db.upsert('policyProfiles', (r) => r.key === profile.key, { id: newId('policy'), ...profile, builtin: true })
  }
  return db.list('policyProfiles')
}

export const listProfiles = () => db.list('policyProfiles')
export const getProfile = (id) => db.get('policyProfiles', id) ?? db.find('policyProfiles', (r) => r.key === id)

export function createProfile(input) {
  return db.insert('policyProfiles', { id: newId('policy'), builtin: false, version: '1.0.0', ...input })
}

/**
 * The profile a product is judged under, with the fallbacks made explicit.
 * A product without a profile gets the strictest built-in, never "no policy" —
 * a missing config must fail closed.
 */
export function resolveProfile(product) {
  const profile = product?.policyProfileId ? getProfile(product.policyProfileId) : null
  if (profile) return profile
  return getProfile('regulated-financial') ?? BUILTIN_PROFILES[1]
}

/** Platforms a product may publish to under its profile. */
export function allowedPlatforms(product) {
  const profile = resolveProfile(product)
  const blocked = new Set([...(profile.blockedPlatforms ?? []), ...(product?.blockedPlatforms ?? [])])
  return PLATFORM_IDS.filter((p) => !blocked.has(p))
}

/** Does this claim domain force a human into the loop for this product? */
export function requiresHumanReview(product, { claimDomains = [], flags = [] } = {}) {
  const profile = resolveProfile(product)
  const reasons = []

  if (!profile.autoApproveAllowed) reasons.push(`policy profile「${profile.name}」不允許自動核准`)

  for (const domain of claimDomains) {
    if (ALWAYS_HUMAN_REVIEW.includes(domain)) reasons.push(`${domain} 屬高風險 claim，必經人工審查`)
    else if ((profile.restrictedClaimDomains ?? []).includes(domain)) reasons.push(`${domain} 在此 policy profile 為受限 claim`)
  }

  const triggers = profile.requireHumanReviewWhen ?? []
  if (triggers.includes('*') && flags.length) reasons.push('此 profile 對所有風險旗標要求人工審查')
  else for (const flag of flags) if (triggers.includes(flag)) reasons.push(`風險旗標 ${flag} 需人工審查`)

  return { required: reasons.length > 0, reasons, policyVersion: `${profile.key}@${profile.version}` }
}

/* ------------------------------------------------------------- incidents */

export function logIncident({ productId, personaId = null, publicationId = null, incidentType, severity = 'medium', platform = null, description, resolution = null, policyVersion = null, occurredAt = null }) {
  return db.insert('incidents', {
    id: newId('incident'),
    productId,
    personaId,
    publicationId,
    incidentType,
    severity,
    platform,
    description,
    resolution,
    policyVersion,
    occurredAt: occurredAt ?? new Date().toISOString(),
    status: resolution ? 'resolved' : 'open',
  })
}

export const listIncidents = (filter = {}) => db.list('incidents', filter)
