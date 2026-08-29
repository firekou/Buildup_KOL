import { db } from './store.js'
import { newId, assertId } from './ids.js'
import { validator, notFound, badRequest, conflict } from './validate.js'
import { emit, dedupeKey } from './events.js'
import * as audit from './audit.js'
import * as policy from './policy.js'
import { runJob } from './jobs.js'
import { getPublishAdapter, listPublishAdapters } from './adapters/publish.js'
import { PLATFORM_IDS, getPlatform } from './platforms.js'
import { requireArm, requireExperiment, setStatus as setExperimentStatus } from './experiments.js'
import { requireProduct } from './products.js'
import { getAsset } from './generation.js'
import { createTrackingLink } from './tracking.js'

/**
 * Publishing & Distribution — FR-P0-08, GHOS-031 / 160-164.
 *
 * The governance boundary is enforced here rather than described: the account
 * registry holds only a `credentialRef`, publish is idempotent per (arm,
 * account), and there is no code path for coordinated engagement, undisclosed
 * impersonation or ban evasion. ROADMAP.md Epic 8 lists those as an explicit
 * non-task; the way to keep that true is to not build the seams for them.
 */

export { listPublishAdapters }

export const ACCOUNT_TYPES = ['persona_owned', 'brand_owned']
export const ACCOUNT_STATUS = ['active', 'paused', 'restricted', 'banned']

/* ------------------------------------------------------- social accounts */

export function registerAccount(input, actor = 'system') {
  const clean = validator(input)
    .oneOf('platform', PLATFORM_IDS, { label: '平台' })
    .required('accountRef', { label: '帳號識別（handle）' })
    .oneOf('accountType', ACCOUNT_TYPES, { label: '帳號類型' })
    .optional('personaId', null)
    .optional('credentialRef', null)
    .optional('displayName', null)
    .done()

  // Persona-owned accounts must name their persona: an account posting as a
  // character with no registered persona is exactly the undisclosed-identity
  // shape the policy forbids.
  if (clean.accountType === 'persona_owned' && !clean.personaId) {
    throw badRequest('persona_owned 帳號必須指定 personaId——沒有登記人設的角色帳號無法通過身分揭露檢查。')
  }
  if (clean.credentialRef && /[=:]/.test(clean.credentialRef)) {
    throw badRequest('credentialRef 只能是環境變數名稱等「參照」，不得填入實際憑證。')
  }

  const existing = db.find('socialAccounts', (a) => a.platform === clean.platform && a.accountRef === clean.accountRef)
  if (existing) throw conflict(`帳號 ${clean.platform}/${clean.accountRef} 已登記`)

  const account = db.insert('socialAccounts', {
    id: newId('account'),
    ...clean,
    status: 'active',
    policyState: 'ok',
    lastSyncAt: null,
    publishCount: 0,
    failureCount: 0,
  })
  audit.record({ actorType: 'human', actorId: actor, action: 'social_account.registered', entityType: 'account', entityId: account.id, after: account })
  return account
}

export const listAccounts = (filter = {}) => db.list('socialAccounts', filter)

export function setAccountStatus(id, status, { actor = 'system', reason = null, policyState = null } = {}) {
  if (!ACCOUNT_STATUS.includes(status)) throw badRequest(`未知帳號狀態 "${status}"`)
  const before = db.get('socialAccounts', id)
  if (!before) throw notFound(`Account ${id}`)
  const after = db.update('socialAccounts', id, { status, ...(policyState ? { policyState } : {}) })
  audit.record({ actorType: 'human', actorId: actor, action: 'social_account.status.changed', entityType: 'account', entityId: id, before, after, reason })
  return after
}

/**
 * Account health — the Distribution page's top table. `restricted` and
 * `banned` accounts are surfaced next to publish volume deliberately: a rising
 * publish rate with rising restrictions is the pattern that a growth dashboard
 * showing only volume would hide.
 */
export function accountHealth() {
  return listAccounts().map((account) => {
    const pubs = db.filter('publications', (p) => p.socialAccountId === account.id)
    const failed = pubs.filter((p) => p.status === 'failed')
    const incidents = db.filter('incidents', (i) => pubs.some((p) => p.id === i.publicationId))
    const recent = pubs.filter((p) => Date.parse(p.createdAt) > Date.now() - 7 * 86_400_000)
    const spec = getPlatform(account.platform)
    return {
      ...account,
      publishTotal: pubs.length,
      publishLast7d: recent.length,
      failureRate: pubs.length ? failed.length / pubs.length : null,
      incidents: incidents.length,
      openIncidents: incidents.filter((i) => i.status === 'open').length,
      lastPublishedAt: pubs.map((p) => p.publishedAt).filter(Boolean).sort().at(-1) ?? null,
      lastMetricSyncAt: pubs.map((p) => p.lastMetricSyncAt).filter(Boolean).sort().at(-1) ?? null,
      rateLimitPerDay: spec?.rateLimitPerDay ?? null,
      // Compared against the platform's own documented ceiling, not a made-up one.
      rateLimitPressure: spec?.rateLimitPerDay ? recent.length / (spec.rateLimitPerDay * 7) : null,
    }
  })
}

