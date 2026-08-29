import express from 'express'
import * as products from '../growth/products.js'
import * as policy from '../growth/policy.js'
import * as signals from '../growth/signals.js'
import * as opportunities from '../growth/opportunities.js'
import * as personas from '../growth/personas.js'
import * as router_ from '../growth/router.js'
import * as experiments from '../growth/experiments.js'
import * as generation from '../growth/generation.js'
import * as review from '../growth/review.js'
import * as publish from '../growth/publish.js'
import * as telemetry from '../growth/telemetry.js'
import * as conversions from '../growth/conversions.js'
import * as tracking from '../growth/tracking.js'
import * as evaluator from '../growth/evaluator.js'
import * as evolution from '../growth/evolution.js'
import * as portfolio from '../growth/portfolio.js'
import * as pipeline from '../growth/pipeline.js'
import * as completeness from '../growth/completeness.js'
import * as cost from '../growth/cost.js'
import * as jobs from '../growth/jobs.js'
import * as audit from '../growth/audit.js'
import * as events from '../growth/events.js'
import { db, freshness } from '../growth/store.js'
import { PLATFORMS, PLATFORM_IDS, FORMATS } from '../growth/platforms.js'
import { COST_LADDER, CREDIT_PLANS, DEFAULT_PLAN, MODEL_COSTS } from '../growth/cost-model.js'

/**
 * Growth OS API — SYSTEM_ARCHITECTURE.md §6.
 *
 * Mounted under `/api/growth`. Route handlers stay thin: validation, policy
 * and state transitions all live in the growth/ modules so the same rules
 * apply whether a call arrives from the UI, a webhook or a seed script.
 */

const r = express.Router()

/** Async handler wrapper — errors reach the app's error middleware. */
const h = (fn) => (req, res, next) => Promise.resolve(fn(req, res)).catch(next)
const actor = (req) => req.get('x-ghos-actor') || req.body?.actor || 'dashboard'

/* ------------------------------------------------------------------ meta */

r.get('/growth/meta', h(async (req, res) => {
  res.json({
    platforms: PLATFORMS,
    platformIds: PLATFORM_IDS,
    formats: FORMATS,
    productRoles: products.PRODUCT_ROLES,
    businessModels: products.BUSINESS_MODELS,
    conversionEventTypes: products.CONVERSION_EVENT_TYPES,
    campaignObjectives: products.CAMPAIGN_OBJECTIVES,
    dimensions: experiments.DIMENSIONS,
    primaryOutcomes: experiments.PRIMARY_OUTCOMES,
    experimentStatus: experiments.EXPERIMENT_STATUS,
    mutationDimensions: evolution.MUTATION_DIMENSIONS,
    riskFlags: opportunities.RISK_FLAGS,
    relevanceAnchors: opportunities.RELEVANCE_ANCHORS,
    opportunityStatus: opportunities.OPPORTUNITY_STATUS,
    claimDomains: policy.CLAIM_DOMAINS,
    reviewReasonCodes: policy.REVIEW_REASON_CODES,
    incidentTypes: policy.INCIDENT_TYPES,
    severities: policy.SEVERITIES,
    policyProfiles: policy.listProfiles(),
    signalSourceTypes: signals.SOURCE_TYPES,
    freshnessBands: signals.FRESHNESS_BANDS,
    generationAdapters: generation.listAdapters(),
    publishAdapters: publish.listPublishAdapters(),
    accountTypes: publish.ACCOUNT_TYPES,
    stages: pipeline.STAGES,
    recommendations: portfolio.RECOMMENDATIONS,
    canonicalMetrics: telemetry.CANONICAL_METRICS,
    evidenceTypes: conversions.EVIDENCE_TYPES,
    costLadder: COST_LADDER,
    creditPlans: CREDIT_PLANS,
    activePlan: DEFAULT_PLAN,
    modelCosts: MODEL_COSTS,
    evaluator: { version: evaluator.EVALUATOR_VERSION, minRelativeLift: evaluator.MIN_RELATIVE_LIFT, alpha: evaluator.ALPHA },
    attribution: { model: conversions.ATTRIBUTION_MODEL, version: conversions.ATTRIBUTION_MODEL_VERSION, windowHours: conversions.ATTRIBUTION_WINDOW_HOURS },
  })
}))

