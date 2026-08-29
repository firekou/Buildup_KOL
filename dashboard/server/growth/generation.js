import { db } from './store.js'
import { newId, shortHash } from './ids.js'
import { validator, notFound, badRequest, conflict } from './validate.js'
import { emit, dedupeKey } from './events.js'
import * as audit from './audit.js'
import * as cost from './cost.js'
import { runJob } from './jobs.js'
import { getAdapter, listAdapters } from './adapters/generation.js'
import { requireExperiment, requireArm, setStatus as setExperimentStatus, DIMENSIONS } from './experiments.js'
import { getPersona } from './personas.js'
import { requireProduct } from './products.js'
import { estimateCost, tierForFormat } from './cost-model.js'

/**
 * Generation Orchestrator — FR-P0-06, GHOS-026 / 027 / 028 / 029.
 *
 * Three things happen here and they are deliberately not separable:
 *   1. a versioned creative brief is built from the arm + persona + product,
 *   2. an adapter runs and a ModelRun row records what it cost and how long,
 *   3. the output is registered as an Asset carrying its arm's identity.
 *
 * Step 2 is what makes the whole cost side of the OS real: SYSTEM_ARCHITECTURE
 * §3.7 requires prompt template version, model, inputs, outputs, usage, cost
 * and failure reason on *every* run, including the failed ones. A failed
 * generation that cost money and left no row is how an AIGC budget goes
 * missing.
 */

export { listAdapters }
export { listAitokenkingModels } from './adapters/generation.js'

/* ------------------------------------------------------- prompt templates */

export const TASK_TYPES = ['caption', 'script', 'image_prompt', 'video_prompt', 'hook_variants']

export function ensureTemplatesSeeded() {
  for (const t of BUILTIN_TEMPLATES) {
    db.upsert('promptTemplates', (r) => r.name === t.name && r.version === t.version, { id: newId('promptTemplate'), ...t, builtin: true })
  }
  return db.list('promptTemplates')
}

const BUILTIN_TEMPLATES = [
  {
    name: 'arm-caption-v1',
    version: '1.0.0',
    taskType: 'caption',
    template: [
      '你要為一個 AI KOL 帳號寫一則貼文文案。',
      '',
      '人設：{{persona.name}}（{{persona.credibilityMode}} 型可信度）',
      '可信度來源：{{persona.credibilityBasis}}',
      '絕不可宣稱：{{blockedClaims}}',
      '',
      '題目：{{opportunity.topic}}',
      '為什麼是現在：{{opportunity.whyNow}}',
      '這題的對立：{{opportunity.tension}}',
      '',
      '本則要測的變因：{{experiment.comparisonDimension}}',
      'Hook（必須照用，這是被測的變因）：{{arm.hook}}',
      '產品在內容裡的角色：{{arm.productRole}}',
      'CTA：{{arm.cta}}',
      '平台：{{arm.platform}}（文案上限 {{platform.maxTextLength}} 字）',
      '',
      '限制：',
      '- 不得宣稱親身經歷任何無法被此帳號背書的事。',
      '- 不得對結果做保證。',
      '- 不得捏造來源、數據或見證。',
      '- 產品必須以「{{arm.productRole}}」的方式出現，不是最後硬貼的廣告。',
    ].join('\n'),
    policyNotes: '此模板的限制段落對應 .claude/skills/kol-redline-check 的 R-EMBODIMENT / R-FAKE-CERTAINTY / R-FABRICATED-SOURCE。修改模板時必須同步檢查那些規則仍被涵蓋。',
  },
  {
    name: 'arm-script-v1',
    version: '1.0.0',
    taskType: 'script',
    template: [
      '為 {{persona.name}} 寫一支 {{arm.duration}} 秒的短影音腳本，分段給出畫面與台詞。',
      '第一句必須是這個 hook（被測變因，不可改寫）：{{arm.hook}}',
      '場景：{{arm.visualSetting}}｜語氣：{{arm.tone}}',
      '結尾 CTA：{{arm.cta}}',
      '絕不可宣稱：{{blockedClaims}}',
    ].join('\n'),
    policyNotes: '影片腳本的具身主張風險最高——「我試過」「我去過」都是此帳號無法背書的長期主張。',
  },
]

