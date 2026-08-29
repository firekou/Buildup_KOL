import { db } from './store.js'
import { listProducts, getProduct, listConversions } from './products.js'
import * as portfolio from './portfolio.js'
import * as cost from './cost.js'
import { coverage } from './conversions.js'
import { assess } from './completeness.js'

/**
 * Product pipeline tracker — the board that answers the question this whole
 * Dashboard was asked for: **每一個產品現在走到 Growth OS 的哪一格？**
 *
 * The loop in README.md §2 has ten meaningful checkpoints. A product's stage
 * is the furthest one it has actually reached, derived from data rather than
 * set by hand, so nobody can mark a product "measuring" because it feels like
 * it should be. Each stage carries the exit criterion it has not yet met.
 */

export const STAGES = [
  {
    key: 'registered',
    label: '① 已登錄',
    says: '產品已建立，但還沒有做特性分析。',
    exit: '執行產品特性分析。',
  },
  {
    key: 'analysed',
    label: '② 特性分析完成',
    says: '知道這個產品的宣稱面、可用角色、可發平台與量測方式。',
    exit: '定義 conversion event 並補齊阻擋級 readiness gate。',
  },
  {
    key: 'measurable',
    label: '③ 可量測',
    says: 'conversion event 與 tracking 目的地齊備，實驗結果能回到產品端。',
    exit: '建立第一個 Opportunity。',
  },
  {
    key: 'opportunity',
    label: '④ 有題目',
    says: 'Opportunity queue 有可測題目。',
    exit: '建立第一個多 arm 實驗。',
  },
  {
    key: 'experimenting',
    label: '⑤ 實驗中',
    says: '已有結構化實驗與 arms。',
    exit: '生成素材並通過 review gate。',
  },
  {
    key: 'generated',
    label: '⑥ 素材已生成',
    says: 'AIGC 已產出素材，成本已進帳。',
    exit: '通過審查並發布。',
  },
  {
    key: 'published',
    label: '⑦ 已發布',
    says: '內容已上線，觀測窗開始。',
    exit: '回收社群成效與產品轉換。',
  },
  {
    key: 'measuring',
    label: '⑧ 收資料中',
    says: '成效與轉換正在回流。',
    exit: '資料完整度達標並產出 evaluator 判定。',
  },
  {
    key: 'decided',
    label: '⑨ 已判定',
    says: 'evaluator 已產出可解釋的 Winner / Loser / Inconclusive。',
    exit: '從 Winner 建立 child experiment。',
  },
  {
    key: 'compounding',
    label: '⑩ 進入複利',
    says: 'Winner 已產生有 lineage 的下一代實驗——閉環完成。',
    exit: '——（持續運轉）',
  },
]

const STAGE_INDEX = Object.fromEntries(STAGES.map((s, i) => [s.key, i]))

/**
 * Derive a product's stage from what actually exists in the data.
 *
 * Each rung is a fact, not a status field: "published" means there is a
 * publication row with status `published`, and nothing else can make it true.
 */
export function stageOf(productId) {
  const product = getProduct(productId)
  if (!product) return null

  const conversions = listConversions(productId)
  const opportunities = db.count('opportunities', { productId })
  const experiments = db.filter('experiments', (e) => e.productId === productId)
  const arms = db.filter('arms', (a) => a.productId === productId)
  const assets = db.filter('assets', (a) => a.productId === productId)
  const publications = db.filter('publications', (p) => p.productId === productId)
  const published = publications.filter((p) => p.status === 'published')
  const metrics = db.filter('metricEvents', (m) => m.productId === productId)
  const decisions = db.filter('decisions', (d) => d.productId === productId)
  const clones = arms.filter((a) => a.parentArmId)

  const reached = ['registered']
  if (product.analysis) reached.push('analysed')
  if (product.analysis?.readiness?.ready && conversions.length > 0) reached.push('measurable')
  if (opportunities > 0) reached.push('opportunity')
  if (experiments.length > 0 && arms.length >= 2) reached.push('experimenting')
  if (assets.length > 0) reached.push('generated')
  if (published.length > 0) reached.push('published')
  if (metrics.length > 0) reached.push('measuring')
  if (decisions.length > 0) reached.push('decided')
  if (clones.length > 0) reached.push('compounding')

  const current = reached.at(-1)
  const stage = STAGES[STAGE_INDEX[current]]
  const next = STAGES[STAGE_INDEX[current] + 1] ?? null

  return {
    productId,
    name: product.name,
    status: product.status,
    stage: current,
    stageIndex: STAGE_INDEX[current],
    stageLabel: stage.label,
    stageSays: stage.says,
    // The single most useful cell on the board: what is stopping this product
    // from moving one square right.
    blockedBy: blockerFor(current, { product, conversions, opportunities, experiments, arms, assets, publications, published, metrics, decisions }),
    nextStage: next ? { key: next.key, label: next.label } : null,
    exitCriterion: stage.exit,
    reached,
    counts: {
      conversionEvents: conversions.length,
      opportunities,
      experiments: experiments.length,
      arms: arms.length,
      assets: assets.length,
      publications: publications.length,
      published: published.length,
      metricEvents: metrics.length,
      decisions: decisions.length,
      winners: decisions.filter((d) => d.decision === 'WINNER').length,
      clones: clones.length,
      incidents: db.count('incidents', { productId }),
      openIncidents: db.filter('incidents', (i) => i.productId === productId && i.status === 'open').length,
    },
  }
}

