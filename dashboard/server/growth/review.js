import { db } from './store.js'
import { newId } from './ids.js'
import { validator, notFound, badRequest } from './validate.js'
import { emit } from './events.js'
import * as audit from './audit.js'
import * as policy from './policy.js'
import { runGates } from './gates.js'
import { getAsset } from './generation.js'
import { requireArm, requireExperiment, setStatus as setExperimentStatus } from './experiments.js'
import { requireProduct } from './products.js'

/**
 * Review queue — FR-P0-07, GHOS-030.
 *
 * Every decision stores reviewer, decision, reason code, notes, timestamp and
 * policy version (DASHBOARD_SPEC.md §11). The policy version is the field that
 * is easy to omit and expensive to lack: without it, tightening a rule makes
 * every historical approval unexplainable.
 */

export const DECISIONS = ['approved', 'rejected', 'revision_requested']

export const REVIEW_TYPES = ['auto', 'human', 'claim', 'likeness', 'platform', 'product']

/** Run the gate chain against an asset and store the automatic verdict. */
export function evaluateAsset(assetId, actor = 'system') {
  const asset = getAsset(assetId)
  if (!asset) throw notFound(`Asset ${assetId}`)
  const arm = requireArm(asset.armId)
  const experiment = requireExperiment(arm.experimentId)
  const product = requireProduct(experiment.productId)
  const opportunity = experiment.opportunityId ? db.get('opportunities', experiment.opportunityId) : null

  const result = runGates({ asset, arm, experiment, product, opportunity })

  const decision = result.verdict === 'blocked' ? 'rejected' : result.verdict === 'auto_approvable' ? 'approved' : 'revision_requested'
  const autoReview = db.insert('reviews', {
    id: newId('review'),
    assetId,
    armId: arm.id,
    experimentId: experiment.id,
    productId: product.id,
    publicationId: null,
    reviewType: 'auto',
    decision: result.verdict === 'auto_approvable' ? 'approved' : 'pending',
    verdict: result.verdict,
    reasonCode: result.verdict === 'blocked' ? reasonCodeFor(result.blocking[0]) : 'OK',
    notes: result.summary,
    gates: result.gates,
    reviewer: 'gate_pipeline',
    policyVersion: result.policyVersion,
  })

  // An asset that the chain can auto-approve moves straight to `approved`.
  // Anything else waits for a human — including `needs_human`, which is the
  // common case, not the exception.
  const reviewStatus = result.verdict === 'auto_approvable' ? 'approved' : result.verdict === 'blocked' ? 'rejected' : 'review_required'
  db.update('assets', assetId, { reviewStatus, lastGateVerdict: result.verdict, lastGateAt: new Date().toISOString() })

  if (result.verdict === 'auto_approvable') {
    emit('review.approved', { productId: product.id, experimentId: experiment.id, armId: arm.id, assetId, source: 'gate_pipeline', properties: { auto: true, policyVersion: result.policyVersion } })
  } else if (result.verdict === 'blocked') {
    emit('review.rejected', { productId: product.id, experimentId: experiment.id, armId: arm.id, assetId, source: 'gate_pipeline', properties: { blocking: result.blocking.map((g) => g.gate) } })
  }

  audit.record({ actorType: 'system', actorId: 'gate_pipeline', action: `review.auto.${result.verdict}`, entityType: 'asset', entityId: assetId, after: { verdict: result.verdict, gates: result.gates.map((g) => `${g.gate}=${g.result}`) } })

  if (result.verdict !== 'auto_approvable' && ['GENERATED'].includes(experiment.status)) {
    setExperimentStatus(experiment.id, 'REVIEW_REQUIRED', { actor, reason: '至少一個素材需人工審查或被擋下' })
  }

  return { review: autoReview, ...result, asset: getAsset(assetId) }
}

const reasonCodeFor = (gate) => {
  if (!gate) return 'OTHER'
  const map = {
    duplicate_content: 'DUPLICATE_CONTENT',
    product_platform: 'PRODUCT_RESTRICTION',
    product_claims: 'CLAIM_UNSUPPORTED',
    persona_claims: 'PERSONA_OUT_OF_BOUNDS',
    persona_credibility: 'PERSONA_EMBODIMENT',
    platform_format: 'PLATFORM_FORMAT',
    schema: 'OTHER',
  }
  if (gate.gate.startsWith('redline:')) return 'CLAIM_HIGH_STAKES'
  return map[gate.gate] ?? 'OTHER'
}

/**
 * A human decision. Never allowed to silently overturn a *blocking* gate:
 * doing so requires an explicit `overrideBlocking` plus a reason, and it is
 * recorded as a human override so the incident review can find it later.
 */
