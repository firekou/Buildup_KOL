import { apify, isApifyConfigured } from '../../config.js'
import { getAxes } from '../kols.js'
import { classifyDomain, resolveAxisDemand } from './classify.js'
import { fetchRegionTopics, seedTermsFor } from './apify.js'
import * as store from '../store.js'
import { getConfig } from '../scoring/gates.js'
import { getFixtureTopics, FIXTURE_REGIONS } from './fixtures.js'

export const PLATFORMS = ['threads', 'tiktok', 'instagram']

const cache = new Map() // key -> { at, value }

/**
 * docs/11 §4 B4 — Gemini's review: 7 days of history makes every ordinary
 * weekend peak look like a burst. Whole weekly cycles, not elapsed days.
 */
const REQUIRED_WEEKLY_CYCLES = 3

const getTimeSeriesConfig = () => {
  try {
    return getConfig().timeSeries ?? {}
  } catch {
    return {}
  }
}

const cacheKey = (region, platforms) => `${region}::${[...platforms].sort().join(',')}`

/** Min–max normalize to 0–100; a flat set maps to the midpoint rather than 0. */
function normalize(values) {
  const finite = values.filter((v) => Number.isFinite(v))
  if (!finite.length) return () => 50
  const min = Math.min(...finite)
  const max = Math.max(...finite)
  if (max === min) return () => 50
  return (v) => (Number.isFinite(v) ? ((v - min) / (max - min)) * 100 : 50)
}

/**
 * Merge duplicate tags across platforms into one topic, summing volume and
 * keeping per-platform attribution — a tag that is hot on all three platforms
 * should outrank one that is hot on a single platform.
 */
