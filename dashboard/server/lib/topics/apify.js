import { apify, isApifyConfigured } from '../../config.js'

const API_BASE = 'https://api.apify.com/v2'

/**
 * Apify connector.
 *
 * The important thing to understand here: **none of these actors return
 * hashtag aggregates.** All three return POSTS. There is no "this tag has
 * 128,000 uses" field anywhere — that was an assumption in the first version
 * and it was wrong (verified against live runs, 2026-08-19).
 *
 * So a region's top topics are built by scraping recent posts for a handful of
 * seed terms and then tallying which hashtags actually co-occur in them.
 * `volume` is therefore a SAMPLE FREQUENCY (how many of the scraped posts carry
 * that tag), not a platform-wide count — the UI labels it as such, because
 * calling it "volume" without that caveat would be inventing precision again.
 */

/**
 * Seed terms per region. IG/TikTok take hashtags (no spaces); Threads takes
 * free-text keywords.
 */
const REGION_SEEDS = {
  TW: { tags: ['台灣', 'taiwan', '台北'], keywords: ['台灣 熱門話題', '台灣 討論'] },
  HK: { tags: ['香港', 'hongkong', 'hkig'], keywords: ['香港 熱門話題', '香港 討論'] },
  SG: { tags: ['singapore', 'sgig', 'sglifestyle'], keywords: ['singapore trending', 'singapore discussion'] },
  MY: { tags: ['malaysia', 'kualalumpur', 'malaysiaviral'], keywords: ['malaysia trending', 'malaysia 討論'] },
  CN: { tags: ['中国', '国内热点'], keywords: ['热门话题', '今日热点'] },
  JP: { tags: ['日本', 'tokyo', 'japantravel'], keywords: ['日本 トレンド', '話題'] },
  GLOBAL: { tags: ['trending', 'viral'], keywords: ['trending now', 'what everyone is talking about'] },
}

/** Platform-generic tags that carry no topical information. */
const JUNK_TAGS = new Set([
  'fyp', 'foryou', 'foryoupage', 'fypage', 'viral', 'viralvideo', 'trending', 'trend',
  'tiktok', 'instagram', 'insta', 'reels', 'reel', 'explore', 'explorepage', 'threads',
  'follow', 'followme', 'like', 'likes', 'love', 'photooftheday', 'picoftheday',
  'video', 'shorts', 'capcut', 'duet', 'xyzbca', 'tiktokviral',
  // 區域型流量字：英文名單擋不到，但在小樣本下同樣會霸榜且不帶題材資訊
  '推薦', '推荐', '爆紅', '爆红', '熱門', '热门', '流量密碼', '流量密码',
  '追蹤', '追踪', '按讚', '点赞', '分享', '限動', '限动', '日常', '紀錄', '记录',
  'berandafyp', 'masukberanda', 'fypシ', 'fypp', 'foryoupageofficiall',
])

