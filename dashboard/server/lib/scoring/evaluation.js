/**
 * Pre / post evaluation and delta analysis — implements docs/09 §4.
 */

const round = (n, d = 2) => Math.round(n * 10 ** d) / 10 ** d
const int = (n) => Math.round(n)

export const FOUR_AXES = [
  { key: 'entertaining', label: '娛樂性', threshold: 4, veto: 2 },
  { key: 'musicality', label: '音樂性', threshold: 4, veto: null },
  { key: 'authenticity', label: '真實性', threshold: 4, veto: null },
  { key: 'motionFluency', label: '動作流暢性', threshold: 4, veto: 2 },
]

export const DEFAULT_BASELINE = {
  assumed: true,
  avg_views: 20000,
  engagement_rate: 0.045,
  profile_visit_rate: 0.03,
  link_ctr: 0.08,
  conversion_rate: 0.02,
}

/* ------------------------------------------------------------------ §4.1 */

/** docs/09 §4.1(3) — funnel prediction from the KOL baseline, lifted by match and heat. */
export function predictFunnel(baseline, matchScore, topicHeat) {
  const b = { ...DEFAULT_BASELINE, ...(baseline ?? {}) }
  const lift = 0.7 + 0.6 * (matchScore / 100)
  const heatMultiplier = 0.85 + 0.3 * ((topicHeat ?? 50) / 100)

  const views = b.avg_views * lift * heatMultiplier
  const engagements = views * b.engagement_rate * lift
  const profileVisits = views * b.profile_visit_rate * lift
  const linkClicks = profileVisits * b.link_ctr
  const conversions = linkClicks * b.conversion_rate

  return {
    lift: round(lift),
    heatMultiplier: round(heatMultiplier),
    baselineAssumed: b.assumed !== false,
    views: int(views),
    engagements: int(engagements),
    profileVisits: int(profileVisits),
    linkClicks: int(linkClicks),
    conversions: round(conversions, 1),
    engagementRate: round(b.engagement_rate * lift, 4),
  }
}

/** docs/09 §4.1(2) — the four-axis gate. Missing scores block, they do not pass. */
export function fourAxisGate(scores = {}) {
  const rows = FOUR_AXES.map((axis) => {
    const value = scores[axis.key]
    const scored = Number.isFinite(value)
    return {
      ...axis,
      value: scored ? value : null,
      passes: scored ? value >= axis.threshold : false,
      vetoed: scored && axis.veto != null ? value <= axis.veto : false,
      unscored: !scored,
    }
  })

  const vetoed = rows.filter((r) => r.vetoed)
  const failing = rows.filter((r) => !r.passes && !r.unscored)
  const unscored = rows.filter((r) => r.unscored)

  return {
    rows,
    average: rows.some((r) => r.unscored)
      ? null
      : round(rows.reduce((s, r) => s + r.value, 0) / rows.length),
    verdict: vetoed.length ? 'rework' : unscored.length ? 'incomplete' : failing.length ? 'revise' : 'pass',
    vetoed: vetoed.map((r) => r.label),
    failing: failing.map((r) => r.label),
    unscored: unscored.map((r) => r.label),
  }
}

/**
 * Build a full pre-evaluation record. `match` is the snapshot from the match
 * engine — it is stored verbatim, because heat drifts and an honest
 * before/after comparison needs the numbers that were true at decision time.
 */
export function buildPreEvaluation({ kol, topics, match, fourAxis = {}, plan = {}, author = null }) {
  const gate = fourAxisGate(fourAxis)
  const heat = topics.reduce((s, t) => s + (t.heat ?? 50), 0) / Math.max(topics.length, 1)
  const funnel = predictFunnel(kol.affinity?.baseline_funnel, match.score, heat)

  const decision = match.blocked
    ? { key: 'blocked', label: '紅線否決', reason: match.rationale }
    : gate.verdict === 'rework'
      ? { key: 'rework', label: '退回改腳本', reason: `四維一票否決：${gate.vetoed.join('、')}` }
      : match.score < 50
        ? { key: 'reassign', label: '換人或換題', reason: `Match ${match.score} 低於 50` }
        : gate.verdict === 'incomplete'
          ? { key: 'incomplete', label: '四維尚未評分', reason: `未評分：${gate.unscored.join('、')}` }
          : gate.verdict === 'revise'
            ? { key: 'revise', label: '可做但需修', reason: `未達門檻：${gate.failing.join('、')}` }
            : { key: 'go', label: '通過，可開工', reason: `Match ${match.score}，四維均達門檻` }

  return {
    type: 'pre',
    kolId: kol.id,
    kolName: kol.name,
    topicIds: topics.map((t) => t.id),
    topicTags: topics.map((t) => t.tag),
    matchSnapshot: match,
    topicHeatSnapshot: round(heat, 1),
    fourAxis: gate,
    predictedFunnel: funnel,
    plan,
    decision,
    author,
  }
}

