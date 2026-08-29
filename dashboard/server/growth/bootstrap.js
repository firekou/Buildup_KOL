import { ensureSeeded as seedPolicies } from './policy.js'
import { ensureTemplatesSeeded } from './generation.js'
import { syncRegistry } from './personas.js'

/**
 * Idempotent boot: make sure the control-plane rows the OS needs in order to
 * accept its first write actually exist.
 *
 * Runs on every boot rather than in a migration because the store is
 * file-backed and a Railway deploy without a mounted volume starts empty —
 * in that case the OS must still be usable, and it must say so (the health
 * endpoint reports `persistent: false`).
 */
export function bootstrapGrowthOs() {
  const profiles = seedPolicies()
  const templates = ensureTemplatesSeeded()
  const personas = syncRegistry()
  return { policyProfiles: profiles.length, promptTemplates: templates.length, personas: personas.count }
}
