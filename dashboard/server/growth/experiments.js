import { db } from './store.js'
import { newId, assertId } from './ids.js'
import { validator, notFound, badRequest, conflict } from './validate.js'
import { emit } from './events.js'
import * as audit from './audit.js'
import { requireProduct, primaryConversion, PRODUCT_ROLES } from './products.js'
import { requireOpportunity, setOpportunityStatus } from './opportunities.js'
import { getPersona } from './personas.js'
import { PLATFORM_IDS, FORMATS, checkPlatformFit } from './platforms.js'

/**
 * Experiment Planner — FR-P0-05, GHOS-002 / 025 / 026.
 *
 * The contract in PRODUCT_SPEC.md §6 is enforced here, not documented here.
 * "禁止把『發幾篇看看』當成 experiment" is implemented as: an experiment cannot
 * be created without a hypothesis, a primary outcome, a comparison dimension,
 * a baseline definition and an observation window — and its arms cannot be
 * created unless they differ on exactly the declared tested dimension and
 * agree on every frozen one.
 *
 * That last check (`assertSingleFactor`) is the one that earns the module its
 * keep. Without it, Winner Evolution produces children that changed four
 * things and a "lift" nobody can attribute (DATA_MODEL.md §4 rule 5).
 */

/** Everything an arm can vary. The comparison dimension must be one of these. */
export const DIMENSIONS = {
  hook: { label: 'Hook 開場', field: 'hook' },
  persona: { label: '人設', field: 'personaId' },
  format: { label: '格式', field: 'format' },
  cta: { label: 'CTA', field: 'cta' },
  platform: { label: '平台', field: 'platform' },
  product_role: { label: '產品角色', field: 'productRole' },
  visual_setting: { label: '視覺場景', field: 'visualSetting' },
  tone: { label: '語氣', field: 'tone' },
  duration: { label: '長度', field: 'duration' },
  opening_frame: { label: '首幀', field: 'openingFrame' },
  caption: { label: '文案', field: 'caption' },
}

export const DIMENSION_KEYS = Object.keys(DIMENSIONS)

export const EXPERIMENT_STATUS = [
  'DRAFT',
  'PLANNED',
  'GENERATED',
  'REVIEW_REQUIRED',
  'APPROVED',
  'PUBLISHED',
  'COLLECTING',
  'EVALUABLE',
  'WINNER',
  'LOSER',
  'INCONCLUSIVE',
  'STOPPED',
]

/** Legal forward transitions. A backwards jump needs an explicit audit reason. */
const TRANSITIONS = {
  DRAFT: ['PLANNED', 'STOPPED'],
  PLANNED: ['GENERATED', 'STOPPED'],
  GENERATED: ['REVIEW_REQUIRED', 'APPROVED', 'STOPPED'],
  REVIEW_REQUIRED: ['APPROVED', 'GENERATED', 'STOPPED'],
  APPROVED: ['PUBLISHED', 'STOPPED'],
  PUBLISHED: ['COLLECTING', 'STOPPED'],
  COLLECTING: ['EVALUABLE', 'STOPPED'],
  EVALUABLE: ['WINNER', 'LOSER', 'INCONCLUSIVE', 'COLLECTING', 'STOPPED'],
  WINNER: ['STOPPED'],
  LOSER: ['STOPPED'],
  INCONCLUSIVE: ['COLLECTING', 'STOPPED'],
  STOPPED: [],
}

export const PRIMARY_OUTCOMES = ['click', 'qualified_session', 'signup', 'activation', 'purchase', 'deposit', 'custom_conversion']

/* --------------------------------------------------------- experiments */

