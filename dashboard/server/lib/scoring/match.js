import { getAxes } from '../kols.js'
import { resolveAxisDemand } from '../topics/classify.js'
import { coverage, containsKeyword } from '../text.js'

/**
 * Match engine — implements docs/09 §3.
 * Every exported function here has a §-numbered counterpart in that document.
 * Change one, change the other.
 */

export const WEIGHTS = {
  personaFit: 0.35,
  pillarFit: 0.3,
  topicHeat: 0.2,
  regionFit: 0.15,
}

const round = (n, d = 1) => Math.round(n * 10 ** d) / 10 ** d

/* ------------------------------------------------------------------ §3.2 */

/**
 * Demand-weighted attainment, not plain cosine similarity: axes the topic
 * needs most dominate the score, and strength on axes the topic does not need
 * earns nothing. Prevents the "generalist looks perfect for everything" bug.
 */
export function personaFit(personaAxes, axisDemand, invalidAxes = new Set()) {
  const { axes } = getAxes()
  let weighted = 0
  let weightSum = 0
  const perAxis = []

  for (const axis of axes) {
    // docs/09 §0 原則二：沒有依據的分數不進計算——整條軸略過，
    // 而不是當成 0（當 0 會變成「這個 KOL 這一軸很差」，那是另一種造假）。
    if (invalidAxes.has(axis.key)) {
      perAxis.push({ key: axis.key, label: axis.label_zh, demand: axisDemand?.[axis.key] ?? 50, have: null, attainment: null, gap: 0, excluded: '缺少 why，未納入計算' })
      continue
    }
    const demand = axisDemand?.[axis.key] ?? 50
    const have = personaAxes?.[axis.key]?.score ?? 0
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
  if (!pillars.length) return { score: 0, pillar: null, bound: false, needsBinding: true, candidates: [] }

  const weights = pillars.map((p) => Number(String(p.weight ?? '').replace('%', '')) || 0)
  const maxWeight = Math.max(...weights, 1)
  const pillarKeywords = kol.affinity?.pillar_keywords ?? {}

  const needleText = [topic.tag?.replace(/^#/, ''), topic.title, ...(topic.keywords ?? [])]
    .filter(Boolean)
    .join(' ')

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

  // An editorially bound hook is marked as such, but its score is still
  // computed. v1 floored it at 70, which let one binding bypass scoring
  // entirely (docs/10 第八刀).
  if (boundPillarName) {
    const bound = candidates.find((c) => c.name === boundPillarName)
    if (bound) return { score: bound.score, pillar: bound.name, bound: true, needsBinding: false, candidates }
  }

  const best = [...candidates].sort((a, b) => b.score - a.score)[0]
  // No overlap with any pillar means the topic has no home on this account.
  // v1 applied a made-up capping curve here; now it is an explicit state.
  if (!best || best.score === 0) {
    return { score: 0, pillar: null, bound: false, needsBinding: true, candidates }
  }
  return { score: best.score, pillar: best.name, bound: false, needsBinding: false, candidates }
}

/* ------------------------------------------------------------------ §3.4 */

/**
 * Region and language fit.
 *
 * This dimension is scored, not merely flagged. In direction (a) — one KOL
 * against a region's topic list — every topic shares a region, so it adds
 * nothing to the ranking. But direction (b) scores ONE topic against ALL KOLs,
 * whose regions and languages differ, and there it is a genuine source of
 * ranking difference. Dropping it would let a KOL who does not publish in that
 * language rank first (docs/10 v0.2 「被 review 推翻的判斷」).
 */
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

/* ------------------------------------------------------------------ §3.5 */

/**
 * Redlines are a gate, not a weighted term. v1 gave risk 10% of the score AND
 * a veto special case — the same thing written twice — plus a three-level
 * severity whose −40 / −20 deductions nobody could justify (docs/10 第二刀).
 *
 * Two states only: `block` keeps it out of the recommendation list, `warn`
 * shows up alongside it without changing the score.
 */
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

  const blocks = []
  const warnings = []

  for (const rule of redlines ?? []) {
    const matched = (rule.keywords ?? []).filter((k) => containsKeyword(hay, k))
    if (!matched.length) continue
    const hit = { rule: rule.rule, severity: rule.severity, keywords: matched }
    if (rule.severity === 'block') blocks.push(hit)
    else warnings.push(hit)
  }

  return { blocked: blocks.length > 0, blocks, warnings, hits: [...blocks, ...warnings] }
}

/* ------------------------------------------------------------------ §3.6 */

export function grade(score, { blocked, needsBinding } = {}) {
  if (blocked) return { key: 'blocked', label: '✕｜否決', action: '紅線命中，不論分數' }
  if (needsBinding) return { key: 'unbound', label: '—｜待綁定', action: '沒有內容支柱對應，需人工綁定支柱後再判' }
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
      grade: grade(0, { blocked: true }),
      missingData: 'topic_affinity.json 不存在，無法計算 Match',
    }
  }

  const invalidAxes = new Set((kol.axisIssues ?? []).map((i) => i.axis))
  const persona = personaFit(affinity.axes, topic.axisDemand, invalidAxes)
  const pillar = pillarFit(kol, topic, topic.boundPillar ?? null)
  const region = regionFit(affinity.reach, context.region ?? topic.region ?? 'GLOBAL', context.language ?? null)
  const risk = riskCheck(affinity.redlines, topic)
  const heat = Number.isFinite(topic.heat) ? topic.heat : 50

  const raw =
    WEIGHTS.personaFit * persona.score +
    WEIGHTS.pillarFit * pillar.score +
    WEIGHTS.topicHeat * heat +
    WEIGHTS.regionFit * region.score

  const score = risk.blocked ? 0 : round(raw)

  return {
    kolId: kol.id,
    kolName: kol.name,
    topicId: topic.id,
    topicTag: topic.tag,
    topicTitle: topic.title,
    domain: topic.domain,
    score,
    blocked: risk.blocked,
    needsBinding: pillar.needsBinding,
    warnings: risk.warnings,
    dataIssues: kol.axisIssues ?? [],
    grade: grade(score, { blocked: risk.blocked, needsBinding: pillar.needsBinding }),
    dimensions: {
      personaFit: { score: persona.score, weight: WEIGHTS.personaFit, perAxis: persona.perAxis, weakest: persona.weakest },
      pillarFit: { score: pillar.score, weight: WEIGHTS.pillarFit, pillar: pillar.pillar, bound: pillar.bound, needsBinding: pillar.needsBinding },
      topicHeat: { score: round(heat), weight: WEIGHTS.topicHeat, parts: topic.heatParts ?? null },
      regionFit: { score: region.score, weight: WEIGHTS.regionFit, detail: region },
    },
    /** Plain-language reason, so the ranking never looks like an oracle. */
    rationale: buildRationale({ persona, pillar, region, risk, heat, score }),
  }
}

