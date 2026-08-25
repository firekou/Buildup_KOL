import { apify, isApifyConfigured } from '../../config.js'
import { runActor, buildInput, toPost, seedTermsFor } from '../topics/apify.js'

/**
 * Batch 0 · probes 0-4 and 0-5 (docs/15 §2.1).
 *
 *   0-4  Do the hashtag / keyword actors actually reach back 180 days, or do
 *        they only return "recent / top N"?
 *   0-5  Is pagination controllable? How far back can we page?
 *
 * Why this exists as a deployed endpoint rather than a local script: the dev
 * sandbox's proxy denies CONNECT to `api.apify.com`, and the token lives only
 * in Railway's variables. So the probe runs where the credentials and the
 * network are — exactly what docs/15 §2 said Batch 0 would require.
 *
 * This module MEASURES. It does not judge. Whether "half a year" survives as a
 * name for the feature is a conclusion drawn in the write-up from these
 * numbers, not something computed in here — the same separation the rest of
 * the system keeps between a reading and a verdict.
 */

const DAY_MS = 86_400_000

/** Hard ceiling so a typo in a query param cannot start a runaway actor job. */
const MAX_REQUESTED = 400

const iso = (ms) => (Number.isFinite(ms) ? new Date(ms).toISOString() : null)

/**
 * Everything about the age distribution of one actor run's results.
 *
 * `sortedDescending` is the tell for 0-4: an actor that returns a "most recent
 * N" slice hands back a monotonically decreasing date sequence. One that
 * genuinely searches a window does not have to.
 */
function describeAges(posts, { now = Date.now(), windowDays = 180 } = {}) {
  const times = posts.map((p) => (p.timestamp ? Date.parse(p.timestamp) : NaN))
  const dated = times.filter(Number.isFinite)
  const sorted = [...dated].sort((a, b) => a - b)

  const monthly = {}
  for (const t of dated) {
    const key = new Date(t).toISOString().slice(0, 7)
    monthly[key] = (monthly[key] ?? 0) + 1
  }

  // Is the RETURNED ORDER newest-first? Compare consecutive dated items in the
  // order the actor gave them, not the sorted copy.
  let descendingPairs = 0
  let comparablePairs = 0
  for (let i = 1; i < times.length; i += 1) {
    if (!Number.isFinite(times[i]) || !Number.isFinite(times[i - 1])) continue
    comparablePairs += 1
    if (times[i] <= times[i - 1]) descendingPairs += 1
  }

  const cutoff = now - windowDays * DAY_MS
  const oldest = sorted.length ? sorted[0] : null
  const newest = sorted.length ? sorted.at(-1) : null

  return {
    returned: posts.length,
    dated: dated.length,
    undated: posts.length - dated.length,
    oldestAt: iso(oldest),
    newestAt: iso(newest),
    /** How far back the returned set actually reaches, in days from now. */
    oldestAgeDays: oldest === null ? null : Math.round(((now - oldest) / DAY_MS) * 10) / 10,
    newestAgeDays: newest === null ? null : Math.round(((now - newest) / DAY_MS) * 10) / 10,
    /** The span the results themselves cover — not the same as reach. */
    spanDays: sorted.length >= 2 ? Math.round(((newest - oldest) / DAY_MS) * 10) / 10 : 0,
    withinWindow: dated.filter((t) => t >= cutoff).length,
    olderThanWindow: dated.filter((t) => t < cutoff).length,
    monthlyHistogram: Object.fromEntries(Object.entries(monthly).sort(([a], [b]) => a.localeCompare(b))),
    returnOrderDescendingRatio:
      comparablePairs > 0 ? Math.round((descendingPairs / comparablePairs) * 100) / 100 : null,
    comparablePairs,
  }
}

/**
 * One actor run at one requested size. Returns raw measurements plus the exact
 * input that produced them, because the write-up has to be reproducible.
 */
export async function probeOnce({ platform, region = 'TW', requested = 50, windowDays = 180, timeoutMs = 240_000 } = {}) {
  if (!isApifyConfigured()) {
    return { ok: false, error: 'APIFY_TOKEN not configured' }
  }

  const actorId = apify.actors[platform]
  if (!actorId) return { ok: false, error: `no actor configured for platform "${platform}"` }

  const limit = Math.min(Math.max(Number(requested) || 50, 1), MAX_REQUESTED)
  const seeds = seedTermsFor(region)
  const input = buildInput(platform, seeds, limit)

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), Math.min(Number(timeoutMs) || 240_000, 300_000))
  const startedAt = Date.now()

  try {
    const items = await runActor(actorId, input, controller.signal)
    const elapsedMs = Date.now() - startedAt
    const posts = items.map((i) => toPost(i, platform)).filter(Boolean)

    return {
      ok: true,
      platform,
      region,
      actorId,
      requested: limit,
      /** The literal actor input, so this run can be repeated by hand. */
      input,
      seeds,
      elapsedMs,
      rawItems: items.length,
      /** Did asking for `limit` actually yield `limit`? */
      fulfilledRatio: limit > 0 ? Math.round((items.length / limit) * 100) / 100 : null,
      ages: describeAges(posts, { windowDays }),
      /** A couple of real rows, so the write-up can show what a record looks like. */
      sampleTimestamps: posts.slice(0, 3).map((p) => p.timestamp),
    }
  } catch (err) {
    return {
      ok: false,
      platform,
      region,
      actorId,
      requested: limit,
      input,
      elapsedMs: Date.now() - startedAt,
      error: String(err?.message ?? err).slice(0, 500),
      aborted: controller.signal.aborted,
    }
  } finally {
    clearTimeout(timer)
  }
}
