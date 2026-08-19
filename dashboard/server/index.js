import express from 'express'
import fs from 'node:fs'
import path from 'node:path'
import { PORT, CLIENT_DIST, isApifyConfigured } from './config.js'
import { getAxes, listKols, getData } from './lib/kols.js'
import * as store from './lib/store.js'
import { WEIGHTS } from './lib/scoring/match.js'
import { FOUR_AXES, DISPLAY_FIELDS } from './lib/scoring/evaluation.js'
import { PLATFORMS } from './lib/topics/index.js'
import kolsRouter from './routes/kols.js'
import topicsRouter from './routes/topics.js'
import workflowRouter from './routes/workflow.js'
import evaluationsRouter from './routes/evaluations.js'

const app = express()
app.use(express.json({ limit: '2mb' }))

app.get('/api/health', (req, res) => {
  res.json({ ok: true, kols: listKols().length, apify: isApifyConfigured(), uptime: process.uptime() })
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
    matchWeights: WEIGHTS,
    fourAxes: FOUR_AXES,
    displayFields: DISPLAY_FIELDS,
    topicSource: isApifyConfigured() ? 'apify' : 'fixtures',
    store: store.stats(),
    methodology: 'docs/09-kol-topic-match-and-evaluation-methodology.md',
  })
})

app.use('/api', kolsRouter)
app.use('/api', topicsRouter)
app.use('/api', workflowRouter)
app.use('/api', evaluationsRouter)

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
  app.use(express.static(CLIENT_DIST))
  app.get('*', (req, res) => res.sendFile(path.join(CLIENT_DIST, 'index.html')))
} else {
  app.get('*', (req, res) =>
    res
      .status(503)
      .type('text/plain')
      .send('前端尚未建置。請先執行 `npm run build`，或在開發時使用 `npm run dev`（Vite 於 5173）。'),
  )
}

getData() // fail fast at boot if the KOL data cannot be read
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Buildup KOL Dashboard listening on :${PORT}`)
  console.log(`  KOLs loaded: ${listKols().length}`)
  console.log(`  Topic source: ${isApifyConfigured() ? 'Apify' : 'fixtures (APIFY_TOKEN not set)'}`)
  console.log(`  Data dir: ${store.stats().dataDir}${store.stats().persistent ? '' : ' (ephemeral — set DATA_DIR to a Railway volume)'}`)
})