function blockerFor(stage, ctx) {
  switch (stage) {
    case 'registered':
      return { what: '尚未執行產品特性分析', how: '在產品頁點「執行特性分析」，系統會產出宣稱面、角色適配、平台與量測方式。' }
    case 'analysed': {
      const gaps = ctx.product.analysis?.readiness?.blockingGaps ?? []
      return gaps.length
        ? { what: `readiness gate 未過：${gaps.join('、')}`, how: '補齊這些欄位後重新執行分析。缺 conversion event 或 tracking 目的地時，所有實驗都會是不可評估的。' }
        : { what: '尚未定義 conversion event', how: '至少定義一個並指定為 primary。' }
    }
    case 'measurable':
      return { what: 'Opportunity queue 是空的', how: '執行事件掃描，或手動建立一個含 why_now / 對立 / 產品相關性的 Opportunity。' }
    case 'opportunity':
      return ctx.experiments.length === 0
        ? { what: '還沒有實驗', how: '從 Opportunity 用 Persona Router 選人，建立至少兩個 arm 的實驗。' }
        : { what: '實驗只有一個 arm', how: '單 arm 沒有比較對象，再加一個只改變被測維度的 arm。' }
    case 'experimenting':
      return { what: '還沒有素材', how: '對實驗執行生成；沒有 API key 時可用 template adapter 或外部生成後登錄素材。' }
    case 'generated': {
      const pending = ctx.assets.filter((a) => a.reviewStatus !== 'approved').length
      return { what: `${pending} 個素材尚未核准或尚未發布`, how: '到 Review & Compliance 逐項處理紅線語意層與 AI 揭露確認，核准後排入發布。' }
    }
    case 'published':
      return { what: '還沒有成效資料', how: '同步平台成效，或手動登錄一次曝光／點擊數字。' }
    case 'measuring': {
      const notEvaluable = ctx.experiments
        .map((e) => ({ id: e.id, a: assess({ ...e, arms: [] }) }))
        .filter((x) => !x.a.evaluable)
      return notEvaluable.length
        ? { what: `${notEvaluable.length} 個實驗尚未達可評估條件`, how: notEvaluable[0].a.summary }
        : { what: '可評估，但還沒跑 evaluator', how: '在實驗頁執行評估。' }
    }
    case 'decided': {
      const winners = ctx.decisions.filter((d) => d.decision === 'WINNER').length
      return winners
        ? { what: 'Winner 還沒有變體', how: '到 Winner Factory 選一個變異維度建立 child experiment——沒有這一步，AIGC 產能就沒有複利。' }
        : { what: '目前判定中沒有 Winner', how: 'Inconclusive 是合法結果。檢視 caveats，決定是加大樣本重測還是換題目。' }
    }
    default:
      return null
  }
}

/** The whole board. */
export function board() {
  return listProducts().map((product) => {
    const stage = stageOf(product.id)
    const summary = portfolio.productSummary(product.id)
    return {
      ...stage,
      businessModel: product.businessModel,
      owner: product.owner,
      policyProfileId: product.policyProfileId,
      economics: {
        impressions: summary.impressions,
        clicks: summary.clicks,
        conversions: summary.conversions,
        attributedValueUsd: summary.attributedValueUsd,
        totalCostUsd: summary.totalCostUsd,
        contributionUsd: summary.contributionUsd,
        roas: summary.roas,
        costPerConversion: summary.costPerConversion,
      },
      attribution: summary.attribution,
      recommendation: summary.recommendation,
      analysedAt: product.analysedAt ?? null,
    }
  })
}

