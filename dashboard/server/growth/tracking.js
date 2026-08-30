import { db } from './store.js'
import { newId, shortHash } from './ids.js'
import { badRequest, notFound } from './validate.js'

/**
 * Tracking Link service — GHOS-005, DATA_MODEL.md §5.
 *
 * The attribution priority in the spec puts "direct tracking link / click ID"
 * first for a reason: everything below it is inference. A tracking code is
 * cheap to mint and is the only mechanism that makes a conversion
 * *verifiably* traceable to one publication.
 *
 * The code embeds nothing — it is an opaque key into this table. Encoding the
 * experiment id into the URL would leak the experiment structure to anyone who
 * hovers a link, and would break the moment an id format changed.
 */

/** Short, unambiguous alphabet — no 0/O/1/l, because these get typed by hand. */
const ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'

function mintCode(seed) {
  const digest = shortHash(`${seed}:${Date.now()}:${Math.random()}`)
  let out = ''
  for (let i = 0; i < 8; i += 1) out += ALPHABET[parseInt(digest.slice(i * 2, i * 2 + 2), 16) % ALPHABET.length]
  return out
}

export function createTrackingLink({ productId, campaignId = null, experimentId = null, armId = null, publicationId = null, articleId = null, destinationUrl, medium = 'organic_social', platform = null }) {
  if (!destinationUrl) throw badRequest('destinationUrl 為必填——沒有目的地就沒有可追蹤的連結。')

  let url
  try {
    url = new URL(destinationUrl)
  } catch {
    throw badRequest(`destinationUrl "${destinationUrl}" 不是有效的網址`)
  }

  const code = mintCode(`${experimentId}:${armId}:${articleId}`)
  // Params are appended as well as the code stored, so the product's own
  // analytics can attribute independently of this service — two paths to the
  // same answer is what makes a discrepancy detectable.
  url.searchParams.set('utm_source', platform ?? 'growth_os')
  url.searchParams.set('utm_medium', medium)
  if (campaignId) url.searchParams.set('utm_campaign', campaignId)
  url.searchParams.set('utm_content', code)
  url.searchParams.set('ghos', code)

  return db.insert('trackingLinks', {
    id: newId('trackingLink'),
    productId,
    campaignId,
    experimentId,
    armId,
    publicationId,
    articleId,
    destinationUrl,
    trackedUrl: url.toString(),
    trackingCode: code,
    medium,
    platform,
    clickCount: 0,
  })
}

export const byCode = (code) => db.find('trackingLinks', (l) => l.trackingCode === String(code ?? '').toUpperCase())

export function requireLink(code) {
  const link = byCode(code)
  if (!link) throw notFound(`Tracking code ${code}`)
  return link
}

/**
 * Register a click and hand back the destination. Called by the redirect
 * endpoint. Click counting is intentionally not idempotent — two clicks are
 * two clicks — but the conversion join downstream is.
 */
export function registerClick(code) {
  const link = requireLink(code)
  db.update('trackingLinks', link.id, { clickCount: (link.clickCount ?? 0) + 1, lastClickAt: new Date().toISOString() })
  return link
}

export const listLinks = (filter = {}) => db.list('trackingLinks', filter)
