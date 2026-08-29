import { db } from './store.js'
import { newId } from './ids.js'
import { emit } from './events.js'
import * as audit from './audit.js'
import * as cost from './cost.js'
import { assess } from './completeness.js'
import { requireExperiment, setStatus, DIMENSIONS } from './experiments.js'

/**
 * Experiment Evaluator v1 — FR-P0-11, GHOS-061 / 062.
 *
 * The spec's constraint is unusually specific and worth restating:
 *
 *   "第一版 evaluator 以可解釋 rule / comparison 為主，禁止先硬編全域通用
 *    Winner score."
 *
 * So there is no weighted composite. The evaluator answers one question —
 * "did the tested dimension move the primary outcome relative to the declared
 * baseline, by more than this sample could produce by chance?" — and shows its
 * arithmetic. Where it cannot answer, it says NEEDS_MORE_DATA or INCONCLUSIVE
 * rather than picking the bigger number.
 *
 * The chance test is a two-proportion z-test on the primary outcome rate. It
 * is the simplest defensible test for "one arm beat another on a rate", and it
 * is named in the output so a reader can disagree with the method rather than
 * with a verdict.
 */

export const EVALUATOR_VERSION = '1.0.0'

export const DECISIONS = ['WINNER', 'LOSER', 'INCONCLUSIVE', 'NEEDS_MORE_DATA']

/**
 * Minimum relative lift we are willing to call a win. Below this, even a
 * statistically clean difference is not worth reallocating production for.
 * Declared here rather than tuned per experiment, and printed in every output.
 */
export const MIN_RELATIVE_LIFT = 0.15

/** Significance level for the z-test. */
export const ALPHA = 0.05
const Z_CRITICAL = 1.96 // two-tailed, alpha = 0.05

/**
 * Two-proportion z-test. Returns null when either arm lacks the sample for the
 * normal approximation to mean anything (the usual np ≥ 5 rule) — a p-value
 * computed on n=3 is worse than no p-value, because it looks like evidence.
 */
export function twoProportionTest(successesA, trialsA, successesB, trialsB) {
  if (!trialsA || !trialsB) return null
  const p1 = successesA / trialsA
  const p2 = successesB / trialsB
  const pooled = (successesA + successesB) / (trialsA + trialsB)
  if (pooled <= 0 || pooled >= 1) return null
  const minExpected = Math.min(trialsA * pooled, trialsB * pooled, trialsA * (1 - pooled), trialsB * (1 - pooled))
  if (minExpected < 5) {
    return { usable: false, reason: `樣本太小（最小期望次數 ${minExpected.toFixed(1)} < 5），常態近似不成立，不做顯著性宣稱。`, p1, p2 }
  }
  const se = Math.sqrt(pooled * (1 - pooled) * (1 / trialsA + 1 / trialsB))
  if (se === 0) return null
  const z = (p1 - p2) / se
  return {
    usable: true,
    z: Math.round(z * 1000) / 1000,
    significant: Math.abs(z) >= Z_CRITICAL,
    p1,
    p2,
    method: `two-proportion z-test, alpha=${ALPHA}, |z|>=${Z_CRITICAL}`,
  }
}

/** Denominator for the primary outcome rate — what the outcome is a rate *of*. */
const TRIAL_METRIC = {
  click: ['impressions', 'views', 'reach'],
  qualified_session: ['clicks'],
  signup: ['clicks'],
  activation: ['clicks'],
  purchase: ['clicks'],
  deposit: ['clicks'],
  custom_conversion: ['clicks'],
}

function armOutcome(experiment, armMetric, attributions) {
  const metrics = armMetric.metrics ?? {}
  const trialsFrom = TRIAL_METRIC[experiment.primaryOutcome] ?? ['impressions']
  const trials = trialsFrom.map((k) => metrics[k] ?? 0).find((v) => v > 0) ?? 0

  const successes = ['click', 'qualified_session'].includes(experiment.primaryOutcome)
    ? (metrics.clicks ?? 0)
    : attributions.filter((a) => a.armId === armMetric.armId).length

  return {
    armId: armMetric.armId,
    label: armMetric.label,
    trials,
    successes,
    rate: trials ? successes / trials : null,
    trialsMetric: trialsFrom.find((k) => (metrics[k] ?? 0) > 0) ?? trialsFrom[0],
    metrics,
    costUsd: cost.forArm(armMetric.armId).totalUsd,
  }
}

