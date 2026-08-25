import { probeOnce } from './probe-window.js'
import { NEWS_FEEDS, probeFeed, probeRateLimit } from './probe-news.js'
import { discoverAuthors, probeProfile, compareRuns, projectCost } from './probe-actor.js'

/**
 * Run the Batch 0 source probe once at boot and print the results to stdout.
 *
 * Why this exists alongside the HTTP endpoint: the dev sandbox's proxy denies
 * CONNECT to `api.apify.com` AND to the service's own public domain, so there
 * is no path from the workstation to either the actor or the deployed endpoint.
 * The container has both. Railway's log stream is therefore the only channel
 * out — so the probe writes its findings there.
 *
 * This is a temporary, opt-in path for Batch 0, not a permanent feature:
 *
 *   - It does nothing unless `SCAN_PROBE_ON_BOOT` is set.
 *   - It runs AFTER `listen()` and is never awaited, so the healthcheck is not
 *     delayed by a multi-minute actor run.
 *   - Every actor run costs money, and a container restart re-runs it. Remove
 *     the variable as soon as the results are collected.
 *
 * Spec format: `kind:arg:arg` separated by `;`
 *
 *   window:tiktok:20,100,300   0-4 / 0-5 · age reach and pagination depth
 *   news:TW,HK,SG,JP,US        0-1 / 0-2 · RSS feeds per region
 *   profile:tiktok:5:30        0-3 / 0-6 / 0-7 / 0-8 / 0-10 · discover N authors,
 *                              then fetch each one's own recent posts
 *   stability:tiktok:100       0-9 · run the same discovery twice, compare ids
 *
 * A bare `platform:tiers` is still accepted and means `window:` — the first
 * probe run used that form and the report cites it.
 */

const PREFIX = '[b0probe]'

const KINDS = new Set(['window', 'news', 'profile', 'stability'])

function parseSpec(spec) {
  return String(spec)
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const bits = part.split(':').map((b) => b.trim())
      // Backwards compatible: `tiktok:20,100` == `window:tiktok:20,100`.
      const kind = KINDS.has(bits[0]) ? bits.shift() : 'window'
      return { kind, args: bits }
    })
    .filter((p) => p.args.length)
}

const nums = (s) => String(s ?? '').split(',').map((t) => Number(t.trim())).filter((n) => Number.isFinite(n) && n > 0)

/**
 * One compact JSON line per probe so a log reader can pull them out whole.
 * `input` and `seeds` are included deliberately: docs/15 §2 requires the probe
 * write-up to record real responses AND be reproducible by hand.
 */
function emit(payload) {
  try {
    console.log(`${PREFIX} ${JSON.stringify(payload)}`)
  } catch (err) {
    console.log(`${PREFIX} {"ok":false,"error":"serialise failed: ${String(err.message).slice(0, 120)}"}`)
  }
}

export function startBootProbe({ region = 'TW' } = {}) {
  const spec = process.env.SCAN_PROBE_ON_BOOT
  if (!spec) return

  const plan = parseSpec(spec)
  if (!plan.length) {
    console.log(`${PREFIX} spec 解析不出任何項目：${spec}`)
    return
  }

  console.log(`${PREFIX} START region=${region} steps=${plan.length} spec=${spec}`)

  // Detached on purpose — the healthcheck must not wait on actor runs.
  ;(async () => {
    for (const { kind, args } of plan) {
      // Sequential across every kind: concurrent actor runs against one account
      // are a good way to hit a rate limit and then misread it as "the actor
      // cannot do this".
      if (kind === 'window') await runWindow(args, region)
      else if (kind === 'news') await runNews(args)
      else if (kind === 'profile') await runProfile(args, region)
      else if (kind === 'stability') await runStability(args, region)
      else emit({ ok: false, kind, error: `unknown probe kind "${kind}"` })
    }
    console.log(`${PREFIX} DONE`)
  })().catch((err) => {
    console.log(`${PREFIX} FATAL ${String(err?.message ?? err).slice(0, 300)}`)
  })
}

/** 0-4 / 0-5 */
async function runWindow([platform, tiers], region) {
  for (const requested of nums(tiers ?? '50')) {
    emit({ probe: 'window', ...(await probeOnce({ platform, region, requested })) })
  }
}

/** 0-1 / 0-2 */
async function runNews([regionList]) {
  const regions = String(regionList ?? 'TW').split(',').map((r) => r.trim()).filter(Boolean)
  for (const r of regions) {
    for (const feed of NEWS_FEEDS[r] ?? []) {
      emit({ probe: 'news', ...(await probeFeed({ region: r, ...feed })) })
    }
  }
  // 0-1's rate-limit half, on one feed only — hammering every feed to find a
  // limit would itself be the thing that trips it.
  const first = NEWS_FEEDS[regions[0]]?.[0]
  if (first) emit({ probe: 'news-rate', ...(await probeRateLimit({ url: first.url, times: 5 })) })
}

/** 0-3 / 0-6 / 0-7 / 0-8 / 0-10 */
async function runProfile([platform = 'tiktok', count = '5', perProfile = '30'], region) {
  const wanted = nums(count)[0] ?? 5
  const depth = nums(perProfile)[0] ?? 30

  const discovery = await discoverAuthors({ platform, region, requested: 100 })
  emit({ probe: 'discover', ...discovery, authors: discovery.authors?.slice(0, 20), postIds: undefined })
  if (!discovery.ok || !discovery.authors?.length) return

  // Take them in the actor's own order — that IS the truncation bias 0-7 asks
  // about, so sampling randomly here would hide the thing being measured.
  const targets = discovery.authors.slice(0, wanted)
  const startedAt = Date.now()
  let fetched = 0
  for (const t of targets) {
    const r = await probeProfile({ platform, profile: t.author, requested: depth })
    emit({ probe: 'profile', upstreamRank: t.upstreamRank, ...r })
    if (r.ok) fetched += 1
  }
  emit({ probe: 'cost', ...projectCost({ authorsFetched: fetched || targets.length, totalElapsedMs: Date.now() - startedAt, target: 100 }) })
}

/** 0-9 */
async function runStability([platform = 'tiktok', requested = '100'], region) {
  const n = nums(requested)[0] ?? 100
  const a = await discoverAuthors({ platform, region, requested: n })
  const b = await discoverAuthors({ platform, region, requested: n })
  emit({
    probe: 'stability',
    ok: a.ok && b.ok,
    requested: n,
    runA: { rawItems: a.rawItems, distinctAuthors: a.distinctAuthors, ids: a.postIds?.length, missingId: a.postsMissingId },
    runB: { rawItems: b.rawItems, distinctAuthors: b.distinctAuthors, ids: b.postIds?.length, missingId: b.postsMissingId },
    posts: compareRuns(a.postIds, b.postIds),
    authors: compareRuns(a.authors?.map((x) => x.author), b.authors?.map((x) => x.author)),
  })
}