export const listTemplates = (filter = {}) => db.list('promptTemplates', filter)

/** Substitute `{{path.to.value}}` against a context object. */
export function renderTemplate(template, context) {
  return String(template).replace(/\{\{([\w.]+)\}\}/g, (_, path) => {
    const value = path.split('.').reduce((acc, key) => (acc == null ? acc : acc[key]), context)
    if (value == null) return `（未提供：${path}）`
    return Array.isArray(value) ? value.join('、') : String(value)
  })
}

/* -------------------------------------------------------- creative brief */

/**
 * Build (and persist) the brief for an arm. Versioned per GHOS-026: a
 * regenerate after an edit creates concept v2, and the asset records which
 * concept version produced it.
 */
export function buildBrief(armId, { actor = 'system', beats = null } = {}) {
  const arm = requireArm(armId)
  const experiment = requireExperiment(arm.experimentId)
  const product = requireProduct(experiment.productId)
  const persona = getPersona(arm.personaId, product.id)
  if (!persona) throw notFound(`Persona ${arm.personaId}`)
  const opportunity = experiment.opportunityId ? db.get('opportunities', experiment.opportunityId) : null

  const blockedClaims = [
    ...(persona.overlay?.blockedClaims ?? []),
    ...(product.analysis?.blockedClaims ?? []),
  ]
  const allowedClaims = [
    ...(persona.overlay?.allowedClaims ?? []),
    ...(product.proofPoints ?? []),
  ]

  const brief = {
    hook: arm.hook,
    cta: arm.cta,
    productRole: arm.productRole,
    platform: arm.platform,
    format: arm.format,
    tone: arm.tone,
    visualSetting: arm.visualSetting,
    duration: arm.duration,
    beats: beats ?? defaultBeats(arm, opportunity, product),
    blockedClaims,
    allowedClaims,
    // The brief carries the *reason* this arm exists, so a reviewer reading it
    // can tell whether the copy actually tests what the experiment claims to.
    testedDimension: experiment.comparisonDimension,
    testedDimensionLabel: DIMENSIONS[experiment.comparisonDimension]?.label,
    hypothesis: experiment.hypothesis,
  }

  const priorVersions = db.filter('concepts', (c) => c.armId === armId).length
  const concept = db.insert('concepts', {
    id: newId('concept'),
    armId,
    experimentId: experiment.id,
    productId: product.id,
    personaId: persona.id,
    conceptVersion: priorVersions + 1,
    brief,
    createdBy: actor,
  })

  return { concept, brief, arm, experiment, product, persona, opportunity }
}

/**
 * Default narrative beats, derived from the opportunity and the product's
 * declared role. Not creative writing — a scaffold that names what each beat
 * must accomplish, so the model (or a human) fills a defined slot.
 */
function defaultBeats(arm, opportunity, product) {
  const role = arm.productRole ?? 'next_action'
  const beatsByRole = {
    utility: ['示範產品實際被用來解決什麼', '指出沒有它的時候會卡在哪'],
    answer_to_debate: ['把對立的兩邊各講一句，不偏袒', '指出唯一能分出勝負的證據在哪'],
    destination: ['先讓人看到那個地方值得去', '說明現在進去會看到什麼'],
    proof_source: ['把可查證的數據攤開', '說明這份數據怎麼查'],
    challenge: ['提出一個可複製的做法', '說明怎麼判定自己做到了'],
    next_action: ['把結論說完', '給出唯一合理的下一步'],
  }
  return [
    opportunity ? `承接題目：${opportunity.topic}` : `承接產品主張：${product.valueProposition}`,
    ...(beatsByRole[role] ?? beatsByRole.next_action),
  ]
}

/* ------------------------------------------------------------ generation */

/**
 * Run one generation for an arm. Records a ModelRun and a cost event whether
 * it succeeds or fails, then registers the asset on success.
 */
