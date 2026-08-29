import { NEWS_FEEDS } from '../../lib/scan/probe-news.js'
import { getRegionTopics } from '../../lib/topics/index.js'
import { isApifyConfigured } from '../../config.js'

/**
 * Signal source adapters — GHOS-080, SYSTEM_ARCHITECTURE.md §3.2.
 *
 * Every adapter returns the same `RawSignal` shape so `signals.js` never
 * branches on where a signal came from:
 *
 *   { sourceType, sourceRef, title, summary, url, occurredAt, evidence[], raw }
 *
 * Adapters do exactly one thing — fetch and normalise. They do not decide
 * whether a signal is interesting; that is the Opportunity engine's job, and
 * keeping the split is what lets us re-run opportunity scoring over historical
 * signals when the rules change.
 */

export const SOURCE_TYPES = ['manual', 'news', 'social_trend', 'product_event', 'competitor', 'internal_pattern']

const stripCdata = (s = '') => String(s).replace(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/, '$1').trim()
const stripTags = (s = '') => stripCdata(s).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
const grab = (xml, tag) => [...xml.matchAll(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'gi'))].map((m) => m[1])

/* ------------------------------------------------------------------ news */

/**
 * Google/Yahoo RSS per region. Reuses the feed list that Batch 0 already
 * probed (docs/15 §2.1) rather than inventing a second one — those URLs are
 * the ones with recorded evidence of actually working.
 */
export async function fetchNewsSignals({ region = 'TW', limit = 20, timeoutMs = 20_000, query = null } = {}) {
  const feeds = query
    ? [{ source: 'google-search', url: `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=zh-TW&gl=${region}&ceid=${region}:zh-Hant` }]
    : (NEWS_FEEDS[region] ?? NEWS_FEEDS.TW)

  const out = []
  const failures = []

  for (const feed of feeds) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    try {
      const res = await fetch(feed.url, { signal: controller.signal, headers: { 'user-agent': 'buildup-kol-growth-os/1.0' } })
      if (!res.ok) {
        failures.push({ source: feed.source, url: feed.url, status: res.status })
        continue
      }
      const body = await res.text()
      for (const item of grab(body, 'item').slice(0, limit)) {
        const title = stripTags(grab(item, 'title')[0] ?? '')
        if (!title) continue
        const link = stripCdata(grab(item, 'link')[0] ?? '')
        const pubDate = stripCdata(grab(item, 'pubDate')[0] ?? '')
        // Google wraps the real publisher in <source url="…">; <link> is a
        // news.google.com redirect and is useless as an outlet identity.
        const outlet = (item.match(/<source[^>]*url="([^"]+)"[^>]*>([\s\S]*?)<\/source>/i) ?? [])[2]
        const occurredAt = Number.isFinite(Date.parse(pubDate)) ? new Date(pubDate).toISOString() : null
        out.push({
          sourceType: 'news',
          sourceRef: `${feed.source}:${region}`,
          title,
          summary: stripTags(grab(item, 'description')[0] ?? '').slice(0, 500),
          url: link || null,
          occurredAt,
          region,
          evidence: [{ type: 'article', outlet: outlet ? stripTags(outlet) : feed.source, url: link || null, publishedAt: occurredAt }],
          raw: { feed: feed.source, feedUrl: feed.url },
        })
      }
    } catch (err) {
      failures.push({ source: feed.source, url: feed.url, error: String(err?.message ?? err).slice(0, 200) })
    } finally {
      clearTimeout(timer)
    }
  }

  return { signals: out.slice(0, limit), failures, feedCount: feeds.length }
}

/* ---------------------------------------------------------- social trend */

/**
 * Reuses the existing region-topic pipeline, so Growth OS inherits the Apify
 * wiring and — crucially — the `source: 'fixtures'` honesty badge when no
 * token is configured. A social signal built on fixture numbers is marked as
 * such all the way through to the Opportunity Radar.
 */
export async function fetchSocialSignals({ region = 'TW', platforms = ['threads', 'tiktok', 'instagram'], limit = 15 } = {}) {
  const result = await getRegionTopics(region, { platforms, limit, refresh: false })
  const signals = (result.topics ?? []).slice(0, limit).map((t) => ({
    sourceType: 'social_trend',
    sourceRef: `${result.source}:${region}`,
    title: t.title ?? t.tag,
    summary: `${t.tag}｜合併聲量 ${t.volume ?? '—'}｜48h 佔比 ${t.recencyRatio48h ?? '—'}%`,
    url: null,
    occurredAt: new Date().toISOString(),
    region,
    evidence: [
      {
        type: 'social_metric',
        // Never launder fixture numbers into something that reads as measured.
        measured: result.source === 'apify',
        source: result.source,
        tag: t.tag,
        volume: t.volume ?? null,
        platforms: t.platforms ?? [],
        heatConfidence: t.heatConfidence ?? 'none',
      },
    ],
    raw: t,
  }))
  return { signals, source: result.source, measured: isApifyConfigured() }
}

/* ---------------------------------------------------------------- manual */

export function normaliseManualSignal(input) {
  return {
    sourceType: input.sourceType && SOURCE_TYPES.includes(input.sourceType) ? input.sourceType : 'manual',
    sourceRef: input.sourceRef ?? 'operator',
    title: input.title,
    summary: input.summary ?? '',
    url: input.url ?? null,
    occurredAt: input.occurredAt ?? new Date().toISOString(),
    region: input.region ?? null,
    evidence: Array.isArray(input.evidence) ? input.evidence : [],
    raw: input.raw ?? null,
  }
}
