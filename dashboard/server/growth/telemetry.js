import { db } from './store.js'
import { newId } from './ids.js'
import { emit, dedupeKey } from './events.js'
import { notFound, badRequest } from './validate.js'
import { getPlatform } from './platforms.js'

/**
 * Telemetry Collector — FR-P0-09, GHOS-008, SYSTEM_ARCHITECTURE.md §3.10.
 *
 * Two layers, deliberately:
 *
 *   metric_snapshots — the platform's raw payload, exactly as received
 *   metric_events    — normalized, with the normalizer version stamped on it
 *
 * The spec insists on the split and it earns its cost the first time a
 * normalization rule changes: raw snapshots let every historical metric be
 * recomputed, whereas a single normalized table means a rule change silently
 * makes old and new numbers incomparable — and every Winner decision built on
 * them unreproducible.
 */

export const NORMALIZER_VERSION = '1.0.0'

/**
 * Platform metric names → the canonical set the funnel counts in. Where a
 * platform has no equivalent, there is no entry — an absent metric must read
 * as absent, never as zero.
 */
const CANONICAL = {
  // `impressions`, `reach` and `views` are three different measurements and
  // each keeps its own canonical name. Folding views into impressions would
  // make a TikTok play and an X impression the same number, which they are
  // not — and the funnel would then be comparing across platforms without
  // saying so. Consumers that need "whatever the denominator is" fall back
  // across all three explicitly (evaluator.js TRIAL_METRIC, portfolio.js).
  impressions: ['impressions', 'impression_count'],
  reach: ['reach', 'unique_reach'],
  views: ['views', 'view_count', 'play_count', 'video_views'],
  likes: ['likes', 'like_count', 'favorites', 'diggs'],
  comments: ['comments', 'comment_count', 'replies', 'reply_count'],
  shares: ['shares', 'share_count', 'reposts', 'repost_count', 'retweets'],
  saves: ['saves', 'saved', 'collects', 'bookmarks'],
  clicks: ['clicks', 'link_clicks', 'url_clicks', 'website_clicks'],
  follows: ['follows', 'new_followers', 'profile_follows'],
  watch_time: ['watch_time', 'total_watch_time', 'average_watch_time'],
  profile_visits: ['profile_visits', 'profile_views'],
}

const CANONICAL_NAMES = Object.keys(CANONICAL)

/** Reverse index: any known platform key → canonical name. */
const LOOKUP = {}
for (const [canonical, aliases] of Object.entries(CANONICAL)) {
  for (const alias of aliases) LOOKUP[alias] = LOOKUP[alias] ?? canonical
}

export function normalise(rawPayload) {
  const out = {}
  const unmapped = []
  for (const [key, value] of Object.entries(rawPayload ?? {})) {
    const num = Number(value)
    if (!Number.isFinite(num)) continue
    const canonical = LOOKUP[String(key).toLowerCase()]
    if (!canonical) {
      unmapped.push(key)
      continue
    }
    // A platform can report both `views` and `play_count`; keep the larger
    // rather than whichever arrived last.
    out[canonical] = Math.max(out[canonical] ?? 0, num)
  }
  return { metrics: out, unmapped, normalizerVersion: NORMALIZER_VERSION }
}

/**
 * Ingest one snapshot for a publication.
 *
 * Idempotent on (publicationId, capturedAt, payload hash): platform syncs get
 * re-run, and a re-run must not double the impression count.
 */
export function ingestSnapshot(publicationId, rawPayload, { capturedAt = null, source = 'manual' } = {}) {
  const publication = db.get('publications', publicationId)
  if (!publication) throw notFound(`Publication ${publicationId}`)
  if (publication.status !== 'published') throw badRequest(`publication 狀態為 ${publication.status}，尚未發布，不接受成效資料。`)

  const at = capturedAt ?? new Date().toISOString()
  const key = dedupeKey('snapshot', publicationId, at, JSON.stringify(rawPayload))

  const { row: snapshot, inserted } = db.upsert('metricSnapshots', (r) => r.dedupeKey === key, {
    id: newId('metricSnapshot'),
    publicationId,
    experimentId: publication.experimentId,
    armId: publication.armId,
    productId: publication.productId,
    platform: publication.platform,
    capturedAt: at,
    rawPayload,
    source,
    dedupeKey: key,
    sourceVersion: NORMALIZER_VERSION,
  })

  if (!inserted) return { snapshot, events: [], duplicate: true }

  const { metrics, unmapped } = normalise(rawPayload)
  const events = []

  for (const [name, value] of Object.entries(metrics)) {
    // Metrics are cumulative counters, not deltas. Storing one row per
    // (publication, metric, capture) and taking the max at read time means a
    // platform that resets or lags cannot make a total go backwards.
    const eventKey = dedupeKey('metric', publicationId, name, at)
    const { row } = db.upsert('metricEvents', (r) => r.dedupeKey === eventKey, {
      id: newId('metricEvent'),
      publicationId,
      experimentId: publication.experimentId,
      armId: publication.armId,
      productId: publication.productId,
      platform: publication.platform,
      metricName: name,
      metricValue: value,
      occurredAt: at,
      capturedAt: at,
      snapshotId: snapshot.id,
      normalizerVersion: NORMALIZER_VERSION,
      dedupeKey: eventKey,
    })
    events.push(row)
  }

  db.update('publications', publicationId, { lastMetricSyncAt: at })

  emit('publication.metric.updated', {
    productId: publication.productId, experimentId: publication.experimentId, armId: publication.armId,
    publicationId, platform: publication.platform,
    source: `telemetry:${source}`,
    idempotencyKey: key,
    properties: { metrics, unmapped, capturedAt: at },
  })

  return { snapshot, events, duplicate: false, unmapped }
}

/** Latest value per metric for a publication. */
export function currentMetrics(publicationId) {
  const rows = db.filter('metricEvents', (m) => m.publicationId === publicationId)
  const out = {}
  for (const r of rows) out[r.metricName] = Math.max(out[r.metricName] ?? 0, Number(r.metricValue) || 0)
  return out
}

/** Summed across all publications of an arm. */
export function armMetrics(armId) {
  const pubs = db.filter('publications', (p) => p.armId === armId)
  const out = {}
  for (const pub of pubs) {
    for (const [name, value] of Object.entries(currentMetrics(pub.id))) out[name] = (out[name] ?? 0) + value
  }
  return out
}

export function experimentMetrics(experimentId) {
  const arms = db.listAsc('arms', { experimentId })
  const perArm = arms.map((a) => ({ armId: a.id, label: a.label, platform: a.platform, metrics: armMetrics(a.id) }))
  const total = {}
  for (const a of perArm) for (const [k, v] of Object.entries(a.metrics)) total[k] = (total[k] ?? 0) + v
  return { perArm, total }
}

/**
 * What a platform *can* report — so the Dashboard can distinguish "0 clicks"
 * from "this platform does not report clicks", which are entirely different
 * facts about an experiment.
 */
export const availableMetrics = (platform) => getPlatform(platform)?.telemetry ?? []

export const CANONICAL_METRICS = CANONICAL_NAMES

export const listSnapshots = (filter = {}, limit = 200) => db.list('metricSnapshots', filter).slice(0, limit)
