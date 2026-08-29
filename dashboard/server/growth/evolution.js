import { db } from './store.js'
import { newId, assertId } from './ids.js'
import { validator, notFound, badRequest, conflict } from './validate.js'
import { emit } from './events.js'
import * as audit from './audit.js'
import * as telemetry from './telemetry.js'
import * as cost from './cost.js'
import { createExperiment, addArm, requireArm, requireExperiment, DIMENSIONS, DIMENSION_KEYS } from './experiments.js'
import { twoProportionTest, MIN_RELATIVE_LIFT } from './evaluator.js'

/**
 * Winner Evolution Engine — FR-P0-12, GHOS-063 … 067.
 *
 * The rule this module exists to enforce:
 *
 *   "不可一次全部變掉後仍宣稱知道提升原因。"
 *
 * A mutation therefore names exactly one dimension to change and freezes the
 * rest, and the child experiment inherits `parent_arm_id` on every arm so the
 * lineage survives. Clone lift is then a comparison against a *named* parent,
 * not against "how we were doing generally" — which is the difference between
 * a measurement and a story.
 */

/** Dimensions that make sense to mutate, with what each one actually tests. */
export const MUTATION_DIMENSIONS = {
  hook: { label: 'Hook 開場', tests: '同一題目、同一人設下，換一個進入點是否改變轉換。最便宜也最常見的一刀。' },
  opening_frame: { label: '首幀', tests: '短影音前 1.5 秒的畫面，對完播與點擊的影響。' },
  cta: { label: 'CTA', tests: '同樣的內容，換一個行動呼籲是否改變轉換率而非只改變點擊。' },
  persona: { label: '人設', tests: '同一個 hook 換一個人來說，是否仍然有效——這條會告訴你贏的是題目還是人。' },
  format: { label: '格式', tests: '同一個想法做成圖文或影片，成本差 40 倍，轉換差多少。' },
  caption: { label: '文案', tests: '同一素材、不同文案的邊際效果。' },
  visual_setting: { label: '視覺場景', tests: '場景更換對停留與可信感的影響。' },
  tone: { label: '語氣', tests: '同樣論點用不同語氣說，對留言與分享的影響。' },
  duration: { label: '長度', tests: '長度與完播／轉換的取捨。' },
  platform: { label: '平台', tests: '同一素材跨平台改編的效果——注意跨平台絕對值不可直接比較。' },
}

export const MUTATION_STATUS = ['queued', 'generating', 'running', 'completed', 'cancelled']

/* --------------------------------------------------------- clone builder */

/**
 * Create a child experiment from a winning arm.
 *
 * `childCount` variants of the mutation dimension are created; everything else
 * is copied verbatim from the parent, which is what makes the frozen-dimension
 * guarantee real rather than an instruction to the operator.
 */