export function createExperiment(input, actor = 'system') {
  const clean = validator(input)
    .required('hypothesis', { label: '假設', min: 15 })
    .oneOf('comparisonDimension', DIMENSION_KEYS, { label: '比較維度' })
    .oneOf('primaryOutcome', PRIMARY_OUTCOMES, { label: 'Primary outcome' })
    .number('observationWindowHours', { min: 1, max: 24 * 60, required: true, label: '觀測窗（小時）' })
    .optional('owner', actor)
    .optional('primaryConversionEvent', null)
    .done()

  const product = requireProduct(input.productId)
  const opportunity = input.opportunityId ? requireOpportunity(input.opportunityId) : null
  const campaignId = input.campaignId ? assertId(input.campaignId, 'campaign', 'campaignId') : (opportunity?.campaignId ?? null)

  // A product-level conversion outcome needs a defined event, or the evaluator
  // has nothing to count. FR-P0-11 forbids guessing one.
  const needsConversion = ['signup', 'activation', 'purchase', 'deposit', 'custom_conversion'].includes(clean.primaryOutcome)
  let conversionEvent = clean.primaryConversionEvent
  if (needsConversion) {
    const primary = primaryConversion(product.id)
    conversionEvent = conversionEvent ?? primary?.eventName ?? null
    if (!conversionEvent) {
      throw badRequest(
        `primary outcome "${clean.primaryOutcome}" 需要一個已定義的 product conversion event，但產品「${product.name}」尚未定義。請先在產品設定中定義 conversion event。`,
      )
    }
  }

  const baseline = normaliseBaseline(input.baseline, clean.comparisonDimension)

  const experiment = db.insert('experiments', {
    id: newId('experiment'),
    productId: product.id,
    campaignId,
    opportunityId: opportunity?.id ?? null,
    ...clean,
    primaryConversionEvent: conversionEvent,
    baseline,
    // The dimensions every arm must hold constant. Populated at arm-creation
    // time from the first arm, so "frozen" means "whatever arm 1 chose".
    frozenDimensions: DIMENSION_KEYS.filter((d) => d !== clean.comparisonDimension),
    testedDimensions: [clean.comparisonDimension],
    status: 'DRAFT',
    dataCompletenessStatus: 'not_started',
    evaluatorVersion: null,
    createdBy: actor,
    observationStartedAt: null,
    observationEndsAt: null,
  })

  if (opportunity && opportunity.status === 'new') setOpportunityStatus(opportunity.id, 'experimenting', actor, `建立實驗 ${experiment.id}`)

  emit('experiment.created', {
    productId: product.id,
    campaignId,
    opportunityId: opportunity?.id ?? null,
    experimentId: experiment.id,
    source: 'experiment_planner',
    properties: { hypothesis: clean.hypothesis, comparisonDimension: clean.comparisonDimension, primaryOutcome: clean.primaryOutcome },
  })
  audit.record({ actorType: 'human', actorId: actor, action: 'experiment.created', entityType: 'experiment', entityId: experiment.id, after: experiment })

  return getExperiment(experiment.id)
}

/**
 * A baseline must say what the winner is being compared *against*. Three
 * legal kinds; anything else is rejected rather than defaulted, because a
 * silently defaulted baseline produces a lift number that means nothing.
 */
function normaliseBaseline(baseline, dimension) {
  const kind = baseline?.kind ?? 'best_other_arm'
  if (kind === 'best_other_arm') {
    return { kind, says: `同一實驗內、其他 ${DIMENSIONS[dimension].label} 變體中表現最好的一支。` }
  }
  if (kind === 'parent_arm') {
    if (!baseline.parentArmId) throw badRequest('baseline.kind=parent_arm 時必須提供 parentArmId')
    return { kind, parentArmId: assertId(baseline.parentArmId, 'arm', 'baseline.parentArmId'), says: '與被複製的 parent arm 在同一 primary outcome 上比較。' }
  }
  if (kind === 'fixed_threshold') {
    if (!Number.isFinite(Number(baseline.value))) throw badRequest('baseline.kind=fixed_threshold 時必須提供數值 value')
    return { kind, value: Number(baseline.value), says: `與固定門檻 ${baseline.value} 比較（僅在有歷史依據時使用）。` }
  }
  throw badRequest(`未知的 baseline kind "${kind}"，可選：best_other_arm / parent_arm / fixed_threshold`)
}