function mergeByTag(rows) {
  const byTag = new Map()
  for (const row of rows) {
    const key = row.tag.toLowerCase().replace(/^#/, '')
    const existing = byTag.get(key)
    // The apify path already emits a per-platform breakdown (docs/11 §11 P1-3);
    // the fixture path has one flat `platform` per row. Accept both.
    const platformsOf = (r) => r.platforms ?? [{ platform: r.platform, volume: r.volume }]
    if (!existing) {
      byTag.set(key, {
        ...row,
        platforms: platformsOf(row),
        postCount: row.postCount ?? null,
        tags: [row.tag],
        _growths: Number.isFinite(row.recencyRatio48h) ? [{ v: row.recencyRatio48h, w: row.volume }] : [],
        _rates: Number.isFinite(row.engagementRate) ? [{ v: row.engagementRate, w: row.volume }] : [],
      })
      continue
    }
    existing.volume += row.volume
    existing.postCount = (existing.postCount ?? 0) + (row.postCount ?? 0) || null
    existing.platforms.push(...platformsOf(row))
    // Collect, then average once at the end. Folding pairwise as we go
    // ((a+b)/2 then (…+c)/2) gives the LAST platform half the weight and makes
    // the result depend on merge order.
    if (Number.isFinite(row.recencyRatio48h)) existing._growths.push({ v: row.recencyRatio48h, w: row.volume })
    if (Number.isFinite(row.engagementRate)) existing._rates.push({ v: row.engagementRate, w: row.volume })
    if (row.title && row.title.length > (existing.title?.length ?? 0)) existing.title = row.title
  }
  // Volume-weighted average, computed once — a tag carried by 20 accounts on
  // one platform should outweigh the same tag carried by 2 on another.
  const weighted = (rows) => {
    const wSum = rows.reduce((n, r) => n + (r.w || 1), 0)
    return wSum ? rows.reduce((n, r) => n + r.v * (r.w || 1), 0) / wSum : null
  }
  return [...byTag.values()].map(({ _growths, _rates, ...row }) => ({
    ...row,
    recencyRatio48h: _growths.length ? weighted(_growths) : row.recencyRatio48h,
    engagementRate: _rates.length ? weighted(_rates) : row.engagementRate,
  }))
}

/**
 * Heat is always relative to the result set it was computed in (docs/09 §3.4).
 *
 * v1 also weighted engagement rate at 20%. Most Apify hashtag actors do not
 * return it at all, so once real scraping is on it degenerates to the constant
 * 50 and contributes nothing — it only ever had values in the fixture set,
 * i.e. it was scoring on fake data (docs/10 第四刀).
 */
/**
 * True when min–max normalization has nothing to separate — every value is the
 * same, so `normalize()` returns the constant 50 for all of them.
 *
 * docs/11 §11 P1-4: in small samples this is the common case (every tag carried
 * by exactly 2 accounts, every `recencyRatio48h` null). Heat then equals 50 for
 * every row and `.sort()` degenerates to the incoming order — which the UI
 * renders as a confident-looking ranking that carries no information at all.
 */
function isDegenerate(values) {
  const finite = values.filter((v) => Number.isFinite(v))
  if (finite.length < 2) return true
  return Math.min(...finite) === Math.max(...finite)
}

/**
 * Heat is always relative to the result set it was computed in (docs/09 §3.4).
 *
 * docs/11 §2.9 — normalization happens WITHIN a domain, not across all of them.
 * Romero, Meeder & Kleinberg (2011) showed diffusion mechanics differ by topic:
 * political hashtags spread by complex contagion (repeated exposure needed),
 * idioms do not. Ranking the two on one scale compares different things.
 */
function scoreHeat(rows) {
  const byDomain = new Map()
  for (const r of rows) {
    const d = r.domain ?? 'other'
    if (!byDomain.has(d)) byDomain.set(d, [])
    byDomain.get(d).push(r)
  }

  const out = []
  for (const [domain, group] of byDomain) {
    const logs = group.map((r) => Math.log10(Math.max(r.volume, 1)))
    const growths = group.map((r) => r.recencyRatio48h)
    const volumeFlat = isDegenerate(logs)
    const growthFlat = isDegenerate(growths)

    const logVolume = normalize(logs)
    const growth = normalize(growths)

    for (const r of group) {
      const parts = {
        volume: logVolume(Math.log10(Math.max(r.volume, 1))),
        growth: growth(r.recencyRatio48h),
      }
      const heat = 0.6 * parts.volume + 0.4 * parts.growth
      out.push({
        ...r,
        heat: Math.round(heat * 10) / 10,
        heatParts: parts,
        normalizedWithin: domain,
        groupSize: group.length,
        /**
         * When both inputs are flat the heat number exists but orders nothing.
         * Downstream must show "no discriminating power" instead of a rank.
         */
        heatDiscriminates: !(volumeFlat && growthFlat),
      })
    }
  }
  return out
}

/**
 * docs/11 §2.8 — how much the heat number can be trusted.
 *
 * `none` is the honest answer without a stored time series: burst detection is
 * defined against a term's own past (Kleinberg 2002) and we have one slice.
 * There is deliberately no `high` — that would need platform-official APIs,
 * not seed-term scraping.
 */
function heatConfidenceOf({ snapshots = [], discriminates, approved = false } = {}) {
  if (!discriminates) return { level: 'none', reason: '這批樣本沒有區辨力——數字全都一樣，排序沒有意義。' }
  if (snapshots.length < 2) {
    return { level: 'none', reason: '還沒有歷史快照可以比較，無法判定升溫。' }
  }

  // Span, not count. Two snapshots taken minutes apart is not a time series —
  // and this is precisely the trap both spec reviewers named: Gemini pointed
  // out that a 7-day baseline reads every ordinary weekend peak as a burst, so
  // the bar is whole weekly cycles, not elapsed days and certainly not rows.
  const times = snapshots.map((s) => Date.parse(s.capturedAt)).filter(Number.isFinite).sort((a, b) => a - b)
  const spanDays = times.length >= 2 ? (times.at(-1) - times[0]) / 86_400_000 : 0
  const weeklyCycles = Math.floor(spanDays / 7)

  if (weeklyCycles < REQUIRED_WEEKLY_CYCLES) {
    return {
      level: 'none',
      spanDays: Math.round(spanDays * 10) / 10,
      weeklyCycles,
      reason: `快照只涵蓋 ${Math.round(spanDays)} 天（${weeklyCycles} 個完整週週期）。社群流量有很強的平日／週末週期，週期數不足時，週末的正常高峰會被誤判成突發——需要 ${REQUIRED_WEEKLY_CYCLES} 個完整週週期。`,
    }
  }

  // docs/11 §4 B4 — even with enough history, leaving the experimental zone is
  // a human decision. The spec's first draft had this auto-enable; the review
  // removed that, and the flag lives in scoring-config so the change is a
  // reviewable commit rather than a silent threshold crossing.
  if (!approved) {
    return {
      level: 'none',
      spanDays: Math.round(spanDays * 10) / 10,
      weeklyCycles,
      reason: `快照已涵蓋 ${weeklyCycles} 個完整週週期，達到門檻——但出實驗區需要人工批准。批准後把 kols/scoring-config.json 的 timeSeries.approved 設為 true。`,
    }
  }

  return {
    level: 'low',
    spanDays: Math.round(spanDays * 10) / 10,
    weeklyCycles,
    reason: `已有 ${weeklyCycles} 個完整週週期可比較，且經人工批准。仍是 low：樣本小、且種子詞決定了能看到什麼。`,
  }
}

/**
 * docs/11 §2.9 — domain must be resolved BEFORE heat is scored, because heat is
 * now normalized within a domain. In v1 `classifyDomain` ran inside `enrich`,
 * i.e. after `scoreHeat`, so it could not have been used for this.
 */
function classify(rows) {
  return rows.map((row) => ({ ...row, domain: classifyDomain(row) }))
}

function enrich(rows) {
  return rows.map((row) => {
    const domain = row.domain ?? classifyDomain(row)
    const { demand, derivedFrom } = resolveAxisDemand({ ...row, domain })
    return {
      id: `${row.tag.toLowerCase().replace(/^#/, '').replace(/\s+/g, '-')}`,
      tag: row.tag,
      title: row.title || row.tag,
      domain,
      axisDemand: demand,
      axisDerivedFrom: derivedFrom,
      volume: row.volume,
      postCount: row.postCount ?? null,
      recencyRatio48h: row.recencyRatio48h,
      engagementRate: row.engagementRate,
      platforms: row.platforms ?? [{ platform: row.platform, volume: row.volume }],
      authorConcentration: row.authorConcentration ?? null,
      heat: row.heat,
      heatParts: row.heatParts,
      heatDiscriminates: row.heatDiscriminates ?? true,
      normalizedWithin: row.normalizedWithin ?? null,
      groupSize: row.groupSize ?? null,
      samples: row.samples ?? [],
      sampleEngagement: row.sampleEngagement ?? null,
      sampleViews: row.sampleViews ?? null,
    }
  })
}

/**
 * Region topic list. Uses Apify when configured; otherwise the hand-written
 * fixture set. The `source` field on the response says which, always.
 */
export async function getRegionTopics(region, { platforms = PLATFORMS, limit = 10, refresh = false } = {}) {
  const key = cacheKey(region, platforms)
  const hit = cache.get(key)
  if (!refresh && hit && (Date.now() - hit.at) / 1000 < apify.cacheTtl) {
    return { ...hit.value, cached: true }
  }

  let raw = []
  let source = 'fixtures'
  let errors = []
  let postsScraped = 0

  if (isApifyConfigured()) {
    const result = await fetchRegionTopics(region, platforms, { limit: Math.max(limit * 4, 40) })
    errors = result.errors
    postsScraped = result.postsScraped
    if (result.topics.length) {
      raw = result.topics
      source = result.errors.length ? 'apify_partial' : 'apify'
    } else {
      errors.push({ platform: 'all', message: `Apify 取回 ${result.postsScraped} 則貼文但聚不出話題——已退回範例資料` })
    }
  }

  if (!raw.length) {
    raw = getFixtureTopics(region, platforms)
    source = isApifyConfigured() ? 'fixtures_fallback' : 'fixtures'
  }

  // docs/11 §2.9 — classify → score (within domain) → enrich.
  const ranked = enrich(scoreHeat(classify(mergeByTag(raw)))).sort((a, b) => b.heat - a.heat)

  const fetchedAt = new Date().toISOString()

  // docs/11 §11 P1-1 — persist every real fetch. Without a stored history,
  // heatConfidence can never leave `none` (Kleinberg 2002: a burst is defined
  // relative to a term's own past). Fixtures are never snapshotted: they are
  // hand-written placeholders and would poison the baseline.
  let snapshotCount = 0
  let snapshotRows = []
  if (source.startsWith('apify')) {
    try {
      store.insert('topicSnapshots', {
        capturedAt: fetchedAt,
        region,
        platforms,
        source,
        postsScraped,
        seedTerms: seedTermsFor(region),
        // Only what a future time series needs — not the whole payload.
        tags: ranked.map((t) => ({
          tag: t.tag,
          domain: t.domain,
          volume: t.volume,
          postCount: t.postCount,
          recencyRatio48h: t.recencyRatio48h,
        })),
      })
    } catch (err) {
      // A snapshot failure must never take the request down.
      errors.push({ platform: 'store', message: `快照寫入失敗：${String(err.message).slice(0, 160)}` })
    }
    snapshotRows = store.list('topicSnapshots', { region })
    snapshotCount = snapshotRows.length
  }

  const discriminates = ranked.some((t) => t.heatDiscriminates)
  const confidence = heatConfidenceOf({
    snapshots: snapshotRows,
    discriminates,
    approved: Boolean(getTimeSeriesConfig().approved),
  })
  const heatConfidence = confidence.level

  // Consequence of docs/11 §2.9 that has to be surfaced, not hidden: once heat
  // is normalized WITHIN a domain, two topics from different domains no longer
  // sit on the same scale. A flat cross-domain ranking would be exactly the
  // "comparing different things" error §2.9 exists to remove — so the grouped
  // view is the primary one and the flat list is explicitly marked.
  const byDomain = [...new Map(
    ranked.reduce((acc, t) => {
      const d = t.domain ?? 'other'
      if (!acc.has(d)) acc.set(d, [])
      acc.get(d).push(t)
      return acc
    }, new Map()),
  ).entries()]
    .map(([domain, topics]) => ({
      domain,
      size: topics.length,
      // A domain with one topic has nothing to rank against.
      discriminates: topics.length > 1 && topics.some((t) => t.heatDiscriminates),
      topics,
    }))
    .sort((a, b) => b.size - a.size)

  const value = {
    region,
    platforms,
    source,
    errors,
    fetchedAt,
    total: ranked.length,
    postsScraped,
    /** volume 的語意隨來源而不同——UI 要據此改標籤，不能一律叫「量體」。 */
    volumeMeaning: source.startsWith('apify') ? 'sample_frequency' : 'platform_volume',
    /** docs/11 §2.8 — 目前永遠不會是 high；沒有時間序列時是 none。 */
    heatConfidence,
    snapshotCount,
    snapshotSpanDays: confidence.spanDays ?? 0,
    weeklyCycles: confidence.weeklyCycles ?? 0,
    requiredWeeklyCycles: REQUIRED_WEEKLY_CYCLES,
    heatDiscriminates: discriminates,
    heatCaveat: source.startsWith('apify') ? confidence.reason : heatCaveatFor(heatConfidence, discriminates, source),
    /**
     * false, always, while heat is normalized within a domain (docs/11 §2.9).
     * The UI must not present `topics` as a league table across domains.
     */
    crossDomainComparable: false,
    crossDomainCaveat: '熱度是在「同一個題材類別內」比較出來的。不同類別之間的分數不能互相比大小——政治題與生活題的擴散機制本來就不同（Romero, Meeder & Kleinberg 2011）。要挑題請看分類別的清單。',
    byDomain,
    topics: ranked.slice(0, limit),
    allTopics: ranked,
  }

  cache.set(key, { at: Date.now(), value })
  return { ...value, cached: false }
}

/**
 * The sentence the UI must show next to any heat number. docs/11 §2.8 forbids
 * the words 正在紅 / 新趨勢 / 爆紅 / 跨圈潛力 / 熱度上升 anywhere in the product;
 * this is what goes there instead.
 */
function heatCaveatFor(confidence, discriminates, source) {
  if (!source.startsWith('apify')) {
    return '這一組是手寫的範例資料，不是抓到的。任何數字都不代表真實平台狀況。'
  }
  if (!discriminates) {
    return '這批樣本裡每個標籤的數字都一樣，排序沒有區辨力——不要照這個順序選題。'
  }
  if (confidence === 'none') {
    return '這是「樣本共現密度」，不是熱度。它說的是：在我們用種子詞抓到的樣本裡，有幾個不同帳號用了這個標籤。還沒有歷史快照，所以無法判定升溫。'
  }
  return '已有歷史快照可比較，但樣本仍小、且種子詞決定了能看到什麼。這個數字可以參考先後，不能當成平台熱度。'
}

export function listRegions() {
  const { regions } = getAxes()
  return regions.map((r) => ({
    ...r,
    hasFixtures: FIXTURE_REGIONS.includes(r.key),
  }))
}

/**
 * Cross-query: intersect or union several tags within a region's topic set.
 * docs/09 §6 — two-tag intersection is the useful case; three or more usually
 * returns nothing, and the response says so rather than silently emptying.
 */
export async function crossQuery(region, tags, { mode = 'intersection', platforms = PLATFORMS } = {}) {
  const { allTopics, source, fetchedAt } = await getRegionTopics(region, { platforms, limit: 1000 })
  const needles = tags.map((t) => t.toLowerCase().replace(/^#/, '').trim()).filter(Boolean)

  const matchesTopic = (topic, needle) => {
    const hay = `${topic.tag} ${topic.title} ${topic.domain} ${topic.samples.join(' ')}`.toLowerCase()
    return hay.includes(needle)
  }

  const matched = allTopics.filter((topic) =>
    mode === 'union'
      ? needles.some((n) => matchesTopic(topic, n))
      : needles.every((n) => matchesTopic(topic, n)),
  )

  return {
    region,
    tags: needles,
    mode,
    source,
    fetchedAt,
    matched,
    note:
      mode === 'intersection' && needles.length >= 3 && matched.length === 0
        ? '三個以上 Tag 的交集在實務上通常無資料——建議改用兩個 Tag，或切換成聯集模式。'
        : null,
  }
}

/** Build a synthetic topic object from a free-form tag, for ad-hoc matching. */
export function makeAdHocTopic(input) {
  const tag = input.tag?.startsWith('#') ? input.tag : `#${input.tag ?? 'adhoc'}`
  const base = {
    tag,
    title: input.title || tag,
    domain: input.domain,
    volume: input.volume ?? 0,
    recencyRatio48h: input.recencyRatio48h ?? null,
    engagementRate: input.engagementRate ?? null,
    samples: input.samples ?? [],
    platform: input.platform ?? 'manual',
  }
  const domain = classifyDomain(base)
  const { demand, derivedFrom } = resolveAxisDemand({ ...base, domain, axis_demand: input.axisDemand })
  return {
    id: `adhoc-${tag.replace(/^#/, '').replace(/\s+/g, '-').toLowerCase()}`,
    ...base,
    domain,
    axisDemand: demand,
    axisDerivedFrom: derivedFrom,
    platforms: [{ platform: base.platform, volume: base.volume }],
    heat: input.heat ?? 50,
    heatParts: null,
    adHoc: true,
  }
}
