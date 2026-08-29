import { db } from './store.js'
import { listPersonas, getPersona, personaGates } from './personas.js'
import { requireOpportunity } from './opportunities.js'
import { requireProduct, PRODUCT_ROLES } from './products.js'
import { allowedPlatforms } from './policy.js'
import { PLATFORMS } from './platforms.js'

/**
 * Persona Router v1 — FR-P0-04, GHOS-024.
 *
 * "輸出 candidate + reason，不用黑箱總分."
 *
 * The router therefore produces three things per persona and no fourth:
 *   1. hard gates  — pass/fail, each with the sentence that decides it
 *   2. evidence    — the concrete overlaps it found (pillar keyword, hook,
 *                    audience line, prior experiment outcome)
 *   3. cautions    — the reasons a human might still say no
 *
 * It ranks by *count of independent evidence types*, which is a tie-break, not
 * a score, and the UI is required to show the evidence rather than the rank.
 * The existing docs/09 four-axis match engine is deliberately NOT reused here:
 * that scores topic-demand vs persona-supply for content planning, whereas the
 * question here is "may this persona carry this product's claim", which is a
 * gate question.
 */

const tokenise = (text) =>
  String(text ?? '')
    .toLowerCase()
    .split(/[\s,、，。；;：:/|\-—()（）「」『』\[\]#]+/)
    .filter((t) => t.length >= 2)

/** Overlap between an opportunity's language and a persona's declared pillars. */
function pillarEvidence(persona, haystack) {
  const hits = []
  for (const [pillar, keywords] of Object.entries(persona.source.pillarKeywords ?? {})) {
    const matched = (Array.isArray(keywords) ? keywords : []).filter((k) => haystack.includes(String(k).toLowerCase()))
    if (matched.length) hits.push({ pillar, matched })
  }
  return hits
}

function hookEvidence(persona, haystack) {
  return (persona.source.topicHooks ?? [])
    .map((h) => {
      const text = typeof h === 'string' ? h : (h.hook ?? h.text ?? JSON.stringify(h))
      const tokens = tokenise(text)
      const matched = tokens.filter((t) => haystack.includes(t))
      return { hook: text, matched }
    })
    .filter((h) => h.matched.length > 0)
}

/** Past experiments this persona ran for this product, and how they landed. */
function historyEvidence(personaId, productId) {
  const arms = db.filter('arms', (a) => a.personaId === personaId)
  const armIds = new Set(arms.map((a) => a.id))
  const decisions = db.filter('decisions', (d) => armIds.has(d.armId))
  const scoped = arms.filter((a) => {
    const exp = db.get('experiments', a.experimentId)
    return exp && exp.productId === productId
  })
  return {
    experimentsRun: new Set(scoped.map((a) => a.experimentId)).size,
    winners: decisions.filter((d) => d.decision === 'WINNER').length,
    losers: decisions.filter((d) => d.decision === 'LOSER').length,
    inconclusive: decisions.filter((d) => d.decision === 'INCONCLUSIVE').length,
    // No win-rate percentage until there is a meaningful denominator; a 1/1
    // rendered as "100%" is the exact overfitting DASHBOARD_SPEC §7 warns about.
    sampleSufficient: decisions.length >= 5,
  }
}

/**
 * Which platforms this pairing could actually run on: the intersection of what
 * the product allows, what the persona is assigned, and what the format needs.
 */
function platformOptions(persona, product) {
  const productAllowed = new Set(allowedPlatforms(product))
  const assigned = persona.overlay?.platformRoles ?? {}
  const assignedIds = Object.keys(assigned)
  const candidates = assignedIds.length ? assignedIds : [...productAllowed]

  return candidates
    .filter((p) => productAllowed.has(p))
    .map((p) => ({
      platform: p,
      label: PLATFORMS[p]?.label ?? p,
      role: assigned[p] ?? null,
      assigned: Boolean(assigned[p]),
      automation: PLATFORMS[p]?.automation ?? 'manual_only',
      note: assigned[p] ? null : '此人設尚未指派此平台角色；先設定 overlay 再排程發布。',
    }))
}

export function route(opportunityId, { limit = 8, includeBlocked = true } = {}) {
  const opportunity = requireOpportunity(opportunityId)
  const product = requireProduct(opportunity.productId)
  const analysis = product.analysis ?? null

  const haystack = [
    opportunity.topic,
    opportunity.whyNow,
    opportunity.tension,
    opportunity.productRelevance,
    ...(opportunity.competingViewpoints ?? []),
  ]
    .join(' ')
    .toLowerCase()

  const claimDomains = [...new Set([...(opportunity.claimDomains ?? []), ...((analysis?.claimSurface?.domains ?? []).map((d) => d.domain))])]

  // `full` — the router reads topic hooks and red-line prose, which the list
  // projection drops.
  const candidates = listPersonas(product.id, { full: true }).map((persona) => {
    const gates = personaGates(persona, { product, claimDomains })
    const pillars = pillarEvidence(persona, haystack)
    const hooks = hookEvidence(persona, haystack)
    const history = historyEvidence(persona.id, product.id)
    const platforms = platformOptions(persona, product)

    const audience = (persona.overlay?.audienceHypotheses ?? [])
      .concat(persona.source.homophily?.audience_identity ? [persona.source.homophily.audience_identity] : [])
    const audienceOverlap = (product.targetAudience ?? []).flatMap((a) => {
      const tokens = tokenise(a)
      return audience.filter((h) => tokens.some((t) => String(h).toLowerCase().includes(t))).map((h) => ({ productAudience: a, personaAudience: h }))
    })

    const evidence = []
    if (pillars.length) evidence.push({ type: 'content_pillar', detail: pillars, says: `題目命中人設內容支柱：${pillars.map((p) => p.pillar).join('、')}` })
    if (hooks.length) evidence.push({ type: 'topic_hook', detail: hooks.slice(0, 3), says: `已登記的 topic hook 與此題重疊 ${hooks.length} 條` })
    if (audienceOverlap.length) evidence.push({ type: 'audience', detail: audienceOverlap, says: '人設受眾與產品目標受眾有明確交集' })
    if (history.experimentsRun > 0) {
      evidence.push({
        type: 'prior_experiment',
        detail: history,
        says: history.sampleSufficient
          ? `此人設在本產品跑過 ${history.experimentsRun} 個實驗（Winner ${history.winners}）`
          : `此人設在本產品跑過 ${history.experimentsRun} 個實驗，樣本仍不足以推論`,
      })
    }

    const cautions = []
    if (persona.source.credibilityRisk) cautions.push({ type: 'credibility_risk', says: persona.source.credibilityRisk })
    for (const rl of persona.source.redlines ?? []) {
      const text = typeof rl === 'string' ? rl : (rl.rule ?? rl.text ?? JSON.stringify(rl))
      if (tokenise(text).some((t) => haystack.includes(t))) {
        cautions.push({ type: 'persona_redline', says: `人設紅線可能觸及此題：${text}` })
      }
    }
    for (const flag of opportunity.riskFlags ?? []) {
      if (flag === 'regulated_domain' && persona.source.credibilityMode === 'embodied') {
        cautions.push({
          type: 'credibility_mismatch',
          says: '題目屬受監管領域，但此人設的可信度來自親身經歷——AI 人設無法背書這類主張。改用 database／hybrid 型人設，或把內容改寫成不依賴親身經驗的形式。',
        })
      }
    }
    if (!persona.hasProductOverlay) {
      cautions.push({ type: 'no_product_overlay', says: '尚未為此產品設定 persona overlay（產品角色、允許／禁止宣稱皆未定義）。' })
    }
    if (!platforms.some((p) => p.assigned)) {
      cautions.push({ type: 'no_platform_role', says: '尚未指派平台角色，發布前必須先補。' })
    }

    const roleSuggestion = suggestRole(persona, analysis)

    return {
      personaId: persona.id,
      name: persona.name,
      handle: persona.handle,
      avatar: persona.avatar,
      credibilityMode: persona.source.credibilityMode,
      eligible: gates.passed,
      gates: gates.gates,
      failedGates: gates.failed,
      evidence,
      // The tie-break, named as what it is.
      evidenceTypes: evidence.length,
      cautions,
      platforms,
      suggestedProductRole: roleSuggestion,
      overlay: persona.overlay,
    }
  })

  const ranked = candidates
    .filter((c) => includeBlocked || c.eligible)
    .sort((a, b) => {
      if (a.eligible !== b.eligible) return a.eligible ? -1 : 1
      if (b.evidenceTypes !== a.evidenceTypes) return b.evidenceTypes - a.evidenceTypes
      return a.cautions.length - b.cautions.length
    })

  return {
    opportunityId,
    productId: product.id,
    claimDomains,
    candidates: ranked.slice(0, limit),
    blockedCount: candidates.filter((c) => !c.eligible).length,
    method: {
      version: '1.0.0',
      says: '本排序只依「獨立證據種類數」與「注意事項數」做 tie-break，不是配對分數。請依 evidence 與 cautions 自行判斷，不要照名次選人。',
    },
  }
}

/** Which product role this persona is best placed to play, with the reason. */
function suggestRole(persona, analysis) {
  const declared = persona.overlay?.productRole
  if (declared) return { role: declared, because: '已在 persona overlay 明確指定。', source: 'overlay' }

  const plausible = (analysis?.productRoles ?? []).filter((r) => r.plausible)
  const mode = persona.source.credibilityMode
  // Keyed on the real `credibility_mode` enum (kols/topic-affinity.schema.json).
  // A database-type persona earns attention by laying out verifiable material,
  // so it belongs where the product *is* the evidence; an embodied one earns it
  // by being somewhere, so it belongs where the product is a place or a habit.
  const preference = {
    database: ['proof_source', 'answer_to_debate', 'utility'],
    hybrid: ['answer_to_debate', 'proof_source', 'utility', 'destination'],
    embodied: ['destination', 'challenge', 'utility', 'next_action'],
  }[mode] ?? ['next_action']

  const pick = preference.find((r) => plausible.some((p) => p.role === r))
  return pick
    ? { role: pick, because: `人設 credibility_mode=${mode}，而產品分析認為此角色可行：${PRODUCT_ROLES[pick].hint}`, source: 'derived' }
    : { role: null, because: '產品分析未提供可行的角色，或人設可信度模式與所有可行角色不合。', source: 'none' }
}