export function cloneWinner(input, actor = 'system') {
  const clean = validator(input)
    .oneOf('mutationDimension', Object.keys(MUTATION_DIMENSIONS), { label: '變異維度' })
    .list('variants', { min: 1, label: '變體' })
    .optional('hypothesis', null)
    .number('observationWindowHours', { min: 1, fallback: null })
    .done()

  const parentArm = requireArm(assertId(input.parentArmId, 'arm', 'parentArmId'))
  const parentExperiment = requireExperiment(parentArm.experimentId)

  // Cloning a loser is legitimate (a retest), cloning an *unevaluated* arm is
  // not — there is nothing to preserve and nothing to compare the child to.
  const parentDecision = db.find('decisions', (d) => d.armId === parentArm.id)
  if (!parentDecision) {
    throw conflict(`arm ${parentArm.label} 還沒有 evaluator 判定結果。沒有 parent 表現就沒有 baseline，child 的 lift 會無從比較。`)
  }

  if (clean.variants.length > 8) throw badRequest('一次最多產生 8 個變體——再多就不是實驗而是撒網。')

  const field = DIMENSIONS[clean.mutationDimension].field
  const dupes = clean.variants.filter((v) => String(v) === String(parentArm[field]))
  if (dupes.length) throw badRequest(`變體「${dupes[0]}」與 parent 的 ${DIMENSIONS[clean.mutationDimension].label} 相同，不構成變異。`)

  const child = createExperiment(
    {
      productId: parentExperiment.productId,
      campaignId: parentExperiment.campaignId,
      opportunityId: parentExperiment.opportunityId,
      hypothesis:
        clean.hypothesis ??
        `在 ${parentArm.label}（已判定 ${parentDecision.decision}）的基礎上，只改變「${MUTATION_DIMENSIONS[clean.mutationDimension].label}」，測試是否能在 ${parentExperiment.primaryOutcome} 上超越 parent。`,
      comparisonDimension: clean.mutationDimension,
      primaryOutcome: parentExperiment.primaryOutcome,
      primaryConversionEvent: parentExperiment.primaryConversionEvent,
      observationWindowHours: clean.observationWindowHours ?? parentExperiment.observationWindowHours,
      // The baseline is the parent arm, explicitly. This is the whole point.
      baseline: { kind: 'parent_arm', parentArmId: parentArm.id },
    },
    actor,
  )

  const arms = []
  // Arm 1 is the parent's configuration re-run, so the child experiment
  // contains its own control. Without it, a platform-wide shift between the
  // parent's window and the child's would read as clone lift.
  arms.push(
    addArm(
      child.id,
      {
        ...copyableFields(parentArm),
        label: 'CTRL',
        parentArmId: parentArm.id,
        mutationReason: 'control: parent 設定原樣重跑，用來吸收兩個觀測窗之間的環境變化',
      },
      actor,
    ),
  )

  for (const [i, variant] of clean.variants.entries()) {
    arms.push(
      addArm(
        child.id,
        {
          ...copyableFields(parentArm),
          [field]: variant,
          label: `V${i + 1}`,
          parentArmId: parentArm.id,
          mutationReason: `mutation on ${clean.mutationDimension}: ${String(variant).slice(0, 120)}`,
        },
        actor,
      ),
    )
  }

  const job = db.insert('mutations', {
    id: newId('mutation'),
    parentExperimentId: parentExperiment.id,
    parentArmId: parentArm.id,
    productId: parentExperiment.productId,
    mutationDimension: clean.mutationDimension,
    mutationInstruction: { variants: clean.variants, field },
    frozenDimensions: DIMENSION_KEYS.filter((d) => d !== clean.mutationDimension),
    childExperimentId: child.id,
    childArmIds: arms.map((a) => a.id),
    status: 'queued',
    createdBy: actor,
  })

  emit('mutation.queued', {
    productId: parentExperiment.productId,
    experimentId: child.id,
    armId: parentArm.id,
    source: 'winner_evolution',
    properties: { mutationDimension: clean.mutationDimension, variants: clean.variants.length, parentExperimentId: parentExperiment.id },
  })
  audit.record({
    actorType: 'human', actorId: actor, action: 'mutation.cloned',
    entityType: 'experiment', entityId: child.id,
    after: { parentArmId: parentArm.id, dimension: clean.mutationDimension, childArms: arms.length },
    reason: `從 ${parentDecision.decision} arm 建立子實驗`,
  })

  return { mutationJob: job, childExperiment: requireExperiment(child.id), arms }
}

/** Everything an arm inherits unchanged from its parent. */
const copyableFields = (arm) => ({
  personaId: arm.personaId,
  hook: arm.hook,
  format: arm.format,
  platform: arm.platform,
  cta: arm.cta,
  productRole: arm.productRole,
  visualSetting: arm.visualSetting,
  tone: arm.tone,
  duration: arm.duration,
  openingFrame: arm.openingFrame,
  caption: arm.caption,
})

/* ------------------------------------------------------------- lineage */

/** Walk down from a root arm, building the tree the Winner Factory renders. */
export function lineage(armId, { depth = 0, maxDepth = 12 } = {}) {
  const arm = db.get('arms', armId)
  if (!arm || depth > maxDepth) return null

  const decision = db.find('decisions', (d) => d.armId === arm.id)
  const metrics = telemetry.armMetrics(arm.id)
  const attributions = db.filter('attributions', (a) => a.armId === arm.id && a.evidenceType !== 'unknown')
  const children = db.filter('arms', (a) => a.parentArmId === arm.id)

  return {
    armId: arm.id,
    label: arm.label,
    experimentId: arm.experimentId,
    personaId: arm.personaId,
    platform: arm.platform,
    hook: arm.hook,
    mutationDimension: arm.testedDimensions?.[0] ?? null,
    mutationReason: arm.mutationReason,
    multiFactor: arm.multiFactor,
    decision: decision?.decision ?? null,
    decisionReason: decision?.decisionReason ?? null,
    metrics,
    conversions: attributions.length,
    costUsd: cost.forArm(arm.id).totalUsd,
    generation: depth,
    // Recursion is bounded by maxDepth and DATA_MODEL.md §4 rule 2 forbids
    // cycles; `assertNoCycle` enforces that at write time.
    children: children.map((c) => lineage(c.id, { depth: depth + 1, maxDepth })).filter(Boolean),
  }
}

