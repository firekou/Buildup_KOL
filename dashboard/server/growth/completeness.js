import { db } from './store.js'
import { contractGates } from './experiments.js'
import * as cost from './cost.js'

/**
 * Data completeness evaluator — GHOS-060, ROADMAP.md Gate 3.
 *
 *   "若 observation window 未完成或關鍵資料缺失，輸出 NEEDS_MORE_DATA /
 *    INCONCLUSIVE，不得硬選 Winner."
 *
 * This module is the thing that makes that rule enforceable. It runs *before*
 * the evaluator and can veto it. The most common real-world failure it exists
 * to catch is not "no data" — it is partial data: three of five arms reported,
 * or clicks present but conversions still landing, which produces a confident
 * and wrong Winner.
 */

export const COMPLETENESS_STATES = ['not_started', 'collecting', 'partial', 'complete', 'stale']

/** Outcomes that need product-side events, not just platform metrics. */
const PRODUCT_OUTCOMES = ['signup', 'activation', 'purchase', 'deposit', 'custom_conversion']

export function assess(experiment) {
  const arms = db.listAsc('arms', { experimentId: experiment.id })
  const checks = []
  const now = Date.now()

  /* --- contract ------------------------------------------------------- */
  const contract = contractGates(experiment)
  checks.push({
    check: 'contract',
    passed: contract.passed,
    blocking: true,
    message: contract.passed ? '實驗契約完整。' : `契約未完成：${contract.failed.join('、')}`,
    detail: contract.gates.filter((g) => !g.passed),
  })

  /* --- publication ----------------------------------------------------- */
  const publications = db.filter('publications', (p) => p.experimentId === experiment.id)
  const publishedArms = new Set(publications.filter((p) => p.status === 'published').map((p) => p.armId))
  checks.push({
    check: 'all_arms_published',
    passed: arms.length > 0 && publishedArms.size === arms.length,
    blocking: true,
    message:
      arms.length === 0
        ? '沒有任何 arm。'
        : publishedArms.size === arms.length
          ? `${arms.length} 個 arm 全部已發布。`
          : `只有 ${publishedArms.size}/${arms.length} 個 arm 已發布——用部分已發布的 arm 比較會系統性偏向先發的那些。`,
  })

  /* --- observation window ---------------------------------------------- */
  const windowEndsAt = experiment.observationEndsAt ? Date.parse(experiment.observationEndsAt) : null
  const windowComplete = windowEndsAt != null && now >= windowEndsAt
  checks.push({
    check: 'observation_window',
    passed: windowComplete,
    blocking: true,
    message: windowEndsAt
      ? windowComplete
        ? `觀測窗已於 ${experiment.observationEndsAt} 結束。`
        : `觀測窗還有 ${Math.round(((windowEndsAt - now) / 3_600_000) * 10) / 10} 小時才結束——提早判定會偏向早期爆發型內容。`
      : '觀測窗尚未開始（實驗尚未發布）。',
    remainingHours: windowEndsAt ? Math.max(0, Math.round(((windowEndsAt - now) / 3_600_000) * 10) / 10) : null,
  })

  /* --- metrics per arm -------------------------------------------------- */
  const armMetrics = arms.map((arm) => {
    const pubs = publications.filter((p) => p.armId === arm.id)
    const pubIds = new Set(pubs.map((p) => p.id))
    const metrics = db.filter('metricEvents', (m) => pubIds.has(m.publicationId))
    const byName = {}
    for (const m of metrics) byName[m.metricName] = Math.max(byName[m.metricName] ?? 0, Number(m.metricValue) || 0)
    const lastSync = pubs.map((p) => p.lastMetricSyncAt).filter(Boolean).sort().at(-1) ?? null
    return { armId: arm.id, label: arm.label, hasMetrics: metrics.length > 0, metrics: byName, lastSync, publicationCount: pubs.length }
  })

  const armsWithMetrics = armMetrics.filter((a) => a.hasMetrics).length
  checks.push({
    check: 'metrics_present',
    passed: arms.length > 0 && armsWithMetrics === arms.length,
    blocking: true,
    message: `${armsWithMetrics}/${arms.length} 個 arm 有回傳的成效資料。`,
    detail: armMetrics.filter((a) => !a.hasMetrics).map((a) => a.label),
  })

  /* --- primary outcome data --------------------------------------------- */
  const needsProduct = PRODUCT_OUTCOMES.includes(experiment.primaryOutcome)
  const conversions = db.filter('attributions', (a) => a.experimentId === experiment.id)
  const primaryCount = needsProduct
    ? conversions.length
    : armMetrics.reduce((acc, a) => acc + (a.metrics[experiment.primaryOutcome] ?? a.metrics.clicks ?? 0), 0)

  const definition = experiment.primaryConversionEvent
    ? db.find('conversionDefinitions', (c) => c.productId === experiment.productId && c.eventName === experiment.primaryConversionEvent)
    : null
  const minSample = definition?.minSampleForEvaluation ?? 30

  checks.push({
    check: 'primary_outcome_sample',
    passed: primaryCount >= minSample,
    // Not blocking: a genuinely small sample is a legitimate reason to return
    // NEEDS_MORE_DATA rather than to refuse to evaluate at all.
    blocking: false,
    message:
      primaryCount >= minSample
        ? `Primary outcome「${experiment.primaryOutcome}」累積 ${primaryCount}，達到門檻 ${minSample}。`
        : `Primary outcome「${experiment.primaryOutcome}」只累積 ${primaryCount}，未達門檻 ${minSample}——這個樣本量下的差異多半是雜訊。`,
    observed: primaryCount,
    threshold: minSample,
  })

  /* --- attribution coverage --------------------------------------------- */
  const measured = conversions.filter((a) => a.evidenceType === 'direct').length
  const modeled = conversions.filter((a) => a.evidenceType === 'modeled').length
  const unknown = conversions.filter((a) => a.evidenceType === 'unknown').length
  const coverage = conversions.length ? measured / conversions.length : null
  checks.push({
    check: 'attribution_coverage',
    passed: !needsProduct || coverage == null || coverage >= 0.5,
    blocking: false,
    message:
      conversions.length === 0
        ? '尚無任何歸因記錄。'
        : `${conversions.length} 筆歸因：直接量測 ${measured}、模型歸因 ${modeled}、無法歸因 ${unknown}。`,
    coverage,
  })

  /* --- cost ------------------------------------------------------------- */
  const costs = cost.forExperiment(experiment.id)
  checks.push({
    check: 'cost_recorded',
    passed: costs.count > 0,
    blocking: false,
    message: costs.count
      ? `已記錄 ${costs.count} 筆成本，共 $${costs.totalUsd}${costs.unknownModelRows ? `（其中 ${costs.unknownModelRows} 筆為未登錄模型，需補登）` : ''}。`
      : '沒有任何成本記錄——單位經濟無法計算。',
  })

  /* --- freshness -------------------------------------------------------- */
  const lastSync = armMetrics.map((a) => a.lastSync).filter(Boolean).sort().at(-1) ?? null
  const staleHours = lastSync ? (now - Date.parse(lastSync)) / 3_600_000 : null
  checks.push({
    check: 'data_freshness',
    passed: staleHours == null || staleHours <= 24,
    blocking: false,
    message: lastSync ? `最後一次成效同步在 ${Math.round(staleHours * 10) / 10} 小時前。` : '尚未同步過成效資料。',
    lastSync,
  })

  const blockingFailures = checks.filter((c) => c.blocking && !c.passed)
  const advisoryFailures = checks.filter((c) => !c.blocking && !c.passed)

  const state = blockingFailures.length
    ? publications.length === 0
      ? 'not_started'
      : 'collecting'
    : advisoryFailures.length
      ? 'partial'
      : 'complete'

  return {
    state,
    // `evaluable` is the single field the evaluator branches on. Anything that
    // fails a blocking check is not evaluable, full stop.
    evaluable: blockingFailures.length === 0,
    checks,
    blockingFailures: blockingFailures.map((c) => c.check),
    advisoryFailures: advisoryFailures.map((c) => c.check),
    armMetrics,
    attribution: { total: conversions.length, measured, modeled, unknown, coverage },
    cost: costs,
    summary: blockingFailures.length
      ? `尚不可評估：${blockingFailures.map((c) => c.message).join(' ')}`
      : advisoryFailures.length
        ? `可評估，但有保留：${advisoryFailures.map((c) => c.check).join('、')}`
        : '資料完整，可進入評估。',
  }
}
