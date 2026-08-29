import express from 'express'
import fs from 'node:fs'
import path from 'node:path'
import { PORT, CLIENT_DIST, isApifyConfigured } from './config.js'
import { getAxes, listKols, getData } from './lib/kols.js'
import * as store from './lib/store.js'
import { DIMENSIONS } from './lib/scoring/match.js'
import { getConfig } from './lib/scoring/gates.js'
import { FOUR_AXES, DISPLAY_FIELDS, PRIMARY_TASKS } from './lib/scoring/evaluation.js'
import { listNotes, noteIndex } from './lib/scoring/notes.js'
import { PLATFORMS } from './lib/topics/index.js'
import kolsRouter from './routes/kols.js'
import topicsRouter from './routes/topics.js'
import workflowRouter from './routes/workflow.js'
import evaluationsRouter from './routes/evaluations.js'
import redlinesRouter from './routes/redlines.js'
import guidedRouter from './routes/guided.js'
import scanProbeRouter from './routes/scan-probe.js'
import growthRouter from './routes/growth.js'
import { bootstrapGrowthOs } from './growth/bootstrap.js'
import { freshness as growthFreshness } from './growth/store.js'
import * as growthPipeline from './growth/pipeline.js'
import { startBootProbe } from './lib/scan/probe-on-boot.js'

const app = express()
app.use(express.json({ limit: '2mb' }))

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    kols: listKols().length,
    apify: isApifyConfigured(),
    uptime: process.uptime(),
    // Growth OS is part of the same service, so its readiness belongs in the
    // same healthcheck Railway polls.
    growthOs: { products: growthPipeline.overview().products.total, persistent: Boolean(process.env.DATA_DIR) },
  })
})

/** Everything the client needs to render labels and explain the model. */
app.get('/api/meta', (req, res) => {
  const { axes, domains, regions } = getAxes()
  res.json({
    axes,
    formatFit: getAxes().format_fit,
    domains,
    regions,
    platforms: PLATFORMS,
    scoringDimensions: DIMENSIONS,
    scoringConfig: getConfig(),
    fourAxes: FOUR_AXES,
    displayFields: DISPLAY_FIELDS,
    topicSource: isApifyConfigured() ? 'apify' : 'fixtures',
    store: store.stats(),
    methodology: 'docs/11-system-redesign-spec.md',
    primaryTasks: PRIMARY_TASKS,
    dimensionNotes: noteIndex(),
    calibration: getConfig().calibration,
    growthOs: { enabled: true, stages: growthPipeline.STAGES.length, store: growthFreshness() },
  })
})

app.use('/api', kolsRouter)
app.use('/api', topicsRouter)
app.use('/api', workflowRouter)
app.use('/api', evaluationsRouter)
app.use('/api', redlinesRouter)
app.use('/api', guidedRouter)
app.use('/api', scanProbeRouter)
app.use('/api', growthRouter)

app.use('/api', (req, res) => res.status(404).json({ error: `no such endpoint: ${req.method} ${req.originalUrl}` }))

// eslint-disable-next-line no-unused-vars -- Express identifies error handlers by arity
app.use((err, req, res, next) => {
  const status = err.status ?? 500
  if (status >= 500) console.error('[api]', err)
  res.status(status).json({ error: err.message ?? 'internal error' })
})

// Built client, when present. `npm run build` produces it; in dev the Vite
// server proxies /api here instead.
if (fs.existsSync(CLIENT_DIST)) {
  // Hashed asset filenames can be cached hard; index.html must not be, or a
  // browser keeps pointing at bundle names that this deploy already deleted
  // (vite builds with emptyOutDir), and the user silently runs stale code.
  app.use(express.static(CLIENT_DIST, { index: false, setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) res.setHeader('cache-control', 'no-cache')
  } }))
  app.get('*', (req, res) => {
    res.setHeader('cache-control', 'no-cache')
    res.sendFile(path.join(CLIENT_DIST, 'index.html'))
  })
} else {
  app.get('*', (req, res) =>
    res
      .status(503)
      .type('text/plain')
      .send('前端尚未建置。請先執行 `npm run build`，或在開發時使用 `npm run dev`（Vite 於 5173）。'),
  )
}

getData() // fail fast at boot if the KOL data cannot be read
const growthBoot = bootstrapGrowthOs()
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Buildup KOL Dashboard listening on :${PORT}`)
  console.log(`  KOLs loaded: ${listKols().length}`)
  console.log(`  Topic source: ${isApifyConfigured() ? 'Apify' : 'fixtures (APIFY_TOKEN not set)'}`)
  console.log(`  Data dir: ${store.stats().dataDir}${store.stats().persistent ? '' : ' (ephemeral — set DATA_DIR to a Railway volume)'}`)
  console.log(`  Growth OS: ${growthBoot.policyProfiles} policy profiles, ${growthBoot.promptTemplates} prompt templates, ${growthBoot.personas} personas synced`)

  // Batch 0 only, and only when SCAN_PROBE_ON_BOOT is set. Started here rather
  // than before listen() so a multi-minute actor run cannot delay the
  // healthcheck. See lib/scan/probe-on-boot.js for why the log stream is the
  // channel and why the variable must be removed afterwards.
  startBootProbe()
})
