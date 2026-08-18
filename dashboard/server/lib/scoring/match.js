import { getAxes } from '../kols.js'
import { resolveAxisDemand } from '../topics/classify.js'
import { coverage, containsKeyword } from '../text.js'

/**
 * Match engine — implements docs/09 §3.
 * Every exported function here has a §-numbered counterpart in that document.
 * Change one, change the other.
 */

export const WEIGHTS = {
  personaFit: 0.3,
  pillarFit: 0.25,
  topicHeat: 0.2,
  regionFit: 0.15,
  risk: 0.1,
}

const round = (n, d = 1) => Math.round(n * 10 ** d) / 10 ** d

/* ------------------------------------------------------------------ §3.2 */

/**
 * Demand-weighted attainment, not plain cosine similarity: axes the topic
 * needs most dominate the score, and strength on axes the topic does not need
 * earns nothing. Prevents the "generalist looks perfect for everything" bug.
 */
export function personaFit(personaAxes, axisDemand) {
  const { axes } = getAxes()
  let weighted = 0
  let weightSum = 0
  const perAxis = []

  for (const axis of axes) {
    const demand = axisDemand?.[axis.key] ?? 50
    const have = personaAxes?.[axis.key] ?? 0
    const w = demand / 100
    const attainment = Math.min(have / Math.max(demand, 1), 1)
    weighted += w * attainment
    weightSum += w
    perAxis.push({
      key: axis.key,
      label: axis.label_zh,
      demand,
      have,
      attainment: round(attainment * 100),
      gap: round(Math.max(demand - have, 0)),
    })
  }

  const score = weightSum ? (weighted / weightSum) * 100 : 0
  // The axis that costs the most: highest demand × largest shortfall.
  const weakest = [...perAxis].sort((a, b) => b.gap * b.demand - a.gap * a.demand)[0] ?? null

  return { score: round(score), perAxis, weakest }
}

/* ------------------------------------------------------------------ §3.3 */

