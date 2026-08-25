import { apify, isApifyConfigured } from '../../config.js'
import { runActor, buildInput, buildProfileInput, toPost, seedTermsFor } from '../topics/apify.js'
import { describeAges } from './probe-window.js'

/**
 * Batch 0 · probes 0-3, 0-6, 0-7, 0-8, 0-9, 0-10 (docs/15 §2.1).
 *
 *   0-3   Can the TikTok actor list ONE account's recent videos, with playCount?
 *   0-6   How many per account, over what date span?
 *   0-7   What order does the hashtag search return authors in?
 *   0-8   How are private / deleted / region-locked posts marked?
 *   0-9   Re-running the same query — does the sample set stay stable?
 *   0-10  Real cost and latency per author.
 *
 * 0-3 is the one that decides whether the whole spec stands up: no per-account
 * video list means no channel median, and no median means no outlier
 * (docs/14 §3.1). Everything else here is measurement around it.
 *
 * The two stages run in the real order the scan would use — discover authors
 * from a hashtag search, then fetch each author's own recent posts — so 0-10's
 * latency figure is the pipeline's, not a synthetic one.
 */

const DAY_MS = 86_400_000

const median = (xs) => {
  if (!xs.length) return null
  const s = [...xs].sort((a, b) => a - b)
  const m = s.length >> 1
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

/**
 * Stage 1 — discover authors, and record the ORDER the actor returned them in.
 *
 * docs/14 §8.2.1: which authors enter the candidate set is decided by the
 * actor's own ranking, so `upstreamRank` has to be captured here or the
 * truncation bias can never be described.
 */
export async function discoverAuthors({ platform = 'tiktok', region = 'TW', requested = 100, timeoutMs = 240_000 } = {}) {
  if (!isApifyConfigured()) return { ok: false, error: 'APIFY_TOKEN not configured' }
  const actorId = apify.actors[platform]
  const seeds = seedTermsFor(region)
  const input = buildInput(platform, seeds, requested)

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  const startedAt = Date.now()
  try {
    const items = await runActor(actorId, input, controller.signal)
    const posts = items.map((i) => toPost(i, platform)).filter(Boolean)

    // First-seen order == the actor's own ranking.
    const order = []
    const seen = new Map()
    posts.forEach((p, idx) => {
      if (!p.author) return
      if (!seen.has(p.author)) {
        seen.set(p.author, { author: p.author, upstreamRank: order.length + 1, firstItemIndex: idx, posts: 0, views: [] })
        order.push(p.author)
      }
      const e = seen.get(p.author)
      e.posts += 1
      if (Number.isFinite(p.views)) e.views.push(p.views)
    })

    return {
      ok: true, platform, region, actorId, requested, input,
      elapsedMs: Date.now() - startedAt,
      rawItems: items.length,
      postsWithAuthor: posts.filter((p) => p.author).length,
      postsWithoutAuthor: posts.filter((p) => !p.author).length,
      distinctAuthors: order.length,
      authors: order.map((a) => seen.get(a)).map(({ views, ...rest }) => ({
        ...rest,
        medianViewsInSample: median(views),
      })),
      /** 0-9 needs ids to compare two runs. */
      postIds: posts.map((p) => p.id).filter(Boolean),
      postsMissingId: posts.filter((p) => !p.id).length,
    }
  } catch (err) {
    return { ok: false, platform, region, actorId, requested, input, elapsedMs: Date.now() - startedAt, error: String(err?.message ?? err).slice(0, 400) }
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Stage 2 — one account's own recent posts. This is 0-3.
 *
 * The verdict is not "did it return something" but "can a channel median be
 * computed from it": enough posts, with view counts, spread over enough time.
 */
export async function probeProfile({ platform = 'tiktok', profile, requested = 30, timeoutMs = 240_000 } = {}) {
  if (!isApifyConfigured()) return { ok: false, error: 'APIFY_TOKEN not configured' }
  const actorId = apify.actors[platform]
  const input = buildProfileInput(platform, [profile], requested)

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  const startedAt = Date.now()
  try {
    const items = await runActor(actorId, input, controller.signal)
    const elapsedMs = Date.now() - startedAt
    const posts = items.map((i) => toPost(i, platform)).filter(Boolean)
    const views = posts.map((p) => p.views).filter(Number.isFinite)

    // 0-8 — anything the actor flags rather than silently omits.
    const flagged = items.filter((i) => i?.error || i?.errorDescription || i?.isPrivate || i?.privateAccount)
    const flagKeys = [...new Set(flagged.flatMap((i) => Object.keys(i).filter((k) => /error|private|unavailable|removed|blocked/i.test(k))))]

    // Did the actor stay on the requested account?
    const authors = [...new Set(posts.map((p) => p.author).filter(Boolean))]

    return {
      ok: true, platform, profile, actorId, requested, input, elapsedMs,
      rawItems: items.length,
      posts: posts.length,
      /** 0-3 · the field the whole outlier model depends on. */
      withViews: views.length,
      viewsCoverage: posts.length ? Math.round((views.length / posts.length) * 100) / 100 : null,
      medianViews: median(views),
      minViews: views.length ? Math.min(...views) : null,
      maxViews: views.length ? Math.max(...views) : null,
      /** 0-6 · how deep an account's history one call reaches. */
      ages: describeAges(posts),
      /** Did we get the account we asked for, or a mixed bag? */
      authorsReturned: authors.slice(0, 5),
      staysOnProfile: authors.length === 1 && authors[0] != null,
      /** 0-8 */
      flaggedItems: flagged.length,
      flagKeys,
    }
  } catch (err) {
    return { ok: false, platform, profile, actorId, requested, input, elapsedMs: Date.now() - startedAt, error: String(err?.message ?? err).slice(0, 400) }
  } finally {
    clearTimeout(timer)
  }
}

/**
 * 0-9 — run the same discovery twice and compare the returned id sets.
 *
 * If a repeat run hands back a substantially different sample, then week-over-
 * week comparison is comparing two different populations and Track A's
 * cross-week reproducibility does not hold (docs/15 §9).
 */
export function compareRuns(a, b) {
  const A = new Set(a ?? [])
  const B = new Set(b ?? [])
  const inter = [...A].filter((x) => B.has(x)).length
  const union = new Set([...A, ...B]).size
  return {
    sizeA: A.size,
    sizeB: B.size,
    overlap: inter,
    jaccard: union ? Math.round((inter / union) * 1000) / 1000 : null,
    /** Share of run A that reappeared — the number that matters for "can I compare weeks". */
    recallOfA: A.size ? Math.round((inter / A.size) * 1000) / 1000 : null,
  }
}

/** 0-10 — extrapolate the per-author cost from a measured batch. */
export function projectCost({ authorsFetched, totalElapsedMs, target = 100 }) {
  if (!authorsFetched) return null
  const perAuthorMs = Math.round(totalElapsedMs / authorsFetched)
  return {
    authorsFetched,
    perAuthorMs,
    projectedMsFor: target,
    projectedMinutesFor: Math.round((perAuthorMs * target) / 60_000 * 10) / 10,
    note: '只量到耗時。實際 Apify 計費要看 console，這裡拿不到——docs/15 §8。',
  }
}
