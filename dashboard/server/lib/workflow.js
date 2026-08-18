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
    .sort((a, b) => b.match.score - a.match.score)

  const recommended = ranked.filter((r) => !r.match.blocked)
  const excluded = ranked.filter((r) => r.match.blocked)

  // The KOL's own evergreen hooks, scored on the same scale — they are the
  // fallback when nothing in this week's trending set fits.
  const hooks = includeHooks
    ? (kol.affinity?.topic_hooks ?? [])
        .map((hook) => {
          const topic = hookToTopic(hook, { region })
          return { topic, hook, match: matchKolToTopic(kol, topic, context) }
        })
        .sort((a, b) => b.match.score - a.match.score)
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
    .sort((a, b) => b.match.score - a.match.score)

  return {
    direction: 'topic_to_kols',
    topic,
    region,
    recommended: ranked.filter((r) => !r.match.blocked),
    excluded: ranked.filter((r) => r.match.blocked),
  }
}

/* ---------------------------------------------------- (c) 組合 → 素材企劃 */

/**
 * Build the material brief skeleton (docs/09 §6). Deliberately a skeleton:
 * the hook line, script and shot list stay human work — what the engine
 * supplies is the binding, the constraints, and the feasibility warnings.
 */
export async function combinationToBrief({ kolId, topicIds = [], adHocTopics = [], region = 'GLOBAL', platforms = PLATFORMS, fourAxis = {} }) {
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
  const primary = [...matches].sort((a, b) => b.score - a.score)[0]
  const supporting = matches.filter((m) => m !== primary)
  const bonus = supporting.filter((m) => !m.blocked && m.score >= 50).length * 3
  const blocked = matches.some((m) => m.blocked)
  const combinedScore = blocked ? 0 : Math.min(Math.round((primary.score + bonus) * 10) / 10, 100)

  const combinedMatch = {
    ...primary,
    score: combinedScore,
    blocked,
    combination: {
      primaryTopicId: primary.topicId,
      supportingTopicIds: supporting.map((m) => m.topicId),
      bonus,
      perTopic: matches.map((m) => ({ topicId: m.topicId, topicTitle: m.topicTitle, score: m.score, blocked: m.blocked, grade: m.grade })),
    },
  }

  const pillarName = primary.dimensions.pillarFit.pillar
  const pillar = (kol.profile?.content?.pillars ?? []).find((p) => p.name === pillarName) ?? null
  const scenes = kol.profile?.ai_prompts?.scenes ?? []
  const material = kol.affinity?.material_attributes ?? {}

  const feasibility = []
  if ((material.identity_refs ?? 0) < 3) {
    feasibility.push({ level: 'warn', message: '身分參考圖少於 3 張，多場景敘事的臉部一致性風險高。' })
  }
  if (!scenes.length) {
    feasibility.push({ level: 'warn', message: 'profile.json 沒有 ai_prompts.scenes，需要先補場景 prompt。' })
  }
  if (kol.affinity?.baseline_funnel?.assumed !== false) {
    feasibility.push({ level: 'info', message: '導流基準值仍為假設值，預測數字只能當相對排序用（docs/09 §4.1）。' })
  }
  for (const hit of primary.dimensions.risk.hits) {
    feasibility.push({ level: hit.severity === 'veto' ? 'block' : 'warn', message: `紅線：${hit.rule}（命中：${hit.keywords.join('、')}）` })
  }
  const weakest = primary.dimensions.personaFit.weakest
  if (weakest && weakest.gap >= 20) {
    feasibility.push({ level: 'warn', message: `最弱軸「${weakest.label}」缺口 ${weakest.gap}——這一軸要靠腳本或製作補，否則會拉低成效。` })
  }

  const brief = {
    kol: { id: kol.id, name: kol.name, handle: kol.handle },
    region,
    topics: topics.map((t) => ({ id: t.id, tag: t.tag, title: t.title, domain: t.domain, heat: t.heat, angle: t.angle ?? null })),
    boundPillar: pillar ? { name: pillar.name, weight: pillar.weight, description: pillar.description } : null,
    suggestedFormats: kol.profile?.content?.formats ?? [],
    visualLanguage: material.visual_language ?? kol.profile?.content?.aesthetic?.editing_style ?? null,
    colorPalette: material.color_palette ?? kol.profile?.content?.aesthetic?.color_palette ?? [],
    availableScenes: scenes.map((s) => ({ id: s.id, label: s.label })),
    voiceTone: kol.profile?.persona?.voice_tone ?? null,
    language: kol.affinity?.reach?.language ?? null,
    brandDont: kol.profile?.content?.brand_dont ?? [],
    feasibility,
    /** Fields a planner fills in — the engine does not write copy. */
    toFillIn: {
      hookLine: '',
      structure: '亮相 → 主歌 groove → 副歌 hook → 收尾（docs/06 D.1）',
      cta: '',
      musicPick: '發片前重抓當週熱曲（docs/06 D.2）',
    },
  }

  const preEvaluation = buildPreEvaluation({ kol, topics, match: combinedMatch, fourAxis, plan: brief })

  return { direction: 'combination_to_brief', brief, match: combinedMatch, preEvaluation }
}