export function decide(assetId, input, actor = 'system') {
  const asset = getAsset(assetId)
  if (!asset) throw notFound(`Asset ${assetId}`)

  const clean = validator(input)
    .oneOf('decision', DECISIONS, { label: '審查結果' })
    .oneOf('reasonCode', policy.REVIEW_REASON_CODES, { label: '原因代碼' })
    .optional('notes', null)
    .oneOf('reviewType', REVIEW_TYPES, { label: '審查類型', required: false, fallback: 'human' })
    .done()

  const arm = requireArm(asset.armId)
  const experiment = requireExperiment(arm.experimentId)
  const latestAuto = db.list('reviews', { assetId, reviewType: 'auto' })[0]
  const hadBlocking = (latestAuto?.gates ?? []).some((g) => g.result === 'blocking')

  if (clean.decision === 'approved' && hadBlocking && !input.overrideBlocking) {
    throw badRequest(
      '此素材有阻擋級 gate 未解除。若確定要放行，必須帶 overrideBlocking=true 並在 notes 寫明理由——此動作會記為人工 override 並進入稽核。',
    )
  }
  if (clean.decision === 'approved' && hadBlocking && !clean.notes) {
    throw badRequest('override 阻擋級 gate 時，notes 為必填。')
  }

  const review = db.insert('reviews', {
    id: newId('review'),
    assetId,
    armId: arm.id,
    experimentId: experiment.id,
    productId: experiment.productId,
    publicationId: null,
    reviewType: clean.reviewType,
    decision: clean.decision,
    verdict: null,
    reasonCode: clean.reasonCode,
    notes: clean.notes,
    reviewer: actor,
    overrodeBlocking: Boolean(clean.decision === 'approved' && hadBlocking),
    policyVersion: latestAuto?.policyVersion ?? null,
  })

  const reviewStatus = clean.decision === 'approved' ? 'approved' : clean.decision === 'rejected' ? 'rejected' : 'revision_requested'
  db.update('assets', assetId, { reviewStatus })

  emit(clean.decision === 'approved' ? 'review.approved' : clean.decision === 'rejected' ? 'review.rejected' : 'review.revision_requested', {
    productId: experiment.productId, experimentId: experiment.id, armId: arm.id, assetId,
    source: 'human_reviewer',
    properties: { reviewer: actor, reasonCode: clean.reasonCode, overrodeBlocking: review.overrodeBlocking },
  })

  audit.record({
    actorType: 'human',
    actorId: actor,
    action: review.overrodeBlocking ? 'review.human.override' : `review.human.${clean.decision}`,
    entityType: 'asset',
    entityId: assetId,
    before: { reviewStatus: asset.reviewStatus },
    after: { reviewStatus, reasonCode: clean.reasonCode },
    reason: clean.notes,
  })

  // Once every arm has an approved asset, the experiment can move to APPROVED.
  const arms = db.listAsc('arms', { experimentId: experiment.id })
  const allApproved = arms.every((a) => db.filter('assets', (x) => x.armId === a.id && x.reviewStatus === 'approved').length > 0)
  if (allApproved && ['GENERATED', 'REVIEW_REQUIRED'].includes(experiment.status)) {
    setExperimentStatus(experiment.id, 'APPROVED', { actor, reason: '所有 arm 皆有已核准素材' })
  }

  return review
}

/** The queue the Review & Compliance page renders. */
export function queue({ productId = null, limit = 100 } = {}) {
  const assets = db
    .list('assets', productId ? { productId } : {})
    .filter((a) => ['pending', 'review_required', 'revision_requested'].includes(a.reviewStatus))
    .slice(0, limit)

  return assets.map((asset) => {
    const latestAuto = db.list('reviews', { assetId: asset.id, reviewType: 'auto' })[0]
    const arm = db.get('arms', asset.armId)
    const experiment = arm ? db.get('experiments', arm.experimentId) : null
    return {
      asset,
      arm,
      experiment: experiment ? { id: experiment.id, hypothesis: experiment.hypothesis, status: experiment.status } : null,
      verdict: latestAuto?.verdict ?? 'not_run',
      blocking: (latestAuto?.gates ?? []).filter((g) => g.result === 'blocking'),
      needsHuman: (latestAuto?.gates ?? []).filter((g) => g.result === 'needs_human'),
      warnings: (latestAuto?.gates ?? []).filter((g) => g.result === 'warning'),
      policyVersion: latestAuto?.policyVersion ?? null,
      waitingSinceHours: Math.round(((Date.now() - Date.parse(asset.createdAt)) / 3_600_000) * 10) / 10,
    }
  })
}

export const listReviews = (filter = {}, limit = 200) => db.list('reviews', filter).slice(0, limit)

/** Human overrides of blocking gates — the set a compliance audit reads first. */
export const overrides = () => db.filter('reviews', (r) => r.overrodeBlocking)