/* -------------------------------------------------------------- products */

r.get('/growth/products', h((req, res) => res.json({ products: products.listProducts() })))
r.post('/growth/products', h((req, res) => res.status(201).json(products.createProduct(req.body, actor(req)))))
r.get('/growth/products/:id', h((req, res) => {
  const product = products.getProduct(req.params.id)
  if (!product) return res.status(404).json({ error: 'product not found' })
  res.json({ ...product, stage: pipeline.stageOf(product.id), economics: portfolio.productSummary(product.id) })
}))
r.patch('/growth/products/:id', h((req, res) => res.json(products.updateProduct(req.params.id, req.body, actor(req)))))
r.post('/growth/products/:id/analyse', h((req, res) => res.json(products.analyse(req.params.id, actor(req)))))
r.post('/growth/products/:id/conversions', h((req, res) => res.status(201).json(products.defineConversion(req.params.id, req.body, actor(req)))))
r.get('/growth/products/:id/conversions', h((req, res) => res.json({ conversions: products.listConversions(req.params.id) })))

r.get('/growth/campaigns', h((req, res) => res.json({ campaigns: products.listCampaigns({ productId: req.query.productId }) })))
r.post('/growth/campaigns', h((req, res) => res.status(201).json(products.createCampaign(req.body, actor(req)))))

/* --------------------------------------------------------------- signals */

r.get('/growth/signals', h((req, res) =>
  res.json({ signals: signals.listSignals({ sourceType: req.query.sourceType, region: req.query.region, status: req.query.status, limit: Number(req.query.limit) || 100 }) })))
r.post('/growth/signals', h((req, res) => res.status(201).json(signals.createManualSignal(req.body))))
r.post('/growth/signals/scan', h(async (req, res) => {
  const { region = 'TW', sources = ['news', 'social_trend'], limit = 20, query = null } = req.body ?? {}
  const { result, job } = await signals.scan({ region, sources, limit, query })
  res.json({ ...result, jobId: job.id })
}))
r.get('/growth/signals/:id', h((req, res) => {
  const signal = signals.getSignal(req.params.id)
  if (!signal) return res.status(404).json({ error: 'signal not found' })
  res.json(signal)
}))

/* --------------------------------------------------------- opportunities */

r.get('/growth/opportunities', h((req, res) =>
  res.json({ opportunities: opportunities.listOpportunities({ productId: req.query.productId, status: req.query.status, campaignId: req.query.campaignId }) })))
r.post('/growth/opportunities', h((req, res) => res.status(201).json(opportunities.createOpportunity(req.body, actor(req)))))
r.get('/growth/opportunities/:id', h((req, res) => {
  const o = opportunities.getOpportunity(req.params.id)
  if (!o) return res.status(404).json({ error: 'opportunity not found' })
  res.json({ ...o, experiments: experiments.listExperiments({ opportunityId: o.id }) })
}))
r.patch('/growth/opportunities/:id/status', h((req, res) =>
  res.json(opportunities.setOpportunityStatus(req.params.id, req.body.status, actor(req), req.body.reason))))
r.get('/growth/opportunities/draft', h((req, res) =>
  res.json(opportunities.draftFromSignal(req.query.signalId, req.query.productId))))
r.get('/growth/opportunities/:id/route', h((req, res) =>
  res.json(router_.route(req.params.id, { limit: Number(req.query.limit) || 8 }))))

/* -------------------------------------------------------------- personas */

r.get('/growth/personas', h((req, res) =>
  res.json({ personas: personas.listPersonas(req.query.productId ?? null, { full: req.query.full === '1' }) })))
