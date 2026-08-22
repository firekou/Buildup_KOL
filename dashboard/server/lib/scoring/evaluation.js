/**
 * Pre / post evaluation and delta analysis — implements docs/09 §4.
 *
 * v1 predicted a five-layer funnel from an `assumed: true` baseline multiplied
 * by two hand-written coefficients. Nothing supported those coefficients, so
 * five decimal-precise numbers rested on two invented ones — worse than not
 * predicting, because it implies knowledge the system does not have.
 *
 * v2 asks the planner for two targets instead (docs/10 第五刀). A number a
 * person committed to is worth more than one a fake formula produced, and the
 * after-the-fact gap then measures a real judgement.
 */

const round = (n, d = 2) => Math.round(n * 10 ** d) / 10 ** d

/**
 * The four-axis rubric of docs/06 Part D. It judges FINISHED-FOOTAGE QUALITY,
 * so it is a pre-shoot checklist here, not a second gate on top of Match —
 * whether a topic suits a KOL and whether a cut is well made are different
 * questions (docs/10 第八刀).
 */
export const FOUR_AXES = [
  { key: 'entertaining', label: '娛樂性', threshold: 4 },
  { key: 'musicality', label: '音樂性', threshold: 4 },
  { key: 'authenticity', label: '真實性', threshold: 4 },
  { key: 'motionFluency', label: '動作流暢性', threshold: 4 },
]

/* ------------------------------------------------------------------ §4.1 */

export function fourAxisChecklist(scores = {}) {
  const rows = FOUR_AXES.map((axis) => {
    const value = scores[axis.key]
    const scored = Number.isFinite(value)
    return {
      ...axis,
      value: scored ? value : null,
      passes: scored ? value >= axis.threshold : false,
      unscored: !scored,
    }
  })
  const scoredRows = rows.filter((r) => !r.unscored)
  return {
    rows,
    average: scoredRows.length ? round(scoredRows.reduce((s, r) => s + r.value, 0) / scoredRows.length) : null,
    failing: rows.filter((r) => !r.passes && !r.unscored).map((r) => r.label),
    unscored: rows.filter((r) => r.unscored).map((r) => r.label),
    /** Advisory only —發片前要跑，但不擋開工。 */
    note: 'docs/06 Part D 的成片品質判準。發片前逐軸自評，未達 4 分要修——但這不是選題門檻。',
  }
}

/** The numbers the planner commits to before anything is generated. */
export function normalizeTargets(targets = {}) {
  const positive = (v) => {
    const n = Number(v)
    return Number.isFinite(n) && n > 0 ? Math.round(n) : null
  }
  return {
    views: positive(targets.views),
    linkClicks: positive(targets.linkClicks),
    // docs/11 §11 P1-5 — 互動 previously had no settable target, so it could
    // never be judged. Comment and share outcomes were structurally excluded
    // from every post-hoc review.
    engagements: positive(targets.engagements),
    note: targets.note ?? null,
  }
}

/**
 * Build a pre-evaluation record. `match` is the snapshot from the match engine
 * and is stored verbatim: heat drifts, and an honest before/after comparison
 * needs the numbers that were true at decision time.
 */
export function buildPreEvaluation({ kol, topics, match, fourAxis = {}, targets = {}, plan = {}, author = null }) {
  const checklist = fourAxisChecklist(fourAxis)
  const normalizedTargets = normalizeTargets(targets)

  const decision = match.blocked
    ? { key: 'blocked', label: '紅線否決', reason: match.rationale }
    : match.needsBinding
      ? { key: 'unbound', label: '待綁定支柱', reason: '這個話題在該帳號上沒有內容支柱可以歸屬，先決定它屬於哪一根支柱' }
      : match.score < 50
        ? { key: 'reassign', label: '換人或換題', reason: `Match ${match.score} 低於 50` }
        : !normalizedTargets.views
          ? { key: 'needs_target', label: '待填目標', reason: 'Match 過關，但還沒有人說出這支要達到什麼' }
          : { key: 'go', label: '通過，可開工', reason: `Match ${match.score}，目標觀看 ${normalizedTargets.views}` }

  return {
    type: 'pre',
    kolId: kol.id,
    kolName: kol.name,
    topicIds: topics.map((t) => t.id),
    topicTags: topics.map((t) => t.tag),
    matchSnapshot: match,
    targets: normalizedTargets,
    fourAxisChecklist: checklist,
    plan,
    decision,
    author,
  }
}