export function getExperiment(id) {
  const exp = db.get('experiments', id)
  if (!exp) return null
  const arms = db.listAsc('arms', { experimentId: id })
  return {
    ...exp,
    arms,
    armCount: arms.length,
    dimensionLabel: DIMENSIONS[exp.comparisonDimension]?.label ?? exp.comparisonDimension,
  }
}

export function requireExperiment(id) {
  const exp = getExperiment(assertId(id, 'experiment', 'experimentId'))
  if (!exp) throw notFound(`Experiment ${id}`)
  return exp
}

export const listExperiments = (filter = {}) =>
  db.list('experiments', filter).map((e) => ({
    ...e,
    armCount: db.count('arms', { experimentId: e.id }),
    dimensionLabel: DIMENSIONS[e.comparisonDimension]?.label ?? e.comparisonDimension,
  }))

export function setStatus(id, status, { actor = 'system', reason = null, force = false } = {}) {
  const before = requireExperiment(id)
  if (!EXPERIMENT_STATUS.includes(status)) throw badRequest(`未知狀態 "${status}"`)
  const legal = TRANSITIONS[before.status] ?? []
  if (!legal.includes(status) && before.status !== status) {
    if (!force) throw conflict(`不允許從 ${before.status} 轉到 ${status}（可轉：${legal.join('/') || '無'}）`)
    // A forced transition is a human override and is logged as one — the
    // evaluator's track record must stay separable from operator intervention.
    audit.record({ actorType: 'human', actorId: actor, action: 'experiment.status.override', entityType: 'experiment', entityId: id, before: { status: before.status }, after: { status }, reason })
  }

  const patch = { status }
  if (status === 'PUBLISHED' && !before.observationStartedAt) {
    patch.observationStartedAt = new Date().toISOString()
    patch.observationEndsAt = new Date(Date.now() + before.observationWindowHours * 3_600_000).toISOString()
  }
  const after = db.update('experiments', id, patch)
  audit.record({ actorType: force ? 'human' : 'system', actorId: actor, action: 'experiment.status.changed', entityType: 'experiment', entityId: id, before: { status: before.status }, after: { status }, reason })
  return getExperiment(after.id)
}

/* ---------------------------------------------------------------- arms */

/**
 * Single-factor enforcement.
 *
 * Every arm after the first must differ from arm 1 on the tested dimension and
 * match it on every frozen one. A caller that genuinely wants a multi-factor
 * arm must pass `allowMultiFactor`, which stamps the arm — and therefore any
 * decision built on it — as multi-factor, so the Dashboard can refuse to claim
 * single-cause attribution (DATA_MODEL.md §4 rule 5).
 */
function assertSingleFactor(experiment, arms, candidate, allowMultiFactor) {
  if (arms.length === 0) return { multiFactor: false, differsOn: [] }

  const reference = arms[0]
  const differsOn = DIMENSION_KEYS.filter((d) => {
    const field = DIMENSIONS[d].field
    const a = reference[field] ?? null
    const b = candidate[field] ?? null
    return JSON.stringify(a) !== JSON.stringify(b)
  })

  const tested = experiment.comparisonDimension
  const unexpected = differsOn.filter((d) => d !== tested)

  if (!differsOn.includes(tested)) {
    throw badRequest(
      `新 arm 在比較維度「${DIMENSIONS[tested].label}」上與第一個 arm 相同——這樣無法比較。請改變 ${DIMENSIONS[tested].field}。`,
    )
  }
  if (unexpected.length && !allowMultiFactor) {
    throw badRequest(
      `新 arm 同時改變了 ${unexpected.map((d) => DIMENSIONS[d].label).join('、')}，而本實驗只測「${DIMENSIONS[tested].label}」。` +
        `請對齊這些欄位，或明確帶入 allowMultiFactor=true（該 arm 將被標記為多因子，其結果不得宣稱單一因果）。`,
    )
  }

  return { multiFactor: unexpected.length > 0, differsOn }
}