export function pillarFit(kol, topic, boundPillarName = null) {
  const pillars = kol.profile?.content?.pillars ?? []
  if (!pillars.length) return { score: 0, pillar: null, bound: false, candidates: [] }

  const weights = pillars.map((p) => Number(String(p.weight ?? '').replace('%', '')) || 0)
  const maxWeight = Math.max(...weights, 1)

  const needleText = [topic.tag?.replace(/^#/, ''), topic.title, ...(topic.keywords ?? [])]
    .filter(Boolean)
    .join(' ')

  const pillarKeywords = kol.affinity?.pillar_keywords ?? {}

  const candidates = pillars.map((p, i) => {
    const hay = [p.name, p.description ?? '', ...(pillarKeywords[p.name] ?? [])].join(' ')
    const cov = coverage(needleText, hay)
    // Declared pillar keywords are precise, so a direct hit counts fully —
    // coverage over a long English description is structurally small and would
    // otherwise drown the signal.
    const keywordHit = (pillarKeywords[p.name] ?? []).some((k) => containsKeyword(needleText, k))
    const normalizedWeight = weights[i] / maxWeight
    const scaled = keywordHit ? Math.max(Math.min(cov * 2.5, 1), 0.7) : Math.min(cov * 2.5, 1)
    return {
      name: p.name,
      weight: p.weight,
      coverage: round(cov * 100),
      keywordHit,
      score: round(scaled * (0.6 + 0.4 * normalizedWeight) * 100),
    }
  })

  if (boundPillarName) {
    const bound = candidates.find((c) => c.name === boundPillarName)
    if (bound) {
      // An explicitly bound hook already passed human judgement — floor it at 70
      // so a keyword miss cannot override an editorial decision.
      return { score: Math.max(bound.score, 70), pillar: bound.name, bound: true, candidates }
    }
  }

  const best = [...candidates].sort((a, b) => b.score - a.score)[0]
  // No overlap with any pillar means the topic has no home on this account —
  // say so rather than naming the highest-weighted pillar with a score of 0.
  if (!best || best.score === 0) return { score: 0, pillar: null, bound: false, candidates }
  return { score: best.score, pillar: best.name, bound: false, candidates }
}

/* ------------------------------------------------------------------ §3.5 */

export function regionFit(reach, topicRegion, topicLanguage) {
  const regions = reach?.regions ?? []
  const kolLanguage = reach?.language ?? null

  let regionOverlap = 0
  const rank = regions.indexOf(topicRegion)
  if (rank >= 0) regionOverlap = Math.max(1 - rank * 0.15, 0.4)
  else if (regions.includes('GLOBAL') || topicRegion === 'GLOBAL') regionOverlap = 0.45

  let languageMatch = 0
  if (kolLanguage && topicLanguage) {
    if (kolLanguage === topicLanguage) languageMatch = 1
    else if (kolLanguage.split('-')[0] === topicLanguage.split('-')[0]) languageMatch = 0.5
  }

  return {
    score: round(60 * regionOverlap + 40 * languageMatch),
    regionOverlap: round(regionOverlap, 2),
    languageMatch,
    kolRegions: regions,
    topicRegion,
  }
}

/* ------------------------------------------------------------------ §3.6 */

const SEVERITY_POINTS = { veto: 100, high: 40, medium: 20 }

export function riskCheck(redlines, topic) {
  const hay = [
    topic.tag,
    topic.title,
    topic.domain,
    ...(topic.keywords ?? []),
    ...(topic.samples ?? []),
  ]
    .filter(Boolean)
    .join(' ')

  const hits = []
  let score = 0
  let blocked = false

  for (const rule of redlines ?? []) {
    const matched = (rule.keywords ?? []).filter((k) => containsKeyword(hay, k))
    if (!matched.length) continue
    hits.push({ rule: rule.rule, severity: rule.severity, keywords: matched })
    if (rule.severity === 'veto') blocked = true
    score += SEVERITY_POINTS[rule.severity] ?? 20
  }

  return { score: Math.min(score, 100), blocked, hits }
}

/* ------------------------------------------------------------------ §3.7 */

export function grade(score, blocked) {
  if (blocked) return { key: 'blocked', label: '✕｜否決', action: '紅線命中，不論分數' }
  if (score >= 80) return { key: 'A', label: 'A｜強配', action: '直接排進製作' }
  if (score >= 65) return { key: 'B', label: 'B｜可做', action: '需要一個明確的切角才開工' }
  if (score >= 50) return { key: 'C', label: 'C｜勉強', action: '缺題時使用，須補足最弱的軸' }
  return { key: 'D', label: 'D｜不建議', action: '換人或換題' }
}

/* ------------------------------------------------------------------ §3.1 */

/**
 * Full match between one KOL and one topic.
 *
 * `topic` may be a region topic (from the topic pipeline) or a KOL topic hook
 * promoted via `hookToTopic`. `context.region` / `context.language` describe
 * where the topic was observed.
 */
export function matchKolToTopic(kol, topic, context = {}) {
  const affinity = kol.affinity
  if (!affinity) {
    return {
      kolId: kol.id,
      topicId: topic.id,
      score: 0,
      blocked: true,
      grade: grade(0, true),
      missingData: 'topic_affinity.json 不存在，無法計算 Match',
    }
  }

  const persona = personaFit(affinity.persona_axes, topic.axisDemand)
  const pillar = pillarFit(kol, topic, topic.boundPillar ?? null)
  const region = regionFit(affinity.reach, context.region ?? topic.region ?? 'GLOBAL', context.language ?? null)
  const risk = riskCheck(affinity.redlines, topic)
  const heat = Number.isFinite(topic.heat) ? topic.heat : 50

  const raw =
    WEIGHTS.personaFit * persona.score +
    WEIGHTS.pillarFit * pillar.score +
    WEIGHTS.topicHeat * heat +
    WEIGHTS.regionFit * region.score +
    WEIGHTS.risk * (100 - risk.score)

  // A topic with no pillar home cannot be an A/B pick however hot it is —
  // cap it at the top of grade C (docs/09 §3.3). The cap is a shallow curve
  // rather than a flat clamp, so capped topics still sort against each other.
  const capped = pillar.score === 0 ? Math.min(raw, 54 + raw * 0.1) : raw
  const score = risk.blocked ? 0 : round(capped)
  const notes = []
  if (pillar.score === 0) notes.push('沒有任何內容支柱對應——已封頂於 C 級。')

  return {
    kolId: kol.id,
    kolName: kol.name,
    topicId: topic.id,
    topicTag: topic.tag,
    topicTitle: topic.title,
    domain: topic.domain,
    score,
    blocked: risk.blocked,
    grade: grade(score, risk.blocked),
    dimensions: {
      personaFit: { score: persona.score, weight: WEIGHTS.personaFit, perAxis: persona.perAxis, weakest: persona.weakest },
      pillarFit: { score: pillar.score, weight: WEIGHTS.pillarFit, pillar: pillar.pillar, bound: pillar.bound },
      topicHeat: { score: round(heat), weight: WEIGHTS.topicHeat, parts: topic.heatParts ?? null },
      regionFit: { score: region.score, weight: WEIGHTS.regionFit, detail: region },
      risk: { score: risk.score, weight: WEIGHTS.risk, blocked: risk.blocked, hits: risk.hits },
    },
    notes,
    /** Plain-language reason, so the ranking never looks like an oracle. */
    rationale: buildRationale({ persona, pillar, region, risk, heat, score }),
  }
}

function buildRationale({ persona, pillar, region, risk, heat, score }) {
  if (risk.blocked) {
    return `紅線否決：${risk.hits.filter((h) => h.severity === 'veto').map((h) => h.keywords.join('／')).join('；')}`
  }
  const parts = []
  parts.push(`人設契合 ${persona.score}（最弱：${persona.weakest?.label ?? '—'}，缺口 ${persona.weakest?.gap ?? 0}）`)
  parts.push(`支柱「${pillar.pillar ?? '無'}」覆蓋 ${pillar.score}${pillar.bound ? '（已綁定）' : ''}`)
  parts.push(`熱度 ${Math.round(heat)}`)
  parts.push(`地區契合 ${region.score}`)
  if (risk.hits.length) parts.push(`風險扣分 ${risk.score}`)
  return `總分 ${score}｜${parts.join('，')}`
}

/** Promote a KOL's own topic hook into a topic object the match engine accepts. */
export function hookToTopic(hook, { region = null, heat = null } = {}) {
  const { demand } = resolveAxisDemand({
    domain: hook.domain,
    title: hook.title,
    tags: hook.keywords,
    samples: [hook.angle].filter(Boolean),
    axis_demand: hook.axis_demand,
  })
  return {
    id: hook.id,
    tag: `#${hook.id}`,
    title: hook.title,
    domain: hook.domain,
    keywords: hook.keywords ?? [],
    samples: [hook.angle].filter(Boolean),
    axisDemand: demand,
    boundPillar: hook.pillar,
    heat: heat ?? hook.affinity ?? 50,
    region,
    isHook: true,
    affinity: hook.affinity,
    evergreen: hook.evergreen,
    angle: hook.angle,
  }
}
