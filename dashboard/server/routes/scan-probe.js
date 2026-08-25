import crypto from 'node:crypto'
import { Router } from 'express'
import { probeOnce } from '../lib/scan/probe-window.js'

const router = Router()

/**
 * docs/15 §2 · Batch 0 source probe.
 *
 * Token-guarded because it spends money: every call starts a real Apify actor
 * run. The variable name matches the one docs/14 §1.3 already reserves for the
 * cron trigger, so Batch 3 will not need a second secret.
 *
 * When `SCAN_TRIGGER_TOKEN` is unset the endpoint is CLOSED, not open. A probe
 * that silently becomes public the moment someone forgets a variable is the
 * kind of default this repo should not ship.
 */
function authorized(req) {
  const expected = process.env.SCAN_TRIGGER_TOKEN
  if (!expected) return false
  const given = req.get('x-scan-token') ?? ''
  const a = Buffer.from(given)
  const b = Buffer.from(expected)
  // Length check first — timingSafeEqual throws on a length mismatch.
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

router.post('/scan/probe/window', async (req, res, next) => {
  if (!authorized(req)) return res.status(404).json({ error: 'not found' })

  const { platform = 'tiktok', region = 'TW', requested = 50, windowDays = 180 } = req.body ?? {}
  try {
    const result = await probeOnce({ platform, region, requested, windowDays })
    res.status(result.ok ? 200 : 502).json(result)
  } catch (err) {
    next(err)
  }
})

export default router
