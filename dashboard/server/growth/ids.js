import crypto from 'node:crypto'

/**
 * Growth OS identity — DATA_MODEL.md §1 / §4, SYSTEM_ARCHITECTURE.md §2.2.
 *
 * Every object carries a prefixed, sortable ID. The prefix is not decoration:
 * `lineageOf()` and the read models walk foreign keys across a dozen stores,
 * and a bare uuid gives no way to catch "this arm_id is actually an asset_id"
 * before it becomes a silently wrong funnel number.
 *
 * The time component is the first 8 hex chars of the epoch in ms, so IDs sort
 * by creation without a separate index. Not a real ULID — no Crockford base32,
 * no monotonic counter — because nothing here needs cross-process ordering
 * guarantees, only "newest last" within one file store.
 */

export const PREFIX = {
  product: 'prd',
  campaign: 'cmp',
  signal: 'sig',
  opportunity: 'opp',
  experiment: 'exp',
  arm: 'arm',
  concept: 'cpt',
  promptTemplate: 'tpl',
  asset: 'ast',
  modelRun: 'run',
  review: 'rev',
  account: 'acc',
  publication: 'pub',
  metricSnapshot: 'snp',
  metricEvent: 'met',
  trackingLink: 'trk',
  conversion: 'cnv',
  attribution: 'att',
  cost: 'cst',
  decision: 'dec',
  mutation: 'mut',
  incident: 'inc',
  audit: 'aud',
  event: 'evt',
  job: 'job',
  overlay: 'ovl',
  article: 'art',
  policy: 'pol',
}

/** `prd_01996f2a_4c8b91` — prefix, ms timestamp, random tail. */
export function newId(kind) {
  const prefix = PREFIX[kind]
  if (!prefix) throw new Error(`unknown id kind "${kind}"`)
  const time = Date.now().toString(16).padStart(12, '0').slice(-12)
  return `${prefix}_${time}_${crypto.randomBytes(3).toString('hex')}`
}

export const idKind = (id) => {
  const prefix = String(id ?? '').split('_')[0]
  return Object.keys(PREFIX).find((k) => PREFIX[k] === prefix) ?? null
}

/**
 * Throw unless `id` is of `kind`. Used at every write boundary that accepts a
 * foreign key from the client — the alternative is a dangling reference that
 * only shows up as a missing row in the Winner Factory three weeks later.
 */
export function assertId(id, kind, field = 'id') {
  if (id == null) return null
  if (idKind(id) !== kind) {
    throw Object.assign(new Error(`${field} must be a ${kind} id (${PREFIX[kind]}_…), got "${id}"`), { status: 400 })
  }
  return id
}

/** Stable hash for content dedupe and idempotency keys. */
export const hash = (value) =>
  crypto.createHash('sha256').update(typeof value === 'string' ? value : JSON.stringify(value ?? null)).digest('hex')

export const shortHash = (value) => hash(value).slice(0, 16)
