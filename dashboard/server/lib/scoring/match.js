import { getAxes } from '../kols.js'
import { resolveAxisDemand } from '../topics/classify.js'
import { coverage, containsKeyword } from '../text.js'
import { validate, credibilityModeGate, fitGate, redlineGateFor, toBand, getConfig } from './gates.js'
import { withNote } from './notes.js'

/**
 * Match engine — implements docs/11 §2 (supersedes docs/09 §3).
 *
 * The single most important change from v1: there is no weighted total that
 * mixes gates with scores. v1 computed
 *
 *     score = 0.35·personaFit + 0.30·pillarFit + 0.20·topicHeat + 0.15·regionFit
 *
 * and those weights were invented. Worse than invented — the shape was wrong:
 * a linear compensatory model lets topic heat buy persona fit, which both
 * Mandler (1982) and Zuckerman (1999) rule out. Congruence that fails is not
 * congruence that scores low.
 *
 * Now: validate → gates → a three-dimension equal-weight screening score →
 * timing shown alongside, never inside.
 */

/**
 * Equal weights. This is not neutrality and we do not pretend it is — it
 * assumes the three matter equally for ranking, which is itself a strong claim.
 * It is chosen because we have zero outcome data, so any other split would just
 * be 0.35 renamed to 0.4. Equal weighting at least states something true: we do
 * not know which dimension matters more.
 *
 * The mitigation for its weakness is in the UI, not the arithmetic — the total
 * is shown as a band and the three bars sit next to it, so a short leg stays
 * visible instead of being averaged away.
 */