r.post('/growth/personas/sync', h((req, res) => res.json(personas.syncRegistry())))
r.get('/growth/personas/:id', h((req, res) => {
  const persona = personas.getPersona(req.params.id, req.query.productId ?? null)
  if (!persona) return res.status(404).json({ error: 'persona not found' })
  res.json(persona)
}))
r.put('/growth/personas/:id/overlay', h((req, res) =>
  res.json(personas.setOverlay(req.params.id, req.body.productId ?? null, req.body, actor(req)))))
r.get('/growth/personas/:id/performance', h((req, res) => {
  const rows = portfolio.byPersona(req.query.productId ?? null)
  const row = rows.find((x) => x.key === req.params.id)
  res.json({
    persona: personas.getPersona(req.params.id, req.query.productId ?? null),
    economics: row ?? null,
    experiments: experiments.listExperiments().filter((e) => db.filter('arms', (a) => a.experimentId === e.id && a.personaId === req.params.id).length > 0),
  })
}))

/* ----------------------------------------------------------- experiments */

r.get('/growth/experiments', h((req, res) =>
  res.json({ experiments: experiments.listExperiments({ productId: req.query.productId, status: req.query.status, campaignId: req.query.campaignId }) })))
r.post('/growth/experiments', h((req, res) => res.status(201).json(experiments.createExperiment(req.body, actor(req)))))

r.get('/growth/experiments/:id', h((req, res) => {
  const experiment = experiments.requireExperiment(req.params.id)
  const arms = experiment.arms.map((arm) => ({
    ...arm,
    assets: generation.listAssets({ armId: arm.id }),
    publications: publish.listPublications({ armId: arm.id }),
    metrics: telemetry.armMetrics(arm.id),
    cost: cost.forArm(arm.id),
    conversions: db.filter('attributions', (a) => a.armId === arm.id && a.evidenceType !== 'unknown').length,
    decision: db.find('decisions', (d) => d.armId === arm.id) ?? null,
    cloneLift: arm.parentArmId ? evolution.cloneLift(arm.id) : null,
  }))
  res.json({
    ...experiment,
    arms,
    contractGates: experiments.contractGates(experiment),
    completeness: completeness.assess(experiment),
    cost: cost.forExperiment(experiment.id),
    attribution: conversions.coverage({ experimentId: experiment.id }),
    decisions: evaluator.listDecisions({ experimentId: experiment.id }),
    timeline: events.timeline({ experimentId: experiment.id }),
    opportunity: experiment.opportunityId ? opportunities.getOpportunity(experiment.opportunityId) : null,
  })
}))

r.post('/growth/experiments/:id/arms', h((req, res) => res.status(201).json(experiments.addArm(req.params.id, req.body, actor(req)))))
r.post('/growth/experiments/:id/generate', h(async (req, res) =>
  res.json(await generation.generateExperiment(req.params.id, { adapterId: req.body?.adapterId ?? 'template', taskType: req.body?.taskType ?? 'caption', actor: actor(req) }))))
r.post('/growth/experiments/:id/evaluate', h((req, res) => res.json(evaluator.evaluate(req.params.id, { actor: actor(req) }))))
r.get('/growth/experiments/:id/completeness', h((req, res) => res.json(completeness.assess(experiments.requireExperiment(req.params.id)))))
r.patch('/growth/experiments/:id/status', h((req, res) =>
  res.json(experiments.setStatus(req.params.id, req.body.status, { actor: actor(req), reason: req.body.reason, force: Boolean(req.body.force) }))))
r.post('/growth/experiments/:id/clone', h((req, res) =>
  res.status(201).json(evolution.cloneWinner({ ...req.body, parentArmId: req.body.parentArmId }, actor(req)))))

/* ------------------------------------------------------- generation/AIGC */

