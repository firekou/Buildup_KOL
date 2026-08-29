import { db } from './store.js'
import { newId } from './ids.js'
import { emit, dedupeKey } from './events.js'
import { validator, notFound } from './validate.js'
import { byCode } from './tracking.js'
import { requireProduct, listConversions } from './products.js'

/**
 * Product Event Collector + Attribution Service — FR-P0-09, GHOS-006 / 009,
 * DATA_MODEL.md §5.
 *
 * The rule that shapes this module:
 *
 *   "禁止把沒有可驗證連結的 conversion 強行分配給某一篇內容。"
 *
 * So attribution is a *ladder* with the rung recorded on every touch:
 *
 *   1. direct  — the conversion carried our tracking code or click id
 *   2. modeled — a configured rule joined it (session ref, referral code)
 *   3. unknown — nothing linked it; it stays unattributed and is counted as such
 *
 * `evidenceType` is never inferred upward. An unattributed conversion is a
 * real, reportable fact; a fabricated attribution is not.
 */

export const EVIDENCE_TYPES = ['direct', 'modeled', 'unknown']

export const ATTRIBUTION_MODEL = 'last_touch_tracked_link'
export const ATTRIBUTION_MODEL_VERSION = '1.0.0'

/** How long after a click a conversion may still be joined to it. */
export const ATTRIBUTION_WINDOW_HOURS = Number(process.env.GHOS_ATTRIBUTION_WINDOW_HOURS) || 24 * 7

/**
 * Ingest a product conversion event. Idempotent on the product's own event id
 * — webhooks retry, and a doubled signup makes an experiment look twice as
 * good as it is.
 */
export function ingest(input) {
  const clean = validator(input)
    .required('eventName', { label: '事件名稱' })
    .required('eventExternalId', { label: '產品端事件 ID（用於冪等）' })
    .iso('occurredAt')
    .number('valueAmount', { fallback: null })
    .optional('valueCurrency', 'USD')
    .optional('trackingCode', null)
    .optional('clickRef', null)
    .optional('sessionRef', null)
    .optional('userRef', null)
    .done()

  const product = requireProduct(input.productId)

  const defined = listConversions(product.id).find((c) => c.eventName === clean.eventName)
  if (!defined) {
    throw Object.assign(
      new Error(`產品「${product.name}」沒有定義事件 "${clean.eventName}"。請先在產品設定中定義它，否則 evaluator 不知道該不該計入。`),
      { status: 400 },
    )
  }

  const key = dedupeKey('conversion', product.id, clean.eventName, clean.eventExternalId)
  const { row: conversion, inserted } = db.upsert('conversions', (r) => r.dedupeKey === key, {
    id: newId('conversion'),
    productId: product.id,
    eventName: clean.eventName,
    eventType: defined.eventType,
    eventExternalId: clean.eventExternalId,
    // DATA_MODEL.md §7 — pseudonymous reference only. No PII enters Growth OS.
    userRef: clean.userRef ? String(clean.userRef).slice(0, 128) : null,
    sessionRef: clean.sessionRef,
    clickRef: clean.clickRef,
    trackingCode: clean.trackingCode,
    valueAmount: clean.valueAmount,
    valueCurrency: clean.valueCurrency,
    occurredAt: clean.occurredAt ?? new Date().toISOString(),
    receivedAt: new Date().toISOString(),
    dedupeKey: key,
  })

  if (!inserted) return { conversion, attribution: db.find('attributions', (a) => a.conversionEventId === conversion.id), duplicate: true }

  const attribution = attribute(conversion)

  emit('product.conversion.occurred', {
    productId: product.id,
    experimentId: attribution?.experimentId ?? null,
    armId: attribution?.armId ?? null,
    publicationId: attribution?.publicationId ?? null,
    source: 'product_adapter',
    idempotencyKey: key,
    occurredAt: conversion.occurredAt,
    properties: { eventName: conversion.eventName, valueAmount: conversion.valueAmount, evidenceType: attribution?.evidenceType ?? 'unknown' },
  })

  return { conversion, attribution, duplicate: false }
}

/**
 * Resolve a conversion to a publication, walking the ladder in order and
 * stopping at the first rung that produces a *verifiable* link.
 */
export function attribute(conversion) {
  const rungs = []

  // Rung 1 — our own tracking code. This is the only rung that is evidence
  // rather than inference.
  const code = conversion.trackingCode ?? extractCode(conversion.clickRef)
  if (code) {
    const link = byCode(code)
    if (link) {
      const withinWindow = isWithinWindow(link.lastClickAt ?? link.createdAt, conversion.occurredAt)
      rungs.push({ rung: 'tracking_code', matched: true, note: withinWindow ? null : '點擊與轉換的間隔超過歸因窗，但 tracking code 本身仍是直接證據。' })
      return persist(conversion, {
        publicationId: link.publicationId,
        armId: link.armId,
        experimentId: link.experimentId,
        campaignId: link.campaignId,
        evidenceType: 'direct',
        attributionWeight: 1,
        reason: `轉換帶有本系統簽發的 tracking code ${code}，直接對應 publication。`,
        rungs,
      })
    }
    rungs.push({ rung: 'tracking_code', matched: false, note: `code ${code} 不在本系統簽發的清單中。` })
  } else {
    rungs.push({ rung: 'tracking_code', matched: false, note: '轉換未帶 tracking code。' })
  }

  // Rung 2 — session join. A prior conversion from the same session that *was*
  // directly attributed carries that publication forward. Modeled, not measured.
  if (conversion.sessionRef) {
    const sibling = db.find(
      'attributions',
      (a) => a.evidenceType === 'direct' && a.sessionRef === conversion.sessionRef,
    )
    if (sibling) {
      rungs.push({ rung: 'session_join', matched: true })
      return persist(conversion, {
        publicationId: sibling.publicationId,
        armId: sibling.armId,
        experimentId: sibling.experimentId,
        campaignId: sibling.campaignId,
        evidenceType: 'modeled',
        attributionWeight: 1,
        reason: `同一 session（${conversion.sessionRef}）先前有一筆直接歸因的轉換，依 ${ATTRIBUTION_MODEL} 沿用其 publication。此為模型歸因，非直接量測。`,
        rungs,
      })
    }
    rungs.push({ rung: 'session_join', matched: false })
  }

  // No rung matched. It stays unattributed — and it is still recorded, because
  // attribution coverage is a number the Dashboard must be able to show.
  rungs.push({ rung: 'unattributed', matched: true, note: '沒有任何可驗證的連結，不指派給任何內容。' })
  return persist(conversion, {
    publicationId: null,
    armId: null,
    experimentId: null,
    campaignId: null,
    evidenceType: 'unknown',
    attributionWeight: null,
    reason: '沒有 tracking code、也沒有可join的 session——這筆轉換無法歸因到任何一篇內容，計入 unattributed。',
    rungs,
  })
}

