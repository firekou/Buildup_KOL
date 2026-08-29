import { db } from './store.js'
import { newId, shortHash } from './ids.js'
import { emit, dedupeKey } from './events.js'
import { validator, badRequest } from './validate.js'
import { fetchNewsSignals, fetchSocialSignals, normaliseManualSignal, SOURCE_TYPES } from './adapters/signal-sources.js'
import { runJob } from './jobs.js'

/**
 * Signal intake — 事件查找與尋找最新事件. GHOS-021 / 080 / 081 / 082.
 *
 * A Signal is an observation, full stop. It does not know which product it is
 * relevant to, it carries no verdict, and it is never deleted when it turns
 * out to be uninteresting. That discipline is what makes the Opportunity layer
 * re-runnable: when the relevance rules change we can replay six weeks of
 * signals instead of waiting six weeks for new ones.
 */

export { SOURCE_TYPES }

/**
 * Freshness bands, in hours. `why_now` decays — an event that broke four days
 * ago is a different creative problem from one that broke this morning, and
 * the Opportunity Radar has to say which it is looking at.
 */
export const FRESHNESS_BANDS = [
  { key: 'breaking', maxAgeHours: 6, label: '突發（6h 內）', hint: '仍在擴散，fast lane 有意義。' },
  { key: 'fresh', maxAgeHours: 24, label: '新鮮（24h 內）', hint: '主流討論期，正常流程來得及。' },
  { key: 'recent', maxAgeHours: 72, label: '近期（3 天內）', hint: '需要新角度才有增量，不要只是複述。' },
  { key: 'stale', maxAgeHours: 24 * 14, label: '過期（2 週內）', hint: '只適合當常青題材的引子，不要宣稱時效性。' },
  { key: 'archival', maxAgeHours: Infinity, label: '存檔', hint: '沒有時效價值，僅供 pattern 分析。' },
]

export function freshnessOf(occurredAt, now = Date.now()) {
  if (!occurredAt) return { key: 'unknown', label: '時間未知', ageHours: null, hint: '來源沒有給時間戳，不得宣稱時效性。' }
  const ageHours = (now - Date.parse(occurredAt)) / 3_600_000
  if (!Number.isFinite(ageHours)) return { key: 'unknown', label: '時間未知', ageHours: null, hint: '時間戳無法解析。' }
  const band = FRESHNESS_BANDS.find((b) => ageHours <= b.maxAgeHours) ?? FRESHNESS_BANDS.at(-1)
  return { key: band.key, label: band.label, hint: band.hint, ageHours: Math.round(ageHours * 10) / 10 }
}

/**
 * Natural key for dedupe. Two feeds carrying the same wire story must collapse
 * into one signal, or the radar shows five "different" events that are one.
 * Title is normalised hard — outlets append their own name and section.
 */
const naturalKey = (raw) => {
  const title = String(raw.title ?? '')
    .toLowerCase()
    .replace(/\s*[-|｜–—]\s*[^-|｜–—]{1,20}$/, '') // trailing " - 三立新聞網"
    .replace(/[\s\p{P}]/gu, '')
    .slice(0, 80)
  return shortHash(`${raw.sourceType}|${title}`)
}

