import { listKols, getKol } from './kols.js'
import { getRegionTopics, makeAdHocTopic, PLATFORMS } from './topics/index.js'
import { matchKolToTopic, hookToTopic } from './scoring/match.js'
import { buildPreEvaluation } from './scoring/evaluation.js'
import { getAxes } from './kols.js'

/**
 * The three workflow directions of docs/09 §6. All three share one match
 * engine — the difference is only what is held fixed and what is ranked.
 */

const languageOf = (region) => getAxes().regions.find((r) => r.key === region)?.language ?? null

/* ---------------------------------------------------- (a) KOL → 話題 */

export async function kolToTopics(kolId, { region = 'GLOBAL', platforms = PLATFORMS, limit = 10, includeHooks = true } = {}) {
  const kol = getKol(kolId)
  if (!kol) throw Object.assign(new Error(`unknown KOL "${kolId}"`), { status: 404 })

  const topicSet = await getRegionTopics(region, { platforms, limit })
  const context = { region, language: languageOf(region) }

  const ranked = topicSet.topics
    .map((topic) => ({ topic, match: matchKolToTopic(kol, topic, context) }))
    .sort((a, b) => (b.match.screeningScore ?? -1) - (a.match.screeningScore ?? -1))

  // docs/11 §2.1 — "excluded" now means a gate refused it, not a low score.
  const recommended = ranked.filter((r) => r.match.gates?.passed)
  const excluded = ranked.filter((r) => !r.match.gates?.passed)

  // The KOL's own evergreen hooks, scored on the same scale — they are the
  // fallback when nothing in this week's trending set fits.
  const hooks = includeHooks
    ? (kol.affinity?.topic_hooks ?? [])
        .map((hook) => {
          const topic = hookToTopic(hook, { region })
          return { topic, hook, match: matchKolToTopic(kol, topic, context) }
        })
        .sort((a, b) => (b.match.screeningScore ?? -1) - (a.match.screeningScore ?? -1))
    : []

  return {
    direction: 'kol_to_topics',
    kol: { id: kol.id, name: kol.name, handle: kol.handle },
    region,
    source: topicSet.source,
    fetchedAt: topicSet.fetchedAt,
    recommended,
    excluded,
    hooks,
  }
}

/* ---------------------------------------------------- (b) 話題 → KOL */

export async function topicToKols(topicRef, { region = 'GLOBAL', platforms = PLATFORMS } = {}) {
  let topic
  if (topicRef.topicId) {
    const set = await getRegionTopics(region, { platforms, limit: 1000 })
    topic = set.allTopics.find((t) => t.id === topicRef.topicId || t.tag.toLowerCase() === String(topicRef.topicId).toLowerCase())
  }
  if (!topic) topic = makeAdHocTopic(topicRef)

  const context = { region, language: languageOf(region) }
  const ranked = listKols()
    .map((kol) => ({ kol: { id: kol.id, name: kol.name, handle: kol.handle, category: kol.category }, match: matchKolToTopic(kol, topic, context) }))
    .sort((a, b) => (b.match.screeningScore ?? -1) - (a.match.screeningScore ?? -1))

  return {
    direction: 'topic_to_kols',
    topic,
    region,
    recommended: ranked.filter((r) => r.match.gates?.passed),
    excluded: ranked.filter((r) => !r.match.gates?.passed),
  }
}

/* ---------------------------------------------------- (c) 組合 → 素材企劃 */

/**
 * Build the material brief skeleton (docs/09 §6). Deliberately a skeleton:
 * the hook line, script and shot list stay human work — what the engine
 * supplies is the binding, the constraints, and the feasibility warnings.
 */