/* ------------------------------------------------------------------ §4.2 */

const ACTUAL_FIELDS = ['views', 'reach', 'likes', 'comments', 'shares', 'saves', 'profileVisits', 'linkClicks', 'conversions']

/** Normalize whatever the Match 庫 returns into the canonical actuals shape. */
export function normalizeActuals(raw = {}) {
  const actuals = {}
  for (const key of ACTUAL_FIELDS) actuals[key] = Number(raw[key]) || 0
  actuals.avgWatchTime = Number(raw.avgWatchTime) || null
  actuals.completionRate = Number(raw.completionRate) || null

  const interactions = actuals.likes + actuals.comments + actuals.shares + actuals.saves
  actuals.engagements = interactions
  actuals.engagementRate = actuals.views > 0 ? round(interactions / actuals.views, 4) : null
  return actuals
}

export function buildPostEvaluation({ preEvaluation, actuals, fourAxisActual = {}, publishedAt = null, notes = null, matchRecordId = null }) {
  const normalized = normalizeActuals(actuals)
  const gate = fourAxisGate(fourAxisActual)
  return {
    type: 'post',
    preEvaluationId: preEvaluation?.id ?? null,
    kolId: preEvaluation?.kolId ?? actuals.kolId ?? null,
    matchRecordId,
    publishedAt,
    actuals: normalized,
    fourAxisActual: gate,
    notes,
  }
}

/* ------------------------------------------------------------------ §4.3 */

const VARIANCE_BANDS = [
  { min: 0.3, key: 'underestimated', label: '低估', action: '提高該題材／該軸的權重' },
  { min: -0.15, key: 'onTarget', label: '命中', action: '模型可用，不動' },
  { min: -Infinity, key: 'overestimated', label: '高估', action: '檢查預測乘數或製作品質' },
]

const bandFor = (variance) => VARIANCE_BANDS.find((b) => variance >= b.min) ?? VARIANCE_BANDS.at(-1)

const COMPARE_ROWS = [
  { key: 'views', label: '觸及 Views', predictedKey: 'views', actualKey: 'views' },
  { key: 'engagements', label: '互動 Engagements', predictedKey: 'engagements', actualKey: 'engagements' },
  { key: 'profileVisits', label: '主頁造訪', predictedKey: 'profileVisits', actualKey: 'profileVisits' },
  { key: 'linkClicks', label: '外連點擊', predictedKey: 'linkClicks', actualKey: 'linkClicks' },
  { key: 'conversions', label: '轉換', predictedKey: 'conversions', actualKey: 'conversions' },
]

/**
 * Layer-by-layer attribution (docs/09 §4.3). The point is to separate a
 * selection problem from a material problem — a single aggregate number cannot.
 */
export function compare(pre, post) {
  const predicted = pre?.predictedFunnel ?? {}
  const actual = post?.actuals ?? {}

  const rows = COMPARE_ROWS.map((row) => {
    const p = Number(predicted[row.predictedKey]) || 0
    const a = Number(actual[row.actualKey]) || 0
    const variance = (a - p) / Math.max(p, 1)
    const band = bandFor(variance)
    return {
      key: row.key,
      label: row.label,
      predicted: p,
      actual: a,
      delta: round(a - p, 1),
      variance: round(variance, 3),
      variancePercent: round(variance * 100, 1),
      band: band.key,
      bandLabel: band.label,
      action: band.action,
    }
  })

  const byKey = Object.fromEntries(rows.map((r) => [r.key, r]))
  const viewsOk = byKey.views.band !== 'overestimated'
  const clicksOk = byKey.linkClicks.band !== 'overestimated'
  const qualityAvg = post?.fourAxisActual?.average ?? null

  let attribution
  if (viewsOk && !clicksOk) {
    attribution = {
      key: 'material',
      label: '素材導流設計問題',
      detail: '觸及達標但外連點擊不足——題選對了，問題在素材的 CTA 與結尾設計。',
    }
  } else if (!viewsOk && clicksOk) {
    attribution = {
      key: 'selection',
      label: '選題或發布時機問題',
      detail: '觸及不足但後段轉換率正常——素材本身可用，問題在題材或發布時機。',
    }
  } else if (!viewsOk && !clicksOk && qualityAvg != null && qualityAvg < 4) {
    attribution = {
      key: 'production',
      label: '製作品質問題',
      detail: `各層皆低且四維實測平均 ${qualityAvg}——回 docs/06 Part D 逐軸修。`,
    }
  } else if (!viewsOk && !clicksOk) {
    attribution = {
      key: 'mixed',
      label: '全鏈路低於預期',
      detail: '四維實測未回填或尚可，但各層皆低——先補四維實測分數再判定。',
    }
  } else {
    attribution = { key: 'onTarget', label: '符合預期', detail: '漏斗各層皆在容許區間內。' }
  }

  const fourAxisDelta = (pre?.fourAxis?.rows ?? []).map((row) => {
    const actualRow = (post?.fourAxisActual?.rows ?? []).find((r) => r.key === row.key)
    return {
      key: row.key,
      label: row.label,
      predicted: row.value,
      actual: actualRow?.value ?? null,
      delta: Number.isFinite(row.value) && Number.isFinite(actualRow?.value) ? round(actualRow.value - row.value, 1) : null,
    }
  })

  return {
    rows,
    attribution,
    fourAxisDelta,
    matchScore: pre?.matchSnapshot?.score ?? null,
    actualEngagementRate: actual.engagementRate ?? null,
    predictedEngagementRate: predicted.engagementRate ?? null,
  }
}