export function evaluate(experimentId, { actor = 'system', persist = true } = {}) {
  const experiment = requireExperiment(experimentId)
  const completeness = assess(experiment)
  const attributions = db.filter('attributions', (a) => a.experimentId === experimentId)

  const arms = db.listAsc('arms', { experimentId })
  const outcomes = completeness.armMetrics.map((m) => armOutcome(experiment, m, attributions))
  const armById = Object.fromEntries(arms.map((a) => [a.id, a]))

  const context = {
    evaluatorVersion: EVALUATOR_VERSION,
    evaluatedAt: new Date().toISOString(),
    primaryOutcome: experiment.primaryOutcome,
    comparisonDimension: experiment.comparisonDimension,
    comparisonDimensionLabel: DIMENSIONS[experiment.comparisonDimension]?.label,
    baseline: experiment.baseline,
    observationWindowHours: experiment.observationWindowHours,
    minRelativeLift: MIN_RELATIVE_LIFT,
    alpha: ALPHA,
    dataCompleteness: {
      state: completeness.state,
      evaluable: completeness.evaluable,
      blockingFailures: completeness.blockingFailures,
      advisoryFailures: completeness.advisoryFailures,
      summary: completeness.summary,
    },
    attributionCoverage: completeness.attribution,
    arms: outcomes,
    cost: completeness.cost,
    // Multi-factor arms poison causal claims; the decision carries the caveat.
    multiFactorArms: arms.filter((a) => a.multiFactor).map((a) => a.label),
  }

  /* --- gate 1: is it even evaluable? ---------------------------------- */
  if (!completeness.evaluable) {
    return finalise(experiment, {
      ...context,
      decision: 'NEEDS_MORE_DATA',
      armId: null,
      decisionReason: completeness.summary,
      caveats: ['資料完整度未通過必要檢查，未進行任何比較。'],
    }, { actor, persist })
  }

  /* --- gate 2: enough of the primary outcome to compare? --------------- */
  const totalSuccesses = outcomes.reduce((acc, o) => acc + o.successes, 0)
  const sampleCheck = completeness.checks.find((c) => c.check === 'primary_outcome_sample')
  if (!sampleCheck?.passed) {
    return finalise(experiment, {
      ...context,
      decision: 'NEEDS_MORE_DATA',
      armId: null,
      decisionReason: sampleCheck?.message ?? `Primary outcome 累積 ${totalSuccesses}，不足以比較。`,
      caveats: ['樣本量未達該 conversion event 設定的最低評估門檻。'],
    }, { actor, persist })
  }

  const comparable = outcomes.filter((o) => o.trials > 0)
  if (comparable.length < 2) {
    return finalise(experiment, {
      ...context,
      decision: 'NEEDS_MORE_DATA',
      armId: null,
      decisionReason: `只有 ${comparable.length} 個 arm 有可用的分母（${outcomes.map((o) => `${o.label}:${o.trials}`).join(', ')}），無法比較。`,
      caveats: [],
    }, { actor, persist })
  }

  /* --- the comparison -------------------------------------------------- */
  const sorted = [...comparable].sort((a, b) => (b.rate ?? 0) - (a.rate ?? 0))
  const leader = sorted[0]
  const challenger = resolveBaseline(experiment, sorted, outcomes)

  if (!challenger) {
    return finalise(experiment, {
      ...context,
      decision: 'INCONCLUSIVE',
      armId: null,
      decisionReason: `baseline（${experiment.baseline?.kind}）無法解析成一個可比較的對象。`,
      caveats: ['比較基準缺失，任何領先都沒有參照。'],
    }, { actor, persist })
  }

  const relativeLift = challenger.rate > 0 ? (leader.rate - challenger.rate) / challenger.rate : null
  const test = twoProportionTest(leader.successes, leader.trials, challenger.successes, challenger.trials)

  const comparison = {
    leaderArmId: leader.armId,
    leaderLabel: leader.label,
    baselineArmId: challenger.armId,
    baselineLabel: challenger.label,
    leaderRate: leader.rate,
    baselineRate: challenger.rate,
    absoluteDelta: leader.rate - challenger.rate,
    relativeLift,
    test,
    // Stated in words, because a Dashboard that shows only "+31%" invites the
    // reader to forget what it is 31% of.
    says: `${leader.label} 的 ${experiment.primaryOutcome} 率為 ${fmtRate(leader.rate)}（${leader.successes}/${leader.trials} ${leader.trialsMetric}），` +
      `${challenger.label} 為 ${fmtRate(challenger.rate)}（${challenger.successes}/${challenger.trials}）。`,
  }

  const caveats = []
  if (context.multiFactorArms.length) caveats.push(`arm ${context.multiFactorArms.join('/')} 為多因子變更，不得宣稱單一因果。`)
  if (completeness.advisoryFailures.length) caveats.push(`資料保留：${completeness.advisoryFailures.join('、')}。`)
  if (completeness.attribution.total && completeness.attribution.coverage < 0.5) {
    caveats.push(`只有 ${Math.round(completeness.attribution.coverage * 100)}% 的轉換是直接量測，其餘為模型歸因或無法歸因。`)
  }
  const platforms = new Set(arms.map((a) => a.platform))
  if (platforms.size > 1 && experiment.comparisonDimension !== 'platform') {
    caveats.push('本實驗的 arm 跨多個平台，絕對數字不可直接相比。')
  }

  let decision
  let reason

  if (!test) {
    decision = 'INCONCLUSIVE'
    reason = `無法對 ${leader.label} 與 ${challenger.label} 做比較檢定（分母為 0 或結果率為極值）。${comparison.says}`
  } else if (!test.usable) {
    decision = 'NEEDS_MORE_DATA'
    reason = `${comparison.says}${test.reason}`
  } else if (!test.significant) {
    decision = 'INCONCLUSIVE'
    reason = `${comparison.says}差異未達顯著（|z|=${Math.abs(test.z)} < ${Z_CRITICAL}），在此樣本量下無法區分兩者。`
  } else if (relativeLift == null || relativeLift < MIN_RELATIVE_LIFT) {
    decision = 'INCONCLUSIVE'
    reason = `${comparison.says}差異在統計上顯著，但相對提升 ${fmtPct(relativeLift)} 低於 ${fmtPct(MIN_RELATIVE_LIFT)} 的最低採用門檻——不值得為此重新配置產能。`
  } else {
    decision = 'WINNER'
    reason = `${comparison.says}相對提升 ${fmtPct(relativeLift)}，且達統計顯著（|z|=${Math.abs(test.z)} >= ${Z_CRITICAL}）。` +
      `本實驗只變動「${context.comparisonDimensionLabel}」，因此差異可歸因於該維度。`
  }

  const result = finalise(experiment, {
    ...context,
    decision,
    armId: decision === 'WINNER' ? leader.armId : null,
    comparison,
    decisionReason: reason,
    caveats,
  }, { actor, persist })

  // Losers are marked per-arm, not per-experiment: the experiment produced a
  // finding either way, and calling the whole thing a "loser" loses that.
  if (decision === 'WINNER' && persist) {
    for (const o of comparable) {
      if (o.armId === leader.armId) continue
      const lift = challenger.rate > 0 ? (o.rate - challenger.rate) / challenger.rate : null
      db.insert('decisions', {
        id: newId('decision'),
        experimentId,
        armId: o.armId,
        productId: experiment.productId,
        decision: 'LOSER',
        baselineRef: challenger.armId,
        primaryOutcomeObserved: { rate: o.rate, successes: o.successes, trials: o.trials },
        decisionReason: `在同一觀測窗下輸給 ${leader.label}（${fmtRate(o.rate)} vs ${fmtRate(leader.rate)}）。`,
        relativeLift: lift,
        evaluatorVersion: EVALUATOR_VERSION,
        dataCompleteness: context.dataCompleteness,
        caveats,
        decidedAt: new Date().toISOString(),
      })
      db.update('arms', o.armId, { status: 'LOSER' })
    }
    db.update('arms', leader.armId, { status: 'WINNER' })
  }

  return result
}