export const DIMENSIONS = ['fit', 'pillar', 'homophily']

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
    const hits = (pillarKeywords[p.name] ?? []).filter((k) => containsKeyword(needleText, k))
    const keywordHit = hits.length > 0
    const normalizedWeight = weights[i] / maxWeight
    // docs/11 §2.6 M2 — v1 floored a keyword hit at 0.7, which meant the wider
    // your keyword list, the better you scored. That rewards exactly what
    // Zuckerman (1999) says gets punished: a blurred category boundary. One
    // generic word like 「离职」 was enough to put a workplace-feelings topic
    // into "workable" on a mountain guide's account.
    // Hits now add on top of real coverage instead of replacing it.
    const scaled = Math.min(cov * 2.5 + Math.min(hits.length, 3) * 0.08, 1)
    return {
      name: p.name,
      weight: p.weight,
      coverage: round(cov * 100),
      keywordHit,
      keywordHits: hits,
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

/* ------------------------------------------------- docs/11 §2.4 · homophily */

/**
 * Similarity between the KOL and the intended audience.
 *
 * New in the rewrite, and the single biggest gap the literature review found:
 * Lou & Yuan (2019) identify four antecedents of follower trust — information
 * value, trustworthiness, attractiveness, and SIMILARITY — and the previous
 * four axes had no representation of the last one at all.
 *
 * Deliberately has no floor. Lou & Yuan establish it as an antecedent; nothing
 * establishes a line below which it fails. Inventing one would break §0 rule 2,
 * so a low score is surfaced loudly instead of vetoing.
 */
export function homophilyFit(kol, topic) {
  const h = kol.affinity?.homophily
  if (!h) {
    return { score: null, missing: true, reason: 'topic_affinity.json 尚未宣告 homophily——這一維無法計算，不計入平均。' }
  }

  // Lou & Yuan measure similarity as a property of the KOL–audience
  // relationship, not of a topic. So the base is declared per KOL and carries a
  // `why`, under the same discipline as the axes: a number nobody can justify
  // does not enter the calculation.
  const base = Number(h.score)
  if (!Number.isFinite(base) || String(h.why ?? '').trim().length < 10) {
    return {
      score: null,
      missing: true,
      reason: 'homophily.score 缺失，或 why 短於 10 字——依 docs/09 §0 原則二，這個分數視為未定義，不計入平均。',
    }
  }

  // The topic then modulates it: a topic that lands inside the audience's own
  // situation reads as "one of us talking about our thing"; one that does not
  // still carries the account's baseline similarity, just without the lift.
  const needle = [topic.tag?.replace(/^#/, ''), topic.title, ...(topic.keywords ?? []), ...(topic.samples ?? [])]
    .filter(Boolean)
    .join(' ')

  const facets = [
    { key: 'audience_identity', label: '受眾身分', text: h.audience_identity },
    { key: 'shared_situation', label: '共同處境', text: h.shared_situation },
    { key: 'language_register', label: '語域', text: h.language_register },
  ].map((f) => ({ ...f, overlap: f.text ? round(Math.min(coverage(needle, f.text) * 2.5, 1) * 100) : null }))

  const overlaps = facets.filter((f) => Number.isFinite(f.overlap)).map((f) => f.overlap)
  const topicResonance = overlaps.length ? round(overlaps.reduce((a, b) => a + b, 0) / overlaps.length) : 0

  // Bounded lift, so the declared base stays the dominant term and a lucky
  // word match cannot manufacture similarity.
  const score = round(Math.min(base + topicResonance * 0.2, 100))

  return {
    score,
    missing: false,
    base,
    why: h.why,
    topicResonance,
    perFacet: facets,
    weakest: [...facets].filter((f) => Number.isFinite(f.overlap)).sort((a, b) => a.overlap - b.overlap)[0] ?? null,
    explain: `帳號層的相似性 ${base}（宣告值），這個題目與受眾處境的重疊 ${topicResonance} → 加權後 ${score}。`,
  }
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

/* ------------------------------------------------------ docs/11 §2.1 · 主流程 */

const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null)

/**
 * Full evaluation of one KOL against one topic.
 *
 * Returns a shape with no single headline number. `screeningScore` is null —
 * not 0 — whenever the gates did not clear, because 0 reads as "scored badly"
 * when the truth is "never scored".
 */
export function matchKolToTopic(kol, topic, context = {}) {
  const cfg = getConfig()

  /* 階段 0 — validation. Not a gate: nothing is scored, the user is sent back. */
  const validation = validate(kol, topic)
  if (!validation.passed) {
    return {
      kolId: kol.id,
      kolName: kol.name,
      topicId: topic.id,
      topicTag: topic.tag,
      topicTitle: topic.title,
      domain: topic.domain,
      validation,
      gates: null,
      band: toBand(null),
      screeningScore: null,
      dimensions: null,
      timing: buildTiming(topic),
      decision: { key: 'needs_input', label: '待補資料', detail: validation.problems.map((p) => p.message).join('；') },
      experimental: {},
    }
  }

  /* 階段 1 — gates. None of these can be bought by another dimension. */
  const invalidAxes = new Set((kol.axisIssues ?? []).map((i) => i.axis))
  const persona = personaFit(kol.affinity?.axes, topic.axisDemand, invalidAxes)
  const pillar = pillarFit(kol, topic, topic.boundPillar ?? null)
  const homophily = homophilyFit(kol, topic)

  const g1 = redlineGateFor(kol, topic)
  const g2 = credibilityModeGate(kol, topic)
  const g3 = fitGate(persona.score)

  const gateList = [g1, g2, g3]
  const failed = gateList.filter((g) => g.veto)
  const undecided = gateList.filter((g) => g.undecided)

  // A topic with no pillar to live on is a binding decision for a human, not a
  // veto — Zuckerman says an unclear category is discounted, not forbidden.
  const needsBinding = pillar.needsBinding

  if (failed.length) {
    return {
      kolId: kol.id,
      kolName: kol.name,
      topicId: topic.id,
      topicTag: topic.tag,
      topicTitle: topic.title,
      domain: topic.domain,
      validation,
      gates: { passed: false, failed: failed.map((g) => g.key), undecided: undecided.map((g) => g.key), detail: gateList },
      band: toBand(null),
      screeningScore: null,
      dimensions: null,
      gateDimensions: { credibilityMode: withNote('credibilityMode', g2) },
      timing: buildTiming(topic),
      warnings: g1.warnings ?? [],
      needsReview: [...(g1.lintHits ?? []), ...undecided],
      decision: {
        key: 'veto',
        label: '否決',
        detail: failed.map((g) => g.reason).filter(Boolean).join('；') || '未通過 gate',
      },
      /** docs/11 §2.4 — G3 vetoes must be logged, or the floor can never be calibrated. */
      shouldLogVeto: Boolean(g3.logVeto),
      vetoRecord: g3.logVeto ? { kolId: kol.id, topicId: topic.id, fit: persona.score, gatesFailed: failed.map((g) => g.key) } : null,
      experimental: {},
    }
  }

  /* 階段 2 — screening score. Equal weight, three dimensions, heat excluded. */
  const parts = [persona.score, pillar.score, homophily.score].filter((v) => Number.isFinite(v))
  const screeningScore = round(mean(parts) ?? 0)
  const experimentBand = Boolean(g3.experimentBand)

  const dimensions = {
    fit: withNote('fit', { score: persona.score, perAxis: persona.perAxis, weakest: persona.weakest, band: g3.band }),
    pillar: withNote('pillar', {
      score: pillar.score,
      pillar: pillar.pillar,
      bound: pillar.bound,
      needsBinding,
      candidates: pillar.candidates,
    }),
    homophily: withNote('homophily', homophily),
  }

  // The short leg, stated rather than averaged away — the answer to both
  // reviewers' point that mean() is still a compensatory model.
  const shortest = Object.entries(dimensions)
    .filter(([, d]) => Number.isFinite(d.score))
    .sort((a, b) => a[1].score - b[1].score)[0]

  return {
    kolId: kol.id,
    kolName: kol.name,
    topicId: topic.id,
    topicTag: topic.tag,
    topicTitle: topic.title,
    domain: topic.domain,
    validation,
    gates: { passed: true, failed: [], undecided: undecided.map((g) => g.key), detail: gateList },
    band: toBand(screeningScore, { experimentBand }),
    screeningScore,
    experimentBand,
    dimensions,
    gateDimensions: { credibilityMode: withNote('credibilityMode', g2) },
    timing: buildTiming(topic),
    weakestDimension: shortest ? { key: shortest[0], label: shortest[1].note?.label ?? shortest[0], score: shortest[1].score } : null,
    needsBinding,
    warnings: g1.warnings ?? [],
    needsReview: [...(g1.lintHits ?? []), ...undecided],
    standingChecks: g1.standing ?? [],
    dataIssues: kol.axisIssues ?? [],
    decision: needsBinding
      ? { key: 'unbound', label: '待綁定支柱', detail: '這個話題在該帳號上沒有內容支柱可以歸屬，先決定它屬於哪一根支柱再判。' }
      : experimentBand
        ? { key: 'experiment', label: '實驗帶，可做', detail: g3.reason }
        : { key: 'go', label: '可做', detail: `分帶 ${toBand(screeningScore).label}，最短板是「${shortest?.[1]?.note?.label ?? '—'}」。` },
    rationale: buildRationale({ persona, pillar, homophily, g1, screeningScore, experimentBand, shortest }),
    /** Zone B is physically absent from the main path (docs/11 §1.1). */
    experimental: {},
    equalWeightNotice: cfg.dimensions.note,
  }
}

/**
 * docs/11 §2.8 — timing sits beside the decision, never inside it.
 * It is not part of the score and not a gate.
 */
function buildTiming(topic) {
  const value = Number.isFinite(topic.heat) ? round(topic.heat) : null

  return {
    value,
    label: '樣本共現密度',
    /**
     * docs/14 §7A — a null value means "this topic never came from a sampled
     * fetch", which is a different statement from "its density is low". The two
     * used to collapse together because the topic builders defaulted heat to
     * 50; now they don't, so the distinction has to survive to the screen.
     */
    applicable: value !== null,
    confidence: topic.heatConfidence ?? 'none',
    discriminates: topic.heatDiscriminates ?? null,
    parts: topic.heatParts ?? null,
    normalizedWithin: topic.normalizedWithin ?? null,
    caveat:
      value === null
        ? (topic.timingCaveat
          ?? '這個題目沒有樣本共現密度資料——它不是從地區話題抓取來的。這一欄不適用，不是「低」。')
        : (topic.heatCaveat
          ?? '這不是平台熱度。它說的是：在我們用種子詞抓到的樣本裡，有幾個不同帳號用了這個標籤。沒有歷史快照就無法判定升溫。'),
    note: withNote('timing', {}).note,
  }
}

function buildRationale({ persona, pillar, homophily, g1, screeningScore, experimentBand, shortest }) {
  const parts = [
    `人設契合 ${persona.score}（最弱的軸：${persona.weakest?.label ?? '—'}）`,
    pillar.needsBinding ? '無支柱對應——需人工綁定' : `支柱「${pillar.pillar}」${pillar.score}`,
    homophily.missing ? '相似性未設定' : `相似性 ${homophily.score}`,
  ]
  if (experimentBand) parts.push('落在底線附近，標為實驗帶')
  if (g1.warnings?.length) parts.push(`⚠ ${g1.warnings.length} 項紅線警示`)
  if (shortest) parts.push(`最短板：${shortest[1].note?.label ?? shortest[0]}`)
  return `篩選分 ${screeningScore}｜${parts.join('，')}`
}

/**
 * Promote a KOL's own topic hook into a topic object the match engine accepts.
 *
 * docs/14 §7A — `heat` used to default to 50 here. A hook is a topic the KOL
 * declared; it has no platform sample behind it at all, so 50 was not a neutral
 * reading, it was a fabricated one rendered as a measurement. Null is the
 * honest value and `buildTiming()` already renders it as "not applicable".
 */
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