export function addArm(experimentId, input, actor = 'system') {
  const experiment = requireExperiment(experimentId)
  if (!['DRAFT', 'PLANNED'].includes(experiment.status)) {
    throw conflict(`實驗已進入 ${experiment.status}，不能再加 arm——加了就不是同一個觀測窗下的比較。`)
  }

  const clean = validator(input)
    .required('hook', { label: 'Hook' })
    .oneOf('format', FORMATS, { label: '格式' })
    .oneOf('platform', PLATFORM_IDS, { label: '平台' })
    .required('cta', { label: 'CTA' })
    .oneOf('productRole', Object.keys(PRODUCT_ROLES), { label: '產品角色', required: false, fallback: null })
    .optional('visualSetting', null)
    .optional('tone', null)
    .optional('duration', null)
    .optional('openingFrame', null)
    .optional('caption', null)
    .done()

  const persona = getPersona(input.personaId, experiment.productId)
  if (!persona) throw notFound(`Persona ${input.personaId}`)

  const arms = db.listAsc('arms', { experimentId })
  const candidate = { ...clean, personaId: persona.id }
  const { multiFactor, differsOn } = assertSingleFactor(experiment, arms, candidate, Boolean(input.allowMultiFactor))

  const fit = checkPlatformFit({ platform: clean.platform, format: clean.format, textLength: (clean.caption ?? '').length })

  const arm = db.insert('arms', {
    id: newId('arm'),
    experimentId,
    productId: experiment.productId,
    personaId: persona.id,
    ...clean,
    parentArmId: input.parentArmId ? assertId(input.parentArmId, 'arm', 'parentArmId') : null,
    mutationReason: input.mutationReason ?? null,
    testedDimensions: [experiment.comparisonDimension],
    frozenDimensions: experiment.frozenDimensions,
    multiFactor,
    differsOn,
    platformFitWarnings: fit,
    status: 'PLANNED',
    label: input.label ?? String.fromCharCode(65 + arms.length),
  })

  emit('experiment.arm.created', {
    productId: experiment.productId,
    experimentId,
    armId: arm.id,
    personaId: persona.id,
    platform: clean.platform,
    source: 'experiment_planner',
    properties: { multiFactor, differsOn, label: arm.label },
  })
  audit.record({ actorType: 'human', actorId: actor, action: 'arm.created', entityType: 'arm', entityId: arm.id, after: arm })

  if (experiment.status === 'DRAFT' && arms.length + 1 >= 2) setStatus(experimentId, 'PLANNED', { actor, reason: '已具備至少兩個可比較的 arm' })

  return arm
}

export const getArm = (id) => db.get('arms', id)
export function requireArm(id) {
  const arm = getArm(assertId(id, 'arm', 'armId'))
  if (!arm) throw notFound(`Arm ${id}`)
  return arm
}
export const listArms = (filter = {}) => db.listAsc('arms', filter)

/**
 * Contract readiness — Gate 2 of ROADMAP.md §8. An experiment that fails this
 * never reaches the evaluator, because a comparison with one arm or no
 * baseline cannot produce a defensible Winner.
 */
export function contractGates(experiment) {
  const arms = db.listAsc('arms', { experimentId: experiment.id })
  const gates = [
    { gate: 'hypothesis', passed: Boolean(experiment.hypothesis), message: '必須有可證偽的假設。' },
    { gate: 'primary_outcome', passed: Boolean(experiment.primaryOutcome), message: '必須指定 primary outcome。' },
    { gate: 'baseline', passed: Boolean(experiment.baseline?.kind), message: '必須定義比較基準。' },
    { gate: 'observation_window', passed: Number.isFinite(experiment.observationWindowHours), message: '必須定義觀測窗。' },
    { gate: 'at_least_two_arms', passed: arms.length >= 2, message: `目前 ${arms.length} 個 arm，少於 2 個無法比較。` },
    {
      gate: 'single_factor',
      passed: arms.every((a) => !a.multiFactor),
      message: arms.some((a) => a.multiFactor)
        ? `arm ${arms.filter((a) => a.multiFactor).map((a) => a.label).join('/')} 為多因子，其結果不得宣稱單一因果。`
        : '所有 arm 只在比較維度上不同。',
    },
  ]
  return { gates, passed: gates.every((g) => g.passed), failed: gates.filter((g) => !g.passed).map((g) => g.gate) }
}
