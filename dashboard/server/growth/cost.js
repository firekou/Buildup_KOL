import { db } from './store.js'
import { newId } from './ids.js'
import { emit, dedupeKey } from './events.js'
import { estimateCost, DEFAULT_PLAN, COST_LADDER, checkBudget, tierForFormat } from './cost-model.js'

/**
 * Cost Ledger — FR-P0-10, GHOS-007, DATA_MODEL.md §6.
 *
 * One table for every dollar the OS causes to be spent: model generation,
 * distribution, optional human time. The ledger's job is to answer the four
 * questions in DATA_MODEL.md §6 without anyone opening a provider dashboard,
 * and every row carries `sourceRef` so it can be reconciled against one.
 */

export const COST_TYPES = ['generation', 'distribution', 'human', 'infrastructure', 'other']

export function record({
  productId,
  campaignId = null,
  experimentId = null,
  armId = null,
  assetId = null,
  publicationId = null,
  modelRunId = null,
  costType,
  provider,
  amount,
  currency = 'USD',
  credits = null,
  basis = 'observed',
  breakdown = null,
  sourceRef = null,
  occurredAt = null,
  idempotencyKey = null,
}) {
  if (!COST_TYPES.includes(costType)) throw new Error(`unknown cost type "${costType}"`)

  const row = {
    id: newId('cost'),
    productId,
    campaignId,
    experimentId,
    armId,
    assetId,
    publicationId,
    modelRunId,
    costType,
    provider,
    amount: Number(amount) || 0,
    currency,
    credits,
    // `basis` separates a measured charge from a derived estimate; the unit
    // economics view refuses to blend them without saying so.
    basis,
    breakdown,
    sourceRef,
    planKey: DEFAULT_PLAN,
    occurredAt: occurredAt ?? new Date().toISOString(),
  }

  if (idempotencyKey) {
    const { row: stored, inserted } = db.upsert('costs', (r) => r.idempotencyKey === idempotencyKey, { ...row, idempotencyKey })
    if (!inserted) return stored
    emitCost(stored)
    return stored
  }

  const stored = db.insert('costs', { ...row, idempotencyKey: null })
  emitCost(stored)
  return stored
}

const emitCost = (row) =>
  emit('cost.recorded', {
    productId: row.productId,
    campaignId: row.campaignId,
    experimentId: row.experimentId,
    armId: row.armId,
    assetId: row.assetId,
    publicationId: row.publicationId,
    source: 'cost_ledger',
    idempotencyKey: row.idempotencyKey ?? dedupeKey('cost', row.id),
    properties: { costType: row.costType, amount: row.amount, currency: row.currency, credits: row.credits, basis: row.basis },
  })

/** Convenience wrapper: price a model run and book it in one step. */
export function recordGeneration({ modelRun, arm, experiment, asset }) {
  const est = estimateCost({
    model: modelRun.model,
    kind: modelRun.kind,
    seconds: modelRun.seconds,
    images: modelRun.images ?? 1,
    usage: modelRun.usage,
  })
  return record({
    productId: experiment.productId,
    campaignId: experiment.campaignId,
    experimentId: experiment.id,
    armId: arm?.id ?? null,
    assetId: asset?.id ?? null,
    modelRunId: modelRun.id,
    costType: 'generation',
    provider: modelRun.provider,
    amount: est.usd ?? 0,
    credits: est.credits,
    basis: est.basis,
    breakdown: est.breakdown,
    sourceRef: est.sourceRef,
    idempotencyKey: dedupeKey('generation-cost', modelRun.id),
  })
}

/* ------------------------------------------------------------ rollups */

const sum = (rows, field = 'amount') => rows.reduce((acc, r) => acc + (Number(r[field]) || 0), 0)

export function totals(filter = {}) {
  const rows = db.list('costs', filter)
  const byType = {}
  for (const r of rows) {
    const b = (byType[r.costType] ??= { amount: 0, credits: 0, count: 0 })
    b.amount += Number(r.amount) || 0
    b.credits += Number(r.credits) || 0
    b.count += 1
  }
  return {
    totalUsd: Math.round(sum(rows) * 1e4) / 1e4,
    totalCredits: Math.round(sum(rows, 'credits') * 100) / 100,
    count: rows.length,
    byType,
    // Never blend measured and estimated silently — the caller must be able to
    // say "of this $412, $37 is derived from list prices, not invoices".
    estimatedPortionUsd: Math.round(sum(rows.filter((r) => r.basis !== 'observed')) * 1e4) / 1e4,
    unknownModelRows: rows.filter((r) => r.basis === 'unknown_model').length,
    lastRecordedAt: rows[0]?.occurredAt ?? null,
  }
}

export const forExperiment = (experimentId) => totals({ experimentId })
export const forArm = (armId) => totals({ armId })

export function forPersona(personaId, productId = null) {
  const arms = db.filter('arms', (a) => a.personaId === personaId && (!productId || a.productId === productId))
  const armIds = new Set(arms.map((a) => a.id))
  const rows = db.filter('costs', (c) => armIds.has(c.armId))
  return { totalUsd: Math.round(sum(rows) * 1e4) / 1e4, totalCredits: Math.round(sum(rows, 'credits') * 100) / 100, count: rows.length }
}

export const listCosts = (filter = {}, limit = 200) => db.list('costs', filter).slice(0, limit)

/**
 * Budget check for an experiment: how much it has spent so far against its
 * campaign cap. Used by the generation orchestrator before it spends more.
 */
export function experimentBudget(experiment, incomingUsd = 0) {
  const campaign = experiment.campaignId ? db.get('campaigns', experiment.campaignId) : null
  const spentUsd = totals({ experimentId: experiment.id }).totalUsd
  const campaignSpentUsd = campaign ? totals({ campaignId: campaign.id }).totalUsd : null
  const check = checkBudget({
    spentUsd: campaign?.budgetCapUsd != null ? campaignSpentUsd : spentUsd,
    capUsd: campaign?.budgetCapUsd ?? null,
    incomingUsd,
    label: campaign ? `Campaign「${campaign.name}」` : `Experiment ${experiment.id}`,
  })
  return { ...check, experimentSpentUsd: spentUsd, campaignSpentUsd, campaignId: campaign?.id ?? null }
}

export { COST_LADDER, tierForFormat, estimateCost }
