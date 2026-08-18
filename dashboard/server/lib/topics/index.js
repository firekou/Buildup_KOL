import { apify, isApifyConfigured } from '../../config.js'
import { getAxes } from '../kols.js'
import { classifyDomain, resolveAxisDemand } from './classify.js'
import { fetchRegionTopics } from './apify.js'
import { getFixtureTopics, FIXTURE_REGIONS } from './fixtures.js'

export const PLATFORMS = ['threads', 'tiktok', 'instagram']

const cache = new Map() // key -> { at, value }

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
    if (!existing) {
      byTag.set(key, {
        ...row,
        platforms: [{ platform: row.platform, volume: row.volume }],
        tags: [row.tag],
      })
      continue
    }
    existing.volume += row.volume
    existing.platforms.push({ platform: row.platform, volume: row.volume })
    if (Number.isFinite(row.growth7d)) {
      existing.growth7d = Number.isFinite(existing.growth7d)
        ? (existing.growth7d + row.growth7d) / 2
        : row.growth7d
    }
    if (Number.isFinite(row.engagementRate)) {
      existing.engagementRate = Number.isFinite(existing.engagementRate)
        ? (existing.engagementRate + row.engagementRate) / 2
        : row.engagementRate
    }
    if (row.title && row.title.length > (existing.title?.length ?? 0)) existing.title = row.title
  }
  return [...byTag.values()]
}

/** docs/09 §3.4 — heat is always relative to the result set it was computed in. */
function scoreHeat(rows) {
  const logVolume = normalize(rows.map((r) => Math.log10(Math.max(r.volume, 1))))
  const growth = normalize(rows.map((r) => r.growth7d))
  const engagement = normalize(rows.map((r) => r.engagementRate))

  return rows.map((r) => {
    const parts = {
      volume: logVolume(Math.log10(Math.max(r.volume, 1))),
      growth: growth(r.growth7d),
      engagement: engagement(r.engagementRate),
    }
    const heat = 0.45 * parts.volume + 0.35 * parts.growth + 0.2 * parts.engagement
    return { ...r, heat: Math.round(heat * 10) / 10, heatParts: parts }
  })
}

function enrich(rows) {
  return rows.map((row) => {
    const domain = classifyDomain(row)
    const { demand, derivedFrom } = resolveAxisDemand({ ...row, domain })
    return {
      id: `${row.tag.toLowerCase().replace(/^#/, '').replace(/\s+/g, '-')}`,
      tag: row.tag,
      title: row.title || row.tag,
      domain,
      axisDemand: demand,
      axisDerivedFrom: derivedFrom,
      volume: row.volume,
      growth7d: row.growth7d,
      engagementRate: row.engagementRate,
      platforms: row.platforms ?? [{ platform: row.platform, volume: row.volume }],
      heat: row.heat,
      heatParts: row.heatParts,
      samples: row.samples ?? [],
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

  if (isApifyConfigured()) {
    const result = await fetchRegionTopics(region, platforms, { limit: Math.max(limit * 4, 40) })
    errors = result.errors
    if (result.topics.length) {
      raw = result.topics
      source = result.errors.length ? 'apify_partial' : 'apify'
    } else {
      errors.push({ platform: 'all', message: 'Apify returned no items — falling back to fixtures' })
    }
  }

  if (!raw.length) {
    raw = getFixtureTopics(region, platforms)
    source = isApifyConfigured() ? 'fixtures_fallback' : 'fixtures'
  }

  const ranked = enrich(scoreHeat(mergeByTag(raw)))
    .sort((a, b) => b.heat - a.heat)

  const value = {
    region,
    platforms,
    source,
    errors,
    fetchedAt: new Date().toISOString(),
    total: ranked.length,
    topics: ranked.slice(0, limit),
    allTopics: ranked,
  }

  cache.set(key, { at: Date.now(), value })
  return { ...value, cached: false }
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
    growth7d: input.growth7d ?? null,
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
