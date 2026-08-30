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
import { NARRATIVE_SHAPES, DEFAULT_NARRATIVE, ROLE_FALLBACK } from './narrative.js'

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
export { NARRATIVE_SHAPES, DEFAULT_NARRATIVE } from './narrative.js'
export { listAitokenkingModels } from './adapters/generation.js'

/* ------------------------------------------------------- prompt templates */

export const TASK_TYPES = ['caption', 'script', 'image_prompt', 'video_prompt', 'hook_variants']

/**
 * Seed the built-in templates, one row per version.
 *
 * Keyed on (name, version) so an edit to the template text lands only when the
 * version is bumped — and older rows survive, because `model_runs` records the
 * `promptVersion` an asset was generated under and that reference has to stay
 * resolvable (DATA_MODEL.md §2).
 *
 * The bug this shape has to avoid: keying on (name, version) *without*
 * bumping the version means a changed template silently never reaches a
 * store that already has the old row. That happened — a rewritten caption
 * template sat in the code for a whole deploy while production kept
 * generating against 1.0.0, and the only visible symptom was that the output
 * did not change. Hence `latestTemplate()` below: new rows are additive, and
 * lookup always resolves to the newest version rather than to whichever row
 * happens to be first.
 */
export function ensureTemplatesSeeded() {
  for (const t of BUILTIN_TEMPLATES) {
    db.upsert('promptTemplates', (r) => r.name === t.name && r.version === t.version, { id: newId('promptTemplate'), ...t, builtin: true })
  }
  return db.list('promptTemplates')
}

/** Numeric-segment compare, so 1.10.0 sorts above 1.9.0. */
const compareVersions = (a, b) => {
  const pa = String(a ?? '0').split('.').map(Number)
  const pb = String(b ?? '0').split('.').map(Number)
  for (let i = 0; i < Math.max(pa.length, pb.length); i += 1) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0)
    if (d) return d
  }
  return 0
}

/** Newest version of the template for a task type, or by exact name. */
export function latestTemplate({ taskType = null, name = null } = {}) {
  const rows = db.filter('promptTemplates', (t) => (name ? t.name === name : t.taskType === taskType))
  return rows.sort((a, b) => compareVersions(b.version, a.version))[0] ?? null
}

