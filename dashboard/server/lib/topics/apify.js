import { apify, isApifyConfigured } from '../../config.js'

const API_BASE = 'https://api.apify.com/v2'

/**
 * Seed search terms per region. Apify hashtag/keyword scrapers need something
 * to search for; these are the entry points, not the answers — whatever the
 * actor returns is what gets aggregated into the region's topic list.
 */
const REGION_SEEDS = {
  TW: ['台灣 熱門', '台灣 話題', 'taiwan trending'],
  HK: ['香港 熱門', '香港 話題', 'hongkong trending'],
  SG: ['singapore trending', 'sgtrending', '新加坡 热门'],
  MY: ['malaysia trending', '马来西亚 热门', 'kualalumpur'],
  CN: ['热门话题', '热搜', '今日热点'],
  JP: ['日本 トレンド', 'japan trending'],
  GLOBAL: ['trending', 'viral'],
}

async function runActor(actorId, input, signal) {
  const url = `${API_BASE}/acts/${encodeURIComponent(actorId)}/run-sync-get-dataset-items?token=${encodeURIComponent(apify.token)}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
    signal,
  })
  if (!res.ok) {
    throw new Error(`Apify actor ${actorId} failed: ${res.status} ${await res.text().catch(() => '')}`.slice(0, 400))
  }
  const items = await res.json()
  return Array.isArray(items) ? items : []
}

/**
 * Normalize one dataset item into the shape the topic pipeline expects.
 * Actors differ wildly in field naming, so this reads defensively and returns
 * null for anything it cannot make sense of.
 */
function normalizeItem(item, platform) {
  const tag =
    item.hashtag ?? item.name ?? item.tag ?? item.keyword ?? item.query ??
    (Array.isArray(item.hashtags) ? item.hashtags[0] : null)
  if (!tag) return null

  const volume =
    item.postsCount ?? item.posts_count ?? item.mediaCount ?? item.videoCount ??
    item.viewCount ?? item.playCount ?? item.count ?? 0

  const likes = item.likesCount ?? item.diggCount ?? item.likes ?? 0
  const comments = item.commentsCount ?? item.commentCount ?? item.comments ?? 0
  const shares = item.sharesCount ?? item.shareCount ?? item.shares ?? 0
  const views = item.playCount ?? item.viewCount ?? item.views ?? 0

  return {
    tag: String(tag).startsWith('#') ? String(tag) : `#${tag}`,
    title: item.title ?? item.caption ?? item.text ?? String(tag),
    platform,
    volume: Number(volume) || 0,
    // Actors rarely expose a growth figure; leave it null so the heat model
    // can fall back rather than invent a trend.
    growth7d: item.growth ?? item.trendScore ?? null,
    engagementRate: views > 0 ? (likes + comments + shares) / views : null,
    samples: [item.caption, item.text, item.desc].filter(Boolean).slice(0, 2),
    raw: undefined,
  }
}

function buildInput(platform, seeds, limit) {
  switch (platform) {
    case 'instagram':
      return { hashtags: seeds.map((s) => s.replace(/[^\p{L}\p{N}_]/gu, '')), resultsLimit: limit }
    case 'tiktok':
      return { hashtags: seeds, searchQueries: seeds, resultsPerPage: limit, shouldDownloadVideos: false }
    case 'threads':
    default:
      return { queries: seeds, searchQueries: seeds, maxItems: limit }
  }
}

/**
 * Fetch raw topics for one region across the requested platforms.
 * Returns `{ topics, errors }` — a platform that fails does not take the whole
 * request down; the caller decides whether the remaining coverage is enough.
 */
export async function fetchRegionTopics(region, platforms, { limit = 40 } = {}) {
  if (!isApifyConfigured()) {
    return { topics: [], errors: [{ platform: 'all', message: 'APIFY_TOKEN not configured' }] }
  }

  const seeds = REGION_SEEDS[region] ?? REGION_SEEDS.GLOBAL
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), apify.timeoutMs)

  const results = await Promise.allSettled(
    platforms.map(async (platform) => {
      const actorId = apify.actors[platform]
      if (!actorId) throw new Error(`no actor configured for platform "${platform}"`)
      const items = await runActor(actorId, buildInput(platform, seeds, limit), controller.signal)
      return items.map((i) => normalizeItem(i, platform)).filter(Boolean)
    }),
  )
  clearTimeout(timer)

  const topics = []
  const errors = []
  results.forEach((r, i) => {
    if (r.status === 'fulfilled') topics.push(...r.value)
    else errors.push({ platform: platforms[i], message: String(r.reason?.message ?? r.reason).slice(0, 300) })
  })

  return { topics, errors }
}
