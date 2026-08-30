import { db } from './store.js'
import { newId, hash } from './ids.js'

/**
 * Event backbone — SYSTEM_ARCHITECTURE.md §4, DATA_MODEL.md §3.
 *
 * One envelope for social telemetry and product events alike. The point of the
 * shared envelope is that a funnel query never has to know which side of the
 * house a number came from: both carry the same `experiment_id` / `arm_id` /
 * `publication_id` refs, so `impressions` and `signup` join on the same keys.
 */

export const SCHEMA_VERSION = 1

/** The closed set of event names. An unknown name is a bug, not a new feature. */
export const EVENT_NAMES = [
  'signal.received',
  'opportunity.created',
  'opportunity.status.changed',
  'experiment.created',
  'experiment.arm.created',
  'generation.started',
  'generation.completed',
  'generation.failed',
  'review.approved',
  'review.rejected',
  'review.revision_requested',
  'publication.published',
  'article.published',
  'publication.failed',
  'publication.metric.updated',
  'product.conversion.occurred',
  'cost.recorded',
  'attribution.assigned',
  'experiment.evaluable',
  'experiment.decided',
  'mutation.queued',
  'mutation.completed',
  'policy.incident.created',
]

const REF_FIELDS = [
  'productId',
  'campaignId',
  'opportunityId',
  'experimentId',
  'armId',
  'personaId',
  'assetId',
  'publicationId',
  'platform',
]

/**
 * Append an event.
 *
 * `idempotencyKey` (GHOS-X02) — when given, a second emit with the same key is
 * dropped and the original returned. Callers that ingest from the outside
 * (webhooks, metric syncs) must always pass one; internal state transitions
 * need not, since they are already guarded by the row they mutate.
 */
export function emit(eventName, { source = 'internal', properties = {}, idempotencyKey = null, occurredAt = null, ...refs } = {}) {
  if (!EVENT_NAMES.includes(eventName)) {
    throw Object.assign(new Error(`unknown event name "${eventName}"`), { status: 400 })
  }

  const envelope = {
    id: newId('event'),
    eventName,
    occurredAt: occurredAt ?? new Date().toISOString(),
    schemaVersion: SCHEMA_VERSION,
    source,
    // DATA_MODEL.md §3 — unknown refs stay null. Never backfilled with a guess.
    ...Object.fromEntries(REF_FIELDS.map((f) => [f, refs[f] ?? null])),
    properties,
    idempotencyKey,
  }

  if (idempotencyKey) {
    const key = `${eventName}:${idempotencyKey}`
    const { row, inserted } = db.upsert('events', (r) => r.dedupeKey === key, { ...envelope, dedupeKey: key })
    return { event: row, duplicate: !inserted }
  }

  return { event: db.insert('events', { ...envelope, dedupeKey: null }), duplicate: false }
}

/** Events touching a given entity, oldest first — powers the Experiment Detail timeline. */
export function timeline(refs = {}) {
  const keys = Object.entries(refs).filter(([, v]) => v)
  return db
    .filter('events', (e) => keys.every(([k, v]) => e[k] === v))
    .sort((a, b) => String(a.occurredAt).localeCompare(String(b.occurredAt)))
}

export const recent = (limit = 100) =>
  db.list('events').slice(0, limit)

/** Deterministic idempotency key from any set of natural-key parts. */
export const dedupeKey = (...parts) => hash(parts.map((p) => String(p ?? '')).join('|')).slice(0, 32)