function buildRationale({ persona, pillar, region, risk, heat, score }) {
  if (risk.blocked) {
    return `紅線否決：${risk.blocks.map((h) => h.keywords.join('／')).join('；')}`
  }
  const parts = [
    `人設契合 ${persona.score}（最弱：${persona.weakest?.label ?? '—'}，缺口 ${persona.weakest?.gap ?? 0}）`,
    pillar.needsBinding ? '無支柱對應——需人工綁定' : `支柱「${pillar.pillar}」覆蓋 ${pillar.score}${pillar.bound ? '（已綁定）' : ''}`,
    `熱度 ${Math.round(heat)}`,
    `地區契合 ${region.score}`,
  ]
  if (risk.warnings.length) parts.push(`⚠ ${risk.warnings.length} 項紅線警告`)
  return `總分 ${score}｜${parts.join('，')}`
}

/** Promote a KOL's own topic hook into a topic object the match engine accepts. */
export function hookToTopic(hook, { region = null, heat = 50 } = {}) {
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
    // A hook carries no platform heat of its own. v1 used a hand-written
    // `affinity` number here, which meant a human score and an engine score
    // fought each other. Evergreen hooks sit at the neutral midpoint until a
    // real region topic supplies actual heat.
    heat,
    region,
    isHook: true,
    evergreen: hook.evergreen,
    angle: hook.angle,
  }
}
