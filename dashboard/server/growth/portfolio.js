import { db } from './store.js'
import * as cost from './cost.js'
import * as telemetry from './telemetry.js'
import { coverage } from './conversions.js'
import { getPersona } from './personas.js'
import { PLATFORMS } from './platforms.js'

/**
 * Acquisition Portfolio / AI Traffic Trader — FR-P0-10, GHOS-047 / 068.
 *
 * Content as a portfolio: every Persona, Topic, Platform and Experiment family
 * gets the same five columns — cost, qualified traffic, conversions,
 * attributed value, and the unit economics that fall out of them.
 *
 * The recommendation is a *recommendation*. SYSTEM_ARCHITECTURE.md §3.16 is
 * explicit that P0 does not do autonomous spend, and DASHBOARD_SPEC.md §10
 * repeats it. So `recommend()` returns a state and the sentence behind it, and
 * nothing in this file writes to a budget.
 */

export const RECOMMENDATIONS = ['SCALE_CANDIDATE', 'HOLD', 'REDUCE', 'STOP', 'RETEST']

const round = (n, d = 4) => (n == null || !Number.isFinite(n) ? null : Math.round(n * 10 ** d) / 10 ** d)

/** The economics of one bucket of arms. */
function economicsFor(armIds, { label, dimension, key }) {
  const arms = [...armIds].map((id) => db.get('arms', id)).filter(Boolean)
  const pubIds = new Set(db.filter('publications', (p) => armIds.has(p.armId)).map((p) => p.id))

  const metrics = {}
  for (const arm of arms) {
    for (const [k, v] of Object.entries(telemetry.armMetrics(arm.id))) metrics[k] = (metrics[k] ?? 0) + v
  }

  const attributions = db.filter('attributions', (a) => armIds.has(a.armId))
  const costs = db.filter('costs', (c) => armIds.has(c.armId))
  const totalCostUsd = round(costs.reduce((a, c) => a + (Number(c.amount) || 0), 0), 4)
  const totalCredits = round(costs.reduce((a, c) => a + (Number(c.credits) || 0), 0), 2)
  const attributedValue = round(attributions.reduce((a, r) => a + (Number(r.attributedValue) || 0), 0), 2)

  const impressions = metrics.impressions ?? metrics.views ?? 0
  const clicks = metrics.clicks ?? 0
  const conversions = attributions.filter((a) => a.evidenceType !== 'unknown').length

  const experimentIds = new Set(arms.map((a) => a.experimentId))
  const decisions = db.filter('decisions', (d) => armIds.has(d.armId))
  const winners = decisions.filter((d) => d.decision === 'WINNER').length
  const losers = decisions.filter((d) => d.decision === 'LOSER').length

  return {
    key,
    label,
    dimension,
    armCount: arms.length,
    experimentCount: experimentIds.size,
    publicationCount: pubIds.size,
    impressions,
    clicks,
    conversions,
    winners,
    losers,
    attributedValueUsd: attributedValue,
    totalCostUsd,
    totalCredits,
    // Derived rates. Every one of them is null rather than 0 when its
    // denominator is missing — a 0% CTR and "no impressions reported yet" are
    // different facts and must not render the same.
    ctr: impressions ? round(clicks / impressions) : null,
    conversionRate: clicks ? round(conversions / clicks) : null,
    costPerClick: clicks ? round(totalCostUsd / clicks) : null,
    costPerConversion: conversions ? round(totalCostUsd / conversions) : null,
    valuePerConversion: conversions ? round(attributedValue / conversions) : null,
    contributionUsd: round(attributedValue - totalCostUsd, 2),
    roas: totalCostUsd > 0 ? round(attributedValue / totalCostUsd) : null,
    valuePer1kImpressions: impressions ? round((attributedValue / impressions) * 1000, 4) : null,
    sampleSufficient: conversions >= 20 && experimentIds.size >= 2,
  }
}

/**
 * SCALE / HOLD / REDUCE / STOP / RETEST — with the sentence that produced it.
 *
 * The first branch matters most: without enough evidence the answer is RETEST,
 * never SCALE. DASHBOARD_SPEC.md §7 warns specifically against promoting a
 * persona on one hit.
 */