/** Insert unless the same story is already on file; returns `{ signal, duplicate }`. */
export function ingest(raw) {
  if (!raw?.title) throw badRequest('signal 必須有 title')
  const key = naturalKey(raw)
  const { row, inserted } = db.upsert(
    'signals',
    (r) => r.naturalKey === key,
    {
      id: newId('signal'),
      naturalKey: key,
      sourceType: raw.sourceType,
      sourceRef: raw.sourceRef ?? null,
      title: raw.title,
      summary: raw.summary ?? '',
      url: raw.url ?? null,
      region: raw.region ?? null,
      occurredAt: raw.occurredAt ?? null,
      ingestedAt: new Date().toISOString(),
      evidenceRefs: raw.evidence ?? [],
      rawPayload: raw.raw ?? null,
      status: 'new',
    },
    // A re-sighting is itself information — an event still in the feeds two
    // days later is corroborated, which `evidenceRefs.length` records.
    null,
  )

  if (inserted) {
    emit('signal.received', {
      source: `signal_adapter:${raw.sourceType}`,
      idempotencyKey: dedupeKey('signal', key),
      properties: { signalId: row.id, sourceType: raw.sourceType, title: raw.title },
    })
  } else {
    const merged = mergeEvidence(row.evidenceRefs, raw.evidence ?? [])
    if (merged.length !== row.evidenceRefs.length) {
      db.update('signals', row.id, { evidenceRefs: merged, lastSeenAt: new Date().toISOString() })
    }
  }

  return { signal: db.get('signals', row.id), duplicate: !inserted }
}

const mergeEvidence = (existing = [], incoming = []) => {
  const seen = new Set(existing.map((e) => `${e.type}:${e.url ?? e.outlet ?? e.tag ?? ''}`))
  const out = [...existing]
  for (const e of incoming) {
    const k = `${e.type}:${e.url ?? e.outlet ?? e.tag ?? ''}`
    if (!seen.has(k)) {
      seen.add(k)
      out.push(e)
    }
  }
  return out
}

export function createManualSignal(input) {
  validator(input).required('title', { label: '事件標題' }).done()
  return ingest(normaliseManualSignal(input))
}

export function listSignals({ sourceType = null, region = null, status = null, limit = 100, since = null } = {}) {
  const now = Date.now()
  return db
    .list('signals', { sourceType, region, status })
    .filter((s) => (since ? String(s.ingestedAt) >= since : true))
    .slice(0, limit)
    .map((s) => ({
      ...s,
      freshness: freshnessOf(s.occurredAt ?? s.ingestedAt, now),
      corroboration: (s.evidenceRefs ?? []).length,
      opportunityCount: db.count('opportunities', { signalId: s.id }),
    }))
}

export const getSignal = (id) => {
  const s = db.get('signals', id)
  return s ? { ...s, freshness: freshnessOf(s.occurredAt ?? s.ingestedAt), opportunities: db.list('opportunities', { signalId: id }) } : null
}

export const setStatus = (id, status) => db.update('signals', id, { status })

/* ----------------------------------------------------------- scan (job) */

/**
 * One scan pass across the configured adapters. Runs inside `runJob` so a
 * failure is retryable and visible in System Ops rather than a lost promise
 * (GHOS-X03).
 */
export async function scan({ region = 'TW', sources = ['news', 'social_trend'], limit = 20, query = null } = {}) {
  return runJob('signal.scan', { region, sources, limit, query }, async () => {
    const summary = { region, ingested: 0, duplicates: 0, bySource: {}, failures: [] }

    if (sources.includes('news')) {
      const { signals, failures } = await fetchNewsSignals({ region, limit, query })
      summary.failures.push(...failures.map((f) => ({ source: 'news', ...f })))
      summary.bySource.news = { fetched: signals.length, ingested: 0, duplicates: 0 }
      for (const raw of signals) {
        const { duplicate } = ingest(raw)
        summary.bySource.news[duplicate ? 'duplicates' : 'ingested'] += 1
        summary[duplicate ? 'duplicates' : 'ingested'] += 1
      }
    }

    if (sources.includes('social_trend')) {
      const { signals, source } = await fetchSocialSignals({ region, limit })
      summary.bySource.social_trend = { fetched: signals.length, ingested: 0, duplicates: 0, source }
      for (const raw of signals) {
        const { duplicate } = ingest(raw)
        summary.bySource.social_trend[duplicate ? 'duplicates' : 'ingested'] += 1
        summary[duplicate ? 'duplicates' : 'ingested'] += 1
      }
    }

    return summary
  })
}
