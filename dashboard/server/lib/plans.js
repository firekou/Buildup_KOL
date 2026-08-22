import { getKol } from './kols.js'
import { getRegionTopics, PLATFORMS } from './topics/index.js'
import { matchKolToTopic, hookToTopic } from './scoring/match.js'
import { getConfig } from './scoring/gates.js'
import { PRIMARY_TASKS } from './scoring/evaluation.js'
import { checkContent } from './redlines.js'

/**
 * docs/11 §8 — generate 5–10 content plans for one KOL.
 *
 * The framing that matters, and which the UI must repeat: these are SCREENED
 * CANDIDATES, not predictions. Bakshy et al. (2011) found that which particular
 * user or piece of content produces a large cascade is relatively
 * unpredictable. What this tool can do is remove combinations that are clearly
 * wrong, and force the reasoning to be written down.
 */

/**
 * Task-specific angles.
 *
 * Attention and comment are driven by opposite treatments of the same thing:
 * Mandler's incongruity RESOLVED holds attention; incongruity LEFT OPEN is what
 * makes people type. That is why one plan declares one primary task — not
 * because an audience can only do one thing, but because the hook and the CTA
 * cannot be written both ways at once.
 */
const TASK_ANGLES = {
  attention: {
    hookShape: '前 3 秒就打破預期，但在片子結束前把它解釋清楚。',
    ctaShape: '不要 CTA，或極輕——任何要求都會打斷停留。',
    why: '關注來自「意外被化解」的認知愉悅（Mandler 1982）。沒有化解就只剩困惑。',
  },
  comment: {
    hookShape: '把一個真心持有、但多數人不同意的判斷講清楚，然後停在還沒被填滿的地方。',
    ctaShape: '問一個你真的不知道答案的問題。',
    why: '留言來自認知摩擦與想補充／糾正的衝動——與「關注」相反，這裡的不一致刻意不化解。',
    caution: '刻意演出破綻或說錯話來釣留言會命中 W-ENGAGEMENT-BAIT：被看穿時扣的是整個帳號的評價（Friestad & Wright 1994）。',
  },
  share: {
    hookShape: '一句話講完「這對誰有用」。',
    ctaShape: '「轉給那個正在⋯⋯的朋友」——分享多半發生在私訊，不是動態牆。',
    why: '擴散靠實用價值或身分表態。高喚起情緒也有效，但道德情緒的傳染受群體邊界限制（Brady et al. 2017），買到的是同溫層深度而不是跨圈觸達。',
  },
  identity: {
    hookShape: '直接講這個帳號為什麼存在，或它拒絕做什麼。',
    ctaShape: '不要求任何動作。',
    why: '身分內容的短期數字通常不好看，這是刻意的——它買的是「觀眾知道你是誰」。',
  },
}

const TASK_ORDER = ['attention', 'comment', 'share', 'identity']

/** The same rule surfacing from two checks is one thing to look at, not two. */
const dedupeById = (rows) => {
  const seen = new Set()
  return rows.filter((r) => {
    const id = r.id ?? r.key
    if (!id || seen.has(id)) return false
    seen.add(id)
    return true
  })
}

/**
 * Build one plan from a (KOL, topic) pair that has already cleared the gates.
 * The primary task is assigned round-robin so a batch covers several tasks
 * without a fixed quota — docs/11 §8.3 removed the 4/2/3/1 split because it had
 * no basis and would push the generator into contriving angles to fill it.
 */
function toPlan(kol, topic, match, taskKey, index) {
  const angle = TASK_ANGLES[taskKey]
  const pillar = match.dimensions?.pillar?.pillar ?? null
  const material = kol.affinity?.material_attributes ?? {}

  const draftText = [topic.title, topic.angle, pillar].filter(Boolean).join(' ')
  const redline = checkContent({
    scope: 'plan',
    text: draftText,
    persona: kol.affinity,
    profile: kol.profile,
  })

  return {
    id: `plan-${kol.id}-${topic.id}-${index}`,
    kolId: kol.id,
    kolName: kol.name,
    topicId: topic.id,
    topicTag: topic.tag,
    topic: topic.title,
    domain: topic.domain,
    /** C1 — every plan is bound to an existing pillar. Unbound plans dilute the account. */
    pillar,
    angle: topic.angle ?? null,
    /** C2 — one primary task, and it is what drives the hook and the CTA. */
    primaryTask: taskKey,
    primaryTaskLabel: PRIMARY_TASKS.find((t) => t.key === taskKey)?.label ?? taskKey,
    taskWhy: angle.why,
    taskCaution: angle.caution ?? null,
    hookShape: angle.hookShape,
    ctaShape: angle.ctaShape,
    secondaryEffects: [],
    suggestedFormats: (material.usable_formats ?? kol.profile?.content?.formats ?? []).slice(0, 3),
    band: match.band,
    screeningScore: match.screeningScore,
    experimentBand: Boolean(match.experimentBand),
    dimensions: match.dimensions,
    timing: match.timing,
    weakestDimension: match.weakestDimension,
    warnings: dedupeById([...(match.warnings ?? []), ...(redline.warnings ?? [])]),
    /**
     * Only what THIS plan tripped. The standing list of rules that always need
     * a semantic read is returned once per batch, not repeated on every card —
     * showing the same nine items eleven times reads as "this plan has eleven
     * problems", which is false and trains people to ignore the field.
     */
    lintHits: dedupeById([...(match.needsReview ?? []), ...(redline.needsReview ?? [])]),
    /** The two things the generator will not write. */
    toFillIn: { hookLine: '', cta: '' },
  }
}