const BUILTIN_TEMPLATES = [
  {
    name: 'arm-caption-v1',
    version: '1.1.0',
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
      '敘事結構：{{narrative}} — {{narrativeSays}}',
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
      '- 依上面的「敘事結構」走。若是觀念框架型：先幫讀者整理這則新聞裡值得知道的東西，再給判準；產品只在最後 CTA 那一次出現，當作讀者自己驗算的工具，中途不要推銷。讀者讀完要覺得「我學到一個以後也用得上的判斷方式」，而不是「他在說服我」。',
      '',
      '依序寫出以下段落：',
      '{{beats}}',
    ].join('\n'),
    policyNotes: '此模板的限制段落對應 .claude/skills/kol-redline-check 的 R-EMBODIMENT / R-FAKE-CERTAINTY / R-FABRICATED-SOURCE。修改模板時必須同步檢查那些規則仍被涵蓋。',
  },
  {
    name: 'arm-script-v1',
    version: '1.1.0',
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
    narrative: arm.narrative ?? ROLE_FALLBACK[arm.productRole ?? 'next_action'] ?? DEFAULT_NARRATIVE,
    narrativeSays: (NARRATIVE_SHAPES[arm.narrative] ?? NARRATIVE_SHAPES[ROLE_FALLBACK[arm.productRole ?? 'next_action']] ?? NARRATIVE_SHAPES[DEFAULT_NARRATIVE]).says,
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
  const topic = opportunity ? opportunity.topic : product.valueProposition
  const shape = NARRATIVE_SHAPES[arm.narrative]
    ?? NARRATIVE_SHAPES[ROLE_FALLBACK[arm.productRole ?? 'next_action']]
    ?? NARRATIVE_SHAPES[DEFAULT_NARRATIVE]
  return shape.beats(topic)
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

  const template = templateName ? latestTemplate({ name: templateName }) : latestTemplate({ taskType })
  const prompt = template
    ? renderTemplate(template.template, {
        persona: { name: persona.name, credibilityMode: persona.source.credibilityMode, credibilityBasis: (persona.source.credibilityBasis ?? []).map((b) => b.desc) },
        opportunity: experiment.opportunityId ? db.get('opportunities', experiment.opportunityId) ?? {} : {},
        experiment,
        arm,
        platform: { maxTextLength: 500 },
        blockedClaims: brief.blockedClaims,
        narrative: brief.narrative,
        narrativeSays: brief.narrativeSays,
        beats: brief.beats.map((b, i) => `${i + 1}. ${b}`).join('\n'),
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

/* ------------------------------------------------------------- hooks */

/**
 * 針對「這一則新聞」寫開場句。
 *
 * The previous implementation filled hooks from string templates over the
 * product's first objection and first differentiator, so every piece opened
 * with the same sentence no matter what the event was — twenty posts, twenty
 * identical first lines, which reads as a broken bot and gets treated as
 * duplicate content. A hook has to come out of the event; that is what makes
 * it a hook rather than a slogan.
 *
 * Deliberately its own model call rather than part of the body generation:
 * hooks are the tested dimension, so the operator needs several to choose
 * between *before* any body is written, and each arm's body is then generated
 * against the hook that was chosen.
 */
export async function draftHooks({ opportunityId, personaId, narrative = null, count = 3, adapterId = 'aitokenking', model = null, actor = 'system' }) {
  const opportunity = db.get('opportunities', opportunityId)
  if (!opportunity) throw notFound(`Opportunity ${opportunityId}`)
  const product = requireProduct(opportunity.productId)
  const persona = getPersona(personaId, product.id)
  if (!persona) throw notFound(`Persona ${personaId}`)
  const signal = opportunity.signalId ? db.get('signals', opportunity.signalId) : null

  const shape = NARRATIVE_SHAPES[narrative ?? DEFAULT_NARRATIVE] ?? NARRATIVE_SHAPES[DEFAULT_NARRATIVE]
  const adapter = getAdapter(adapterId)
  if (!adapter) throw badRequest(`未知的 generation adapter "${adapterId}"`)

  const prompt = [
    `為一則 ${persona.name} 的社群貼文，想 ${count} 個不同的開場句。`,
    '',
    '【這則新聞】',
    `標題：${opportunity.topic}`,
    signal?.summary ? `摘要：${signal.summary.slice(0, 400)}` : '',
    '',
    '【這則新聞跟產品的關聯】',
    opportunity.productRelevance,
    '',
    '【這題的對立】',
    opportunity.tension,
    '',
    '【人設】',
    `${persona.name}，可信度來自${persona.source.credibilityMode === 'database' ? '整理可查證的公開資料，不是親身經歷' : persona.source.credibilityMode === 'hybrid' ? '可查證資料與部分個人觀察' : '親身經歷'}。`,
    '',
    '【這一輪的敘事結構】',
    `${shape.label}：${shape.says}`,
    '',
    '【開場句的要求】',
    `- 必須是「因為看到這一則新聞」才寫得出來的句子。換一則新聞就不成立。`,
    `- ${count} 個要是${count} 個真的不同的進場角度，不是同一句話換句型。`,
    '- 每一句都要讓人想繼續讀下去，但不要用「你知道嗎」「其實」這種空轉的起手式。',
    '- 不得捏造任何數據、來源、研究或第三方報告。新聞裡有的數字可以引用。',
    '- 不得宣稱親身經歷任何這個帳號無法背書的事。',
    '- 不得用「最好」「保證」「一定」這類絕對化用語。',
    '- 每句 50 字以內，繁體中文。',
    '',
    `只輸出 ${count} 行，每行一句，行首用「1. 」「2. 」編號。不要任何說明。`,
  ].filter((l) => l !== '').join('\n')

  const result = await adapter.generate({ prompt, model: model ?? undefined })
  if (!result.ok) return { ok: false, error: result.error, errorMessage: result.errorMessage, hooks: [] }

  const hooks = String(result.output.text ?? '')
    .split('\n')
    .map((l) => l.replace(/^\s*\d+[.、)]\s*/, '').trim())
    .filter((l) => l.length >= 8 && l.length <= 120)
    .slice(0, count)

  audit.record({
    actorType: 'system', actorId: `hook_writer:${adapterId}`, action: 'hooks.drafted',
    entityType: 'opportunity', entityId: opportunityId,
    after: { count: hooks.length, personaId, narrative: narrative ?? DEFAULT_NARRATIVE },
  })

  return { ok: true, hooks, model: result.model, usage: result.usage, narrative: narrative ?? DEFAULT_NARRATIVE }
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