/** Resolve `baseline` into the arm the leader is compared against. */
function resolveBaseline(experiment, sortedComparable, allOutcomes) {
  const kind = experiment.baseline?.kind ?? 'best_other_arm'
  if (kind === 'best_other_arm') return sortedComparable[1] ?? null
  if (kind === 'parent_arm') {
    const parentId = experiment.baseline.parentArmId
    const found = allOutcomes.find((o) => o.armId === parentId)
    // A parent from a previous experiment is not in this experiment's arms; the
    // clone-lift path (evolution.js) handles that comparison explicitly.
    return found ?? sortedComparable[1] ?? null
  }
  if (kind === 'fixed_threshold') {
    return { armId: null, label: `固定門檻 ${experiment.baseline.value}`, rate: Number(experiment.baseline.value), successes: 0, trials: 0 }
  }
  return sortedComparable[1] ?? null
}

function finalise(experiment, payload, { actor, persist }) {
  if (!persist) return payload

  const row = db.insert('decisions', {
    id: newId('decision'),
    experimentId: experiment.id,
    productId: experiment.productId,
    armId: payload.armId,
    decision: payload.decision,
    baselineRef: payload.comparison?.baselineArmId ?? experiment.baseline?.kind ?? null,
    primaryOutcomeObserved: payload.comparison
      ? { leaderRate: payload.comparison.leaderRate, baselineRate: payload.comparison.baselineRate, relativeLift: payload.comparison.relativeLift }
      : null,
    dataCompleteness: payload.dataCompleteness,
    decisionReason: payload.decisionReason,
    caveats: payload.caveats,
    comparison: payload.comparison ?? null,
    relativeLift: payload.comparison?.relativeLift ?? null,
    evaluatorVersion: EVALUATOR_VERSION,
    decidedAt: new Date().toISOString(),
  })

  db.update('experiments', experiment.id, {
    dataCompletenessStatus: payload.dataCompleteness.state,
    evaluatorVersion: EVALUATOR_VERSION,
    lastEvaluatedAt: new Date().toISOString(),
  })

  // COLLECTING → EVALUABLE → {WINNER|LOSER|INCONCLUSIVE} is two hops, and the
  // state machine only allows one at a time. Walking it explicitly (rather
  // than jumping straight to the terminal state and swallowing the rejection)
  // is what keeps `EVALUABLE` a state the experiment actually passes through —
  // Winner yield is defined over evaluable experiments, so an experiment that
  // skipped that state would be a Winner missing from its own denominator.
  if (payload.dataCompleteness.evaluable && experiment.status === 'COLLECTING') {
    try {
      setStatus(experiment.id, 'EVALUABLE', { actor, reason: '資料完整度檢查通過' })
    } catch {
      /* already past EVALUABLE */
    }
    emit('experiment.evaluable', { productId: experiment.productId, experimentId: experiment.id, source: 'evaluator', properties: { state: payload.dataCompleteness.state } })
  }

  const statusFor = { WINNER: 'WINNER', INCONCLUSIVE: 'INCONCLUSIVE', NEEDS_MORE_DATA: null, LOSER: 'LOSER' }[payload.decision]
  const current = db.get('experiments', experiment.id)?.status
  if (statusFor && current !== statusFor) {
    try {
      setStatus(experiment.id, statusFor, { actor, reason: payload.decisionReason })
    } catch (err) {
      // A transition the state machine forbids (re-deciding a stopped
      // experiment, or deciding one that never became evaluable) must not lose
      // the decision row that was already written — but it must not be
      // invisible either.
      audit.record({
        actorType: 'system', actorId: `evaluator@${EVALUATOR_VERSION}`, action: 'experiment.status.transition_refused',
        entityType: 'experiment', entityId: experiment.id,
        before: { status: current }, after: { attempted: statusFor }, reason: err.message,
      })
    }
  }

  emit('experiment.decided', {
    productId: experiment.productId,
    campaignId: experiment.campaignId,
    experimentId: experiment.id,
    armId: payload.armId,
    source: 'evaluator',
    properties: { decision: payload.decision, evaluatorVersion: EVALUATOR_VERSION, relativeLift: payload.comparison?.relativeLift ?? null },
  })
  audit.record({
    actorType: 'system', actorId: `evaluator@${EVALUATOR_VERSION}`, action: `experiment.decided.${payload.decision}`,
    entityType: 'experiment', entityId: experiment.id, after: { decision: payload.decision, armId: payload.armId }, reason: payload.decisionReason,
  })

  return { ...payload, decisionId: row.id }
}

const fmtRate = (r) => (r == null ? '—' : `${(r * 100).toFixed(2)}%`)
const fmtPct = (r) => (r == null ? '—' : `${(r * 100).toFixed(1)}%`)

export const listDecisions = (filter = {}, limit = 200) => db.list('decisions', filter).slice(0, limit)
export const latestDecision = (experimentId) => db.list('decisions', { experimentId }).find((d) => !d.armId || d.decision === 'WINNER') ?? db.list('decisions', { experimentId })[0] ?? null