export async function combinationToBrief({ kolId, topicIds = [], adHocTopics = [], region = 'GLOBAL', platforms = PLATFORMS, fourAxis = {}, targets = {}, primaryTask = null, secondaryEffects = [] }) {
  const kol = getKol(kolId)
  if (!kol) throw Object.assign(new Error(`unknown KOL "${kolId}"`), { status: 404 })

  const set = await getRegionTopics(region, { platforms, limit: 1000 })
  const context = { region, language: languageOf(region) }

  const hooksById = new Map((kol.affinity?.topic_hooks ?? []).map((h) => [h.id, h]))
  const topics = [
    ...topicIds.map((id) => set.allTopics.find((t) => t.id === id) ?? (hooksById.has(id) ? hookToTopic(hooksById.get(id), { region }) : null)),
    ...adHocTopics.map((t) => makeAdHocTopic(t)),
  ].filter(Boolean)

  if (!topics.length) throw Object.assign(new Error('至少要選一個話題'), { status: 400 })

  const matches = topics.map((topic) => matchKolToTopic(kol, topic, context))
  // Combination score = the primary topic, with a small bonus for each
  // additional topic that also clears the C grade — genuinely reinforcing
  // angles help, tacking on weak tags does not.
  const primary = [...matches].sort((a, b) => (b.screeningScore ?? -1) - (a.screeningScore ?? -1))[0]
  const supporting = matches.filter((m) => m !== primary)
  // docs/11 §2.5 — no headline number. A supporting topic that also clears the
  // gates is listed, not converted into a bonus: inventing a "+3 per extra
  // topic" rule would be exactly the kind of made-up formula the spec forbids.
  const reinforcing = supporting.filter((m) => m.gates?.passed)
  const anyVetoed = matches.some((m) => !m.gates?.passed)

  const combinedMatch = {
    ...primary,
    gatesPassed: Boolean(primary.gates?.passed) && !anyVetoed,
    anyVetoed,
    needsBinding: primary.needsBinding,
    combination: {
      primaryTopicId: primary.topicId,
      supportingTopicIds: supporting.map((m) => m.topicId),
      reinforcingTopicIds: reinforcing.map((m) => m.topicId),
      perTopic: matches.map((m) => ({ topicId: m.topicId, topicTitle: m.topicTitle, screeningScore: m.screeningScore, band: m.band, gatesPassed: m.gates?.passed ?? false, decision: m.decision })),
    },
  }

  const pillarName = primary.dimensions?.pillar?.pillar ?? null
  const pillar = (kol.profile?.content?.pillars ?? []).find((p) => p.name === pillarName) ?? null
  const scenes = kol.profile?.ai_prompts?.scenes ?? []
  const material = kol.affinity?.material_attributes ?? {}

  const identityRefs = kol.images.filter((i) => i.role === 'identity_ref').length
  const formatFit = kol.affinity?.format_fit ?? null

  const feasibility = []
  if (identityRefs < 3) {
    feasibility.push({ level: 'warn', message: `身分參考圖只有 ${identityRefs} 張，多場景敘事的臉部一致性風險高。` })
  }
  if (!scenes.length) {
    feasibility.push({ level: 'warn', message: 'profile.json 沒有 ai_prompts.scenes，需要先補場景 prompt。' })
  }
  if (primary.needsBinding) {
    feasibility.push({ level: 'block', message: '這個話題沒有對應到任何內容支柱——先決定它屬於哪一根支柱，否則不該排進製作。' })
  }
  for (const hit of primary.warnings ?? []) {
    const where = (hit.findings ?? []).map((f) => f.detail).join('；')
    feasibility.push({ level: 'warn', message: `紅線警示 ${hit.id}：${hit.title}${where ? `（${where}）` : ''}` })
  }
  // docs/11 §5.4 — lint hits are candidates, not verdicts. They must be shown,
  // but as something a human still owes an answer on.
  for (const item of primary.needsReview ?? []) {
    feasibility.push({
      level: 'review',
      message: `待語意判定 ${item.id ?? item.key}：${item.title ?? item.label}——關鍵字比對命中，需要人或語意層確認是不是真的。`,
    })
  }
  const weakest = primary.dimensions?.fit?.weakest
  if (weakest && weakest.gap >= 20) {
    feasibility.push({ level: 'warn', message: `最弱軸「${weakest.label}」缺口 ${weakest.gap}——這一軸要靠腳本或製作補，否則會拉低成效。` })
  }
  if (formatFit) {
    feasibility.push({
      level: 'info',
      message:
        formatFit.score >= 70
          ? `日常適配 ${formatFit.score}：這位 KOL 撐得起隨手感／vlog 式切角。`
          : `日常適配 ${formatFit.score}：偏低，這題不適合做成日常隨手風格，走他原生的格式比較穩。`,
    })
  }

  // Five fields, down from ten (docs/10 第七刀). Everything kept here is
  // something a planner cannot look up faster elsewhere.
  const brief = {
    kol: { id: kol.id, name: kol.name, handle: kol.handle },
    region,
    topics: topics.map((t) => ({ id: t.id, tag: t.tag, title: t.title, domain: t.domain, heat: t.heat, angle: t.angle ?? null })),
    boundPillar: pillar ? { name: pillar.name, weight: pillar.weight, description: pillar.description } : null,
    suggestedFormats: (material.usable_formats ?? kol.profile?.content?.formats ?? []).slice(0, 4),
    availableScenes: scenes.map((s) => ({ id: s.id, label: s.label })),
    visualLanguage: kol.profile?.content?.aesthetic?.editing_style ?? null,
    formatFit,
    feasibility,
    /** The two things the engine will not write: the hook and the CTA. */
    toFillIn: { hookLine: '', cta: '' },
  }

  const preEvaluation = buildPreEvaluation({
    kol, topics, match: combinedMatch, fourAxis, targets, plan: brief, primaryTask, secondaryEffects,
  })

  return { direction: 'combination_to_brief', brief, match: combinedMatch, preEvaluation }
}
