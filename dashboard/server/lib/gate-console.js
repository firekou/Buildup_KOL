/**
 * Optional password gate for the operator console.
 *
 * This exists because of one specific consequence of hosting the public
 * archive on the same service: the moment a bio link points at this domain,
 * anyone can edit the URL down to `/` and reach the Growth OS console — the
 * product record, the cost ledger, the audit log, the review queue. That was
 * survivable while the service had no public entry point. It stops being
 * survivable the day the archive goes live.
 *
 * Two deliberate choices:
 *
 * 1. **Off unless configured.** No `DASHBOARD_PASSWORD` means no gate and no
 *    behaviour change. A security feature that can lock the owner out of their
 *    own dashboard on a deploy they didn't expect is worse than the exposure.
 * 2. **The public surface is an explicit allowlist, not a prefix guess.** Only
 *    the archive pages and the tracking redirect stay open. Anything added
 *    later is private until someone adds it here on purpose.
 *
 * This is HTTP Basic over TLS: enough to keep an operator console out of
 * search results and off a curious reader's screen. It is not an auth system,
 * and it is not what you would put in front of user accounts.
 */

const PUBLIC_PATHS = [
  /^\/notes(\/|$)/, // the archive itself
  /^\/api\/growth\/t\/[^/]+$/, // the tracked redirect an archive page links to
  /^\/api\/health$/, // Railway's healthcheck
]

const isPublic = (path) => PUBLIC_PATHS.some((re) => re.test(path))

export function consoleGate() {
  const password = process.env.DASHBOARD_PASSWORD

  if (!password) {
    return (req, res, next) => next()
  }

  const expected = 'Basic ' + Buffer.from(`admin:${password}`).toString('base64')

  return (req, res, next) => {
    if (isPublic(req.path)) return next()

    const given = req.headers.authorization ?? ''
    // Length check first: timingSafeEqual throws on a length mismatch, and the
    // length of a rejected header is not a secret worth protecting.
    const ok = given.length === expected.length && given === expected
    if (ok) return next()

    res.set('WWW-Authenticate', 'Basic realm="Growth OS", charset="UTF-8"')
    return res.status(401).type('text/plain').send('需要密碼。公開的檔案庫在 /notes。')
  }
}
