import { db } from './store.js'
import { newId } from './ids.js'
import { listKols, getKol, toSummary } from '../lib/kols.js'
import { validator, notFound, badRequest } from './validate.js'
import { PLATFORM_IDS } from './platforms.js'
import { PRODUCT_ROLES } from './products.js'
import * as audit from './audit.js'

/**
 * Persona registry adapter + growth overlay — FR-P0-04, GHOS-022 / 023.
 *
 * The hard rule from the spec: `kols/` stays the source of truth. Growth OS
 * stores an *overlay*, never a copy of the character bible. Two copies of a
 * persona drift, and a persona that drifts is worse than no persona because
 * everything downstream still believes it.
 *
 * So: identity, pillars, red lines and axes are read live out of `kols/` on
 * every call. Only growth-specific facts — what role this persona plays for a
 * *product*, which platforms it is assigned, what it may and may not claim —
 * live here.
 */

/**
 * The enum is owned by `kols/topic-affinity.schema.json`, not by this file.
 * embodied = 可信度來自親身經歷; database = 來自整理可查證資料; hybrid = 兩者兼有.
 */
export const CREDIBILITY_MODES = ['embodied', 'hybrid', 'database']

/** Persona rows are a cache/reference, per DATA_MODEL.md `personas`. */
export function syncRegistry() {
  const kols = listKols()
  const synced = []
  for (const kol of kols) {
    const sourceVersion = [
      kol.profile?.meta?.updated_at ?? '?',
      kol.affinity?.schema_version ?? '?',
      kol.completeness.topicHooks,
    ].join('/')
    const { row } = db.upsert(
      'personaOverlays',
      (r) => r.personaId === kol.id && r.productId === null,
      {
        id: newId('overlay'),
        personaId: kol.id,
        productId: null,
        scope: 'global',
        sourceVersion,
        syncedAt: new Date().toISOString(),
        status: kol.status ?? 'active',
        platformRoles: {},
        productRole: null,
        allowedClaims: [],
        blockedClaims: [],
        ctaCompatibility: [],
        audienceHypotheses: kol.affinity?.homophily?.audience_identity ? [kol.affinity.homophily.audience_identity] : [],
        policyVersion: null,
      },
      { sourceVersion, syncedAt: new Date().toISOString(), status: kol.status ?? 'active' },
    )
    synced.push(row)
  }
  return { count: synced.length, personas: synced.map((r) => r.personaId) }
}

/**
 * The full persona view Growth OS works with: live `kols/` data plus overlays.
 * `redlines` and `credibility` come straight from the bible — they are the
 * fields the router is forbidden to override.
 */
export function getPersona(personaId, productId = null) {
  const kol = getKol(personaId)
  if (!kol) return null
  const global = db.find('personaOverlays', (r) => r.personaId === personaId && r.productId === null)
  const scoped = productId ? db.find('personaOverlays', (r) => r.personaId === personaId && r.productId === productId) : null

  return {
    ...toSummary(kol),
    // Source-of-truth fields, read-only here.
    source: {
      credibilityMode: kol.affinity?.credibility_mode ?? null,
      credibilityBasis: kol.affinity?.credibility_basis ?? [],
      credibilityRisk: kol.affinity?.credibility_risk ?? null,
      redlines: kol.affinity?.redlines ?? [],
      pillars: kol.profile?.content?.pillars ?? [],
      pillarKeywords: kol.affinity?.pillar_keywords ?? {},
      topicHooks: kol.affinity?.topic_hooks ?? [],
      homophily: kol.affinity?.homophily ?? null,
      materialAttributes: kol.affinity?.material_attributes ?? null,
      reach: kol.affinity?.reach ?? null,
      axisIssues: kol.axisIssues,
    },
    overlay: mergeOverlays(global, scoped),
    hasProductOverlay: Boolean(scoped),
  }
}

/**
 * Product-scoped overlay wins field by field over the global one. A product
 * may narrow a persona (add blocked claims, drop a platform) but the merge is
 * a union for blocked claims specifically — narrowing must never be undone by
 * a more specific row.
 */
function mergeOverlays(global, scoped) {
  if (!global && !scoped) return null
  const base = global ?? {}
  const over = scoped ?? {}
  return {
    ...base,
    ...Object.fromEntries(Object.entries(over).filter(([, v]) => v != null && !(Array.isArray(v) && v.length === 0))),
    blockedClaims: [...new Set([...(base.blockedClaims ?? []), ...(over.blockedClaims ?? [])])],
    scope: scoped ? 'product' : 'global',
  }
}

/**
 * List view. Drops the bulky read-only fields (full pillar descriptions,
 * credibility basis prose, material attributes) — the full persona is one
 * request away via `getPersona`, and shipping all sixteen character bibles to
 * render a dropdown made this endpoint 138 KB.
 */