/* ------------------------------------------------------------------ §5 */

const median = (nums) => {
  const s = [...nums].sort((a, b) => a - b)
  if (!s.length) return null
  const mid = Math.floor(s.length / 2)
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2
}

/**
 * Calibration readout (docs/09 §5). Reports what the data says; it does not
 * write topic_affinity.json — that stays a human decision with a git diff.
 */
export function calibration(pairs) {
  const complete = pairs.filter((p) => p.pre && p.post)
  if (complete.length < 1) {
    return { ready: false, sampleSize: complete.length, required: 10, message: '尚無完成後評估的記錄。' }
  }

  const byKol = new Map()
  for (const { pre, post } of complete) {
    const list = byKol.get(pre.kolId) ?? []
    list.push({ pre, post })
    byKol.set(pre.kolId, list)
  }

  const perKol = [...byKol.entries()].map(([kolId, list]) => ({
    kolId,
    sampleSize: list.length,
    suggestedBaseline: {
      avg_views: median(list.map((l) => l.post.actuals.views)),
      engagement_rate: median(list.map((l) => l.post.actuals.engagementRate ?? 0)),
      profile_visit_rate: median(
        list.map((l) => (l.post.actuals.views ? l.post.actuals.profileVisits / l.post.actuals.views : 0)),
      ),
      link_ctr: median(
        list.map((l) => (l.post.actuals.profileVisits ? l.post.actuals.linkClicks / l.post.actuals.profileVisits : 0)),
      ),
      conversion_rate: median(
        list.map((l) => (l.post.actuals.linkClicks ? l.post.actuals.conversions / l.post.actuals.linkClicks : 0)),
      ),
    },
    enoughSamples: list.length >= 10,
  }))

  // Correlation between match score and actual engagement rate (docs/09 §5.2).
  const xs = complete.map((p) => p.pre.matchSnapshot?.score ?? 0)
  const ys = complete.map((p) => p.post.actuals.engagementRate ?? 0)
  const correlation = pearson(xs, ys)

  return {
    ready: complete.length >= 10,
    sampleSize: complete.length,
    required: 10,
    perKol,
    matchVsEngagementCorrelation: correlation == null ? null : round(correlation, 3),
    verdict:
      correlation == null
        ? '樣本不足以計算相關係數。'
        : correlation < 0.3
          ? 'Match 分數與實際互動率相關性低於 0.3——優先檢討 topicHeat 權重（docs/09 §5.2）。'
          : 'Match 分數與實際互動率相關性可接受，維持現有權重。',
  }
}

function pearson(xs, ys) {
  const n = xs.length
  if (n < 3) return null
  const mx = xs.reduce((a, b) => a + b, 0) / n
  const my = ys.reduce((a, b) => a + b, 0) / n
  let num = 0
  let dx = 0
  let dy = 0
  for (let i = 0; i < n; i += 1) {
    num += (xs[i] - mx) * (ys[i] - my)
    dx += (xs[i] - mx) ** 2
    dy += (ys[i] - my) ** 2
  }
  const den = Math.sqrt(dx * dy)
  return den === 0 ? null : num / den
}