/* ------------------------------------------------------------------ §4.2 */

/**
 * Every field a platform can give us is stored, even though the UI shows three.
 * Cutting what is DISPLAYED is reversible; cutting what is STORED is not — and
 * these are facts available at the time, not predictions. Without them, 50
 * records from now we still could not tell a completion-rate problem from a
 * CTA problem (docs/10 第五刀, review 逼出來的修正).
 */
const STORED_FIELDS = [
  'views', 'reach', 'impressions',
  'likes', 'comments', 'shares', 'saves',
  'profileVisits', 'linkClicks', 'conversions', 'follows',
]

export function normalizeActuals(raw = {}) {
  const actuals = {}
  for (const key of STORED_FIELDS) actuals[key] = Number(raw[key]) || 0
  actuals.avgWatchTime = Number(raw.avgWatchTime) || null
  actuals.completionRate = Number(raw.completionRate) || null

  const interactions = actuals.likes + actuals.comments + actuals.shares + actuals.saves
  actuals.engagements = interactions
  actuals.engagementRate = actuals.views > 0 ? round(interactions / actuals.views, 4) : null
  return actuals
}

/** The three the dashboard actually puts in front of a human. */
export const DISPLAY_FIELDS = [
  { key: 'views', label: '觀看' },
  { key: 'engagements', label: '互動' },
  { key: 'linkClicks', label: '外連點擊' },
]

/**
 * docs/11 §9.4-B — the observation windows a record can belong to.
 * A backfill lands in a window only if its post age is within tolerance;
 * anything else is stored but excluded from calibration.
 */
export const OBSERVATION_WINDOWS = [
  { key: 'T+72h', targetHours: 72, toleranceHours: 12 },
  { key: 'T+14d', targetHours: 336, toleranceHours: 12 },
]

export function resolveWindow(postAgeHours) {
  if (!Number.isFinite(postAgeHours)) return null
  return OBSERVATION_WINDOWS.find((w) => Math.abs(postAgeHours - w.targetHours) <= w.toleranceHours) ?? null
}

/**
 * docs/11 §11 P1-2 — a performance number without a measurement time is not
 * comparable to any other performance number. Views at 6 hours and views at
 * 6 days are different quantities wearing the same label.
 *
 * This is the one gap that retroactively invalidates already-backfilled data,
 * which is why it ships in the first batch and why `measuredAt` is required.
 */
export function buildPostEvaluation({
  preEvaluation,
  actuals,
  fourAxisActual = {},
  publishedAt = null,
  measuredAt = null,
  notes = null,
  matchRecordId = null,
}) {
  const published = publishedAt ? Date.parse(publishedAt) : NaN
  const measured = measuredAt ? Date.parse(measuredAt) : NaN
  const postAgeHours =
    Number.isFinite(published) && Number.isFinite(measured)
      ? round((measured - published) / 3_600_000, 1)
      : null

  const window = resolveWindow(postAgeHours)

  return {
    type: 'post',
    preEvaluationId: preEvaluation?.id ?? null,
    kolId: preEvaluation?.kolId ?? actuals.kolId ?? null,
    matchRecordId,
    publishedAt,
    measuredAt,
    postAgeHours,
    /** Which §9.4-B window this reading belongs to; null = outside every window. */
    observationWindow: window?.key ?? null,
    /** docs/11 §9.4-C — only windowed readings may enter calibration. */
    eligibleForCalibration: Boolean(window) && Boolean(preEvaluation?.primaryTask),
    /** docs/11 §2.4 — carried through from the pre-evaluation so the band survives to analysis. */
    experimentBand: preEvaluation?.experimentBand ?? false,
    primaryTask: preEvaluation?.primaryTask ?? null,
    platform: actuals.platform ?? null,
    actuals: normalizeActuals(actuals),
    fourAxisActual: fourAxisChecklist(fourAxisActual),
    notes,
  }
}