r.get('/growth/adapters', h((req, res) => res.json({ generation: generation.listAdapters(), publish: publish.listPublishAdapters() })))
r.get('/growth/prompt-templates', h((req, res) => res.json({ templates: generation.listTemplates() })))
r.post('/growth/arms/:id/brief', h((req, res) => {
  const { concept, brief } = generation.buildBrief(req.params.id, { actor: actor(req), beats: req.body?.beats ?? null })
  res.json({ concept, brief })
}))
r.post('/growth/arms/:id/generate', h(async (req, res) =>
  res.json(await generation.generate(req.params.id, { adapterId: req.body?.adapterId ?? 'template', taskType: req.body?.taskType ?? 'caption', actor: actor(req) }))))
r.post('/growth/arms/:id/assets', h((req, res) =>
  res.status(201).json(generation.registerAsset({ ...req.body, armId: req.params.id }, actor(req)))))
r.get('/growth/assets', h((req, res) => res.json({ assets: generation.listAssets({ experimentId: req.query.experimentId, armId: req.query.armId, reviewStatus: req.query.reviewStatus }) })))
r.get('/growth/model-runs', h((req, res) => res.json({ runs: generation.listModelRuns({ experimentId: req.query.experimentId, status: req.query.status }) })))

/* ------------------------------------------------------ review & policy */

r.get('/growth/reviews/queue', h((req, res) => res.json({ queue: review.queue({ productId: req.query.productId ?? null }) })))
r.post('/growth/assets/:id/gate', h((req, res) => res.json(review.evaluateAsset(req.params.id, actor(req)))))
r.post('/growth/assets/:id/review', h((req, res) => res.status(201).json(review.decide(req.params.id, req.body, actor(req)))))
r.get('/growth/reviews', h((req, res) => res.json({ reviews: review.listReviews({ experimentId: req.query.experimentId, assetId: req.query.assetId }), overrides: review.overrides() })))
r.get('/growth/policy/profiles', h((req, res) => res.json({ profiles: policy.listProfiles() })))
r.post('/growth/policy/profiles', h((req, res) => res.status(201).json(policy.createProfile(req.body))))
r.get('/growth/incidents', h((req, res) => res.json({ incidents: policy.listIncidents({ productId: req.query.productId, severity: req.query.severity, status: req.query.status }) })))
r.post('/growth/publications/:id/incident', h((req, res) => res.status(201).json(publish.recordIncident(req.params.id, req.body, actor(req)))))

/* -------------------------------------------------------- distribution */

r.get('/growth/accounts', h((req, res) => res.json({ accounts: publish.accountHealth() })))
r.post('/growth/accounts', h((req, res) => res.status(201).json(publish.registerAccount(req.body, actor(req)))))
r.patch('/growth/accounts/:id/status', h((req, res) =>
  res.json(publish.setAccountStatus(req.params.id, req.body.status, { actor: actor(req), reason: req.body.reason }))))

r.get('/growth/publications', h((req, res) =>
  res.json({ publications: publish.listPublications({ productId: req.query.productId, experimentId: req.query.experimentId, status: req.query.status }).map((p) => ({ ...p, metrics: telemetry.currentMetrics(p.id) })) })))
r.post('/growth/publications', h((req, res) => res.status(201).json(publish.schedulePublication(req.body, actor(req)))))
r.post('/growth/publications/:id/publish', h(async (req, res) => res.json(await publish.publish(req.params.id, { ...req.body, actor: actor(req) }))))
r.post('/growth/publications/:id/metrics', h((req, res) =>
  res.status(201).json(telemetry.ingestSnapshot(req.params.id, req.body.metrics ?? req.body, { capturedAt: req.body.capturedAt, source: req.body.source ?? 'manual' }))))

/* --------------------------------------------- conversions & attribution */