/* ---------------------------------------------------------- publications */

export const PUBLICATION_STATUS = ['scheduled', 'publishing', 'published', 'failed', 'removed']

/**
 * Create a publication for an approved asset. Refuses unapproved assets —
 * that is the "publication approval" step at the end of the gate chain, and
 * it must be a code path, not a convention.
 */
export function schedulePublication(input, actor = 'system') {
  const asset = getAsset(assertId(input.assetId, 'asset', 'assetId'))
  if (!asset) throw notFound(`Asset ${input.assetId}`)
  const arm = requireArm(asset.armId)
  const experiment = requireExperiment(arm.experimentId)
  const product = requireProduct(experiment.productId)

  if (asset.reviewStatus !== 'approved') {
    throw conflict(`素材尚未核准（目前 ${asset.reviewStatus}）——未通過 review gate 的素材不得排入發布。`)
  }

  const account = db.get('socialAccounts', assertId(input.socialAccountId, 'account', 'socialAccountId'))
  if (!account) throw notFound(`Account ${input.socialAccountId}`)
  if (account.status !== 'active') throw conflict(`帳號 ${account.accountRef} 狀態為 ${account.status}，不得發布。`)
  if (account.platform !== arm.platform) {
    throw badRequest(`arm 指定平台為 ${arm.platform}，但帳號屬於 ${account.platform}。`)
  }
  if (!policy.allowedPlatforms(product).includes(arm.platform)) {
    throw conflict(`產品 policy 封鎖了 ${arm.platform}。`)
  }

  const existing = db.find('publications', (p) => p.armId === arm.id && p.socialAccountId === account.id && p.status !== 'failed')
  if (existing) return { publication: existing, duplicate: true }

  // Mint the tracking link at schedule time so the CTA in the post can carry
  // it. A link created after publishing is a link nobody clicked.
  const trackingLink = product.primaryDomain
    ? createTrackingLink({
        productId: product.id,
        campaignId: experiment.campaignId,
        experimentId: experiment.id,
        armId: arm.id,
        destinationUrl: input.destinationUrl ?? product.primaryDomain,
        platform: arm.platform,
      })
    : null

  const publication = db.insert('publications', {
    id: newId('publication'),
    armId: arm.id,
    assetId: asset.id,
    experimentId: experiment.id,
    productId: product.id,
    campaignId: experiment.campaignId,
    personaId: arm.personaId,
    socialAccountId: account.id,
    platform: arm.platform,
    platformPostId: null,
    url: null,
    trackingLinkId: trackingLink?.id ?? null,
    trackingCode: trackingLink?.trackingCode ?? null,
    trackedUrl: trackingLink?.trackedUrl ?? null,
    status: 'scheduled',
    scheduledAt: input.scheduledAt ?? new Date().toISOString(),
    publishedAt: null,
    lastMetricSyncAt: null,
    // Recorded, not asserted: the disclosure obligation for this platform and
    // whether the operator has confirmed it. The publish call requires it.
    disclosureRequired: Boolean(getPlatform(arm.platform)?.disclosureRequired),
    disclosureConfirmed: false,
  })

  if (trackingLink) db.update('trackingLinks', trackingLink.id, { publicationId: publication.id })

  audit.record({ actorType: 'human', actorId: actor, action: 'publication.scheduled', entityType: 'publication', entityId: publication.id, after: publication })
  return { publication, duplicate: false }
}

/**
 * Mark a publication live. For `manual_log` adapters this is the operator
 * reporting what they posted; the adapter contract is identical either way, so
 * swapping in a real API adapter changes nothing downstream.
 */