/** Roots = arms with no parent. Each root is one Winner family. */
export function families(productId = null) {
  const roots = db.filter('arms', (a) => !a.parentArmId && (!productId || a.productId === productId))
  return roots
    .map((root) => lineage(root.id))
    .filter((tree) => tree && (tree.children.length > 0 || tree.decision === 'WINNER'))
}

/**
 * Clone lift — GHOS-067.
 *
 * "Child 與其明確 parent / baseline 在指定 primary outcome 上的差異。畫面必須同時
 *  顯示 comparison context，不只顯示百分比."
 *
 * So the return value leads with the context and the caveats, and the number
 * comes third.
 */
export function cloneLift(childArmId) {
  const child = requireArm(childArmId)
  if (!child.parentArmId) return { comparable: false, says: '此 arm 沒有 parent，無 clone lift 可言。' }
  const parent = db.get('arms', child.parentArmId)
  if (!parent) return { comparable: false, says: `parent arm ${child.parentArmId} 已不存在。` }

  const childExp = db.get('experiments', child.experimentId)
  const parentExp = db.get('experiments', parent.experimentId)
  const outcome = childExp?.primaryOutcome ?? 'click'

  const rate = (arm) => {
    const metrics = telemetry.armMetrics(arm.id)
    const trials = ['click', 'qualified_session'].includes(outcome)
      ? (metrics.impressions ?? metrics.views ?? 0)
      : (metrics.clicks ?? 0)
    const successes = ['click', 'qualified_session'].includes(outcome)
      ? (metrics.clicks ?? 0)
      : db.filter('attributions', (a) => a.armId === arm.id && a.evidenceType !== 'unknown').length
    return { trials, successes, rate: trials ? successes / trials : null }
  }

  const c = rate(child)
  const p = rate(parent)

  const caveats = []
  if (child.platform !== parent.platform) caveats.push('child 與 parent 在不同平台，絕對值不可直接比較。')
  if (childExp?.primaryOutcome !== parentExp?.primaryOutcome) caveats.push('child 與 parent 的 primary outcome 定義不同，這個比較不成立。')
  if (childExp?.observationWindowHours !== parentExp?.observationWindowHours) {
    caveats.push(`觀測窗不同（child ${childExp?.observationWindowHours}h vs parent ${parentExp?.observationWindowHours}h）——短窗偏向早期爆發型內容。`)
  }
  if (child.multiFactor) caveats.push('child 為多因子變更，提升不可歸因於單一維度。')
  if (parentExp?.observationStartedAt && childExp?.observationStartedAt) {
    const gapDays = Math.abs(Date.parse(childExp.observationStartedAt) - Date.parse(parentExp.observationStartedAt)) / 86_400_000
    if (gapDays > 30) caveats.push(`兩個觀測窗相隔 ${Math.round(gapDays)} 天，期間平台分發與受眾都可能已改變。`)
  }

  if (c.rate == null || p.rate == null) {
    return { comparable: false, child: c, parent: p, caveats, says: '其中一方沒有可用的分母，無法計算 lift。' }
  }

  const lift = p.rate > 0 ? (c.rate - p.rate) / p.rate : null
  const test = twoProportionTest(c.successes, c.trials, p.successes, p.trials)

  return {
    comparable: true,
    outcome,
    mutationDimension: child.testedDimensions?.[0] ?? null,
    mutationReason: child.mutationReason,
    parent: { armId: parent.id, label: parent.label, experimentId: parent.experimentId, ...p },
    child: { armId: child.id, label: child.label, experimentId: child.experimentId, ...c },
    relativeLift: lift,
    test,
    meaningful: Boolean(test?.usable && test.significant && lift != null && lift >= MIN_RELATIVE_LIFT),
    caveats,
    context: `比較的是 ${outcome} 率：child ${(c.rate * 100).toFixed(2)}%（${c.successes}/${c.trials}）vs parent ${(p.rate * 100).toFixed(2)}%（${p.successes}/${p.trials}）。`,
    says:
      test?.usable === false
        ? `${test.reason} 目前不宣稱 lift。`
        : lift == null
          ? 'parent 的比率為 0，相對提升無定義。'
          : `相對提升 ${(lift * 100).toFixed(1)}%${test?.significant ? '（達顯著）' : '（未達顯著，可能是雜訊）'}。`,
  }
}

/* ---------------------------------------------------------- winner queue */

