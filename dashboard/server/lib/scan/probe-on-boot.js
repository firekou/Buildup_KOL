import { probeOnce } from './probe-window.js'

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
 * Spec format: `platform:tier,tier,...` separated by `;`
 *   SCAN_PROBE_ON_BOOT="tiktok:20,100,300;instagram:20,100"
 */

const PREFIX = '[b0probe]'

function parseSpec(spec) {
  return String(spec)
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const [platform, tiers = '50'] = part.split(':')
      return {
        platform: platform.trim(),
        tiers: tiers
          .split(',')
          .map((t) => Number(t.trim()))
          .filter((n) => Number.isFinite(n) && n > 0),
      }
    })
    .filter((p) => p.platform && p.tiers.length)
}

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

  const total = plan.reduce((n, p) => n + p.tiers.length, 0)
  console.log(`${PREFIX} START region=${region} runs=${total} spec=${spec}`)

  // Detached on purpose — the healthcheck must not wait on actor runs.
  ;(async () => {
    for (const { platform, tiers } of plan) {
      for (const requested of tiers) {
        // Sequential, not parallel: three concurrent actor runs against the
        // same account is a good way to hit a rate limit and mistake it for
        // "the actor cannot reach back that far".
        const result = await probeOnce({ platform, region, requested })
        emit(result)
      }
    }
    console.log(`${PREFIX} DONE`)
  })().catch((err) => {
    console.log(`${PREFIX} FATAL ${String(err?.message ?? err).slice(0, 300)}`)
  })
}