export function listPersonas(productId = null, { full = false } = {}) {
  const rows = listKols().map((k) => getPersona(k.id, productId))
  if (full) return rows
  return rows.map((p) => ({
    ...p,
    source: {
      credibilityMode: p.source.credibilityMode,
      credibilityRisk: p.source.credibilityRisk,
      redlineCount: (p.source.redlines ?? []).length,
      pillarNames: (p.source.pillars ?? []).map((x) => x.name ?? x).slice(0, 8),
      pillarKeywords: p.source.pillarKeywords,
      topicHookCount: (p.source.topicHooks ?? []).length,
      homophily: p.source.homophily,
      reach: p.source.reach,
      axisIssues: p.source.axisIssues,
    },
  }))
}

export function setOverlay(personaId, productId, input, actor = 'system') {
  if (!getKol(personaId)) throw notFound(`Persona ${personaId}`)

  const clean = validator(input)
    .oneOf('productRole', Object.keys(PRODUCT_ROLES), { label: '產品角色', required: false, fallback: null })
    .list('allowedClaims')
    .list('blockedClaims')
    .list('ctaCompatibility')
    .list('audienceHypotheses')
    .optional('notes', null)
    .done()

  const platformRoles = input.platformRoles ?? {}
  for (const key of Object.keys(platformRoles)) {
    if (!PLATFORM_IDS.includes(key)) throw badRequest(`未知平台 "${key}"`)
  }

  const before = db.find('personaOverlays', (r) => r.personaId === personaId && r.productId === (productId ?? null))
  const { row } = db.upsert(
    'personaOverlays',
    (r) => r.personaId === personaId && r.productId === (productId ?? null),
    {
      id: newId('overlay'),
      personaId,
      productId: productId ?? null,
      scope: productId ? 'product' : 'global',
      ...clean,
      platformRoles,
      syncedAt: new Date().toISOString(),
    },
    { ...clean, platformRoles },
  )

  audit.record({ actorType: 'human', actorId: actor, action: 'persona_overlay.updated', entityType: 'persona', entityId: personaId, before, after: row })
  return getPersona(personaId, productId)
}

export const listOverlays = (filter = {}) => db.list('personaOverlays', filter)

/**
 * Hard policy gates a persona must clear before it can be routed at all.
 * These are gates, not scores — a failure removes the persona from the
 * candidate set with a printed reason (FR-P0-04: "Router 產生 candidate，不直接
 * 無條件自動發布").
 */
export function personaGates(persona, { product = null, claimDomains = [] } = {}) {
  const gates = []

  gates.push({
    gate: 'persona_active',
    passed: persona.status !== 'archived' && persona.status !== 'retired',
    message: `人設狀態為 ${persona.status}`,
  })

  gates.push({
    gate: 'axes_defined',
    passed: (persona.source.axisIssues ?? []).length === 0,
    // docs/09 §0 原則二 — an axis without a `why` is undefined, not zero.
    message: (persona.source.axisIssues ?? []).map((i) => `${i.axis}: ${i.reason}`).join('；') || '四軸皆有理由',
  })

  const blocked = persona.overlay?.blockedClaims ?? []
  gates.push({
    gate: 'no_blocked_claim_required',
    passed: true,
    message: blocked.length ? `此人設禁止宣稱：${blocked.join('、')}（生成時必須避開）` : '無額外禁止宣稱',
  })

  // Credibility is "唯一無法靠製作補的軸" (kols/topic-axes.json), so it is a
  // gate rather than a caution — but note which direction it runs in.
  //
  // Every persona in this repo is AI-generated. `embodied` means the persona's
  // authority rests on personal experience it cannot actually have had, which
  // the redline rules already flag (R-EMBODIMENT / R-CREDENTIAL). On an
  // ordinary lifestyle topic that is a manageable fiction; on a regulated
  // claim it is an unbackable assertion about money, health or law. So for
  // high-stakes domains the passing modes are the ones grounded in verifiable
  // material — `database` and `hybrid` — and `embodied` fails.
  const mode = persona.source.credibilityMode
  const highStakes = claimDomains.filter((d) => ['finance', 'health', 'legal', 'prediction_market', 'gambling'].includes(d))
  const groundedInEvidence = ['database', 'hybrid'].includes(mode)
  gates.push({
    gate: 'credibility_sufficient',
    passed: highStakes.length === 0 || groundedInEvidence,
    message: highStakes.length
      ? groundedInEvidence
        ? `題目涉及 ${highStakes.join('/')}；人設 credibility_mode=${mode}，可信度建立在可查證資料上，論證有依據。`
        : `題目涉及 ${highStakes.join('/')}，但人設 credibility_mode=${mode ?? '未定義'}——可信度來自親身經歷，而這是 AI 人設無法背書的主張。此題需改由 database／hybrid 型人設承載，或把內容改寫成不依賴親身經驗的形式。`
      : '題目未涉及高風險 claim',
  })

  if (product) {
    const allowed = persona.overlay?.platformRoles ?? {}
    gates.push({
      gate: 'platform_assigned',
      passed: Object.keys(allowed).length > 0,
      message: Object.keys(allowed).length ? `已指派平台：${Object.keys(allowed).join('/')}` : '尚未為此人設指派任何平台角色',
    })
  }

  return { gates, passed: gates.every((g) => g.passed), failed: gates.filter((g) => !g.passed).map((g) => g.gate) }
}