r.post('/growth/conversions', h((req, res) => res.status(201).json(conversions.ingest(req.body))))
r.get('/growth/conversions', h((req, res) => res.json({ conversions: conversions.listConversionEvents({ productId: req.query.productId }) })))
r.get('/growth/attribution', h((req, res) => {
  const filter = { productId: req.query.productId, experimentId: req.query.experimentId }
  // The coverage summary is the whole point of this endpoint; the raw touches
  // are a sample for drill-down, not a dump of every conversion ever.
  res.json({ coverage: conversions.coverage(filter), touches: conversions.listAttributions(filter, Number(req.query.limit) || 50) })
}))
r.get('/growth/conversions/:id/trace', h((req, res) => res.json(conversions.trace(req.params.id))))
r.get('/growth/tracking-links', h((req, res) => res.json({ links: tracking.listLinks({ productId: req.query.productId, experimentId: req.query.experimentId }) })))

/* -------------------------------------------------------- winner factory */

r.get('/growth/winners', h((req, res) => res.json(evolution.winnerQueue(req.query.productId ?? null))))
r.get('/growth/lineage', h((req, res) => res.json({ families: evolution.families(req.query.productId ?? null) })))
r.get('/growth/arms/:id/lineage', h((req, res) => res.json(evolution.lineage(req.params.id))))
r.get('/growth/arms/:id/clone-lift', h((req, res) => res.json(evolution.cloneLift(req.params.id))))
r.get('/growth/mutations', h((req, res) => res.json({ mutations: evolution.listMutations({ productId: req.query.productId, status: req.query.status }) })))

/* --------------------------------------------------------- unit economics */

r.get('/growth/unit-economics', h((req, res) => {
  const productId = req.query.productId ?? null
  res.json({
    byPersona: portfolio.byPersona(productId),
    byTopic: portfolio.byTopic(productId),
    byPlatform: portfolio.byPlatform(productId),
    byFamily: portfolio.byExperimentFamily(productId),
    cost: cost.totals(productId ? { productId } : {}),
    ladder: COST_LADDER,
    creditPlan: { active: DEFAULT_PLAN, plans: CREDIT_PLANS },
  })
}))
r.get('/growth/costs', h((req, res) => res.json({ costs: cost.listCosts({ productId: req.query.productId, experimentId: req.query.experimentId }), totals: cost.totals({ productId: req.query.productId, experimentId: req.query.experimentId }) })))

/* ------------------------------------------------------ dashboard/read model */

r.get('/growth/dashboard/overview', h((req, res) => res.json({ ...pipeline.overview(), board: pipeline.board() })))
r.get('/growth/dashboard/board', h((req, res) => res.json({ board: pipeline.board(), stages: pipeline.STAGES })))
r.get('/growth/dashboard/funnel', h((req, res) => {
  const productId = req.query.productId ?? null
  const summary = portfolio.productSummary(productId ?? undefined)
  res.json({
    funnel: productId ? summary : null,
    byPersona: portfolio.byPersona(productId),
    byPlatform: portfolio.byPlatform(productId),
    attribution: conversions.coverage(productId ? { productId } : {}),
  })
}))

/* --------------------------------------------------------------- ops */

r.get('/growth/ops', h((req, res) => res.json({
  jobs: jobs.jobHealth(),
  recentJobs: jobs.listJobs({ limit: 40 }),
  deadLetters: jobs.deadLetters(),
  freshness: freshness(),
  adapters: { generation: generation.listAdapters(), publish: publish.listPublishAdapters() },
  events: events.recent(40),
  audit: audit.recent(40),
})))

/* ----------------------------------------------------- tracking redirect */

/**
 * The click endpoint. Lives under /api so it shares this router's mounting,
 * and 302s to the product's destination after recording the click — the one
 * mechanism that makes `direct` attribution possible at all.
 */
r.get('/growth/t/:code', h((req, res) => {
  try {
    const link = tracking.registerClick(req.params.code)
    res.redirect(302, link.trackedUrl ?? link.destinationUrl)
  } catch {
    res.status(404).type('text/plain').send('未知的追蹤碼')
  }
}))

export default r