/** The Winner Factory's buckets — DASHBOARD_SPEC.md §6. */
export function winnerQueue(productId = null) {
  // Decisions are append-only, so re-evaluating an experiment writes a second
  // WINNER row for the same arm. The queue is a list of *arms* to act on, so
  // keep only the latest decision per arm — otherwise one re-evaluation shows
  // the same Winner twice and the operator clones it twice.
  const latestByArm = new Map()
  for (const d of db.listAsc('decisions')) {
    if (d.decision !== 'WINNER' || !d.armId) continue
    if (productId && d.productId !== productId) continue
    latestByArm.set(d.armId, d)
  }
  const winners = [...latestByArm.values()]

  const buckets = { newWinners: [], cloneQueued: [], cloneRunning: [], childrenCollecting: [], provenFamily: [], fatigued: [] }

  for (const decision of winners) {
    const arm = db.get('arms', decision.armId)
    if (!arm) continue
    const mutations = db.filter('mutations', (m) => m.parentArmId === arm.id)
    const children = db.filter('arms', (a) => a.parentArmId === arm.id)
    const childDecisions = db.filter('decisions', (d) => children.some((c) => c.id === d.armId))
    const childWinners = childDecisions.filter((d) => d.decision === 'WINNER')

    const entry = {
      armId: arm.id,
      label: arm.label,
      experimentId: arm.experimentId,
      personaId: arm.personaId,
      platform: arm.platform,
      hook: arm.hook,
      decision,
      relativeLift: decision.relativeLift,
      mutationCount: mutations.length,
      childCount: children.length,
      childWinnerCount: childWinners.length,
      costUsd: cost.forArm(arm.id).totalUsd,
      // The next action is named, so the queue is a work list rather than a
      // trophy cabinet.
      nextAction: null,
    }

    if (mutations.length === 0) {
      entry.nextAction = { action: 'clone', says: '這支已判定 Winner 但還沒有任何變體。選一個維度做變異，才會產生複利。' }
      buckets.newWinners.push(entry)
    } else if (mutations.some((m) => m.status === 'queued')) {
      entry.nextAction = { action: 'generate', says: '變體實驗已建立，等待生成素材。' }
      buckets.cloneQueued.push(entry)
    } else if (children.length && childDecisions.length === 0) {
      entry.nextAction = { action: 'wait', says: 'child 已發布，等待觀測窗結束與資料回流。' }
      buckets.childrenCollecting.push(entry)
    } else if (childWinners.length > 0) {
      entry.nextAction = { action: 'scale', says: `已有 ${childWinners.length} 個 child 也成為 Winner，這一支是可靠的家族。` }
      buckets.provenFamily.push(entry)
    } else {
      entry.nextAction = { action: 'retest_or_stop', says: '所有 child 都沒有贏過 parent——parent 的優勢可能是一次性的，或這個維度沒有更多空間。' }
      buckets.cloneRunning.push(entry)
    }
  }

  // Fatigue is a family-level signal, so it is computed over the whole tree.
  for (const family of families(productId)) {
    const flat = flatten(family)
    const gens = new Map()
    for (const node of flat) {
      const g = gens.get(node.generation) ?? { conversions: 0, clicks: 0 }
      g.conversions += node.conversions
      g.clicks += node.metrics.clicks ?? 0
      gens.set(node.generation, g)
    }
    const ordered = [...gens.entries()].sort((a, b) => a[0] - b[0]).filter(([, v]) => v.clicks >= 100)
    if (ordered.length >= 2) {
      const first = ordered[0][1].conversions / ordered[0][1].clicks
      const last = ordered.at(-1)[1].conversions / ordered.at(-1)[1].clicks
      if (last < first * 0.8) {
        buckets.fatigued.push({
          rootArmId: family.armId,
          label: family.label,
          firstGenRate: first,
          latestGenRate: last,
          says: `第一代轉換率 ${(first * 100).toFixed(2)}%，最新一代 ${(last * 100).toFixed(2)}%——降幅超過 20%，建議停止再變異這一支，改測新題目。`,
        })
      }
    }
  }

  return buckets
}

const flatten = (node, out = []) => {
  out.push(node)
  for (const c of node.children) flatten(c, out)
  return out
}

export const listMutations = (filter = {}) => db.list('mutations', filter)

export function setMutationStatus(id, status, actor = 'system') {
  if (!MUTATION_STATUS.includes(status)) throw badRequest(`未知 mutation 狀態 "${status}"`)
  const row = db.update('mutations', id, { status })
  if (!row) throw notFound(`Mutation ${id}`)
  if (status === 'completed') {
    emit('mutation.completed', { productId: row.productId, experimentId: row.childExperimentId, armId: row.parentArmId, source: 'winner_evolution', properties: { mutationDimension: row.mutationDimension } })
  }
  audit.record({ actorType: 'human', actorId: actor, action: `mutation.${status}`, entityType: 'mutation', entityId: id, after: row })
  return row
}
