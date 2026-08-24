import fs from 'node:fs'
import path from 'node:path'
import { KOLS_DIR } from '../config.js'

/**
 * docs/14 §11 · review P1-2 — discovery constants, kept OUT of
 * `scoring-config.json`.
 *
 * v1.0 put them in `outlierScan` inside the scoring config while the spec
 * repeatedly insisted "this is not scoring". That is a coupling you can see in
 * the import graph: `getConfig()` is the scoring engine's entry point, so
 * anything living in there is one `getConfig().outlierScan` away from being
 * read on a scoring path. Separate file, separate loader, no shared accessor.
 *
 * What IS shared is the weekly-cycle threshold — one source of truth here,
 * referenced by both tracks. What is NOT shared is the human sign-off: see
 * `timeSeries.topicHeat.approved` vs `timeSeries.newsCoverage.approved`.
 */

const CONFIG_PATH = path.join(KOLS_DIR, 'discovery-config.json')

let cache = null

export function getDiscoveryConfig({ refresh = false } = {}) {
  if (!cache || refresh) {
    try {
      cache = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'))
    } catch (err) {
      // A missing discovery config must not take the scoring API down — the
      // scan feature is additive, everything else predates it.
      console.error(`[discovery-config] ${CONFIG_PATH} unreadable: ${err.message}`)
      cache = {}
    }
  }
  return cache
}

/** Unwrap a `{ value, calibration, basis }` block to its value. */
export const configValue = (node, fallback = null) =>
  node && typeof node === 'object' && 'value' in node ? node.value : (node ?? fallback)