export async function generate(armId, { adapterId = 'template', taskType = 'caption', model = null, actor = 'system', templateName = null } = {}) {
  const { concept, brief, arm, experiment, product, persona } = buildBrief(armId, { actor })

  const adapter = getAdapter(adapterId)
  if (!adapter) throw badRequest(`未知的 generation adapter "${adapterId}"`)

  const template = templateName
    ? db.find('promptTemplates', (t) => t.name === templateName)
    : db.find('promptTemplates', (t) => t.taskType === taskType)
  const prompt = template
    ? renderTemplate(template.template, {
        persona: { name: persona.name, credibilityMode: persona.source.credibilityMode, credibilityBasis: (persona.source.credibilityBasis ?? []).map((b) => b.desc) },
        opportunity: experiment.opportunityId ? db.get('opportunities', experiment.opportunityId) ?? {} : {},
        experiment,
        arm,
        platform: { maxTextLength: 500 },
        blockedClaims: brief.blockedClaims,
      })
    : null

  // Budget guardrail runs *before* the adapter, using the estimated cost of
  // this run. Spending past a cap and apologising afterwards is not a control.
  const estimate = estimateCost({ model: model ?? 'template-v1', kind: taskType === 'script' ? 'text' : 'text', usage: { inputTokens: (prompt ?? '').length / 4, outputTokens: 400 } })
  const budget = cost.experimentBudget(experiment, estimate.usd ?? 0)
  if (!budget.allowed) throw conflict(`預算擋下：${budget.reason}`)

  emit('generation.started', {
    productId: product.id, experimentId: experiment.id, armId, personaId: persona.id,
    source: `generation_adapter:${adapterId}`,
    properties: { taskType, adapterId, conceptVersion: concept.conceptVersion },
  })

  const { result } = await runJob(
    'generation.run',
    { armId, adapterId, taskType },
    async () => adapter.generate({ brief, arm, persona, product, experiment, prompt, model: model ?? undefined }),
    { idempotencyKey: dedupeKey('generation', armId, adapterId, taskType, concept.conceptVersion) },
  )

  const modelRun = db.insert('modelRuns', {
    id: newId('modelRun'),
    assetId: null,
    armId,
    experimentId: experiment.id,
    productId: product.id,
    conceptId: concept.id,
    provider: adapter.provider,
    adapterId,
    model: result.model ?? model ?? adapter.id,
    kind: taskType === 'image_prompt' ? 'image' : taskType === 'video_prompt' ? 'video' : 'text',
    promptTemplateId: template?.id ?? null,
    promptVersion: template?.version ?? null,
    inputRefs: { conceptId: concept.id, conceptVersion: concept.conceptVersion, promptChars: (prompt ?? '').length },
    usage: result.usage ?? null,
    latencyMs: result.latencyMs ?? null,
    status: result.ok ? 'succeeded' : 'failed',
    errorCode: result.ok ? null : result.error,
    errorMessage: result.ok ? null : result.errorMessage,
    providerRef: result.providerRef ?? null,
  })

  if (!result.ok) {
    // A failed run still books its cost when the provider charged for it. For
    // `not_configured` nothing was charged, and the row records exactly that.
    emit('generation.failed', {
      productId: product.id, experimentId: experiment.id, armId, personaId: persona.id,
      source: `generation_adapter:${adapterId}`,
      properties: { errorCode: result.error, errorMessage: result.errorMessage, modelRunId: modelRun.id },
    })
    audit.record({ actorType: 'system', actorId: adapterId, action: 'generation.failed', entityType: 'arm', entityId: armId, after: { errorCode: result.error }, reason: result.errorMessage })
    return { ok: false, modelRun, error: result.error, errorMessage: result.errorMessage }
  }

  const asset = registerAsset({
    armId,
    experimentId: experiment.id,
    productId: product.id,
    personaId: persona.id,
    conceptId: concept.id,
    assetType: result.output.kind,
    text: result.output.text ?? null,
    storageRef: result.output.storageRef ?? null,
    mimeType: result.output.mimeType ?? null,
    contentHash: result.output.contentHash ?? shortHash(result.output.text ?? ''),
    seconds: result.output.seconds ?? null,
    modelRunId: modelRun.id,
  })

  db.update('modelRuns', modelRun.id, { assetId: asset.id })

  const costRow = cost.recordGeneration({
    modelRun: { ...modelRun, seconds: result.output.seconds ?? null, images: result.output.images ?? 1, usage: result.usage },
    arm,
    experiment,
    asset,
  })

  emit('generation.completed', {
    productId: product.id, experimentId: experiment.id, armId, personaId: persona.id, assetId: asset.id,
    source: `generation_adapter:${adapterId}`,
    properties: { modelRunId: modelRun.id, costUsd: costRow.amount, latencyMs: result.latencyMs, contentHash: asset.contentHash },
  })

  if (experiment.status === 'PLANNED') setExperimentStatus(experiment.id, 'GENERATED', { actor, reason: '至少一個 arm 已產出素材' })

  return { ok: true, asset, modelRun, cost: costRow, concept }
}