async function runActor(actorId, input, signal) {
  const url = `${API_BASE}/acts/${encodeURIComponent(actorId)}/run-sync-get-dataset-items?token=${encodeURIComponent(apify.token)}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
    signal,
  })
  if (!res.ok) {
    throw new Error(`actor ${actorId} → ${res.status} ${(await res.text().catch(() => '')).slice(0, 200)}`)
  }
  const items = await res.json()
  return Array.isArray(items) ? items : []
}

function buildInput(platform, seeds, limit) {
  switch (platform) {
    case 'instagram':
      // required: hashtags
      return { hashtags: seeds.tags, resultsLimit: limit }
    case 'tiktok':
      return { hashtags: seeds.tags, resultsPerPage: limit, shouldDownloadVideos: false, shouldDownloadCovers: false }
    case 'threads':
      // required: keywords + maxItemsPerKeyword.
      // NOTE: the previously configured actor (curious_coder~threads-scraper)
      // takes `urls`, not queries — it could never have worked for search.
      return { keywords: seeds.keywords, maxItemsPerKeyword: Math.max(Math.ceil(limit / seeds.keywords.length), 5) }
    default:
      throw new Error(`unknown platform "${platform}"`)
  }
}

const HASHTAG_IN_TEXT = /#([\p{L}\p{N}_]{2,40})/gu

/** Pull hashtags out of free text — Threads posts frequently have an empty hashtags array. */
function tagsFromText(text) {
  if (!text) return []
  return [...String(text).matchAll(HASHTAG_IN_TEXT)].map((m) => m[1])
}

const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0)

/**
 * Reduce one raw dataset item to the fields the aggregator needs.
 * Field names differ per actor; verified against live runs.
 */
function toPost(item, platform) {
  if (!item || typeof item !== 'object') return null
  switch (platform) {
    case 'instagram': {
      const text = item.caption ?? ''
      return {
        tags: [...(item.hashtags ?? []), ...tagsFromText(text)],
        engagement: num(item.likesCount) + num(item.commentsCount),
        views: null,
        timestamp: item.timestamp ?? null,
        author: item.ownerUsername ?? item.ownerId ?? null,
        text,
      }
    }
    case 'tiktok': {
      const text = item.text ?? ''
      return {
        tags: [...(item.hashtags ?? []).map((h) => h?.name).filter(Boolean), ...tagsFromText(text)],
        engagement: num(item.diggCount) + num(item.commentCount) + num(item.shareCount) + num(item.collectCount),
        views: num(item.playCount) || null,
        timestamp: item.createTimeISO ?? (item.createTime ? new Date(item.createTime * 1000).toISOString() : null),
        author: item.authorMeta?.name ?? item.authorMeta?.id ?? null,
        text,
      }
    }
    case 'threads': {
      const text = item.text ?? ''
      return {
        tags: [...(item.hashtags ?? []), ...tagsFromText(text)],
        engagement: num(item.like_count) + num(item.reply_count) + num(item.repost_count) + num(item.quote_count),
        views: num(item.view_count) || null,
        timestamp: item.created_at ?? null,
        author: item.author ?? item.author_id ?? null,
        text,
      }
    }
    default:
      return null
  }
}

const RECENT_WINDOW_MS = 48 * 60 * 60 * 1000

/**
 * Minimum posts before the 48h ratio is meaningful. Also note what this ratio
 * is NOT: actors tend to return newest-first, so it partly reflects the
 * scraper's sort order rather than the topic's real momentum. It is a weak
 * signal deliberately kept at 40% weight, never a growth rate.
 */
const MIN_POSTS_FOR_GROWTH = 3

/**
 * Tally hashtags across scraped posts into topic rows matching the shape the
 * fixture set produces, so everything downstream stays on one code path.
 *
 * `growth7d` here is a RECENCY RATIO (percent of this tag's posts published in
 * the last 48h), not a real week-over-week growth figure — no actor exposes
 * one. It is the closest honest signal available from the same data.
 */
export function aggregatePostsToTopics(posts, { now = Date.now(), minAuthors = 2, exclude = new Set() } = {}) {
  const byTag = new Map()

  for (const post of posts) {
    const seen = new Set()
    for (const raw of post.tags) {
      const tag = String(raw).replace(/^#/, '').trim().toLowerCase()
      if (!tag || tag.length < 2 || JUNK_TAGS.has(tag)) continue
      // The seed terms are in every post *because we searched for them*.
      // Leaving them in makes the top of the list a mirror of the query.
      if (exclude.has(tag)) continue
      if (seen.has(tag)) continue // one post counts once per tag
      seen.add(tag)

      const entry = byTag.get(tag) ?? {
        tag, postCount: 0, engagement: 0, views: 0, recentCount: 0,
        platforms: new Set(), authors: new Set(), samples: [],
      }
      entry.postCount += 1
      if (post.author) entry.authors.add(post.author)
      entry.engagement += post.engagement
      entry.views += post.views ?? 0
      const ts = post.timestamp ? Date.parse(post.timestamp) : NaN
      if (Number.isFinite(ts) && now - ts <= RECENT_WINDOW_MS) entry.recentCount += 1
      entry.platforms.add(post.platform)
      if (entry.samples.length < 2 && post.text) entry.samples.push(post.text.slice(0, 120))
      byTag.set(tag, entry)
    }
  }

  const rows = []
  for (const e of byTag.values()) {
    // Distinct accounts, not post count: a tag used 14 times by one account is
    // that account's habit; used once each by 14 accounts, it is a trend.
    const authorCount = e.authors.size || e.postCount
    if (authorCount < minAuthors) continue
    rows.push({
      tag: `#${e.tag}`,
      title: e.samples[0]?.replace(/\s+/g, ' ').slice(0, 60) || `#${e.tag}`,
      platform: [...e.platforms][0] ?? 'apify',
      volume: authorCount,
      postCount: e.postCount,
      // A tag with 2 posts that both happen to be recent scores 100% and tops
      // the chart on pure noise. Below MIN_POSTS_FOR_GROWTH the ratio says
      // nothing, so report null — normalize() then treats it as neutral rather
      // than as a perfect score.
      growth7d: e.postCount >= MIN_POSTS_FOR_GROWTH
        ? Math.round((e.recentCount / e.postCount) * 100)
        : null,
      engagementRate: null, // no reliable per-tag impression base; heat ignores it
      samples: e.samples,
      /** Extra context the UI can show without pretending it is platform volume. */
      sampleEngagement: e.engagement,
      sampleViews: e.views || null,
      platformsSeen: [...e.platforms],
    })
  }
  return rows.sort((a, b) => b.volume - a.volume || b.postCount - a.postCount)
}

/**
 * Fetch and aggregate topics for one region.
 * Returns `{ topics, errors, postsScraped }`. A platform that fails does not
 * take the whole request down.
 */
export async function fetchRegionTopics(region, platforms, { limit = 40 } = {}) {
  if (!isApifyConfigured()) {
    return { topics: [], errors: [{ platform: 'all', message: 'APIFY_TOKEN not configured' }], postsScraped: 0 }
  }

  const seeds = REGION_SEEDS[region] ?? REGION_SEEDS.GLOBAL
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), apify.timeoutMs)

  const results = await Promise.allSettled(
    platforms.map(async (platform) => {
      const actorId = apify.actors[platform]
      if (!actorId) throw new Error(`no actor configured for platform "${platform}"`)
      const items = await runActor(actorId, buildInput(platform, seeds, limit), controller.signal)
      return items.map((i) => toPost(i, platform)).filter(Boolean).map((p) => ({ ...p, platform }))
    }),
  )
  clearTimeout(timer)

  const posts = []
  const errors = []
  results.forEach((r, i) => {
    if (r.status === 'fulfilled') posts.push(...r.value)
    else errors.push({ platform: platforms[i], message: String(r.reason?.message ?? r.reason).slice(0, 300) })
  })

  const exclude = new Set(
    [...seeds.tags, ...seeds.keywords.flatMap((k) => k.split(/\s+/))]
      .map((t) => t.replace(/^#/, '').trim().toLowerCase())
      .filter(Boolean),
  )

  let topics = aggregatePostsToTopics(posts, { exclude })
  if (!topics.length && posts.length) {
    topics = aggregatePostsToTopics(posts, { exclude, minAuthors: 1 })
    if (topics.length) {
      errors.push({ platform: 'all', message: `樣本偏小，已放寬為單一帳號的 tag 也計入（共 ${posts.length} 則貼文）` })
    }
  }

  return { topics, errors, postsScraped: posts.length }
}
