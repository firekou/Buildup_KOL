import path from 'node:path'
import { createStore } from '../lib/store.js'
import { DATA_DIR } from '../config.js'

/**
 * Growth OS collections — projects/growth-hack-os/DATA_MODEL.md §2.
 *
 * One file per table, under `${DATA_DIR}/growth/`. Kept separate from the
 * legacy evaluation store so a Railway volume can be mounted, backed up or
 * migrated to Postgres for Growth OS alone; the control-plane / data-plane
 * split of SYSTEM_ARCHITECTURE.md §5 is annotated per collection below.
 */

export const GROWTH_DIR = path.join(DATA_DIR, 'growth')

/** control = strategy and rules; data = observations. Never mix a rule change into history. */
export const PLANE = {
  products: 'control',
  conversionDefinitions: 'control',
  campaigns: 'control',
  policyProfiles: 'control',
  personaOverlays: 'control',
  promptTemplates: 'control',
  socialAccounts: 'control',
  experiments: 'control',
  arms: 'control',
  concepts: 'control',
  opportunities: 'control',

  signals: 'data',
  assets: 'data',
  modelRuns: 'data',
  reviews: 'data',
  publications: 'data',
  trackingLinks: 'data',
  metricSnapshots: 'data',
  metricEvents: 'data',
  conversions: 'data',
  attributions: 'data',
  costs: 'data',
  decisions: 'data',
  mutations: 'data',
  incidents: 'data',
  auditLogs: 'data',
  events: 'data',
  jobs: 'data',
}

const FILES = {
  // --- control plane -----------------------------------------------------
  products: 'products.json',
  conversionDefinitions: 'conversion-definitions.json',
  campaigns: 'campaigns.json',
  policyProfiles: 'policy-profiles.json',
  personaOverlays: 'persona-overlays.json',
  promptTemplates: 'prompt-templates.json',
  socialAccounts: 'social-accounts.json',
  experiments: 'experiments.json',
  arms: 'experiment-arms.json',
  concepts: 'creative-concepts.json',
  opportunities: 'opportunities.json',

  // --- data plane --------------------------------------------------------
  signals: 'signals.json',
  assets: 'assets.json',
  modelRuns: 'model-runs.json',
  reviews: 'review-decisions.json',
  publications: 'publications.json',
  trackingLinks: 'tracking-links.json',
  metricSnapshots: 'metric-snapshots.json',
  metricEvents: 'metric-events.json',
  conversions: 'conversion-events.json',
  attributions: 'attribution-touches.json',
  costs: 'cost-events.json',
  decisions: 'winner-decisions.json',
  mutations: 'mutation-jobs.json',
  incidents: 'policy-incidents.json',
  auditLogs: 'audit-logs.json',
  events: 'events.json',
  jobs: 'jobs.json',
}

export const db = createStore(GROWTH_DIR, FILES)

export const KINDS = Object.keys(FILES)

/** Data freshness per collection — Dashboard 10 System Ops (GHOS-X05). */
export const freshness = () =>
  Object.fromEntries(KINDS.map((k) => [k, { count: db.count(k), lastWriteAt: db.lastWriteAt(k), plane: PLANE[k] }]))