function persist(conversion, resolution) {
  return db.insert('attributions', {
    id: newId('attribution'),
    conversionEventId: conversion.id,
    productId: conversion.productId,
    eventName: conversion.eventName,
    sessionRef: conversion.sessionRef,
    valueAmount: conversion.valueAmount,
    valueCurrency: conversion.valueCurrency,
    occurredAt: conversion.occurredAt,
    modelName: ATTRIBUTION_MODEL,
    modelVersion: ATTRIBUTION_MODEL_VERSION,
    attributedValue: resolution.attributionWeight != null && conversion.valueAmount != null
      ? conversion.valueAmount * resolution.attributionWeight
      : null,
    ...resolution,
  })
}

const extractCode = (clickRef) => {
  if (!clickRef) return null
  try {
    return new URL(clickRef).searchParams.get('ghos')
  } catch {
    return /^[2-9A-HJ-NP-Z]{8}$/.test(String(clickRef)) ? String(clickRef) : null
  }
}

const isWithinWindow = (from, to) => {
  if (!from || !to) return false
  return Date.parse(to) - Date.parse(from) <= ATTRIBUTION_WINDOW_HOURS * 3_600_000
}

/* ----------------------------------------------------------- reporting */

/** Coverage breakdown — DASHBOARD_SPEC.md §9 requires this split explicitly. */
export function coverage(filter = {}) {
  const rows = db.list('attributions', filter)
  const direct = rows.filter((r) => r.evidenceType === 'direct')
  const modeled = rows.filter((r) => r.evidenceType === 'modeled')
  const unknown = rows.filter((r) => r.evidenceType === 'unknown')
  const sumValue = (list) => list.reduce((acc, r) => acc + (Number(r.attributedValue) || 0), 0)

  return {
    total: rows.length,
    direct: direct.length,
    modeled: modeled.length,
    unattributed: unknown.length,
    // The ratio is over *all* conversions, so a high number cannot be produced
    // by quietly dropping the ones that failed to attribute.
    directRate: rows.length ? direct.length / rows.length : null,
    attributedValue: Math.round(sumValue([...direct, ...modeled]) * 100) / 100,
    directValue: Math.round(sumValue(direct) * 100) / 100,
    modeledValue: Math.round(sumValue(modeled) * 100) / 100,
    unattributedValue: Math.round(unknown.reduce((a, r) => a + (Number(r.valueAmount) || 0), 0) * 100) / 100,
    modelName: ATTRIBUTION_MODEL,
    modelVersion: ATTRIBUTION_MODEL_VERSION,
    says:
      rows.length === 0
        ? '尚無轉換資料。'
        : `${rows.length} 筆轉換中，${direct.length} 筆為直接量測（帶 tracking code），${modeled.length} 筆由 ${ATTRIBUTION_MODEL} 模型歸因，${unknown.length} 筆無法歸因。`,
  }
}

export const listConversionEvents = (filter = {}, limit = 300) => db.list('conversions', filter).slice(0, limit)
export const listAttributions = (filter = {}, limit = 300) => db.list('attributions', filter).slice(0, limit)

/** Trace a conversion back up the chain — DASHBOARD_SPEC.md §9 drill-down. */
export function trace(conversionId) {
  const conversion = db.get('conversions', conversionId)
  if (!conversion) throw notFound(`Conversion ${conversionId}`)
  const attribution = db.find('attributions', (a) => a.conversionEventId === conversionId)
  if (!attribution?.publicationId) {
    return { conversion, attribution, chain: null, says: '這筆轉換沒有可追溯的來源鏈——不要假裝它有。' }
  }
  const publication = db.get('publications', attribution.publicationId)
  const asset = publication ? db.get('assets', publication.assetId) : null
  const arm = publication ? db.get('arms', publication.armId) : null
  const experiment = arm ? db.get('experiments', arm.experimentId) : null
  const opportunity = experiment?.opportunityId ? db.get('opportunities', experiment.opportunityId) : null

  return {
    conversion,
    attribution,
    chain: { publication, asset, arm, experiment, opportunity, personaId: arm?.personaId ?? null },
    says: `轉換 → ${attribution.evidenceType === 'direct' ? '直接量測' : '模型歸因'} → publication ${publication?.id} → arm ${arm?.label} → 實驗 ${experiment?.id}`,
  }
}