export function recommend(row) {
  if (row.experimentCount === 0) {
    return { state: 'RETEST', because: '尚未跑過任何實驗，沒有可依據的資料。' }
  }
  if (!row.sampleSufficient) {
    return {
      state: 'RETEST',
      because: `樣本不足（${row.conversions} 筆歸因轉換、${row.experimentCount} 個實驗）。在達到至少 20 筆轉換且 2 個實驗前，任何加碼或砍掉的決定都只是對雜訊反應。`,
    }
  }
  if (row.conversions === 0 && row.impressions > 0) {
    return { state: 'STOP', because: `有 ${row.impressions.toLocaleString()} 次曝光但 0 筆歸因轉換——這是典型的 vanity metric，不值得繼續投入產能。` }
  }
  if (row.contributionUsd != null && row.contributionUsd < 0) {
    return { state: 'REDUCE', because: `歸因價值 $${row.attributedValueUsd} 低於成本 $${row.totalCostUsd}，貢獻為負 $${Math.abs(row.contributionUsd)}。` }
  }
  if (row.winners > 0 && row.roas != null && row.roas >= 2) {
    return { state: 'SCALE_CANDIDATE', because: `有 ${row.winners} 個 Winner，歸因價值為成本的 ${row.roas} 倍。建議加產能——但仍需人工確認品牌與合規面。` }
  }
  // A zero recorded cost makes ROAS undefined, not infinite. That happens for
  // real (the template adapter is free) and it happens when cost simply was
  // not booked — and those need different answers, so neither is allowed to
  // masquerade as a great return.
  if (row.winners > 0 && row.totalCostUsd === 0) {
    return {
      state: 'HOLD',
      because: `有 ${row.winners} 個 Winner 且貢獻為正 $${row.attributedValueUsd}，但成本記錄為 0 元，ROAS 無定義。先確認成本是否漏登（外部生成的素材需手動登錄成本），再談加碼。`,
    }
  }
  return { state: 'HOLD', because: `表現在可接受範圍（ROAS ${row.roas ?? '無定義'}），但沒有明確優於其他組合的證據，維持現有配置。` }
}

const withRecommendation = (row) => ({ ...row, recommendation: recommend(row) })

/* ------------------------------------------------------------ breakdowns */

export function byPersona(productId = null) {
  const arms = db.filter('arms', (a) => !productId || a.productId === productId)
  const grouped = new Map()
  for (const arm of arms) {
    if (!grouped.has(arm.personaId)) grouped.set(arm.personaId, new Set())
    grouped.get(arm.personaId).add(arm.id)
  }
  return [...grouped.entries()]
    .map(([personaId, armIds]) => {
      const persona = getPersona(personaId, productId)
      const row = economicsFor(armIds, { label: persona?.name ?? personaId, dimension: 'persona', key: personaId })
      return withRecommendation({
        ...row,
        avatar: persona?.avatar ?? null,
        credibilityMode: persona?.source?.credibilityMode ?? null,
        incidents: db.count('incidents', { personaId }),
      })
    })
    .sort((a, b) => (b.contributionUsd ?? -Infinity) - (a.contributionUsd ?? -Infinity))
}

export function byPlatform(productId = null) {
  const arms = db.filter('arms', (a) => !productId || a.productId === productId)
  const grouped = new Map()
  for (const arm of arms) {
    if (!grouped.has(arm.platform)) grouped.set(arm.platform, new Set())
    grouped.get(arm.platform).add(arm.id)
  }
  return [...grouped.entries()]
    .map(([platform, armIds]) =>
      withRecommendation(economicsFor(armIds, { label: PLATFORMS[platform]?.label ?? platform, dimension: 'platform', key: platform })),
    )
    .sort((a, b) => (b.contributionUsd ?? -Infinity) - (a.contributionUsd ?? -Infinity))
}