export async function publish(publicationId, { platformPostId = null, url = null, disclosureConfirmed = false, actor = 'system' } = {}) {
  const publication = db.get('publications', publicationId)
  if (!publication) throw notFound(`Publication ${publicationId}`)
  if (publication.status === 'published') return { publication, duplicate: true }

  if (publication.disclosureRequired && !disclosureConfirmed) {
    throw badRequest(
      `${getPlatform(publication.platform)?.label ?? publication.platform} 要求 AI 生成揭露。請在平台上開啟該標示後，帶 disclosureConfirmed=true 再送出——系統不會替你宣告已揭露。`,
    )
  }

  const adapter = getPublishAdapter(publication.platform)
  if (!adapter) throw badRequest(`平台 ${publication.platform} 沒有 publisher adapter`)

  db.update('publications', publicationId, { status: 'publishing' })

  const { result } = await runJob(
    'publication.publish',
    { publicationId },
    async () => adapter.publish({ publication, platformPostId, url }),
    // GHOS-X02 — a UI timeout followed by a retry must not post twice.
    { idempotencyKey: dedupeKey('publish', publicationId) },
  )

  if (!result.ok) {
    const failed = db.update('publications', publicationId, { status: 'failed', lastError: result.errorMessage })
    db.update('socialAccounts', publication.socialAccountId, { failureCount: (db.get('socialAccounts', publication.socialAccountId)?.failureCount ?? 0) + 1 })
    emit('publication.failed', { productId: publication.productId, experimentId: publication.experimentId, armId: publication.armId, publicationId, platform: publication.platform, source: 'publisher', properties: { error: result.error, message: result.errorMessage } })
    return { publication: failed, ok: false, error: result.error, errorMessage: result.errorMessage }
  }

  const published = db.update('publications', publicationId, {
    status: 'published',
    platformPostId: result.platformPostId,
    url: result.url ?? url,
    publishedAt: result.publishedAt ?? new Date().toISOString(),
    disclosureConfirmed: true,
    publishMode: result.mode ?? adapter.mode,
  })

  const account = db.get('socialAccounts', publication.socialAccountId)
  db.update('socialAccounts', account.id, { publishCount: (account.publishCount ?? 0) + 1, lastSyncAt: new Date().toISOString() })
  db.update('arms', publication.armId, { status: 'PUBLISHED' })

  emit('publication.published', {
    productId: publication.productId, campaignId: publication.campaignId, experimentId: publication.experimentId,
    armId: publication.armId, assetId: publication.assetId, personaId: publication.personaId,
    publicationId, platform: publication.platform,
    source: 'publisher',
    idempotencyKey: dedupeKey('published', publicationId),
    properties: { platformPostId: result.platformPostId, mode: result.mode ?? adapter.mode, trackingCode: publication.trackingCode },
  })
  audit.record({ actorType: 'human', actorId: actor, action: 'publication.published', entityType: 'publication', entityId: publicationId, after: published })

  // The experiment's observation window starts at the first publish.
  const experiment = db.get('experiments', publication.experimentId)
  if (experiment && ['APPROVED', 'GENERATED', 'REVIEW_REQUIRED'].includes(experiment.status)) {
    setExperimentStatus(experiment.id, 'PUBLISHED', { actor, reason: '第一個 arm 已發布，觀測窗開始', force: true })
  }
  const arms = db.listAsc('arms', { experimentId: publication.experimentId })
  const publishedArms = new Set(db.filter('publications', (p) => p.experimentId === publication.experimentId && p.status === 'published').map((p) => p.armId))
  if (publishedArms.size === arms.length) {
    const current = db.get('experiments', publication.experimentId)
    if (current?.status === 'PUBLISHED') setExperimentStatus(current.id, 'COLLECTING', { actor, reason: '所有 arm 已發布，進入資料收集' })
  }

  return { publication: published, ok: true }
}

export const listPublications = (filter = {}, limit = 300) => db.list('publications', filter).slice(0, limit)
export const getPublication = (id) => db.get('publications', id)

/** Record a takedown / restriction against a publication (GHOS-164). */
export function recordIncident(publicationId, input, actor = 'system') {
  const publication = db.get('publications', publicationId)
  if (!publication) throw notFound(`Publication ${publicationId}`)

  const incident = policy.logIncident({
    productId: publication.productId,
    personaId: publication.personaId,
    publicationId,
    incidentType: input.incidentType,
    severity: input.severity ?? 'medium',
    platform: publication.platform,
    description: input.description,
    resolution: input.resolution ?? null,
  })

  if (input.incidentType === 'content_removed') db.update('publications', publicationId, { status: 'removed' })
  if (input.incidentType === 'account_restricted') {
    setAccountStatus(publication.socialAccountId, 'restricted', { actor, reason: input.description, policyState: 'restricted' })
  }

  emit('policy.incident.created', { productId: publication.productId, publicationId, platform: publication.platform, personaId: publication.personaId, source: 'operator', properties: { incidentType: input.incidentType, severity: input.severity } })
  audit.record({ actorType: 'human', actorId: actor, action: 'policy.incident.created', entityType: 'publication', entityId: publicationId, after: incident, reason: input.description })
  return incident
}