export async function generatePlans(kolId, { region = 'GLOBAL', platforms = PLATFORMS, count = 8, includeHooks = true } = {}) {
  const kol = getKol(kolId)
  if (!kol) throw Object.assign(new Error(`unknown KOL "${kolId}"`), { status: 404 })

  const cfg = getConfig()
  const want = Math.min(Math.max(Number(count) || 8, 5), 10)

  const set = await getRegionTopics(region, { platforms, limit: 200 })
  const context = { region }

  const candidates = [
    ...set.allTopics.map((t) => ({ topic: t, source: 'region' })),
    ...(includeHooks ? (kol.affinity?.topic_hooks ?? []).map((h) => ({ topic: hookToTopic(h, { region }), source: 'hook' })) : []),
  ]

  const evaluated = candidates
    .map(({ topic, source }) => ({ topic, source, match: matchKolToTopic(kol, topic, context) }))

  // C3 — only gate-clear candidates become plans. Everything refused is
  // returned separately so the screen can show what was removed and why,
  // rather than silently shrinking the list.
  const eligible = evaluated
    .filter((e) => e.match.gates?.passed && !e.match.needsBinding)
    .sort((a, b) => (b.match.screeningScore ?? -1) - (a.match.screeningScore ?? -1))

  const rejected = evaluated
    .filter((e) => !e.match.gates?.passed || e.match.needsBinding)
    .map((e) => ({
      topicTag: e.topic.tag,
      topicTitle: e.topic.title,
      reason: e.match.decision?.detail ?? e.match.decision?.label ?? '未通過',
      decision: e.match.decision?.key,
    }))

  const plans = eligible.slice(0, want).map((e, i) => toPlan(kol, e.topic, e.match, TASK_ORDER[i % TASK_ORDER.length], i))

  // The rules that must be read semantically for every plan, regardless of
  // whether a keyword happened to fire (docs/11 §5.4).
  const semanticChecklist = plans.length
    ? dedupeById(
        checkContent({ scope: 'plan', text: '', persona: kol.affinity, profile: kol.profile }).pendingSemantic ?? [],
      ).map((r) => ({ id: r.id, severity: r.severity, title: r.title, whyPlain: r.whyPlain, semanticPrompt: r.semanticPrompt }))
    : []

  const distinctTasks = new Set(plans.map((p) => p.primaryTask)).size
  const minTasks = cfg.taskCoverage.minDistinctTasks

  return {
    kol: { id: kol.id, name: kol.name, handle: kol.handle, credibilityMode: kol.affinity?.credibility_mode ?? null },
    region,
    source: set.source,
    requested: want,
    plans,
    rejected,
    /** §5.4 — applies to every plan above; read once, apply to each. */
    semanticChecklist,
    semanticChecklistNote:
      '這些規則沒有可靠的關鍵字可以抓，所以每一個企劃都要由人或語意層逐一看過——不是因為某個企劃有問題，而是因為關鍵字本來就抓不到這幾類。',
    coverage: {
      distinctTasks,
      minDistinctTasks: minTasks,
      /** §8.3 — a reminder, never a blocker. */
      blocking: cfg.taskCoverage.blocking,
      satisfied: distinctTasks >= minTasks,
      message:
        distinctTasks >= minTasks
          ? null
          : `這批 ${plans.length} 個企劃只涵蓋了 ${distinctTasks} 種任務。要不要看看有沒有適合其他任務的切角？（這只是提醒，不擋你出稿。）`,
      note: cfg.taskCoverage.basis,
    },
    /** §8.4 — the sentence that must always be on screen. */
    disclaimer:
      '這些是篩選過的候選，不是預測。文獻上（Bakshy et al. 2011）預測哪一則內容會爆本身就不可靠——這個工具的價值在於排除明顯錯的組合，以及逼你把理由寫下來。',
    equalWeightNotice: cfg.dimensions.note,
  }
}
