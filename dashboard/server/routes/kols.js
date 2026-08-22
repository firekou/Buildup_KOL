import express from 'express'
import fs from 'node:fs'
import path from 'node:path'
import { KOLS_DIR } from '../config.js'
import { listKols, getKol, toSummary, getData } from '../lib/kols.js'
import { matchKolToTopic, hookToTopic } from '../lib/scoring/match.js'

const router = express.Router()

const IMAGE_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif'])
const MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif' }

router.get('/kols', (req, res) => {
  res.json({ kols: listKols().map(toSummary) })
})

router.post('/kols/refresh', (req, res) => {
  getData({ refresh: true })
  res.json({ ok: true, kols: listKols().length })
})

router.get('/kols/:id', (req, res) => {
  const kol = getKol(req.params.id)
  if (!kol) return res.status(404).json({ error: `unknown KOL "${req.params.id}"` })

  const region = req.query.region || kol.affinity?.reach?.regions?.[0] || 'GLOBAL'

  // 人設 × 話題連結：每個連結點都跑一次完整 Match，讓數值與理由都攤開。
  const hooks = (kol.affinity?.topic_hooks ?? []).map((hook) => {
    const topic = hookToTopic(hook, { region })
    const match = matchKolToTopic(kol, topic, { region, language: kol.affinity?.reach?.language })
    return {
      ...hook,
      axisDemand: topic.axisDemand,
      match: {
        screeningScore: match.screeningScore,
        band: match.band,
        decision: match.decision,
        gatesPassed: match.gates?.passed ?? false,
        rationale: match.rationale,
        dimensions: match.dimensions,
      },
    }
  }).sort((a, b) => (b.match.screeningScore ?? -1) - (a.match.screeningScore ?? -1))

  res.json({
    id: kol.id,
    name: kol.name,
    handle: kol.handle,
    category: kol.category,
    status: kol.status,
    projectCode: kol.projectCode,
    flavor: kol.flavor,
    identity: kol.profile?.identity ?? null,
    persona: kol.profile?.persona ?? null,
    content: kol.profile?.content ?? null,
    social: kol.profile?.social ?? null,
    aiAssets: kol.profile?.ai_assets ?? null,
    scenes: kol.profile?.ai_prompts?.scenes ?? [],
    images: kol.images,
    axes: kol.affinity?.axes ?? null,
    formatFit: kol.affinity?.format_fit ?? null,
    materialAttributes: kol.affinity?.material_attributes ?? null,
    aesthetic: kol.profile?.content?.aesthetic ?? null,
    reach: kol.affinity?.reach ?? null,
    redlines: kol.affinity?.redlines ?? [],
    hooks,
    completeness: kol.completeness,
    region,
  })
})

/** Static media, scoped to one KOL directory and image types only. */
router.get(/^\/media\/([^/]+)\/(.+)$/, (req, res) => {
  const kolId = decodeURIComponent(req.params[0])
  const relative = decodeURIComponent(req.params[1])

  if (!getKol(kolId)) return res.status(404).json({ error: 'unknown KOL' })

  const kolDir = path.join(KOLS_DIR, kolId)
  const target = path.resolve(kolDir, relative)
  if (!target.startsWith(path.resolve(kolDir) + path.sep)) {
    return res.status(400).json({ error: 'path outside KOL directory' })
  }
  const ext = path.extname(target).toLowerCase()
  if (!IMAGE_EXT.has(ext)) return res.status(415).json({ error: 'only image files are served' })
  if (!fs.existsSync(target)) return res.status(404).json({ error: 'not found' })

  res.setHeader('content-type', MIME[ext])
  res.setHeader('cache-control', 'public, max-age=86400')
  fs.createReadStream(target).pipe(res)
})

export default router