/* ------------------------------------------------------------------ §4.3 */

/**
 * Three rows and one attribution sentence.
 *
 * The point of splitting the funnel at all is to separate a SELECTION problem
 * from a MATERIAL problem — reach tells you whether the topic landed, clicks
 * tell you whether the material converted attention. A single aggregate number
 * cannot say which.
 */
export function compare(pre, post) {
  const targets = pre?.targets ?? {}
  const actual = post?.actuals ?? {}

  const row = (key, label, target) => {
    const a = Number(actual[key]) || 0
    if (!Number.isFinite(target) || target == null || target <= 0) {
      return { key, label, target: null, actual: a, delta: null, variancePercent: null, verdict: '未設目標' }
    }
    const variance = (a - target) / target
    return {
      key,
      label,
      target,
      actual: a,
      delta: round(a - target, 1),
      variancePercent: round(variance * 100, 1),
      verdict: variance >= -0.15 ? '達標' : '未達標',
    }
  }

  // docs/11 §11 P1-5 (review finding): v1 passed a literal `null` here, so the
  // 互動 row could never be judged — comment and share outcomes were
  // structurally excluded from every review. The target is now settable.
  const rows = [
    row('views', '觀看', targets.views),
    row('engagements', '互動', targets.engagements),
    row('linkClicks', '外連點擊', targets.linkClicks),
  ]

  const viewsRow = rows[0]
  const clicksRow = rows[2]
  const reachOk = viewsRow.target == null ? null : viewsRow.verdict === '達標'
  const clicksOk = clicksRow.target == null ? null : clicksRow.verdict === '達標'

  let attribution
  if (reachOk == null || clicksOk == null) {
    attribution = { key: 'incomplete', label: '目標不完整', detail: '缺少目標值，無法判讀是選題問題還是素材問題。' }
  } else if (reachOk && !clicksOk) {
    // Descriptive, not causal. docs/11 §14 #—: Bakshy et al. 2011 found that
    // which individual post spreads is relatively unpredictable, so reading a
    // single miss as evidence about topic choice is reading noise as signal.
    attribution = { key: 'material', label: '觸及達標、點擊未達標', detail: '這一支的觸及到了，點擊沒到。單一則的差異有很大一部分是隨機的——連續多則出現同樣形狀，才值得改素材的 CTA 與結尾。' }
  } else if (!reachOk) {
    attribution = { key: 'selection', label: '觸及未達標', detail: '這一支的觸及沒到。不要據此斷定是選題問題——文獻上單則內容的擴散本來就不可靠預測。累積幾則同型的結果再判斷。' }
  } else {
    attribution = { key: 'onTarget', label: '符合預期', detail: '觸及與點擊都達標。' }
  }

  const fourAxisDelta = (pre?.fourAxisChecklist?.rows ?? []).map((r) => {
    const actualRow = (post?.fourAxisActual?.rows ?? []).find((x) => x.key === r.key)
    return {
      key: r.key,
      label: r.label,
      predicted: r.value,
      actual: actualRow?.value ?? null,
      delta: Number.isFinite(r.value) && Number.isFinite(actualRow?.value) ? round(actualRow.value - r.value, 1) : null,
    }
  })

  return {
    rows,
    attribution,
    fourAxisDelta,
    matchScore: pre?.matchSnapshot?.score ?? null,
    engagementRate: actual.engagementRate ?? null,
    /** Not shown by default, but stored and available for later analysis. */
    storedOnly: Object.fromEntries(
      Object.entries(actual).filter(([k]) => !['views', 'engagements', 'linkClicks', 'engagementRate'].includes(k)),
    ),
  }
}