/** Aggregate health across all products — the Command Center's top row. */
export function overview() {
  const rows = board()
  const experiments = db.list('experiments')
  const evaluable = experiments.filter((e) => ['EVALUABLE', 'WINNER', 'LOSER', 'INCONCLUSIVE'].includes(e.status))
  const decisions = db.list('decisions')
  // Winner yield is "Winner experiments / Evaluable experiments"
  // (DASHBOARD_SPEC.md §13) — experiments, not decision rows. Re-running the
  // evaluator writes a second decision for the same experiment (deliberately:
  // decisions are an append-only audit trail), so counting rows would report
  // a yield above 100% for one experiment evaluated twice.
  const winnerExperimentIds = new Set(decisions.filter((d) => d.decision === 'WINNER').map((d) => d.experimentId))
  const winnerArmIds = new Set(decisions.filter((d) => d.decision === 'WINNER' && d.armId).map((d) => d.armId))
  const pendingReview = db.filter('assets', (a) => ['pending', 'review_required', 'revision_requested'].includes(a.reviewStatus))
  const needsData = decisions.filter((d) => d.decision === 'NEEDS_MORE_DATA')
  const costs = cost.totals()

  return {
    products: {
      total: rows.length,
      byStage: Object.fromEntries(STAGES.map((s) => [s.key, rows.filter((r) => r.stage === s.key).length])),
      compounding: rows.filter((r) => r.stage === 'compounding').length,
      blocked: rows.filter((r) => r.stage !== 'compounding').length,
    },
    experiments: {
      total: experiments.length,
      active: experiments.filter((e) => ['PLANNED', 'GENERATED', 'REVIEW_REQUIRED', 'APPROVED', 'PUBLISHED', 'COLLECTING'].includes(e.status)).length,
      evaluable: evaluable.length,
      awaitingReview: new Set(pendingReview.map((a) => a.experimentId)).size,
      needsMoreData: new Set(needsData.map((d) => d.experimentId)).size,
    },
    winners: {
      count: winnerArmIds.size,
      experimentCount: winnerExperimentIds.size,
      // Only meaningful over evaluable experiments in the same definition and
      // window. Returning null rather than 0 keeps a fresh install from
      // showing "0% yield" as though it had measured something.
      yield: evaluable.length ? winnerExperimentIds.size / evaluable.length : null,
      yieldBasis: `${winnerExperimentIds.size} 個產生 Winner 的實驗 ÷ ${evaluable.length} 個可評估實驗`,
      awaitingClone: [...winnerArmIds].filter((armId) => db.count('mutations', { parentArmId: armId }) === 0).length,
    },
    cost: costs,
    attribution: coverage(),
    incidents: {
      total: db.count('incidents'),
      open: db.filter('incidents', (i) => i.status === 'open').length,
      bySeverity: ['low', 'medium', 'high', 'critical'].reduce((acc, s) => ({ ...acc, [s]: db.count('incidents', { severity: s }) }), {}),
    },
    latency: signalToPublishLatency(),
  }
}

/**
 * Signal → publish latency, per DASHBOARD_SPEC.md §13. Median rather than
 * mean: one manually-entered backfilled signal from three weeks ago would
 * otherwise dominate the average.
 */
export function signalToPublishLatency() {
  const samples = []
  for (const publication of db.filter('publications', (p) => p.status === 'published' && p.publishedAt)) {
    const experiment = db.get('experiments', publication.experimentId)
    const opportunity = experiment?.opportunityId ? db.get('opportunities', experiment.opportunityId) : null
    if (!opportunity) continue
    const signal = opportunity.signalId ? db.get('signals', opportunity.signalId) : null
    const origin = signal?.occurredAt ?? signal?.ingestedAt ?? opportunity.createdAt
    if (!origin) continue
    const hours = (Date.parse(publication.publishedAt) - Date.parse(origin)) / 3_600_000
    if (Number.isFinite(hours) && hours >= 0) {
      samples.push({
        publicationId: publication.id,
        hours: Math.round(hours * 10) / 10,
        stages: {
          signalToOpportunity: signal ? Math.round(((Date.parse(opportunity.createdAt) - Date.parse(origin)) / 3_600_000) * 10) / 10 : null,
          opportunityToExperiment: experiment ? Math.round(((Date.parse(experiment.createdAt) - Date.parse(opportunity.createdAt)) / 3_600_000) * 10) / 10 : null,
          experimentToPublish: experiment ? Math.round(((Date.parse(publication.publishedAt) - Date.parse(experiment.createdAt)) / 3_600_000) * 10) / 10 : null,
        },
      })
    }
  }
  const sorted = samples.map((s) => s.hours).sort((a, b) => a - b)
  return {
    sampleCount: sorted.length,
    medianHours: sorted.length ? sorted[Math.floor(sorted.length / 2)] : null,
    p90Hours: sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.9))] : null,
    fastestHours: sorted[0] ?? null,
    slowestHours: sorted.at(-1) ?? null,
    samples: samples.slice(0, 20),
  }
}