/* -------------------------------------------------------- asset registry */

export const ASSET_TYPES = ['text', 'image', 'video', 'carousel']

/**
 * Register an asset. Also the entry point for content generated *outside* the
 * OS — that path matters, because the image/video adapters are not wired and
 * the honest workflow today is "generate in the provider's UI, then register
 * it here with its real cost".
 */
export function registerAsset(input, actor = 'system') {
  const arm = requireArm(input.armId)
  const contentHash = input.contentHash ?? shortHash(input.text ?? input.storageRef ?? Math.random())

  // A duplicate hash inside one experiment means two arms produced identical
  // content — the comparison is then vacuous, so it is flagged rather than
  // silently stored.
  const twin = db.find('assets', (a) => a.experimentId === arm.experimentId && a.contentHash === contentHash && a.armId !== arm.id)

  const asset = db.insert('assets', {
    id: newId('asset'),
    armId: arm.id,
    experimentId: arm.experimentId,
    productId: arm.productId,
    personaId: arm.personaId,
    conceptId: input.conceptId ?? null,
    modelRunId: input.modelRunId ?? null,
    assetType: input.assetType ?? 'text',
    text: input.text ?? null,
    storageRef: input.storageRef ?? null,
    mimeType: input.mimeType ?? null,
    seconds: input.seconds ?? null,
    contentHash,
    parentAssetId: input.parentAssetId ?? null,
    generationStatus: 'generated',
    reviewStatus: 'pending',
    duplicateOfArmId: twin?.armId ?? null,
    createdBy: actor,
  })

  if (twin) {
    audit.record({
      actorType: 'system', actorId: 'asset_registry', action: 'asset.duplicate_detected',
      entityType: 'asset', entityId: asset.id,
      reason: `與 arm ${twin.armId} 的素材 content hash 相同——兩個 arm 產出相同內容，這組比較沒有意義。`,
    })
  }

  return asset
}

export const getAsset = (id) => db.get('assets', id)
export const listAssets = (filter = {}) => db.list('assets', filter)
export const listModelRuns = (filter = {}, limit = 200) => db.list('modelRuns', filter).slice(0, limit)

/** Generate for every arm of an experiment — the batch the planner produces. */
export async function generateExperiment(experimentId, options = {}) {
  const experiment = requireExperiment(experimentId)
  const results = []
  for (const arm of experiment.arms) {
    try {
      results.push({ armId: arm.id, label: arm.label, ...(await generate(arm.id, options)) })
    } catch (err) {
      results.push({ armId: arm.id, label: arm.label, ok: false, error: 'exception', errorMessage: err.message })
    }
  }
  const tier = tierForFormat(experiment.arms[0]?.format)
  return {
    experimentId,
    results,
    succeeded: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    costTier: tier ? { tier: tier.tier, label: tier.label, says: tier.says } : null,
    totalCost: cost.forExperiment(experimentId),
  }
}