/** Topic = the opportunity an experiment came from. */
export function byTopic(productId = null) {
  const experiments = db.filter('experiments', (e) => !productId || e.productId === productId)
  const grouped = new Map()
  for (const exp of experiments) {
    const opportunity = exp.opportunityId ? db.get('opportunities', exp.opportunityId) : null
    const key = opportunity?.id ?? 'no_opportunity'
    const label = opportunity?.topic ?? '（未綁定 Opportunity）'
    if (!grouped.has(key)) grouped.set(key, { label, armIds: new Set() })
    for (const arm of db.listAsc('arms', { experimentId: exp.id })) grouped.get(key).armIds.add(arm.id)
  }
  return [...grouped.entries()]
    .map(([key, { label, armIds }]) => withRecommendation(economicsFor(armIds, { label, dimension: 'topic', key })))
    .sort((a, b) => (b.contributionUsd ?? -Infinity) - (a.contributionUsd ?? -Infinity))
}

/**
 * A family is a root arm plus everything cloned from it. This is the view
 * that answers "is the Winner still winning after three generations, or is it
 * fatiguing?"
 */
export function byExperimentFamily(productId = null) {
  const arms = db.filter('arms', (a) => !productId || a.productId === productId)
  const byId = Object.fromEntries(arms.map((a) => [a.id, a]))
  const rootOf = (arm, depth = 0) => {
    if (!arm.parentArmId || depth > 20 || !byId[arm.parentArmId]) return arm
    return rootOf(byId[arm.parentArmId], depth + 1)
  }
  const grouped = new Map()
  for (const arm of arms) {
    const root = rootOf(arm)
    if (!grouped.has(root.id)) grouped.set(root.id, { root, armIds: new Set() })
    grouped.get(root.id).armIds.add(arm.id)
  }
  return [...grouped.entries()]
    .map(([key, { root, armIds }]) => {
      const row = economicsFor(armIds, { label: `${root.label}｜${root.hook.slice(0, 30)}`, dimension: 'family', key })
      const generations = [...armIds].map((id) => generationOf(byId[id], byId)).reduce((a, b) => Math.max(a, b), 0)
      return withRecommendation({ ...row, rootArmId: root.id, generations, fatigue: fatigueOf([...armIds], byId) })
    })
    .sort((a, b) => (b.contributionUsd ?? -Infinity) - (a.contributionUsd ?? -Infinity))
}

const generationOf = (arm, byId, depth = 0) =>
  !arm?.parentArmId || depth > 20 || !byId[arm.parentArmId] ? depth : generationOf(byId[arm.parentArmId], byId, depth + 1)

/**
 * Fatigue: are later generations converting worse than earlier ones? Reported
 * only with enough generations to mean anything.
 */
function fatigueOf(armIds, byId) {
  const gens = new Map()
  for (const id of armIds) {
    const g = generationOf(byId[id], byId)
    const attributions = db.filter('attributions', (a) => a.armId === id).filter((a) => a.evidenceType !== 'unknown')
    const clicks = telemetry.armMetrics(id).clicks ?? 0
    const bucket = gens.get(g) ?? { conversions: 0, clicks: 0 }
    bucket.conversions += attributions.length
    bucket.clicks += clicks
    gens.set(g, bucket)
  }
  const ordered = [...gens.entries()].sort((a, b) => a[0] - b[0]).map(([g, v]) => ({ generation: g, rate: v.clicks ? v.conversions / v.clicks : null, clicks: v.clicks }))
  const usable = ordered.filter((o) => o.rate != null && o.clicks >= 100)
  if (usable.length < 2) return { detected: false, says: '世代數或樣本不足，尚無法判斷疲乏。', series: ordered }
  const declining = usable.at(-1).rate < usable[0].rate * 0.8
  return {
    detected: declining,
    says: declining
      ? `最新世代轉換率 ${(usable.at(-1).rate * 100).toFixed(2)}% 已低於第一代 ${(usable[0].rate * 100).toFixed(2)}% 的 80%——這一支可能已疲乏。`
      : '各世代轉換率沒有明顯下降。',
    series: ordered,
  }
}

/** Product-level roll-up for the Command Center. */
export function productSummary(productId) {
  const arms = new Set(db.filter('arms', (a) => a.productId === productId).map((a) => a.id))
  const row = economicsFor(arms, { label: 'product', dimension: 'product', key: productId })
  return {
    ...row,
    cost: cost.totals({ productId }),
    attribution: coverage({ productId }),
    recommendation: recommend(row),
  }
}
