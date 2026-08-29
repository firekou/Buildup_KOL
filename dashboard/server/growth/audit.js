import { db } from './store.js'
import { newId } from './ids.js'

/**
 * Audit log — GHOS-X01, SYSTEM_ARCHITECTURE.md §2.6 / §9.
 *
 * Every automated decision and every human override lands here with actor,
 * reason and before/after. The rule the spec cares about is the second one:
 * a Winner that a human forced, or a gate someone waived, must be
 * distinguishable from one the evaluator produced on its own — otherwise the
 * evaluator's track record is unmeasurable.
 */

export function record({ actorType = 'system', actorId = null, action, entityType, entityId, before = null, after = null, reason = null }) {
  if (!action || !entityType) throw new Error('audit.record needs action and entityType')
  return db.insert('auditLogs', {
    id: newId('audit'),
    actorType,
    actorId,
    action,
    entityType,
    entityId: entityId ?? null,
    beforeJson: before,
    afterJson: after,
    reason,
  })
}

export const forEntity = (entityType, entityId) =>
  db.filter('auditLogs', (r) => r.entityType === entityType && r.entityId === entityId)

export const recent = (limit = 100) => db.list('auditLogs').slice(0, limit)

/** Human overrides only — the set a reviewer audit actually cares about. */
export const overrides = (limit = 100) =>
  db.filter('auditLogs', (r) => r.actorType === 'human' && String(r.action).includes('override')).slice(0, limit)
